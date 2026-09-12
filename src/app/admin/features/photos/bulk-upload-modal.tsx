"use client";

import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dialog";
import { Button } from "@/components/button";
import { Loader2, UploadCloud, X, CheckCircle2, AlertCircle, FileImage } from "lucide-react";
import { formatBytes } from "./photo-card";
import { validateFile, type CloudinaryUploadResult } from "@/lib/cloudinary";
import { authFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileUploadState {
  file: File;
  previewUrl: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "failed";
  error?: string;
  result?: CloudinaryUploadResult;
}

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle?: string;
  onUploadComplete: () => void;
}

export function BulkUploadModal({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  onUploadComplete,
}: BulkUploadModalProps) {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const validNewFiles: FileUploadState[] = [];
    Array.from(newFiles).forEach((file) => {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        return;
      }

      validNewFiles.push({
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: "pending",
      });
    });

    setFiles((prev) => [...prev, ...validNewFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startUpload = async () => {
    if (files.length === 0 || isUploading) return;
    setIsUploading(true);

    try {
      const uploadQueue = files.map((item, idx) => async () => {
        if (item.status === "success") return item;

        setFiles((prev) =>
          prev.map((f, i) => (i === idx ? { ...f, status: "uploading", progress: 20 } : f))
        );

        try {
          // 1. Upload file to Cloudinary via server endpoint
          const formData = new FormData();
          formData.append("file", item.file);
          formData.append("eventId", eventId);

          const uploadRes = await authFetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            throw new Error(err.error || "Upload failed");
          }

          const uploadData = await uploadRes.json();
          const asset = uploadData.asset;

          setFiles((prev) =>
            prev.map((f, i) => (i === idx ? { ...f, progress: 70 } : f))
          );

          // 2. Register photo metadata in Supabase database
          await authFetch(`/api/events/${eventId}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              photos: [
                {
                  publicId: asset.publicId,
                  url: asset.url,
                  secureUrl: asset.secureUrl,
                  thumbnailUrl: asset.thumbnailUrl,
                  filename: asset.filename || item.file.name,
                  fileSize: asset.fileSize || item.file.size,
                  width: asset.width,
                  height: asset.height,
                  isSelected: false,
                },
              ],
            }),
          });

          setFiles((prev) =>
            prev.map((f, i) =>
              i === idx ? { ...f, status: "success", progress: 100, result: asset } : f
            )
          );
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Upload failed";
          setFiles((prev) =>
            prev.map((f, i) =>
              i === idx ? { ...f, status: "failed", error: errorMessage } : f
            )
          );
        }
      });

      // Execute with concurrency
      const pool = 3;
      for (let i = 0; i < uploadQueue.length; i += pool) {
        await Promise.all(uploadQueue.slice(i, i + pool).map((fn) => fn()));
      }

      toast.success("Batch photo upload completed!");
      onUploadComplete();
    } catch {
      toast.error("Some uploads failed. Please retry failed photos.");
    } finally {
      setIsUploading(false);
    }
  };

  const totalUploaded = files.filter((f) => f.status === "success").length;
  const allDone = files.length > 0 && totalUploaded === files.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white dark:bg-dark-2 rounded-2xl border border-[#EBE8E3] dark:border-white/15 p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-between">
            <span>Upload Event Photos</span>
            {eventTitle && (
              <span className="text-xs font-normal text-primary bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-md">
                {eventTitle}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Drag & Drop Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-primary/30 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 p-8 text-center cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/15 transition group"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={isUploading}
          />
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
            <UploadCloud className="size-6" />
          </div>
          <p className="mt-3 font-semibold text-sm text-gray-900 dark:text-white">
            Click or drag & drop high-resolution photos
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supports JPEG, PNG, WebP up to 10MB per file
          </p>
        </div>

        {/* Selected Files Queue */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span>Queue ({files.length} photos)</span>
              <span>{totalUploaded} / {files.length} Uploaded</span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-[#EBE8E3] dark:divide-white/15">
              {files.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 pt-2">
                  <div className="relative size-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-dark-3">
                    {item.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.previewUrl} alt={item.file.name} className="size-full object-cover" />
                    ) : (
                      <FileImage className="size-5 m-2.5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <p className="font-medium text-gray-900 dark:text-white truncate max-w-[240px]">
                        {item.file.name}
                      </p>
                      <span className="text-[10px] text-gray-400">{formatBytes(item.file.size)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-dark-3">
                      <div
                        className={cn(
                          "h-full transition-all duration-200",
                          item.status === "failed" ? "bg-red-500" : "bg-primary"
                        )}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 flex items-center">
                    {item.status === "uploading" && <Loader2 className="size-4 animate-spin text-primary" />}
                    {item.status === "success" && <CheckCircle2 className="size-4 text-emerald-500" />}
                    {item.status === "failed" && (
                      <span title={item.error}>
                        <AlertCircle className="size-4 text-red-500" />
                      </span>
                    )}
                    {item.status === "pending" && !isUploading && (
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="p-1 text-gray-400 hover:text-red-500 transition"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#EBE8E3] dark:border-white/15 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
            className="border-[#EBE8E3] dark:border-white/15"
          >
            {allDone ? "Close" : "Cancel"}
          </Button>

          {files.length > 0 && !allDone && (
            <Button
              type="button"
              onClick={startUpload}
              disabled={isUploading}
              className="bg-primary hover:bg-primary/90 text-white shadow-xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Uploading ({totalUploaded}/{files.length})...
                </>
              ) : (
                `Start Upload (${files.length})`
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
