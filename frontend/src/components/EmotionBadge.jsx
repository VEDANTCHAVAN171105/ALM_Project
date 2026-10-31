import React from "react";
import {
  AlertTriangle,
  Angry,
  Frown,
  Laugh,
  Meh,
  ShieldQuestion,
  SmilePlus
} from "lucide-react";


const emotionMap = {
  happy: { color: "text-success border-success/30 bg-success/10", icon: Laugh },
  sad: { color: "text-sky-400 border-sky-400/30 bg-sky-400/10", icon: Frown },
  angry: { color: "text-danger border-danger/30 bg-danger/10", icon: Angry },
  anxious: { color: "text-warning border-warning/30 bg-warning/10", icon: AlertTriangle },
  calm: { color: "text-teal-400 border-teal-400/30 bg-teal-400/10", icon: SmilePlus },
  neutral: { color: "text-slate-300 border-white/10 bg-white/5", icon: Meh },
  fearful: { color: "text-red-400 border-red-400/30 bg-red-400/10", icon: AlertTriangle },
  surprised: { color: "text-purple border-purple/30 bg-purple/10", icon: ShieldQuestion }
};


function EmotionBadge({ emotion }) {
  const primary = emotion?.primary || "neutral";
  const config = emotionMap[primary] || emotionMap.neutral;
  const Icon = config.icon;

  return (
    <div className="glass-card rounded-[28px] p-5">
      <div className={`rounded-[28px] border p-5 ${config.color}`}>
        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-current/20 p-3">
            <Icon size={28} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em]">Primary Emotion</p>
            <h3 className="mt-2 font-syne text-3xl font-bold capitalize">{primary}</h3>
          </div>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <div>Confidence: {Math.round((emotion?.confidence || 0) * 100)}%</div>
          {emotion?.secondary ? <div>Secondary emotion: {emotion.secondary}</div> : null}
          <div className="italic text-slate-300">{emotion?.reasoning || "Emotion reasoning unavailable."}</div>
        </div>
      </div>
    </div>
  );
}


export default EmotionBadge;

