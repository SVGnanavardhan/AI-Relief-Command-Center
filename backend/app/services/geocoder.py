import traceback
from typing import Optional, Tuple

from geopy.exc import GeocoderServiceError, GeocoderTimedOut, GeopyError
from geopy.geocoders import Nominatim


class GeocodeError(Exception):
    pass


def geocode_location(location: str) -> Tuple[Optional[float], Optional[float]]:
    if not location or not location.strip():
        raise GeocodeError("Invalid location")

    try:
        geolocator = Nominatim(user_agent="ai-relief-command-center")
        details = geolocator.geocode(location, timeout=10)
    except GeocoderTimedOut as exc:
        traceback.print_exc()
        raise GeocodeError("Geocoding timed out") from exc
    except (GeocoderServiceError, GeopyError) as exc:
        traceback.print_exc()
        raise GeocodeError(f"Geocoding failed: {exc}") from exc

    if not details:
        raise GeocodeError("Invalid location")

    return float(details.latitude), float(details.longitude)
