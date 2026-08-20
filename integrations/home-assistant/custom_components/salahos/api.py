"""Read-only client for the SalahOS public mosque API contract."""

from __future__ import annotations

from contextlib import AbstractAsyncContextManager
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
import re
from types import MappingProxyType
from typing import Any, Mapping, Protocol
from urllib.parse import quote, urlsplit, urlunsplit
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

PRAYERS = ("fajr", "dhuhr", "asr", "maghrib", "isha")
_MOSQUE_ID_PATTERN = re.compile(r"^[a-z0-9][a-z0-9._:-]*[a-z0-9]$")
_CLOCK_PATTERN = re.compile(r"^(?P<hour>[01]\d|2[0-3]):(?P<minute>[0-5]\d)$")


class SalahOSApiError(Exception):
    """Base error for the SalahOS public API client."""


class SalahOSConnectionError(SalahOSApiError):
    """Raised when the public API cannot be reached."""


class SalahOSPayloadError(SalahOSApiError):
    """Raised when a public API response violates the expected contract."""


class HttpResponse(Protocol):
    """Subset of an asynchronous HTTP response used by the client."""

    status: int

    async def json(self) -> Any:
        """Return the decoded JSON body."""


class HttpSession(Protocol):
    """Subset of an asynchronous HTTP session used by the client."""

    def get(self, url: str, **kwargs: Any) -> AbstractAsyncContextManager[HttpResponse]:
        """Create a GET request context manager."""


@dataclass(frozen=True, slots=True)
class MosqueProfile:
    """Published mosque identity required by Home Assistant."""

    mosque_id: str
    name: str
    timezone: str


@dataclass(frozen=True, slots=True)
class DailyPrayerData:
    """Resolved daily prayer data returned by the public API."""

    mosque_id: str
    date: str
    timezone: str
    prayer_starts: Mapping[str, datetime]
    iqamah: Mapping[str, datetime | None]
    published_at: str | None
    revision: str | None


def normalize_base_url(value: str) -> str:
    """Validate and normalize a SalahOS API base URL."""

    if not isinstance(value, str):
        raise SalahOSPayloadError("Base URL must be a string")
    raw = value.strip()
    if not raw:
        raise SalahOSPayloadError("Base URL is required")

    parts = urlsplit(raw)
    if parts.scheme not in {"http", "https"} or parts.hostname is None:
        raise SalahOSPayloadError("Base URL must use http or https and include a host")
    if parts.username is not None or parts.password is not None:
        raise SalahOSPayloadError("Base URL must not contain embedded credentials")
    if parts.query or parts.fragment:
        raise SalahOSPayloadError("Base URL must not contain a query string or fragment")

    path = parts.path.rstrip("/")
    return urlunsplit((parts.scheme.lower(), parts.netloc, path, "", ""))


def normalize_mosque_id(value: str) -> str:
    """Apply the same stable mosque identifier policy as the public API contract."""

    if not isinstance(value, str):
        raise SalahOSPayloadError("Mosque ID must be a string")
    normalized = value.strip().lower()
    if not _MOSQUE_ID_PATTERN.fullmatch(normalized):
        raise SalahOSPayloadError("Mosque ID must use a stable lowercase-safe identifier")
    return normalized


def build_profile_url(base_url: str, mosque_id: str) -> str:
    """Build the public mosque-profile endpoint URL."""

    base = normalize_base_url(base_url)
    identifier = quote(normalize_mosque_id(mosque_id), safe="")
    return f"{base}/api/v1/mosques/{identifier}"


def build_daily_prayers_url(base_url: str, mosque_id: str, prayer_date: str) -> str:
    """Build the public daily-prayer endpoint URL."""

    base = normalize_base_url(base_url)
    identifier = quote(normalize_mosque_id(mosque_id), safe="")
    _validate_date(prayer_date)
    return f"{base}/api/v1/mosques/{identifier}/prayers/{prayer_date}"


def parse_profile_payload(payload: Mapping[str, Any], expected_mosque_id: str) -> MosqueProfile:
    """Validate the subset of a published mosque profile required by the integration."""

    mapping = _require_mapping(payload, "Mosque profile")
    mosque_id = normalize_mosque_id(_require_string(mapping, "mosqueId", "Mosque profile"))
    expected = normalize_mosque_id(expected_mosque_id)
    if mosque_id != expected:
        raise SalahOSPayloadError("Mosque profile ID does not match the configured mosque")

    name = _require_string(mapping, "name", "Mosque profile").strip()
    if not name or len(name) > 200:
        raise SalahOSPayloadError("Mosque profile name must contain 1 through 200 characters")

    timezone_name = _validate_timezone(_require_string(mapping, "timezone", "Mosque profile"))
    return MosqueProfile(mosque_id=mosque_id, name=name, timezone=timezone_name)


