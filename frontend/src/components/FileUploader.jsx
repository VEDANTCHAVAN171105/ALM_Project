import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FileAudio, RotateCcw, UploadCloud } from "lucide-react";


const ALLOWED_EXTENSIONS = [".wav", ".mp3", ".ogg", ".flac", ".webm"];
const MAX_FILE_SIZE = 25 * 1024 * 1024;


function FileUploader({ onFileReady }) {
  const inputRef = useRef(null);
  const [fileData, setFileData] = useState(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (fileData?.url) {
        URL.revokeObjectURL(fileData.url);
      }
    };
  }, [fileData]);

  const validateFile = (file) => {
    const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error("Unsupported file type. Upload WAV, MP3, OGG, FLAC, or WEBM.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Please choose an audio file under 25MB.");
      return false;
    }
    return true;
  };

  const attachFile = (file) => {
    if (!validateFile(file)) {
      return;
    }

    if (fileData?.url) {
      URL.revokeObjectURL(fileData.url);
    }

    const nextData = {
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      format: file.name.split(".").pop()?.toUpperCase() || "AUDIO",
      source: "upload"
    };
    setFileData(nextData);
    onFileReady(nextData);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      attachFile(file);
    }
  };

  const clearFile = () => {
    if (fileData?.url) {
      URL.revokeObjectURL(fileData.url);
    }
    setFileData(null);
    onFileReady(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-[28px] border-2 border-dashed p-8 text-center transition ${
          dragging
            ? "border-cyan bg-cyan/10"
            : "border-cyan/40 bg-base/60 hover:border-cyan hover:bg-cyan/5"
        }`}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan/20 bg-cyan/10 text-cyan">
          <UploadCloud size={28} />
        </div>
        <h3 className="font-syne text-2xl font-semibold text-primary">Drop audio here or click to browse</h3>
        <p className="mt-3 text-sm text-secondary">Accepted formats: WAV, MP3, OGG, FLAC, WEBM up to 25MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".wav,.mp3,.ogg,.flac,.webm"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              attachFile(file);
            }
          }}
        />
      </div>

      {fileData ? (
        <div className="glass-card flex items-center justify-between rounded-3xl p-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-cyan/20 bg-cyan/10 p-3 text-cyan">
              <FileAudio size={20} />
            </div>
            <div>
              <div className="font-semibold text-primary">{fileData.name}</div>
              <div className="mt-1 text-sm text-secondary">
                {(fileData.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            </div>
            <div className="rounded-full border border-purple/30 bg-purple/10 px-3 py-1 text-xs font-semibold text-purple">
              {fileData.format}
            </div>
          </div>

          <button
            onClick={clearFile}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-primary transition hover:scale-[1.02]"
          >
            <RotateCcw size={14} />
            Clear
          </button>
        </div>
      ) : null}
    </div>
  );
}


export default FileUploader;

