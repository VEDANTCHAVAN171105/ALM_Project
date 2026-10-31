import React, { useEffect, useMemo, useState } from "react";
import { Bell, Dog, Factory, Music4, Volume2, Waves } from "lucide-react";


const iconForSound = (label) => {
  const lower = String(label || "").toLowerCase();
  if (lower.includes("dog")) {
    return Dog;
  }
  if (lower.includes("machine") || lower.includes("factory") || lower.includes("engine")) {
    return Factory;
  }
  if (lower.includes("music") || lower.includes("instrument") || lower.includes("sing")) {
    return Music4;
  }
  if (lower.includes("alarm") || lower.includes("siren")) {
    return Bell;
  }
  if (lower.includes("rain") || lower.includes("wind") || lower.includes("water")) {
    return Waves;
  }
  return Volume2;
};


const barClass = (confidence) => {
  if (confidence > 0.8) {
    return "from-cyan to-cyan/70";
  }
  if (confidence > 0.5) {
    return "from-purple to-purple/70";
  }
  return "from-slate-500 to-slate-400";
};


function SoundLabels({ detectedSounds = [] }) {
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateBars(true), 80);
    return () => clearTimeout(timer);
  }, [detectedSounds]);

  const sounds = useMemo(() => detectedSounds.slice(0, 6), [detectedSounds]);

  return (
    <div className="glass-card rounded-[28px] p-5">
      <h3 className="font-syne text-2xl font-semibold text-primary">Detected Sounds</h3>

      {sounds.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-white/10 bg-base/80 p-5 text-sm text-secondary">
          No distinct sounds detected
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {sounds.map((sound, index) => {
            const Icon = iconForSound(sound.label);
            const width = `${Math.round((sound.confidence || 0) * 100)}%`;
            return (
              <div key={`${sound.label}-${index}`} className="rounded-3xl border border-white/10 bg-base/80 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-2 text-primary">
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-primary">{sound.label}</div>
                      <div className="text-xs text-secondary">{sound.timestamp || "approximate timing unavailable"}</div>
                    </div>
                  </div>
                  <div className="font-mono text-sm text-slate-300">{Math.round((sound.confidence || 0) * 100)}%</div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${barClass(sound.confidence || 0)}`}
                    style={{ width: animateBars ? width : "0%" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


export default SoundLabels;

