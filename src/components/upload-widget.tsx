'use client';

import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CloudinaryUploadInfo = {
  secure_url: string;
  public_id: string;
  original_filename?: string;
  resource_type: 'image' | 'video' | 'raw';
  bytes?: number;
  width?: number;
  height?: number;
  format?: string;
};

type UploadWidgetProps = {
  /** 'image' | 'video' | 'raw' (PDF = 'raw') */
  resourceType?: 'image' | 'video' | 'raw';
  /** input accept, e.g. ".pdf", "image/*" */
  accept?: string;
  /** max size in MB (client check) */
  maxSizeMB?: number;
  /** allow selecting multiple files */
  multiple?: boolean;
  /** upload to Cloudinary folder */
  folder?: string;
  /** use unsigned uploads by default (requires NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET) */
  unsigned?: boolean;
  /** callback on successful single-file upload */
  onUploadComplete?: (info: CloudinaryUploadInfo) => void;
  /** optional button/label text */
  label?: string;
  /** className for container */
  className?: string;
};

export function UploadWidget({
  resourceType = 'raw',
  accept = '.pdf',
  maxSizeMB = 10,
  multiple = false,
  folder,
  unsigned = true,
  onUploadComplete,
  label = 'Upload',
  className,
}: UploadWidgetProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const unsignedPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET;

  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  if (!cloudName) {
    return (
      <div className="rounded-md border p-4 text-sm text-red-600">
        Cloud name missing. Set <code>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME</code>{' '}
        in <code>.env.local</code>.
      </div>
    );
  }

  if (unsigned && !unsignedPreset) {
    return (
      <div className="rounded-md border p-4 text-sm text-red-600">
        Unsigned preset missing. Set{' '}
        <code>NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET</code> in{' '}
        <code>.env.local</code>.
      </div>
    );
  }

  const openFileDialog = () => inputRef.current?.click();

  const validateFile = (file: File) => {
    const max = maxSizeMB * 1024 * 1024;
    if (file.size > max) return `File too large. Max ${maxSizeMB} MB.`;
    if (accept && accept !== '*') {
      const patterns = accept.split(',').map((s) => s.trim());
      const ok = patterns.some((p) => {
        if (p === '*') return true;
        if (p.endsWith('/*')) {
          const type = p.slice(0, -2);
          return file.type.startsWith(type + '/');
        }
        if (p.startsWith('.'))
          return file.name.toLowerCase().endsWith(p.toLowerCase());
        return file.type === p;
      });
      if (!ok) return `Invalid file type. Allowed: ${accept}`;
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    setError(null);
    setUploadedUrl(null);
    setPreviewName(file.name);
    setProgress(0);
    setUploading(true);

    try {
      // Prepare form data
      const form = new FormData();
      form.append('file', file);
      if (folder) form.append('folder', folder);

      let uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      if (unsigned) {
        form.append('upload_preset', String(unsignedPreset));
      } else {
        // Signed: ask our API for signature & timestamp
        const sigRes = await fetch('/api/cloudinary/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder }),
        });
        if (!sigRes.ok) throw new Error('Failed to get signature');
        const { timestamp, signature, apiKey } = await sigRes.json();
        form.append('timestamp', String(timestamp));
        form.append('signature', signature);
        form.append('api_key', apiKey);
      }

      // Use XHR for progress
      const xhr = new XMLHttpRequest();
      const done: Promise<CloudinaryUploadInfo> = new Promise(
        (resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };
          xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const json = JSON.parse(xhr.responseText);
                  resolve(json);
                } catch (err) {
                  reject(err);
                }
              } else {
                reject(new Error(xhr.responseText || 'Upload failed'));
              }
            }
          };
          xhr.onerror = () => reject(new Error('Network error'));
        }
      );

      xhr.open('POST', uploadUrl);
      xhr.send(form);

      const info = (await done) as CloudinaryUploadInfo;

      setUploadedUrl(info.secure_url || null);
      onUploadComplete?.(info);
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    uploadFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={false && multiple} // single for now; extend as needed
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        onClick={openFileDialog}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'cursor-pointer rounded-lg border p-4 transition',
          dragOver ? 'border-primary ring-2 ring-primary/30' : 'border-border'
        )}
        role="button"
        aria-label="Upload area"
      >
        <div className="flex items-center gap-3">
          <Upload className="h-5 w-5" />
          <div className="text-sm">
            <div className="font-medium">Click to select or drag & drop</div>
            <div className="text-xs text-muted-foreground">
              {accept === '.pdf' ? 'PDF only' : accept || 'Any supported file'}{' '}
              · Max {maxSizeMB}MB
            </div>
          </div>
          <div className="ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={openFileDialog}
              disabled={uploading}
            >
              {label}
            </Button>
          </div>
        </div>

        {previewName && !uploading && (
          <div className="mt-3 flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
            <span className="truncate">{previewName}</span>
            {uploadedUrl ? (
              <a
                className="text-primary underline"
                href={uploadedUrl}
                target="_blank"
                rel="noreferrer"
              >
                View
              </a>
            ) : null}
          </div>
        )}

        {uploading && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Uploading…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded bg-muted">
              <div
                className="h-2 rounded bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Mode: <code>{unsigned ? 'unsigned' : 'signed'}</code> · Resource:{' '}
        <code>{resourceType}</code>
      </div>
    </div>
  );
}
