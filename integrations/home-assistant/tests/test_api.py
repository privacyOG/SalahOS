"""Contract tests for the SalahOS Home Assistant public API client."""

from __future__ import annotations

import asyncio
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sys
import unittest

API_PATH = (
    Path(__file__).resolve().parents[1]
    / "custom_components"
    / "salahos"
    / "api.py"
)
SPEC = spec_from_file_location("salahos_home_assistant_api", API_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("Unable to load SalahOS Home Assistant API module")
API = module_from_spec(SPEC)
sys.modules[SPEC.name] = API
SPEC.loader.exec_module(API)


class FakeResponse:
    def __init__(self, payload, status=200):
        self.payload = payload
        self.status = status

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return None

    async def json(self):
        return self.payload


class FakeSession:
    def __init__(self, responses):
        self.responses = list(responses)
        self.requests = []

    def get(self, url, **kwargs):
        self.requests.append((url, kwargs))
        if not self.responses:
            raise RuntimeError("No fake response remains")
        return self.responses.pop(0)


class SalahOSApiContractTests(unittest.TestCase):
    def test_normalizes_and_builds_public_urls(self):
        self.assertEqual(
            API.normalize_base_url(" HTTPS://example.org/salahos/ "),
            "https://example.org/salahos",
        )
        self.assertEqual(
            API.build_profile_url("https://example.org/", "Masjid.One"),
            "https://example.org/api/v1/mosques/masjid.one",
        )
        self.assertEqual(
            API.build_daily_prayers_url(
                "http://192.0.2.10:8080",
                "branch:sydney",
                "2026-08-20",
            ),
            "http://192.0.2.10:8080/api/v1/mosques/branch%3Asydney/prayers/2026-08-20",
        )

    def test_rejects_credentials_and_invalid_mosque_ids(self):
        with self.assertRaises(API.SalahOSPayloadError):
            API.normalize_base_url("https://user:secret@example.org")
        with self.assertRaises(API.SalahOSPayloadError):
            API.normalize_mosque_id("Not Valid!")

    def test_parses_profile_and_daily_prayer_payload(self):
        profile = API.parse_profile_payload(
            {
                "mosqueId": "masjid.one",
                "name": "Masjid One",
                "timezone": "Australia/Sydney",
            },
            "masjid.one",
        )
        self.assertEqual(profile.name, "Masjid One")
        self.assertEqual(profile.timezone, "Australia/Sydney")

        daily = API.parse_daily_prayer_payload(
            {
                "mosqueId": "masjid.one",
                "date": "2026-08-20",
                "timezone": "Australia/Sydney",
                "publishedAt": "2026-08-19T22:00:00Z",
                "revision": 12,
                "prayers": {
                    "fajr": "05:18",
                    "dhuhr": {"start": "12:03", "iqamah": "12:20"},
                    "asr": {"startLocalMinutes": 15 * 60 + 21},
                    "maghrib": "17:33",
                    "isha": "2026-08-20T10:00:00Z",
                },
                "iqamah": {
                    "fajr": {"kind": "offset", "offsetMinutes": 20},
                    "asr": {"kind": "fixed", "localMinutes": 15 * 60 + 35},
                },
            },
            "masjid.one",
            "2026-08-20",
            "Australia/Sydney",
        )

        self.assertEqual(daily.prayer_starts["fajr"].isoformat(), "2026-08-20T05:18:00+10:00")
        self.assertEqual(daily.prayer_starts["isha"].isoformat(), "2026-08-20T20:00:00+10:00")
        self.assertEqual(daily.iqamah["fajr"].isoformat(), "2026-08-20T05:38:00+10:00")
        self.assertEqual(daily.iqamah["dhuhr"].isoformat(), "2026-08-20T12:20:00+10:00")
        self.assertEqual(daily.iqamah["asr"].isoformat(), "2026-08-20T15:35:00+10:00")
        self.assertEqual(daily.revision, "12")

    def test_rejects_cross_mosque_or_incomplete_payloads(self):
        with self.assertRaises(API.SalahOSPayloadError):
            API.parse_profile_payload(
                {
                    "mosqueId": "other.masjid",
                    "name": "Other",
                    "timezone": "Australia/Sydney",
                },
                "masjid.one",
            )

        with self.assertRaises(API.SalahOSPayloadError):
            API.parse_daily_prayer_payload(
                {
                    "mosqueId": "masjid.one",
                    "prayers": {"fajr": "05:00"},
                },
                "masjid.one",
                "2026-08-20",
                "Australia/Sydney",
            )

    def test_async_client_uses_get_only_and_expected_paths(self):
        session = FakeSession(
            [
                FakeResponse(
                    {
                        "mosqueId": "masjid.one",
                        "name": "Masjid One",
                        "timezone": "Australia/Sydney",
                    }
                ),
                FakeResponse(
                    {
                        "mosqueId": "masjid.one",
                        "prayers": {
                            "fajr": "05:18",
                            "dhuhr": "12:03",
                            "asr": "15:21",
                            "maghrib": "17:33",
                            "isha": "19:00",
                        },
                    }
                ),
            ]
        )
        client = API.SalahOSApiClient(session, "https://example.org", "masjid.one")

        async def exercise_client():
            profile = await client.async_get_profile()
            daily = await client.async_get_daily_prayers("2026-08-20", profile.timezone)
            return profile, daily

        profile, daily = asyncio.run(exercise_client())
        self.assertEqual(profile.mosque_id, "masjid.one")
        self.assertEqual(daily.prayer_starts["maghrib"].hour, 17)
        self.assertEqual(
            [request[0] for request in session.requests],
            [
                "https://example.org/api/v1/mosques/masjid.one",
                "https://example.org/api/v1/mosques/masjid.one/prayers/2026-08-20",
            ],
        )
        for _, options in session.requests:
            self.assertEqual(options["headers"], {"Accept": "application/json"})
            self.assertEqual(options["timeout"], 10.0)


if __name__ == "__main__":
    unittest.main()
