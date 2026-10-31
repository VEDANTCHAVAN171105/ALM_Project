import React, { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";


const pipelineSteps = [
  {
    title: "[Stage 1] 🔊 Audio Processing",
    description: "preprocessing, noise reduction"
  },
  {
    title: "[Stage 2] 🤖 AI Analysis",
    description: "Gemini understanding speech + sounds"
  },
  {
    title: "[Stage 3] 📊 Generating Report",
    description: "building structured output"
  }
];


function LoadingPipeline() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((value) => (value < pipelineSteps.length ? value + 1 : value));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-base/80 px-4 backdrop-blur-md">
      <div className="glass-card relative w-full max-w-2xl overflow-hidden rounded-[32px] p-8">
        <div className="absolute inset-x-0 top-0 h-1 overflow-hidden bg-white/5">
          <div className="h-full w-1/3 animate-scan-line bg-gradient-to-r from-transparent via-cyan to-transparent" />
        </div>

        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-secondary">ALM Pipeline</p>
          <h2 className="mt-3 font-syne text-3xl font-bold text-primary">Analyzing Audio Scene</h2>
          <p className="mt-3 text-sm text-secondary">This may take 10-30 seconds...</p>
        </div>

        <div className="space-y-4">
          {pipelineSteps.map((step, index) => {
            const status = index < activeIndex ? "complete" : index === activeIndex ? "active" : "pending";
            return (
              <div
                key={step.title}
                className={`relative overflow-hidden rounded-3xl border p-5 transition ${
                  status === "complete"
                    ? "border-success/30 bg-success/10"
                    : status === "active"
                    ? "border-cyan/30 bg-cyan/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                {status === "active" ? (
                  <div className="absolute inset-0 -translate-x-full animate-scan-line bg-gradient-to-r from-transparent via-cyan/15 to-transparent" />
                ) : null}
                <div className="relative flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-primary">{step.title}</div>
                    <div className="mt-1 text-sm text-secondary">{step.description}</div>
                  </div>
                  <div className="min-w-[92px] text-right text-sm">
                    {status === "complete" ? (
                      <span className="inline-flex items-center gap-2 text-success">
                        <CheckCircle2 size={16} />
                        Complete
                      </span>
                    ) : status === "active" ? (
                      <span className="text-cyan">Active</span>
                    ) : (
                      <span className="text-secondary">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


export default LoadingPipeline;

