import React, { useEffect } from "react";
import { AudioLines, Mic, ShieldAlert, Square } from "lucide-react";

import useAudioRecorder from "../hooks/useAudioRecorder";


const formatDuration = (seconds) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${mins}:${secs}`;
};


function AudioRecorder({ onAudioReady }) {
  const {
    isSupported,
    isRecording,
    audioBlob,
    audioUrl,
    duration,
    error,
    startRecording,
    stopRecording,
    resetRecording
  } = useAudioRecorder();

  useEffect(() => {
    if (audioBlob && audioUrl) {
      const extension = audioBlob.type.includes("wav") ? "wav" : "webm";
      const file = new File([audioBlob], `recording.${extension}`, { type: audioBlob.type || "audio/webm" });
      onAudioReady({
        file,
        url: audioUrl,
        name: file.name,
        size: file.size,
        source: "record"
      });
    } else {
      onAudioReady(null);
    }
  }, [audioBlob, audioUrl, onAudioReady]);

  return (
    <div className="rounded-[28px] border border-white/5 bg-base/60 p-6">
      <div className="flex flex-col items-center justify-center text-center">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isSupported}
          className={`relative flex h-32 w-32 items-center justify-center rounded-full border-2 transition ${
            isRecording
              ? "animate-pulse-record border-danger bg-danger/20 text-danger"
              : "glow-cyan border-cyan bg-cyan/10 text-cyan hover:scale-[1.02]"
          } ${!isSupported ? "cursor-not-allowed opacity-40" : ""}`}
        >
          <Mic size={42} />
          {isRecording ? <span className="absolute inset-0 rounded-full border border-danger/50" /> : null}
        </button>

        <div className="mt-5 space-y-2">
          <div className="font-mono text-3xl text-primary">{formatDuration(duration)}</div>
          <p className="text-sm text-secondary">
            {isRecording ? "Recording live microphone input..." : "Tap the mic to capture a fresh audio sample"}
          </p>
        </div>

        {isRecording ? (
          <button
            onClick={stopRecording}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition hover:scale-[1.02]"
          >
            <Square size={14} />
            Stop Recording
          </button>
        ) : null}

        {audioBlob ? (
            <div className="mt-6 w-full rounded-3xl border border-success/30 bg-success/10 p-4 text-left">
            <div className="mb-2 flex items-center gap-2 font-semibold text-success">
              <AudioLines size={18} />
              Ready to Analyze
            </div>
            <p className="text-sm text-slate-300">Recorded duration: {formatDuration(duration)}</p>
            <button
              onClick={resetRecording}
              className="mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-primary transition hover:scale-[1.02]"
            >
              Reset Recording
            </button>
          </div>
        ) : null}

        {!isSupported ? (
          <div className="mt-6 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
            Your browser does not support the MediaRecorder API required for live recording.
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 w-full rounded-2xl border border-danger/30 bg-danger/10 p-4 text-left text-sm text-danger">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <ShieldAlert size={16} />
              Recorder Error
            </div>
            <div>
              {error === "MIC_PERMISSION_DENIED"
                ? "Please allow microphone access in your browser settings"
                : error}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}


export default AudioRecorder;
