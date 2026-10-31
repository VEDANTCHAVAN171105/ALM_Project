import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ChevronDown, Database, History, ShieldAlert, Trash2 } from "lucide-react";

import { deleteSession, getHistory } from "../api/client";
import ResultPanel from "../components/ResultPanel";


const PAGE_SIZE = 8;


function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const loadSessions = useCallback(async (nextOffset = 0, append = false) => {
    setLoading(true);
    try {
      const data = await getHistory(PAGE_SIZE, nextOffset);
      setSessions((current) => (append ? [...current, ...data.sessions] : data.sessions));
      setOffset(nextOffset + data.sessions.length);
      setTotal(data.total);
    } catch (error) {
      toast.error(error.userMessage || "Could not load your saved history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this analysis session from history?");
    if (!confirmed) {
      return;
    }

    try {
      await deleteSession(id);
      const remaining = sessions.filter((session) => session.id !== id);
      setSessions(remaining);
      setOffset((current) => Math.max(0, current - 1));
      setTotal((current) => Math.max(0, current - 1));
      if (expandedId === id) {
        setExpandedId(null);
      }
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
      toast.success("Report removed from your history");
    } catch (error) {
      toast.error(error.userMessage || "Could not delete this report.");
    }
  };

  const hasMore = sessions.length < total;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-secondary">Analysis Archive</p>
          <h1 className="mt-3 font-syne text-4xl font-bold">Session History</h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Review your saved ALM analyses, compare reasoning summaries, and reopen full reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-cyan/20 bg-cyan/10 px-4 py-2 text-sm text-cyan">
            <span className="inline-flex items-center gap-2">
              <Database size={14} />
              Private account history
            </span>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-sm text-slate-300">
            {sessions.length} / {total} loaded
          </div>
        </div>
      </div>

      {selectedReport ? (
        <div className="space-y-5">
          <div className="rounded-[28px] border border-cyan/20 bg-cyan/10 p-4 text-sm text-cyan">
            Viewing a report saved to your account.
          </div>
          <ResultPanel
            result={selectedReport}
            onReset={() => setSelectedReport(null)}
            resetLabel="Back to History"
          />
        </div>
      ) : null}

      {sessions.length === 0 && !loading ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-[32px] px-6 py-20 text-center">
          <History size={52} className="mb-4 text-secondary" />
          <h2 className="font-syne text-2xl font-semibold">No analysis history yet</h2>
          <p className="mt-3 max-w-md text-secondary">
            Complete an ALM run from the Analyze page and your report will appear here automatically.
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sessions.map((session, index) => {
          const expanded = expandedId === session.id;
          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className="glass-card rounded-[28px] p-5 transition hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-syne text-xl font-semibold text-primary">{session.filename}</p>
                  <p className="mt-2 text-sm text-secondary">
                    {session.created_at ? new Date(session.created_at).toLocaleString() : "Unknown date"}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(session.id)}
                  className="rounded-full border border-danger/30 bg-danger/10 p-2 text-danger transition hover:scale-[1.02]"
                  aria-label="Delete session"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{session.audio_type || "unknown"}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{session.audio_quality?.quality_rating || "Unknown"}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {session.audio_quality?.duration_seconds?.toFixed?.(1) || session.audio_quality?.duration_seconds}s
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  {session.emotion?.primary || "neutral"}
                </span>
                {session.anomaly_detected ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-danger">
                    <ShieldAlert size={14} />
                    anomaly
                  </span>
                ) : null}
              </div>

              <button
                onClick={() => setSelectedReport(session)}
                className="mt-5 w-full rounded-2xl border border-cyan/30 bg-cyan/10 px-4 py-3 text-sm font-semibold text-cyan transition hover:scale-[1.02]"
              >
                Open Full Report
              </button>

              <button
                onClick={() => setExpandedId(expanded ? null : session.id)}
                className="mt-5 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-base/70 px-4 py-3 text-left text-sm text-primary transition hover:border-cyan/30"
              >
                <span>{expanded ? "Hide reasoning summary" : "Show reasoning summary"}</span>
                <ChevronDown size={18} className={`transition ${expanded ? "rotate-180" : ""}`} />
              </button>

              {expanded ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-base/80 p-4 text-sm leading-7 text-slate-300">
                  {session.reasoning_summary || "No reasoning summary was stored for this session."}
                </div>
              ) : null}
            </motion.div>
          );
        })}
      </div>

      {hasMore ? (
        <div className="flex justify-center">
          <button
            onClick={() => loadSessions(offset, true)}
            disabled={loading}
            className="rounded-full border border-cyan/30 bg-cyan/10 px-6 py-3 font-semibold text-cyan transition hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      ) : null}
    </div>
  );
}


export default HistoryPage;
