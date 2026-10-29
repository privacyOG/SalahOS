#!/usr/bin/env python3
"""Unit acceptance for bounded CoreSimulator command handling."""

import subprocess
import unittest
from unittest.mock import patch

from ios_simulator_acceptance import AcceptanceError, Deadline, simctl


class SimulatorCommandTests(unittest.TestCase):
    @patch('ios_simulator_acceptance.subprocess.run')
    def test_optional_appearance_timeout_does_not_block_launch_path(self, run):
        run.side_effect = subprocess.TimeoutExpired(['xcrun', 'simctl', 'ui'], 15)
        self.assertEqual(
            simctl(Deadline(30), 15, 'ui', 'device-123', 'appearance', 'light', check=False),
            '',
        )

    @patch('ios_simulator_acceptance.subprocess.run')
    def test_required_launch_timeout_remains_failure(self, run):
        run.side_effect = subprocess.TimeoutExpired(['xcrun', 'simctl', 'launch'], 15)
        with self.assertRaisesRegex(AcceptanceError, 'exceeded'):
            simctl(Deadline(30), 15, 'launch', 'device-123', 'com.privacyog.salahos')

    @patch('ios_simulator_acceptance.subprocess.run')
    def test_optional_nonzero_exit_is_nonfatal(self, run):
        run.return_value = subprocess.CompletedProcess(
            ['xcrun', 'simctl', 'ui'], 1, stdout='', stderr='unsupported preference'
        )
        self.assertEqual(
            simctl(Deadline(30), 15, 'ui', 'device-123', 'appearance', 'dark', check=False),
            '',
        )

    @patch('ios_simulator_acceptance.subprocess.run')
    def test_required_nonzero_exit_remains_failure(self, run):
        run.return_value = subprocess.CompletedProcess(
            ['xcrun', 'simctl', 'launch'], 1, stdout='', stderr='service unavailable'
        )
        with self.assertRaisesRegex(AcceptanceError, 'exit code 1'):
            simctl(Deadline(30), 15, 'launch', 'device-123', 'com.privacyog.salahos')


if __name__ == '__main__':
    unittest.main()
