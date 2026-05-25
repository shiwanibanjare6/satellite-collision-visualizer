import { getOrbitType, latLonAltToVector, orbitPathFromTle } from "./orbits";

export function buildSceneSatellites(rawSatellites) {
  const satellites = rawSatellites
    .map((satellite) => ({
      ...satellite,
      riskScore: satellite.risk_score ?? 0,
      isDanger: Boolean(satellite.is_danger),
      orbitType: getOrbitType(satellite.altitude),
      positionVector: latLonAltToVector(
        satellite.latitude,
        satellite.longitude,
        satellite.altitude
      ),
      orbitPath: orbitPathFromTle(satellite.tle_line1, satellite.tle_line2)
    }))
    .sort((left, right) => {
      const rightPriority =
        Number(right.isDanger) * 3 +
        (right.congestion_class ?? 0) +
        (right.riskScore ?? 0);
      const leftPriority =
        Number(left.isDanger) * 3 +
        (left.congestion_class ?? 0) +
        (left.riskScore ?? 0);
      return rightPriority - leftPriority;
    });

  const leo = satellites
    .filter((satellite) => satellite.orbitType === "LEO")
    .slice(0, 40);
  const meo = satellites
    .filter((satellite) => satellite.orbitType === "MEO")
    .slice(0, 35);
  const geo = satellites
    .filter((satellite) => satellite.orbitType === "GEO")
    .slice(0, 30);

  return [...leo, ...meo, ...geo];
}

export function deriveSceneSummary(snapshot, satellites) {
  const collisionPairs = (snapshot.close_approaches ?? [])
    .map((approach, index) => {
      const [fromId, toId] = approach.pair;
      const from = satellites.find((satellite) => satellite.id === fromId);
      const to = satellites.find((satellite) => satellite.id === toId);

      if (!from || !to) {
        return null;
      }

      return {
        id: `${fromId}-${toId}-${index}`,
        from,
        to,
        distanceKm: approach.distance_km,
        collisionProbability: approach.collision_probability
      };
    })
    .filter(Boolean);

  const dangerSatellites = satellites.filter((satellite) => satellite.isDanger);
  const congestedSatellites = satellites.filter(
    (satellite) => (satellite.congestion_class ?? 0) >= 1
  );
  const averageSpeed =
    satellites.reduce((sum, satellite) => sum + satellite.velocity, 0) /
    (satellites.length || 1);
  const maxRisk = Math.max(...satellites.map((satellite) => satellite.riskScore), 0);
  const congestionBreakdown = satellites.reduce(
    (accumulator, satellite) => {
      const congestionClass = satellite.congestion_class ?? 0;
      accumulator[congestionClass] = (accumulator[congestionClass] ?? 0) + 1;
      return accumulator;
    },
    { 0: 0, 1: 0, 2: 0 }
  );
  const mostCongestedSatellite = [...satellites].sort((left, right) => {
    const densityGap = (right.local_density ?? 0) - (left.local_density ?? 0);
    if (densityGap !== 0) {
      return densityGap;
    }
    return (right.congestion_score ?? 0) - (left.congestion_score ?? 0);
  })[0] ?? null;

  return {
    generatedAt: snapshot.generated_at,
    source: snapshot.source ?? "demo",
    datasetLabel:
      snapshot.source === "demo"
        ? "active.txt"
        : snapshot.source === "live"
          ? "CelesTrak live feed"
          : "Backend offline",
    liveTrackingAvailable: snapshot.source !== "offline",
    congestionModelLoaded: Boolean(snapshot.model_status?.congestion_model_loaded),
    satellites,
    collisionPairs,
    dangerSatellites,
    congestedSatellites,
    safeSatelliteCount: Math.max(satellites.length - dangerSatellites.length, 0),
    averageSpeed,
    maxRisk,
    congestionBreakdown,
    mostCongestedSatellite
  };
}
