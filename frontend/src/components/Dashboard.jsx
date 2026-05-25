import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

ChartJS.register(ArcElement, Legend, Tooltip);

export function Dashboard({ summary, selectedSatellite, onSelectSatellite }) {
  const [aiRecommendation, setAiRecommendation] = useState("");

useEffect(() => {
  if (!selectedSatellite) return;

  const fetchRecommendation = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/recommendation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedSatellite),
        },
      );

      const data = await response.json();

      setAiRecommendation(data.recommendation);
    } catch (error) {
      console.error(error);

      setAiRecommendation("Autonomous orbital monitoring active.");
    }
  };

  fetchRecommendation();
}, [selectedSatellite]);
  const congestionChartData = {
    labels: ["Class 2", "Class 1", "Class 0"],
    datasets: [
      {
        data: [
          summary.congestionBreakdown[2] ?? 0,
          summary.congestionBreakdown[1] ?? 0,
          summary.congestionBreakdown[0] ?? 0,
        ],
        backgroundColor: ["#ff3b3b", "#f59e0b", "#22c55e"],
        borderWidth: 0,
      },
    ],
  };

  const mostCongestedRegion = summary.mostCongestedSatellite
    ? `${summary.mostCongestedSatellite.name} (${summary.mostCongestedSatellite.local_density} nearby)`
    : "Computing zone";
  const eventFlow = buildEventFlow(summary, selectedSatellite);

  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr] w-full">
      <div className="grid w-full gap-5 md:grid-cols-2">
      <motion.section
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-2xl w-full border border-white/10 bg-slate-950/30 p-3 backdrop-blur"
      >
        <SectionTitle
          title="Orbital Intelligence"
          subtitle="AI threat monitoring"
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <MetricCard label="Satellites" value={summary.satellites.length} />
          <MetricCard
            label="Close Pairs"
            value={summary.collisionPairs.length}
          />
          <MetricCard
            label="Hotspots"
            value={summary.congestedSatellites.length}
          />
          <MetricCard
            label="Avg Speed"
            value={`${summary.averageSpeed.toFixed(1)} km/s`}
          />
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.04 }}
        className="rounded-2xl w-full border border-red-400/15 bg-slate-950/30 p-3 backdrop-blur"
      >
        <SectionTitle
          title="Threat Timeline"
          subtitle="collision intelligence"
        />
        <div className="mt-4 space-y-1.5">
          {eventFlow.map((event) => (
            <div
              key={event}
              className="rounded-lg border border-white/8 bg-slate-950/35 px-3 py-2 text-xs text-slate-200"
            >
              {event}
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl w-full border border-white/10 bg-slate-950/25 p-3 backdrop-blur"
      >
        <SectionTitle
          title="Traffic Density"
          subtitle="orbital congestion map"
        />
        <div className="mt-4 flex items-center justify-center">
          <Doughnut data={congestionChartData} />
        </div>

        </motion.section>


        <motion.section
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.16 }}
        className="rounded-2xl w-full border border-white/10 bg-slate-950/20 p-3 backdrop-blur"
      >
        <SectionTitle
          title="Space Surveillance"
          subtitle="global orbit network"
        />
        <div className="mt-4 space-y-1.5 text-sm text-slate-200">
          <DetailRow label="Network" value="Global Orbital Traffic" />
          <DetailRow label="AI Monitor" value="Continuous Surveillance" />
          <DetailRow label="Top Zone" value={mostCongestedRegion} />
          <DetailRow
            label="Highest Risk Orbit"
            value={
              summary.dangerSatellites.some(
                (satellite) => satellite.orbitType === "LEO",
              )
                ? "LEO"
                : "MEO"
            }
          />
        </div>
      </motion.section>

      </div>
      <motion.section
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.12 }}
        className={`rounded-2xl h-fit border p-3 backdrop-blur ${
          selectedSatellite?.isDanger
            ? "border-red-400/30 bg-red-950/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]"
            : "border-cyan-300/20 bg-slate-950/25"
        }`}
      >
        <SectionTitle
          title="Satellite Inspection"
          subtitle="live orbital telemetry"
        />
        <select
          className="mt-4 mb-3 w-full rounded-lg border border-white/10 bg-slate-950/80 p-2 text-sm text-white"
          value={selectedSatellite?.id || ""}
          onChange={(e) => {
            const selected = summary.dangerSatellites.find(
              (satellite) => String(satellite.id) === e.target.value,
            );

            if (selected) {
              onSelectSatellite(selected.id);
            }
          }}
        >
          {summary.dangerSatellites.map((satellite) => (
            <option key={satellite.id} value={satellite.id}>
              {satellite.name} — Risk {Math.round(satellite.riskScore * 100)}%
            </option>
          ))}
        </select>
        {selectedSatellite ? (
          <div className="mt-4 space-y-1.5 text-sm text-slate-200">
            <div className="mb-3 rounded-lg border border-white/8 bg-slate-950/30 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Threat Priority
                </span>
                <span
                  className={
                    selectedSatellite.isDanger
                      ? "text-red-300"
                      : "text-cyan-200"
                  }
                >
                  {selectedSatellite.isDanger ? "Red Channel" : "Tracking"}
                </span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${
                    selectedSatellite.isDanger ? "bg-red-400" : "bg-cyan-300"
                  }`}
                  style={{
                    width: `${Math.max(8, Math.round(selectedSatellite.riskScore * 100))}%`,
                  }}
                />
              </div>
            </div>
            <DetailRow label="Name" value={selectedSatellite.name} />
            <DetailRow label="NORAD ID" value={selectedSatellite.id} />
            <DetailRow
              label="Altitude"
              value={`${selectedSatellite.altitude.toFixed(1)} km`}
            />
            <DetailRow
              label="Velocity"
              value={`${selectedSatellite.velocity.toFixed(2)} km/s`}
            />
            <DetailRow
              label="Latitude"
              value={`${selectedSatellite.latitude.toFixed(2)} deg`}
            />
            <DetailRow
              label="Longitude"
              value={`${selectedSatellite.longitude.toFixed(2)} deg`}
            />
            <DetailRow
              label="Risk"
              value={`${Math.round(selectedSatellite.riskScore * 100)}%`}
            />
            <DetailRow
              label="Congestion"
              value={getCongestionClassLabel(
                selectedSatellite.congestion_class ?? 0,
              )}
            />
            <DetailRow
              label="Local Density"
              value={`${selectedSatellite.local_density ?? 0} nearby`}
            />
            <DetailRow
              label="Prediction Confidence"
              value={`${Math.round(selectedSatellite.riskScore * 92)}%`}
            />
            <DetailRow
              label="AI Recommendation"
              value={aiRecommendation}
            />
            <DetailRow
              label="Threat Level"
              value={
                selectedSatellite.riskScore > 0.9
                  ? "Critical"
                  : selectedSatellite.riskScore > 0.7
                    ? "Elevated"
                    : "Nominal"
              }
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-300">
            Select a satellite to inspect it.
          </p>
        )}
      </motion.section>


    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <>
      <p className="text-xs uppercase tracking-[0.25em] text-accent/80">
        {subtitle}
      </p>
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
    </>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-lg border border-white/8 bg-slate-950/30 p-2.5">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-slate-950/25 px-3 py-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-white">{value}</span>
    </div>
  );
}

function getCongestionClassLabel(congestionClass) {
  if (congestionClass === 2) {
    return "Class 2 High";
  }
  if (congestionClass === 1) {
    return "Class 1 Medium";
  }
  return "Class 0 Low";
}

function buildEventFlow(summary, selectedSatellite) {
  const events = [];

  if (summary.mostCongestedSatellite) {
    events.push(
      `LEO congestion spike near ${summary.mostCongestedSatellite.name}: ${summary.mostCongestedSatellite.local_density ?? 0} nearby objects`,
    );
  }
  if (summary.collisionPairs.length > 0) {
    const pair = summary.collisionPairs[0];
    events.push(
      `Close approach warning: ${pair.from.name} to ${pair.to.name}, ${Math.round(pair.distanceKm)} km separation`,
    );
  }
  if (selectedSatellite?.isDanger) {
    events.push(`AI anomaly detection triggered on ${selectedSatellite.name}`);
  } else if (selectedSatellite) {
    events.push(
      `Autonomous orbital tracking established on ${selectedSatellite.name}`,
    );
  }
  events.push(
    summary.dangerSatellites.length > 0
      ? `${summary.dangerSatellites.length} objects promoted to red threat channel`
      : "Threat channel quiet; monitoring density drift",
  );

  return events.slice(0, 4);
}
