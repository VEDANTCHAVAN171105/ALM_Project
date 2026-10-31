import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ActivitySquare, AudioLines, Sparkles, UploadCloud } from "lucide-react";

import { analyzeAudio, checkHealth } from "../api/client";
import AudioRecorder from "../components/AudioRecorder";
import DemoScenarios from "../components/DemoScenarios";
import FileUploader from "../components/FileUploader";
import LoadingPipeline from "../components/LoadingPipeline";
import ResultPanel from "../components/ResultPanel";
import WaveformViewer from "../components/WaveformViewer";


const modeOptions = [
  {
    id: "record",
    label: "Record",
    icon: AudioLines,
    description: "Capture live microphone audio in your browser."
  },
  {
    id: "upload",
    label: "Upload",
    icon: UploadCloud,
    description: "Analyze prerecorded audio files up to 25MB."
  }
];


function HomePage() {
  const [mode, setMode] = useState("record");
  const [audioAsset, setAudioAsset] = useState(null);
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [backendStatus, setBackendStatus] = useState("checking");
  const resultRef = useRef(null);

  useEffect(() => {
    checkHealth()
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const backendBadge = useMemo(() => {
    if (backendStatus === "online") {
      return { label: "Backend Online", className: "border-success/40 bg-success/10 text-success" };
    }
    if (backendStatus === "offline") {
      return { label: "Backend Offline", className: "border-danger/40 bg-danger/10 text-danger" };
    }
    return { label: "Checking Backend", className: "border-cyan/30 bg-cyan/10 text-cyan" };
  }, [backendStatus]);

  const handleAudioReady = (asset) => {
    setAudioAsset(asset);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!audioAsset?.file) {
      toast.error("Attach audio first, then start the ALM analysis.");
      return;
    }

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("audio_file", audioAsset.file);

    try {
      const response = await analyzeAudio(formData);
      if (!response || Object.keys(response).length === 0) {
        toast.error("Analysis incomplete, please try again");
        return;
      }
      setResult(response);
      toast.success(response.status === "partial" ? "Partial analysis ready" : "Analysis completed");
    } catch (error) {
      if (error.userMessage === "Request timed out after 180 seconds.") {
        toast.custom((t) => (
          <div className="glass-card flex max-w-sm items-center gap-3 rounded-2xl p-4">
            <div className="text-sm text-primary">Request timed out after 180 seconds.</div>
            <button
              className="rounded-full border border-cyan/50 px-3 py-1 text-xs font-semibold text-cyan transition hover:scale-[1.02]"
              onClick={() => {
                toast.dismiss(t.id);
                handleAnalyze();
              }}
            >
              Retry
            </button>
          </div>
        ));
      } else {
        toast.error(error.userMessage || "Analysis failed. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetWorkspace = () => {
    setAudioAsset(null);
    setResult(null);
  };

  return (
    <div className="relative space-y-10">
      <div className="mesh-background pointer-events-none absolute inset-0 -z-10 h-[820px] rounded-[40px]" />

      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan/20 bg-cyan/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-cyan">
            <Sparkles size={0} />
            Audio Language Model Workstation
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl font-syne text-4xl font-bold leading-tight text-primary sm:text-5xl lg:text-6xl">
              Deep audio understanding for speech, scene, emotion, and anomaly intelligence.
            </h1>
            <p className="max-w-2xl text-lg text-slate-300">
              ALM listens beyond transcription. It fuses signal quality, speech content, emotional tone, acoustic
              events, and environmental context into a single human-readable report.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className={`rounded-full border px-4 py-2 text-sm ${backendBadge.className}`}>{backendBadge.label}</div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-sm text-slate-300">
               FastAPI + React
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              Max upload: 25MB
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="glass-card relative overflow-hidden rounded-[28px] p-6"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan to-transparent opacity-80" />
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-secondary">Live Intake</p>
              <h2 className="mt-2 font-syne text-2xl font-semibold">Input Console</h2>
            </div>
            <div className="rounded-2xl border border-purple/30 bg-purple/10 px-3 py-2 text-sm text-purple">
              <ActivitySquare size={16} />
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-base/70 p-2">
            {modeOptions.map((option) => {
              const Icon = option.icon;
              const active = mode === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    setMode(option.id);
                    setAudioAsset(null);
                    setResult(null);
                  }}
                  className={`rounded-2xl px-4 py-4 text-left transition ${
                    active
                      ? "glow-cyan bg-gradient-to-br from-cyan/15 to-purple/15 text-primary"
                      : "bg-transparent text-secondary hover:bg-white/5 hover:text-primary"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2 font-semibold">
                    <Icon size={18} />
                    {option.label}
                  </div>
                  <p className="text-sm leading-6">{option.description}</p>
                </button>
              );
            })}
          </div>

          {mode === "record" ? <AudioRecorder onAudioReady={handleAudioReady} /> : <FileUploader onFileReady={handleAudioReady} />}

          <div className="mt-6">
            {audioAsset?.url ? (
              <WaveformViewer audioUrl={audioAsset.url} />
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-base/70 p-6 text-center text-sm text-secondary">
                Record or upload an audio file to preview the waveform before analysis.
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-secondary">
              {audioAsset?.file ? `${audioAsset.name} ready for ALM processing` : "No audio asset loaded yet"}
            </div>
            <button
              onClick={handleAnalyze}
              disabled={!audioAsset?.file || isAnalyzing}
              className="glow-cyan rounded-full bg-gradient-to-r from-cyan to-purple px-6 py-3 font-semibold tracking-wide text-base shadow-lg transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAnalyzing ? "Analyzing..." : "ANALYZE AUDIO"}
            </button>
          </div>
        </motion.div>
      </section>

      <section ref={resultRef}>
        {result ? <ResultPanel result={result} onReset={resetWorkspace} /> : null}
      </section>

      <DemoScenarios />

      {isAnalyzing ? <LoadingPipeline /> : null}
    </div>
  );
}


export default HomePage;
