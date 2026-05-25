import { motion } from "framer-motion";

export function AlertBanner({ summary, loading, error }) {
  const dangerCount = summary.dangerSatellites.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/30 p-3 backdrop-blur md:grid-cols-3"
    >
      <BannerCard
        title="Orbital Network"
        value="LEO / MEO / GEO Active"
        tone="text-accent"
      />

      <BannerCard
        title="AI Threat Engine"
        value="Collision Monitoring Online"
        tone="text-safe"
      />
      <BannerCard
        title="Danger Alerts"
        value={error || (dangerCount > 0 ? `${dangerCount} satellites flagged` : "No critical alerts")}
        tone={error ? "text-amber-300" : dangerCount > 0 ? "text-warn" : "text-safe"}
      />
    </motion.section>
  );
}

function BannerCard({ title, value, tone }) {
  return (
    <div className="rounded-lg border border-white/8 bg-slate-950/30 p-3">
      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{title}</p>
      <p className={`mt-2 text-sm font-medium md:text-base ${tone}`}>{value}</p>
    </div>
  );
}
