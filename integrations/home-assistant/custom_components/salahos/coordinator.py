"""Polling coordinator for SalahOS published mosque data."""

from __future__ import annotations

from datetime import datetime, timedelta
import logging
from zoneinfo import ZoneInfo

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import DailyPrayerData, MosqueProfile, SalahOSApiClient, SalahOSApiError
from .const import DOMAIN, UPDATE_INTERVAL_MINUTES

_LOGGER = logging.getLogger(__name__)


class SalahOSDataUpdateCoordinator(DataUpdateCoordinator[DailyPrayerData]):
    """Fetch one public daily-prayer payload for the configured mosque."""

    def __init__(self, hass: HomeAssistant, client: SalahOSApiClient) -> None:
        super().__init__(
            hass,
            logger=_LOGGER,
            name=DOMAIN,
            update_interval=timedelta(minutes=UPDATE_INTERVAL_MINUTES),
        )
        self.client = client
        self.profile: MosqueProfile | None = None

    async def _async_update_data(self) -> DailyPrayerData:
        try:
            if self.profile is None:
                self.profile = await self.client.async_get_profile()
            local_date = datetime.now(ZoneInfo(self.profile.timezone)).date().isoformat()
            return await self.client.async_get_daily_prayers(local_date, self.profile.timezone)
        except SalahOSApiError as error:
            raise UpdateFailed(str(error)) from error
