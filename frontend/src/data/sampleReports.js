const sampleReports = [
  {
    id: "sample-factory-floor",
    session_id: "sample-factory-floor",
    filename: "factory-floor-inspection.wav",
    file_size_bytes: 1048576,
    created_at: "2026-04-20T09:15:00.000Z",
    status: "success",
    audio_quality: {
      duration_seconds: 28.4,
      sample_rate: 16000,
      snr_db: 18.4,
      rms_energy: 0.023,
      quality_rating: "Good",
      is_silent: false
    },
    transcript: "I think there is something wrong with the machine near line three.",
    language_detected: "English",
    detected_sounds: [
      { label: "Mechanical fan", confidence: 0.87, timestamp: "0-12s" },
      { label: "Worker speech", confidence: 0.93, timestamp: "throughout" },
      { label: "Metal grinding", confidence: 0.81, timestamp: "14-19s" }
    ],
    emotion: {
      primary: "anxious",
      secondary: "calm",
      confidence: 0.74,
      reasoning: "Raised pitch and urgent pacing suggest concern while the speaker remains composed."
    },
    scene_description: "An industrial factory floor with persistent machinery noise and a nearby worker reporting an issue over the equipment bed.",
    intent: "Reporting a likely machine malfunction to trigger maintenance attention.",
    anomaly_detected: true,
    anomaly_details: "A harsh grinding component appears alongside routine factory ambience, indicating a possible equipment fault.",
    severity: "high",
    reasoning_summary: "The clip combines worker speech with mechanical ambience in an industrial setting. The speaker sounds concerned, and the abnormal grinding sound suggests a non-routine machine condition that should be checked immediately.",
    suggested_action: "Pause the affected machine and escalate to the maintenance team for inspection.",
    audio_type: "mixed",
    confidence_overall: 0.82,
    pipeline_stages: [
      { name: "Audio Processing", status: "success", time_ms: 340 },
      { name: "Gemini Analysis", status: "success", time_ms: 1450 },
      { name: "Generating Report", status: "success", time_ms: 50 }
    ],
    total_processing_time_ms: 1840,
    timestamp: "2026-04-20T09:15:02.000Z",
    warnings: []
  },
  {
    id: "sample-emergency-call",
    session_id: "sample-emergency-call",
    filename: "emergency-call-scene.mp3",
    file_size_bytes: 1264000,
    created_at: "2026-04-19T18:42:00.000Z",
    status: "success",
    audio_quality: {
      duration_seconds: 17.9,
      sample_rate: 16000,
      snr_db: 15.2,
      rms_energy: 0.031,
      quality_rating: "Good",
      is_silent: false
    },
    transcript: "Please hurry, there has been an accident and I can hear the siren already.",
    language_detected: "English",
    detected_sounds: [
      { label: "Siren", confidence: 0.95, timestamp: "throughout" },
      { label: "Distressed speech", confidence: 0.92, timestamp: "throughout" },
      { label: "Street traffic", confidence: 0.67, timestamp: "background" }
    ],
    emotion: {
      primary: "fearful",
      secondary: "anxious",
      confidence: 0.88,
      reasoning: "The speaker has a strained tone, elevated pitch, and rapid speech consistent with distress."
    },
    scene_description: "An emergency situation near a roadway, with a siren approaching and a distressed caller describing an accident.",
    intent: "Urgently requesting emergency help after a dangerous incident.",
    anomaly_detected: true,
    anomaly_details: "The presence of alarm-like sirens and distressed speech strongly indicates a potentially dangerous event.",
    severity: "critical",
    reasoning_summary: "This audio captures an active emergency scene. The combination of urgent speech, heightened fear, and a continuous siren indicates immediate risk and the need for rapid response.",
    suggested_action: "Contact or continue coordinating with emergency services immediately.",
    audio_type: "mixed",
    confidence_overall: 0.93,
    pipeline_stages: [
      { name: "Audio Processing", status: "success", time_ms: 280 },
      { name: "Gemini Analysis", status: "success", time_ms: 1320 },
      { name: "Generating Report", status: "success", time_ms: 48 }
    ],
    total_processing_time_ms: 1648,
    timestamp: "2026-04-19T18:42:02.000Z",
    warnings: []
  },
  {
    id: "sample-outdoor-conversation",
    session_id: "sample-outdoor-conversation",
    filename: "rainy-sidewalk-conversation.ogg",
    file_size_bytes: 890000,
    created_at: "2026-04-18T07:30:00.000Z",
    status: "success",
    audio_quality: {
      duration_seconds: 24.1,
      sample_rate: 16000,
      snr_db: 11.6,
      rms_energy: 0.019,
      quality_rating: "Good",
      is_silent: false
    },
    transcript: "It is getting heavier, let's move under the shop awning before we continue.",
    language_detected: "English",
    detected_sounds: [
      { label: "Rain", confidence: 0.94, timestamp: "throughout" },
      { label: "Conversation", confidence: 0.89, timestamp: "throughout" },
      { label: "Footsteps", confidence: 0.58, timestamp: "10-20s" }
    ],
    emotion: {
      primary: "calm",
      secondary: "neutral",
      confidence: 0.79,
      reasoning: "The speech is steady and conversational despite the outdoor conditions."
    },
    scene_description: "A rainy outdoor walkway with two people talking while moving through wet street ambience.",
    intent: "Suggesting a practical move to shelter from worsening rain.",
    anomaly_detected: false,
    anomaly_details: null,
    severity: null,
    reasoning_summary: "The recording represents a normal outdoor conversation during rainfall. There is no anomaly; the speaker remains calm and focused on adapting to the weather conditions.",
    suggested_action: null,
    audio_type: "mixed",
    confidence_overall: 0.84,
    pipeline_stages: [
      { name: "Audio Processing", status: "success", time_ms: 310 },
      { name: "Gemini Analysis", status: "success", time_ms: 1185 },
      { name: "Generating Report", status: "success", time_ms: 44 }
    ],
    total_processing_time_ms: 1539,
    timestamp: "2026-04-18T07:30:02.000Z",
    warnings: []
  }
];


export default sampleReports;
