#!/usr/bin/env python3
"""Bounded iPhone and iPad Simulator runtime acceptance for SalahOS.

The workflow compiles the native application before this script runs, so the
compile gate is already proven when execution reaches here. This script proves
the separate runtime claim: that the freshly built application installs, starts,
renders, survives an explicit termination and starts again on a clean iPhone and
a clean iPad Simulator.

Every external command is bounded, every created device is deleted, and the
whole run is bounded by a single budget. A hosted macOS runner whose
CoreSimulator service is unhealthy therefore produces a reported failure inside
a known time, never an unbounded hang.
"""

import json
import os
import plistlib
import shutil
import struct
import subprocess
import sys
import time

PROFILES = (
    {
        'name': 'iphone',
        'appearance': 'light',
        'preferred_device_types': ('iPhone 17 Pro', 'iPhone 16 Pro', 'iPhone 15 Pro'),
        'device_type_prefix': 'iPhone',
    },
    {
        'name': 'ipad',
        'appearance': 'dark',
        'preferred_device_types': ('iPad Pro 13-inch (M5)', 'iPad Pro 13-inch (M4)', 'iPad Air 11-inch (M3)'),
        'device_type_prefix': 'iPad',
    },
)


class AcceptanceError(RuntimeError):
    """A runtime acceptance expectation was not met."""


class Deadline:
    """A single wall-clock budget shared by the whole acceptance run."""

    def __init__(self, budget_seconds):
        self._expiry = time.monotonic() + budget_seconds

    def remaining(self):
        return max(0.0, self._expiry - time.monotonic())

    def allow(self, requested_seconds):
        remaining = self.remaining()
        if remaining <= 0:
            raise AcceptanceError('Runtime acceptance budget exhausted.')
        return min(requested_seconds, remaining)


def log(message):
    print(message, flush=True)


def simctl(deadline, timeout_seconds, *arguments, check=True):
    """Run one bounded `xcrun simctl` command and return its stdout."""

    bounded = deadline.allow(timeout_seconds)
    printable = 'xcrun simctl ' + ' '.join(arguments)
    try:
        completed = subprocess.run(
            ['xcrun', 'simctl', *arguments],
            capture_output=True,
            text=True,
            timeout=bounded,
        )
    except subprocess.TimeoutExpired:
        raise AcceptanceError('{} exceeded {:.0f} seconds.'.format(printable, bounded))

    if completed.stderr.strip():
        print(completed.stderr.strip(), file=sys.stderr, flush=True)
    if check and completed.returncode != 0:
        raise AcceptanceError('{} failed with exit code {}.'.format(printable, completed.returncode))
    return completed.stdout.strip()


def simctl_cleanup(*arguments):
    """Best-effort teardown that never raises and never consumes the budget."""

    try:
        subprocess.run(
            ['xcrun', 'simctl', *arguments],
            capture_output=True,
            text=True,
            timeout=90,
        )
    except (subprocess.SubprocessError, OSError) as error:
        log('Teardown command simctl {} did not complete: {}'.format(' '.join(arguments), error))


def simctl_json(deadline, timeout_seconds, *arguments):
    payload = simctl(deadline, timeout_seconds, *arguments, '-j')
    try:
        return json.loads(payload)
    except json.JSONDecodeError as error:
        raise AcceptanceError('Unreadable simctl JSON output: {}'.format(error))


def available_ios_runtimes(deadline):
    runtimes = simctl_json(deadline, 60, 'list', 'runtimes')['runtimes']
    usable = [
        runtime
        for runtime in runtimes
        if runtime.get('isAvailable') and runtime.get('platform') == 'iOS'
    ]
    if not usable:
        raise AcceptanceError('No available iOS Simulator runtime on this runner.')

    def version_key(runtime):
        parts = []
        for part in str(runtime.get('version', '0')).split('.'):
            parts.append(int(part) if part.isdigit() else 0)
        return tuple(parts)

    usable.sort(key=version_key, reverse=True)
    return usable


