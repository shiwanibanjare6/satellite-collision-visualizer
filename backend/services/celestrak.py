from datetime import datetime, timezone
from math import atan2, pi, sqrt
from pathlib import Path

import requests
from sgp4.api import Satrec, jday


CELESTRAK_GROUPS = {
    "active": "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
    "stations": "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle",
    "visual": "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle",
}

DEMO_DATASET_PATH = Path(__file__).resolve().parents[1] / "data" / "active.txt"


def fetch_satellite_snapshot(group="active", limit=60, source="demo"):
    if source == "demo":
        satellites = _load_demo_dataset(limit=limit)
        if satellites:
            return satellites

    satellites = _load_live_dataset(group=group, limit=limit)
    if satellites:
        return satellites

    return _load_fallback_dataset(limit=limit)


def _load_demo_dataset(limit):
    if not DEMO_DATASET_PATH.exists():
        return []

    with DEMO_DATASET_PATH.open("r", encoding="utf-8", errors="ignore") as handle:
        lines = [line.rstrip() for line in handle if line.strip()]

    satellites = _parse_tle_lines(lines)
    satellites = [satellite for satellite in satellites if satellite["altitude"] > 0]
    _annotate_local_density(satellites)
    return _select_demo_satellites(satellites, limit)


def _load_live_dataset(group, limit):
    url = CELESTRAK_GROUPS.get(group, CELESTRAK_GROUPS["active"])

    try:
        response = requests.get(url, timeout=12)
        response.raise_for_status()
        tle_text = response.text
    except requests.RequestException:
        return []

    lines = [line.strip() for line in tle_text.splitlines() if line.strip()]
    satellites = _parse_tle_lines(lines)
    _annotate_local_density(satellites)
    return satellites[:limit]


def _load_fallback_dataset(limit):
    lines = [line.strip() for line in _fallback_tle().splitlines() if line.strip()]
    satellites = _parse_tle_lines(lines)
    _annotate_local_density(satellites)
    return satellites[:limit]


def _parse_tle_lines(lines):
    satellites = []

    for index in range(0, len(lines) - 2, 3):
        name, line1, line2 = lines[index : index + 3]
        satellites.append(_build_satellite_record(name, line1, line2))

    return satellites


def _build_satellite_record(name, line1, line2):
    satrec = Satrec.twoline2rv(line1, line2)
    now = datetime.now(timezone.utc)
    jd, fr = jday(
        now.year,
        now.month,
        now.day,
        now.hour,
        now.minute,
        now.second + now.microsecond / 1_000_000,
    )
    error_code, position, velocity = satrec.sgp4(jd, fr)

    inclination = float(line2[8:16].strip())
    eccentricity = float(f"0.{line2[26:33].strip()}")
    mean_motion = float(line2[52:63].strip())

    if error_code != 0:
        return {
            "id": line1[2:7].strip(),
            "name": name.strip(),
            "latitude": 0.0,
            "longitude": 0.0,
            "altitude": 0.0,
            "velocity": 0.0,
            "risk_score": 0.0,
            "is_danger": False,
            "tle_line1": line1,
            "tle_line2": line2,
            "timestamp": now.isoformat(),
            "eci_position": [0.0, 0.0, 0.0],
            "inclination": inclination,
            "eccentricity": eccentricity,
            "mean_motion": mean_motion,
            "local_density": 0,
        }

    latitude, longitude, altitude = _eci_to_geodetic(position)
    speed = sqrt(sum(component * component for component in velocity))

    return {
        "id": line1[2:7].strip(),
        "name": name.strip(),
        "latitude": round(latitude, 3),
        "longitude": round(longitude, 3),
        "altitude": round(altitude, 3),
        "velocity": round(speed, 3),
        "risk_score": 0.0,
        "is_danger": False,
        "tle_line1": line1,
        "tle_line2": line2,
        "timestamp": now.isoformat(),
        "eci_position": [round(value, 3) for value in position],
        "inclination": round(inclination, 4),
        "eccentricity": round(eccentricity, 7),
        "mean_motion": round(mean_motion, 8),
        "local_density": 0,
    }


def _annotate_local_density(satellites):
    density_buckets = {}

    for satellite in satellites:
        altitude_band = round(satellite["altitude"] / 50)
        inclination_band = round(satellite["inclination"] / 2)
        mean_motion_band = round(satellite["mean_motion"])
        key = (altitude_band, inclination_band, mean_motion_band)
        density_buckets[key] = density_buckets.get(key, 0) + 1
        satellite["_density_key"] = key

    for satellite in satellites:
        density = density_buckets.get(satellite["_density_key"], 1) - 1
        satellite["local_density"] = max(density, 0)
        satellite.pop("_density_key", None)


def _select_demo_satellites(satellites, limit):
    sorted_satellites = sorted(
        satellites,
        key=lambda satellite: (
            satellite["local_density"],
            -satellite["altitude"],
            satellite["name"],
        ),
        reverse=True,
    )

    congestion_focus_count = min(max(limit // 3, 12), limit)
    selected = sorted_satellites[:congestion_focus_count]
    selected_ids = {satellite["id"] for satellite in selected}

    remaining = [satellite for satellite in sorted_satellites if satellite["id"] not in selected_ids]
    if remaining and len(selected) < limit:
        step = max(len(remaining) // (limit - len(selected)), 1)
        selected.extend(remaining[::step][: limit - len(selected)])

    selected.sort(key=lambda satellite: satellite["name"])
    return selected[:limit]


def _eci_to_geodetic(position):
    x, y, z = position
    radius = sqrt(x * x + y * y)
    longitude = atan2(y, x)
    latitude = atan2(z, radius)
    altitude = sqrt(x * x + y * y + z * z) - 6378.137

    return (latitude * 180 / pi, longitude * 180 / pi, altitude)


def _fallback_tle():
    return """ISS (ZARYA)
1 25544U 98067A   24180.59717619  .00016871  00000+0  30122-3 0  9991
2 25544  51.6402 156.1455 0006135 107.5173  42.0182 15.50357035459112
HST
1 20580U 90037B   24180.66813110  .00001028  00000+0  59473-4 0  9998
2 20580  28.4698 127.0368 0002842  24.1296 335.9861 15.09408632899616
NOAA 15
1 25338U 98030A   24180.51019334  .00000095  00000+0  75304-4 0  9996
2 25338  98.7404 220.1317 0011046 130.0527 230.1572 14.25965113362389
FENGYUN 3D
1 43010U 17072A   24180.76020547  .00000217  00000+0  80418-4 0  9990
2 43010  98.7339 242.1982 0000662 109.7844 250.3504 14.19512897343438
"""
