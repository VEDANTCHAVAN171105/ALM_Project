import React from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AudioLines, RefreshCcw, Sparkles } from "lucide-react";

import AnomalyAlert from "./AnomalyAlert";
import EmotionBadge from "./EmotionBadge";
import SoundLabels from "./SoundLabels";


const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.35 }
};


function ResultPanel({ result, onReset, resetLabel = "New Analysis" }) {
  const chartData = [
    {
      name: "Overall",
      value: Math.round((result.confidence_overall || 0) * 100),
      fill: "#00D4FF"
    },
    {
      name: "Emotion",
      value: Math.round(((result.emotion?.confidence || 0) * 100)),
      fill: "#7C3AED"
    },
    {
      name: "Signal",
      value: Math.max(0, Math.min(100, Math.round(((result.audio_quality?.snr_db || 0) + 5) * 4))),
      fill: "#10B981"
    }
  ];

  const warnings = result.warnings || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-secondary">Analysis Output</p>
          <h2 className="mt-2 font-syne text-4xl font-bold">Unified Audio Intelligence Report</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-cyan/20 bg-cyan/10 px-4 py-2 font-mono text-sm text-cyan">
            {Math.round(result.total_processing_time_ms || 0)} ms
          </div>
          <button
            onClick={onReset}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-primary transition hover:scale-[1.02]"
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCcw size={14} />
              {resetLabel}
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <AnomalyAlert
            anomalyDetected={result.anomaly_detected}
            severity={result.severity}
            anomalyDetails={result.anomaly_details}
            suggestedAction={result.suggested_action}
          />

          <motion.div {...fadeUp} className="glass-card rounded-[28px] p-5">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <AudioLines size={18} />
              <h3 className="font-syne text-2xl font-semibold">Transcript</h3>
            </div>
            <div className="rounded-3xl border border-white/10 bg-base/80 p-4 text-sm leading-7 text-slate-300">
              {result.transcript || "No speech transcript detected in this audio sample."}
            </div>
            {result.language_detected ? (
              <div className="mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                Language detected: <span className="font-semibold text-primary">{result.language_detected}</span>
              </div>
            ) : null}
          </motion.div>

          <motion.div {...fadeUp}>
            <EmotionBadge emotion={result.emotion} />
          </motion.div>

          <motion.div {...fadeUp} className="glass-card rounded-[28px] p-5">
            <div className="mb-4 flex items-center gap-2 text-primary">
              <Sparkles size={18} />
              <h3 className="font-syne text-2xl font-semibold">Audio Quality</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-base/80 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-secondary">Duration</p>
                <p className="mt-2 font-mono text-2xl text-primary">{result.audio_quality?.duration_seconds}s</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-base/80 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-secondary">Sample Rate</p>
                <p className="mt-2 font-mono text-2xl text-primary">{result.audio_quality?.sample_rate} Hz</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-base/80 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-secondary">SNR</p>
                <p className="mt-2 font-mono text-2xl text-primary">{result.audio_quality?.snr_db} dB</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-base/80 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-secondary">Rating</p>
                <p className="mt-2 text-2xl font-semibold text-primary">{result.audio_quality?.quality_rating}</p>
              </div>
            </div>

            {warnings.length ? (
              <div className="mt-4 rounded-3xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
                {warnings.join(" ")}
              </div>
            ) : null}

            <div className="mt-6 h-60 rounded-3xl border border-white/10 bg-base/80 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#64748B" />
                  <YAxis stroke="#64748B" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "#141B2E",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#E2E8F0"
                    }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div {...fadeUp}>
            <SoundLabels detectedSounds={result.detected_sounds} />
          </motion.div>

          <motion.div {...fadeUp} className="glass-card rounded-[28px] p-5">
            <h3 className="font-syne text-2xl font-semibold text-primary">Scene Description</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {result.scene_description || "Scene information could not be determined."}
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="glass-card rounded-[28px] p-5">
            <h3 className="font-syne text-2xl font-semibold text-primary">Reasoning Summary</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {result.reasoning_summary || "No high-level reasoning summary was returned."}
            </p>
            {result.intent ? (
              <div className="mt-4 rounded-3xl border border-white/10 bg-base/80 p-4 text-sm text-slate-300">
                <span className="font-semibold text-primary">Intent:</span> {result.intent}
              </div>
            ) : null}
          </motion.div>

          <motion.div {...fadeUp} className="glass-card rounded-[28px] p-5">
            <h3 className="font-syne text-2xl font-semibold text-primary">Suggested Action</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {result.suggested_action || "No action required. The audio appears routine."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{result.audio_type}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Overall confidence: {Math.round((result.confidence_overall || 0) * 100)}%
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                {result.status === "partial" ? "Partial result" : "Complete result"}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


export default ResultPanel;