def parse_daily_prayer_payload(
    payload: Mapping[str, Any],
    expected_mosque_id: str,
    expected_date: str,
    default_timezone: str,
) -> DailyPrayerData:
    """Validate and resolve one published daily-prayer response."""

    mapping = _require_mapping(payload, "Daily prayer response")
    expected = normalize_mosque_id(expected_mosque_id)
    mosque_id = normalize_mosque_id(_require_string(mapping, "mosqueId", "Daily prayer response"))
    if mosque_id != expected:
        raise SalahOSPayloadError("Daily prayer mosque ID does not match the configured mosque")

    _validate_date(expected_date)
    response_date = mapping.get("date", expected_date)
    if not isinstance(response_date, str):
        raise SalahOSPayloadError("Daily prayer date must be a string")
    _validate_date(response_date)
    if response_date != expected_date:
        raise SalahOSPayloadError("Daily prayer response date does not match the requested date")

    timezone_value = mapping.get("timezone", default_timezone)
    if not isinstance(timezone_value, str):
        raise SalahOSPayloadError("Daily prayer timezone must be a string")
    timezone_name = _validate_timezone(timezone_value)
    zone = ZoneInfo(timezone_name)

    prayers = _require_mapping(mapping.get("prayers"), "Daily prayer prayers")
    iqamah_values = mapping.get("iqamah", {})
    iqamah_map = _require_mapping(iqamah_values, "Daily prayer iqamah")

    starts: dict[str, datetime] = {}
    iqamah: dict[str, datetime | None] = {}
    for prayer in PRAYERS:
        if prayer not in prayers:
            raise SalahOSPayloadError(f"Daily prayer response is missing {prayer}")
        prayer_value = prayers[prayer]
        embedded_iqamah: Any = None
        if isinstance(prayer_value, Mapping):
            start_value = _first_present(
                prayer_value,
                ("start", "startTime", "startLocalMinutes", "localMinutes", "time"),
            )
            embedded_iqamah = prayer_value.get("iqamah")
        else:
            start_value = prayer_value

        start = _parse_resolved_time(start_value, response_date, zone, f"{prayer} start")
        starts[prayer] = start
        iqamah_value = iqamah_map.get(prayer, embedded_iqamah)
        iqamah[prayer] = _parse_iqamah(iqamah_value, start, response_date, zone, prayer)

    published_at = mapping.get("publishedAt")
    if published_at is not None:
        if not isinstance(published_at, str):
            raise SalahOSPayloadError("publishedAt must be an ISO-8601 string when present")
        _validate_timestamp(published_at, "publishedAt")

    revision_value = mapping.get("revision")
    if revision_value is None:
        revision = None
    elif isinstance(revision_value, (str, int)) and not isinstance(revision_value, bool):
        revision = str(revision_value)
    else:
        raise SalahOSPayloadError("revision must be a string or integer when present")

    return DailyPrayerData(
        mosque_id=mosque_id,
        date=response_date,
        timezone=timezone_name,
        prayer_starts=MappingProxyType(starts),
        iqamah=MappingProxyType(iqamah),
        published_at=published_at,
        revision=revision,
    )


class SalahOSApiClient:
    """Small asynchronous client that only performs public read-only GET requests."""

    def __init__(
        self,
        session: HttpSession,
        base_url: str,
        mosque_id: str,
        request_timeout_seconds: float = 10.0,
    ) -> None:
        self._session = session
        self.base_url = normalize_base_url(base_url)
        self.mosque_id = normalize_mosque_id(mosque_id)
        self._request_timeout_seconds = request_timeout_seconds

    async def async_get_profile(self) -> MosqueProfile:
        """Fetch the published mosque profile."""

        payload = await self._get_json(build_profile_url(self.base_url, self.mosque_id))
        return parse_profile_payload(payload, self.mosque_id)

    async def async_get_daily_prayers(
        self,
        prayer_date: str,
        default_timezone: str,
    ) -> DailyPrayerData:
        """Fetch one day of published prayer data."""

        payload = await self._get_json(
            build_daily_prayers_url(self.base_url, self.mosque_id, prayer_date)
        )
        return parse_daily_prayer_payload(
            payload,
            self.mosque_id,
            prayer_date,
            default_timezone,
        )

    async def _get_json(self, url: str) -> Mapping[str, Any]:
        try:
            async with self._session.get(
                url,
                headers={"Accept": "application/json"},
                timeout=self._request_timeout_seconds,
            ) as response:
                if response.status < 200 or response.status >= 300:
                    raise SalahOSConnectionError(
                        f"SalahOS public API returned HTTP {response.status}"
                    )
                try:
                    payload = await response.json()
                except (TypeError, ValueError) as error:
                    raise SalahOSPayloadError("SalahOS public API returned invalid JSON") from error
        except SalahOSApiError:
            raise
        except Exception as error:
            raise SalahOSConnectionError("Unable to reach the SalahOS public API") from error

        return _require_mapping(payload, "SalahOS public API response")


