import * as satellite from "satellite.js";

export const EARTH_RADIUS = 5;

export function getOrbitType(altitudeKm) {
  if (altitudeKm < 2000) {
    return "LEO";
  }
  if (altitudeKm < 20000) {
    return "MEO";
  }
  return "GEO";
}

export function scaleAltitude(altitudeKm) {
  if (altitudeKm < 2000) {
    return 1.8 + altitudeKm * 0.0005;
  }
  if (altitudeKm < 20000) {
    return 3.8 + altitudeKm * 0.00012;
  }
  return 9 + altitudeKm * 0.00005;
}

export function latLonAltToVector(latitude, longitude, altitudeKm) {
  const radius = EARTH_RADIUS + scaleAltitude(altitudeKm);
  const phi = ((90 - latitude) * Math.PI) / 180;
  const theta = ((longitude + 180) * Math.PI) / 180;

  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  ];
}

export function orbitPathFromTle(tleLine1, tleLine2, steps = 90) {
  if (!tleLine1 || !tleLine2) {
    return [];
  }

  try {
    const satrec = satellite.twoline2satrec(tleLine1, tleLine2);
    const now = new Date();
    const points = [];

    for (let index = 0; index < steps; index += 1) {
      const minutesAhead = (index / steps) * 120;
      const sampleTime = new Date(now.getTime() + minutesAhead * 60 * 1000);
      const positionAndVelocity = satellite.propagate(satrec, sampleTime);
      const gmst = satellite.gstime(sampleTime);

      if (!positionAndVelocity.position) {
        continue;
      }

      const geodetic = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
      const latitude = satellite.degreesLat(geodetic.latitude);
      const longitude = satellite.degreesLong(geodetic.longitude);
      const altitude = geodetic.height;
      points.push(latLonAltToVector(latitude, longitude, altitude));
    }

    return points;
  } catch (error) {
    return [];
  }
}

export function orbitPathPoints(points) {
  return points.length > 0 ? points : [[0, 0, EARTH_RADIUS + scaleAltitude(500)]];
}
