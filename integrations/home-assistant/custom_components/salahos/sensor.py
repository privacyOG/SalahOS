"""Prayer-time sensors for SalahOS."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorEntityDescription
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, PRAYERS
from .coordinator import SalahOSDataUpdateCoordinator

SENSOR_DESCRIPTIONS = tuple(
    SensorEntityDescription(
        key=prayer,
        translation_key=prayer,
        device_class=SensorDeviceClass.TIMESTAMP,
    )
    for prayer in PRAYERS
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up prayer-time sensors."""

    coordinator: SalahOSDataUpdateCoordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities(
        SalahOSPrayerSensor(coordinator, entry, description)
        for description in SENSOR_DESCRIPTIONS
    )


class SalahOSPrayerSensor(CoordinatorEntity[SalahOSDataUpdateCoordinator], SensorEntity):
    """Published Salah start time with optional Iqamah metadata."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: SalahOSDataUpdateCoordinator,
        entry: ConfigEntry,
        description: SensorEntityDescription,
    ) -> None:
        super().__init__(coordinator)
        self.entity_description = description
        self._entry = entry
        self._attr_unique_id = (
            f"{coordinator.client.base_url}|{coordinator.client.mosque_id}|{description.key}"
        )

    @property
    def native_value(self) -> datetime:
        """Return the timezone-aware published prayer start."""

        return self.coordinator.data.prayer_starts[self.entity_description.key]

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Expose publication provenance and the resolved Iqamah time."""

        prayer = self.entity_description.key
        iqamah = self.coordinator.data.iqamah[prayer]
        return {
            "mosque_id": self.coordinator.data.mosque_id,
            "date": self.coordinator.data.date,
            "timezone": self.coordinator.data.timezone,
            "iqamah": None if iqamah is None else iqamah.isoformat(),
            "published_at": self.coordinator.data.published_at,
            "revision": self.coordinator.data.revision,
        }

    @property
    def device_info(self) -> DeviceInfo:
        """Group all five prayers under one mosque device."""

        profile = self.coordinator.profile
        name = profile.name if profile is not None else self.coordinator.client.mosque_id
        return DeviceInfo(
            identifiers={
                (
                    DOMAIN,
                    f"{self.coordinator.client.base_url}|{self.coordinator.client.mosque_id}",
                )
            },
            name=name,
            manufacturer="privacyOG",
            model="SalahOS published mosque timetable",
        )