def _require_mapping(value: Any, label: str) -> Mapping[str, Any]:
    if not isinstance(value, Mapping):
        raise SalahOSPayloadError(f"{label} must be a JSON object")
    return value


def _require_string(mapping: Mapping[str, Any], key: str, label: str) -> str:
    value = mapping.get(key)
    if not isinstance(value, str):
        raise SalahOSPayloadError(f"{label} {key} must be a string")
    return value


def _validate_timezone(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise SalahOSPayloadError("Timezone is required")
    try:
        ZoneInfo(normalized)
    except ZoneInfoNotFoundError as error:
        raise SalahOSPayloadError(f"Unknown IANA timezone: {normalized}") from error
    return normalized


def _validate_date(value: str) -> None:
    try:
        parsed = date.fromisoformat(value)
    except (TypeError, ValueError) as error:
        raise SalahOSPayloadError("Prayer date must use a valid YYYY-MM-DD value") from error
    if parsed.isoformat() != value:
        raise SalahOSPayloadError("Prayer date must use YYYY-MM-DD")


def _validate_timestamp(value: str, label: str) -> None:
    normalized = value.replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as error:
        raise SalahOSPayloadError(f"{label} must use ISO-8601") from error
    if parsed.tzinfo is None:
        raise SalahOSPayloadError(f"{label} must include a UTC offset")


def _first_present(mapping: Mapping[str, Any], keys: tuple[str, ...]) -> Any:
    for key in keys:
        if key in mapping:
            return mapping[key]
    raise SalahOSPayloadError("Prayer time object does not contain a supported start field")


def _parse_resolved_time(value: Any, prayer_date: str, zone: ZoneInfo, label: str) -> datetime:
    if isinstance(value, Mapping):
        if value.get("kind") == "fixed" and "localMinutes" in value:
            value = value["localMinutes"]
        else:
            value = _first_present(value, ("time", "localMinutes", "startLocalMinutes", "start"))

    if isinstance(value, int) and not isinstance(value, bool):
        if value < 0 or value >= 1_440:
            raise SalahOSPayloadError(f"{label} local minutes must be from 0 through 1439")
        hours, minutes = divmod(value, 60)
        return datetime.combine(date.fromisoformat(prayer_date), time(hours, minutes), zone)

    if not isinstance(value, str):
        raise SalahOSPayloadError(f"{label} must be HH:MM, local minutes, or an ISO timestamp")

    clock_match = _CLOCK_PATTERN.fullmatch(value.strip())
    if clock_match is not None:
        return datetime.combine(
            date.fromisoformat(prayer_date),
            time(int(clock_match.group("hour")), int(clock_match.group("minute"))),
            zone,
        )

    normalized = value.strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as error:
        raise SalahOSPayloadError(f"{label} is not a valid time") from error
    if parsed.tzinfo is None:
        raise SalahOSPayloadError(f"{label} ISO timestamp must include a UTC offset")
    return parsed.astimezone(zone)


def _parse_iqamah(
    value: Any,
    prayer_start: datetime,
    prayer_date: str,
    zone: ZoneInfo,
    prayer: str,
) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, Mapping) and value.get("kind") == "offset":
        offset = value.get("offsetMinutes")
        if not isinstance(offset, int) or isinstance(offset, bool) or offset < 0 or offset > 180:
            raise SalahOSPayloadError(f"{prayer} iqamah offset must be from 0 through 180 minutes")
        return prayer_start + timedelta(minutes=offset)
    return _parse_resolved_time(value, prayer_date, zone, f"{prayer} iqamah")