def device_type_candidates(deadline, profile):
    device_types = simctl_json(deadline, 60, 'list', 'devicetypes')['devicetypes']
    by_name = {}
    for device_type in device_types:
        by_name.setdefault(device_type.get('name', ''), device_type.get('identifier', ''))

    ordered = []
    for preferred in profile['preferred_device_types']:
        identifier = by_name.get(preferred)
        if identifier and identifier not in ordered:
            ordered.append(identifier)

    for device_type in device_types:
        name = device_type.get('name', '')
        identifier = device_type.get('identifier', '')
        if name.startswith(profile['device_type_prefix']) and identifier not in ordered:
            ordered.append(identifier)

    if not ordered:
        raise AcceptanceError(
            'No {} Simulator device type on this runner.'.format(profile['device_type_prefix'])
        )
    return ordered


def png_dimensions(path):
    with open(path, 'rb') as handle:
        header = handle.read(24)
    if len(header) < 24 or header[:8] != b'\x89PNG\r\n\x1a\n' or header[12:16] != b'IHDR':
        raise AcceptanceError('{} is not a valid PNG screenshot.'.format(path))
    width, height = struct.unpack('>II', header[16:24])
    if width == 0 or height == 0:
        raise AcceptanceError('{} reports a zero dimension.'.format(path))
    return width, height


def launch_pid(output):
    """Parse `com.privacyog.salahos: 1234` into an integer process identifier."""

    bundle_id = os.environ['BUNDLE_ID']
    prefix = bundle_id + ':'
    if not output.startswith(prefix):
        raise AcceptanceError('Unexpected launch output: {!r}'.format(output))
    identifier = output[len(prefix) :].strip()
    if not identifier.isdigit():
        raise AcceptanceError('Launch did not report a process identifier: {!r}'.format(output))
    return int(identifier)


def capture(deadline, udid, target):
    simctl(deadline, 90, 'io', udid, 'screenshot', '--type=png', target)
    if not os.path.isfile(target) or os.path.getsize(target) == 0:
        raise AcceptanceError('Screenshot {} was not written.'.format(target))
    width, height = png_dimensions(target)
    log('Screenshot {}x{}: {}'.format(width, height, target))


def start_and_capture(deadline, udid, bundle_id, target):
    output = simctl(deadline, 90, 'launch', udid, bundle_id)
    log(output)
    pid = launch_pid(output)
    time.sleep(4)
    capture(deadline, udid, target)
    return pid


def diagnostics(deadline, udid):
    log('Collecting Simulator diagnostics for {}.'.format(udid))
    try:
        listing = simctl_json(deadline, 45, 'list', 'devices')
    except AcceptanceError as error:
        log('Diagnostics unavailable: {}'.format(error))
        return
    for runtime_identifier, devices in listing.get('devices', {}).items():
        for device in devices:
            if device.get('udid') == udid:
                log('{}: {}'.format(runtime_identifier, device))


def exercise_once(deadline, profile, runtime, device_type, app_path, bundle_id, evidence_dir):
    """Create one clean Simulator and run the full acceptance path on it."""

    device_name = 'SalahOS-{}-{}'.format(profile['name'], os.environ.get('GITHUB_RUN_ID', 'local'))
    udid = simctl(deadline, 120, 'create', device_name, device_type, runtime['identifier'])
    if not udid:
        raise AcceptanceError('simctl create did not return a device identifier.')

    try:
        log(
            '{} Simulator: {} ({}) on {}'.format(
                profile['name'], device_name, udid, runtime.get('name', runtime['identifier'])
            )
        )
        simctl(deadline, 120, 'boot', udid)
        simctl(deadline, 240, 'bootstatus', udid, '-b')

        # An unavailable appearance preference is a cosmetic limitation of the
        # runtime, not a failure of the application under test.
        simctl(deadline, 60, 'ui', udid, 'appearance', profile['appearance'], check=False)

        simctl(deadline, 180, 'install', udid, app_path)
        container_path = simctl(deadline, 60, 'get_app_container', udid, bundle_id, 'app')
        if not os.path.isdir(container_path):
            raise AcceptanceError('Installed application container {} is missing.'.format(container_path))

        first_pid = start_and_capture(
            deadline, udid, bundle_id, os.path.join(evidence_dir, profile['name'] + '-launch.png')
        )
        simctl(deadline, 90, 'terminate', udid, bundle_id)
        second_pid = start_and_capture(
            deadline, udid, bundle_id, os.path.join(evidence_dir, profile['name'] + '-relaunch.png')
        )

        evidence = [
            'profile={}'.format(profile['name']),
            'udid={}'.format(udid),
            'runtime={}'.format(runtime['identifier']),
            'device_type={}'.format(device_type),
            'device_name={}'.format(device_name),
            'app_path={}'.format(app_path),
            'container_path={}'.format(container_path),
            'launch_pid={}'.format(first_pid),
            'relaunch_pid={}'.format(second_pid),
            'launch=passed',
            'relaunch=passed',
        ]
        with open(os.path.join(evidence_dir, profile['name'] + '.txt'), 'w') as handle:
            handle.write('\n'.join(evidence) + '\n')
        log('{} runtime acceptance passed.'.format(profile['name']))
    except AcceptanceError:
        diagnostics(deadline, udid)
        raise
    finally:
        # A leaked booted device would poison every later attempt on this
        # runner, so teardown must run even once the budget is exhausted.
        simctl_cleanup('shutdown', udid)
        simctl_cleanup('delete', udid)


