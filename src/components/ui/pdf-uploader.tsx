'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUploadThing } from '@/lib/uploadthing';
import { Loader2, Upload, X, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  /** current PDF url */
  value?: string;
  /** called with the uploaded file url */
  onChange: (url: string) => void;
  /** disable the whole control */
  disabled?: boolean;
};

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export default function PdfUploader({ value, onChange, disabled }: Props) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [fileSize, setFileSize] = useState<number | undefined>(undefined);

  const { startUpload } = useUploadThing('pdfUploader', {
    onUploadProgress: (p) => setProgress(p),
    onUploadError: (err) => {
      setIsUploading(false);
      alert(err.message ?? 'Upload failed');
    },
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      setProgress(100);
      const f = res?.[0];
      if (f?.url) {
        // `name`/`size` available because we returned them in onUploadComplete
        setFileName(f.name as unknown as string | undefined);
        setFileSize((f as any).size as number | undefined);
        onChange(f.url);
      }
    },
  });

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted?.[0];
      if (!file) return;

      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file.');
        return;
      }
      if (file.size > MAX_BYTES) {
        alert('PDF must be 8MB or smaller.');
        return;
      }

      setFileName(file.name);
      setFileSize(file.size);
      setProgress(0);
      setIsUploading(true);
      await startUpload([file]);
    },
    [startUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    maxFiles: 1,
    disabled: !!disabled || isUploading,
    maxSize: MAX_BYTES,
  });

  const removePdf = async () => {
    if (!value) return;
    try {
      await fetch('/api/uploadthing/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value }),
      });
    } catch {
      // swallow – even if UT delete fails, remove from UI
    }
    setFileName(undefined);
    setFileSize(undefined);
    setProgress(0);
    onChange('');
  };

  return (
    <div className="space-y-3">
      {!value ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary' : 'border-gray-300'
          } ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? 'Drop your PDF here'
              : 'Drag & drop or click to upload a PDF'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Max 1 file • 8MB • PDF only
          </p>

          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading… {Math.round(progress)}%</span>
              </div>
              <div className="mt-2 h-2 w-full bg-gray-200 rounded">
                <div
                  className="h-2 bg-primary rounded"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              <div className="text-sm">
                <div className="font-medium">{fileName ?? 'PDF file'}</div>
                {typeof fileSize === 'number' && (
                  <div className="text-gray-500">
                    {(fileSize / (1024 * 1024)).toFixed(2)} MB
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={value} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View PDF
                </Button>
              </a>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={removePdf}
                disabled={disabled}
                title="Remove PDF"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Simple inline preview */}
          <div className="mt-4 h-72 w-full overflow-hidden rounded border">
            <iframe
              src={`${value}#toolbar=1&navpanes=0&scrollbar=1`}
              className="h-full w-full"
              title="PDF preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}
