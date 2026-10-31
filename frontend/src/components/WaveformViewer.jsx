import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play, Radio } from "lucide-react";
import WaveSurfer from "wavesurfer.js";


const formatClock = (seconds) => {
  const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
  const mins = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const secs = String(Math.floor(safeSeconds % 60)).padStart(2, "0");
  return `${mins}:${secs}`;
};


function WaveformViewer({ audioUrl }) {
  const containerRef = useRef(null);
  const waveSurferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!audioUrl || !containerRef.current) {
      return undefined;
    }

    setLoadError(false);
    const waveSurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#00D4FF",
      progressColor: "#7C3AED",
      barWidth: 2,
      barGap: 2,
      barRadius: 9999,
      height: 120,
      cursorColor: "#E2E8F0",
      normalize: true
    });

    waveSurferRef.current = waveSurfer;
    waveSurfer.load(audioUrl).catch(() => setLoadError(true));

    waveSurfer.on("ready", () => setDuration(waveSurfer.getDuration()));
    waveSurfer.on("timeupdate", (time) => setCurrentTime(time));
    waveSurfer.on("finish", () => setIsPlaying(false));
    waveSurfer.on("error", () => setLoadError(true));

    return () => {
      waveSurfer.destroy();
      waveSurferRef.current = null;
    };
  }, [audioUrl]);

  if (!audioUrl) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[28px] p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-secondary">Waveform Preview</p>
          <h3 className="mt-2 font-syne text-2xl font-semibold">Signal Timeline</h3>
        </div>
        <div className="font-mono text-sm text-slate-300">
          {formatClock(currentTime)} / {formatClock(duration)}
        </div>
      </div>

      {loadError ? (
        <div className="rounded-3xl border border-white/10 bg-base/70 p-6">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Radio size={18} />
            Waveform could not be rendered
          </div>
          <div className="flex h-28 items-end gap-2">
            {Array.from({ length: 36 }).map((_, index) => (
              <div
                key={index}
                className="w-full rounded-full bg-cyan/40"
                style={{ height: `${24 + (index % 8) * 9}px` }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="overflow-hidden rounded-3xl border border-white/5 bg-base/70 px-2 py-4" />
      )}

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => {
            if (!waveSurferRef.current) {
              return;
            }
            waveSurferRef.current.playPause();
            setIsPlaying((value) => !value);
          }}
          className="rounded-full border border-cyan/30 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan transition hover:scale-[1.02]"
        >
          <span className="inline-flex items-center gap-2">
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? "Pause" : "Play"}
          </span>
        </button>
        <div className="text-sm text-secondary">Wave color cyan, progress color purple</div>
      </div>
    </motion.div>
  );
}


export default WaveformViewer;