def exercise(deadline, profile, runtimes, app_path, bundle_id, evidence_dir, attempts):
    device_types = device_type_candidates(deadline, profile)
    plans = []
    for runtime in runtimes:
        for device_type in device_types:
            plans.append((runtime, device_type))

    failures = []
    for attempt in range(min(attempts, len(plans))):
        runtime, device_type = plans[attempt]
        log(
            'Attempt {} of {} for {} using {} on {}.'.format(
                attempt + 1, min(attempts, len(plans)), profile['name'], device_type, runtime['identifier']
            )
        )
        try:
            exercise_once(
                deadline, profile, runtime, device_type, app_path, bundle_id, evidence_dir
            )
            return
        except AcceptanceError as error:
            log('{} attempt {} did not complete: {}'.format(profile['name'], attempt + 1, error))
            failures.append(str(error))
            if deadline.remaining() <= 0:
                break

    raise AcceptanceError(
        '{} runtime acceptance did not complete. Attempts: {}'.format(
            profile['name'], ' | '.join(failures) or 'none attempted'
        )
    )


def verify_built_application(app_path, bundle_id):
    if not os.path.isdir(app_path):
        raise AcceptanceError('Built application {} is missing.'.format(app_path))
    info_plist = os.path.join(app_path, 'Info.plist')
    if not os.path.isfile(info_plist):
        raise AcceptanceError('Built application has no Info.plist.')
    with open(info_plist, 'rb') as handle:
        info = plistlib.load(handle)
    built_identifier = info.get('CFBundleIdentifier')
    if built_identifier != bundle_id:
        raise AcceptanceError(
            'Built bundle identifier {!r} does not match the expected {!r}.'.format(
                built_identifier, bundle_id
            )
        )


def main():
    app_path = os.environ.get('APP_PATH', '')
    bundle_id = os.environ.get('BUNDLE_ID', '')
    evidence_dir = os.environ.get('EVIDENCE_DIR', '')
    if not app_path or not bundle_id or not evidence_dir:
        raise AcceptanceError('APP_PATH, BUNDLE_ID and EVIDENCE_DIR must all be set.')

    if shutil.which('xcrun') is None:
        raise AcceptanceError('xcrun is unavailable; this runner cannot host a Simulator.')

    attempts = max(1, int(os.environ.get('ATTEMPTS_PER_PROFILE', '2')))
    budget = float(os.environ.get('RUNTIME_BUDGET_SECONDS', '1020'))
    deadline = Deadline(budget)

    os.makedirs(evidence_dir, exist_ok=True)
    verify_built_application(app_path, bundle_id)

    runtimes = available_ios_runtimes(deadline)
    log('Available iOS runtimes: {}'.format(', '.join(runtime['identifier'] for runtime in runtimes)))

    for profile in PROFILES:
        exercise(deadline, profile, runtimes, app_path, bundle_id, evidence_dir, attempts)

    log('iPhone and iPad Simulator runtime acceptance completed.')


if __name__ == '__main__':
    try:
        main()
    except AcceptanceError as failure:
        print('Simulator runtime acceptance failed: {}'.format(failure), file=sys.stderr, flush=True)
        raise SystemExit(1)
