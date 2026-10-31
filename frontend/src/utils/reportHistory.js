import sampleReports from "../data/sampleReports";


const STORAGE_KEY = "alm-report-history-v1";


const safeJsonParse = (rawValue, fallback) => {
  try {
    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
};


const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
};


const normalizeReport = (report) => {
  const normalizedId = report.id || report.session_id || `report-${Date.now()}`;
  return {
    ...report,
    id: normalizedId,
    session_id: report.session_id || normalizedId,
    created_at: report.created_at || report.timestamp || new Date().toISOString(),
    timestamp: report.timestamp || new Date().toISOString(),
    audio_quality: report.audio_quality || {
      duration_seconds: report.duration_seconds || 0,
      sample_rate: 16000,
      snr_db: 0,
      rms_energy: 0,
      quality_rating: report.quality_rating || "Unknown",
      is_silent: false
    },
    emotion: report.emotion || {
      primary: report.emotion_primary || "neutral",
      secondary: null,
      confidence: report.emotion_confidence || 0,
      reasoning: "No emotion reasoning was stored."
    },
    detected_sounds: Array.isArray(report.detected_sounds) ? report.detected_sounds : [],
    warnings: Array.isArray(report.warnings) ? report.warnings : []
  };
};


export const ensureSeedHistory = () => {
  const storage = getStorage();
  if (!storage) {
    return sampleReports.map(normalizeReport);
  }

  const existing = safeJsonParse(storage.getItem(STORAGE_KEY), null);
  if (Array.isArray(existing) && existing.length > 0) {
    return existing.map(normalizeReport);
  }

  const seeded = sampleReports.map(normalizeReport);
  storage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
};


export const getStoredReports = () => {
  const storage = getStorage();
  if (!storage) {
    return sampleReports.map(normalizeReport);
  }

  const existing = safeJsonParse(storage.getItem(STORAGE_KEY), []);
  if (!Array.isArray(existing) || existing.length === 0) {
    return ensureSeedHistory();
  }

  return existing.map(normalizeReport).sort((left, right) => {
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
};


export const saveReportToHistory = (report, audioAsset = null) => {
  const current = getStoredReports();
  const cacheKey = audioAsset?.file ? `${audioAsset.file.name}::${audioAsset.file.size}` : report.filename || report.id;
  const normalized = normalizeReport({
    ...report,
    cache_key: cacheKey,
    filename: report.filename || audioAsset?.name || "audio-report.wav",
    file_size_bytes: report.file_size_bytes || audioAsset?.size || 0
  });

  const deduped = current.filter((item) => item.id !== normalized.id && item.cache_key !== normalized.cache_key);
  const next = [normalized, ...deduped].slice(0, 30);

  const storage = getStorage();
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return normalized;
};


export const deleteStoredReport = (id) => {
  const next = getStoredReports().filter((report) => report.id !== id);
  const storage = getStorage();
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
};


export const findCachedReportForFile = (file) => {
  if (!file) {
    return null;
  }

  const cacheKey = `${file.name}::${file.size}`;
  const reports = getStoredReports();
  return reports.find((report) => report.cache_key === cacheKey || (report.filename === file.name && report.file_size_bytes === file.size)) || null;
};


export const getPaginatedStoredReports = (limit = 8, offset = 0) => {
  const reports = getStoredReports();
  return {
    sessions: reports.slice(offset, offset + limit),
    total: reports.length,
    limit,
    offset
  };
};
