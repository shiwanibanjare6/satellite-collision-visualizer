import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Dashboard } from "./components/Dashboard";
import { AlertBanner } from "./components/AlertBanner";
import { SatelliteScene } from "./components/SatelliteScene";
import { fetchSatelliteSnapshot } from "./lib/api";
import { buildSceneSatellites, deriveSceneSummary } from "./lib/transformers";
import { fallbackSnapshot } from "./lib/mockData";

function App() {
  const [snapshot, setSnapshot] = useState(fallbackSnapshot);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await fetchSatelliteSnapshot();
        if (!active) {
          return;
        }
        setSnapshot(data);
        setError("");
      } catch (loadError) {
        if (!active) {
          return;
        }
        setSnapshot(fallbackSnapshot);
        setError("Congestion backend unavailable. Start the backend to see the trained-model orbital congestion simulation.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    const interval = window.setInterval(load, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const satellites = useMemo(
    () => buildSceneSatellites(snapshot.satellites ?? []),
    [snapshot]
  );

  const summary = useMemo(
    () => deriveSceneSummary(snapshot, satellites),
    [snapshot, satellites]
  );

  const selectedSatellite =
    satellites.find((satellite) => satellite.id === selectedId) ?? satellites[0] ?? null;

  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#173154_0%,#08111f_52%,#04070e_100%)]" />
      <div className="absolute inset-0 bg-grid bg-[size:28px_28px] opacity-30" />
      <div className="relative z-10 flex min-h-screen w-full flex-col px-6 py-6">
        <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-accent/80">
              Final Year Project
            </p>
            <h1 className="text-3xl font-semibold md:text-5xl">
              Real-Time Satellite Collision Visualizer
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">
              AI-powered orbital monitoring platform for visualizing satellite congestion, close approaches, and collision-risk intelligence across Earth's orbital layers.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-glow backdrop-blur"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Refresh Window
            </p>
            <p className="mt-1 text-lg font-medium text-white">15 seconds</p>
          </motion.div>
        </header>

        <AlertBanner summary={summary} loading={loading} error={error} />

        <main className="mt-5 flex  w-full flex-col gap-5">
          <section className="w-full">
            <Dashboard
              summary={summary}
              selectedSatellite={selectedSatellite}
              onSelectSatellite={setSelectedId}
            />
          </section>

          <section className="h-[620px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950/35 shadow-glow backdrop-blur">
            <SatelliteScene
              satellites={satellites}
              collisionPairs={summary.collisionPairs}
              onSelect={setSelectedId}
              selectedId={selectedSatellite?.id ?? null}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
