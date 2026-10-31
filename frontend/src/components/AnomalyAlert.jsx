import React from "react";
import { AlertOctagon } from "lucide-react";


const severityStyles = {
  low: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
  medium: "border-orange-400/40 bg-orange-400/10 text-orange-300",
  high: "border-danger/40 bg-danger/10 text-danger",
  critical: "border-red-950/70 bg-red-900/30 text-red-200"
};


function AnomalyAlert({ anomalyDetected, severity, anomalyDetails, suggestedAction }) {
  if (!anomalyDetected) {
    return null;
  }

  const badgeClass = severityStyles[severity] || severityStyles.high;

  return (
    <div className="animate-pulse-glow rounded-[28px] border border-danger/40 bg-gradient-to-r from-danger/10 to-warning/10 p-5">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-3 text-danger">
          <AlertOctagon size={24} />
        </div>
        <div className="flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <h3 className="font-syne text-2xl font-semibold text-primary">Anomaly Detected</h3>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${badgeClass}`}>
              {severity || "high"}
            </span>
          </div>
          <p className="text-sm leading-7 text-slate-200">{anomalyDetails || "Unusual acoustic activity was detected."}</p>
          {suggestedAction ? (
            <div className="mt-4 rounded-3xl border border-white/10 bg-base/70 p-4 text-sm text-slate-300">
              <span className="font-semibold text-primary">Suggested action:</span> {suggestedAction}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}


export default AnomalyAlert;

