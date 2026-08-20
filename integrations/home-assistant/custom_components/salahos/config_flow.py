"""Configuration flow for the SalahOS Home Assistant integration."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.const import CONF_URL
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import SalahOSApiClient, SalahOSApiError, normalize_base_url, normalize_mosque_id
from .const import CONF_MOSQUE_ID, DOMAIN


class SalahOSConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Configure a read-only SalahOS public mosque endpoint."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None):
        """Handle user configuration."""

        errors: dict[str, str] = {}
        if user_input is not None:
            try:
                base_url = normalize_base_url(user_input[CONF_URL])
                mosque_id = normalize_mosque_id(user_input[CONF_MOSQUE_ID])
            except (KeyError, SalahOSApiError):
                errors["base"] = "invalid_input"
            else:
                client = SalahOSApiClient(
                    async_get_clientsession(self.hass),
                    base_url,
                    mosque_id,
                )
                try:
                    profile = await client.async_get_profile()
                except SalahOSApiError:
                    errors["base"] = "cannot_connect"
                else:
                    await self.async_set_unique_id(f"{base_url}|{mosque_id}")
                    self._abort_if_unique_id_configured()
                    return self.async_create_entry(
                        title=profile.name,
                        data={CONF_URL: base_url, CONF_MOSQUE_ID: mosque_id},
                    )

        schema = vol.Schema(
            {
                vol.Required(CONF_URL): str,
                vol.Required(CONF_MOSQUE_ID): str,
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)
