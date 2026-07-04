'use client';

import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';

type ServicesImageUploadFieldProps = {
  label: string;
  value: string;
  pendingFile: File | null;
  onFileChange: (file: File | null) => void;
  onUrlChange: (value: string) => void;
  className?: string;
};

export const SERVICE_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

export async function uploadServicesImage(file: File, targetType: 'category' | 'package') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('targetType', targetType);

  const response = await fetch('/api/admin/services/images', {
    method: 'POST',
    body: formData,
  });
  const payload = await response.json() as {
    data?: { publicUrl: string };
    error?: string;
  };

  if (!response.ok || !payload.data?.publicUrl) {
    throw new Error(payload.error || 'Unable to upload image.');
  }

  return payload.data.publicUrl;
}

export default function ServicesImageUploadField({
  label,
  value,
  pendingFile,
  onFileChange,
  onUrlChange,
  className = '',
}: ServicesImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = useMemo(() => (
    pendingFile ? URL.createObjectURL(pendingFile) : ''
  ), [pendingFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const displayUrl = previewUrl || value;
  const hasImage = Boolean(displayUrl);
  const isSelected = hasImage || isDragging;

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const selectFile = (file: File | null | undefined) => {
    if (file) onFileChange(file);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFilePicker();
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files.item(0));
  };

  return (
    <div className={`flex flex-col gap-2 text-sm font-bold ${className}`}>
      <span>{label}</span>
      <div
        role="button"
        tabIndex={0}
        onClick={openFilePicker}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative grid cursor-pointer overflow-hidden rounded-xl border p-3 transition duration-300 md:grid-cols-[180px_1fr] ${
          isDragging
            ? 'gap-4 border-[#D6B53B] bg-[#FDF5CC] shadow-[0_18px_45px_rgba(142,119,34,0.22),0_0_0_4px_rgba(214,181,59,0.18)]'
            : isSelected
              ? 'gap-4 border-[#D6B53B]/70 bg-[#FFF8D6]/80 shadow-[0_18px_45px_rgba(142,119,34,0.16),0_0_0_1px_rgba(246,224,141,0.42)] dark:bg-[#1A1A12]'
              : 'gap-4 border-[#D6B53B]/20 bg-[#F9F8F1] hover:border-[#D6B53B]/60 hover:bg-[#FDF5CC]/60 dark:bg-white/5'
        }`}
        aria-label={`${label}: upload image`}
      >
        {isSelected && (
          <>
            <div className="pointer-events-none absolute inset-y-3 left-0 w-1.5 rounded-r-full bg-gradient-to-b from-[#FFF4B8] via-[#D6B53B] to-[#8E7722] shadow-[0_0_22px_rgba(214,181,59,0.72)]" />
            <div className="pointer-events-none absolute inset-y-6 left-0 w-12 bg-gradient-to-r from-[#D6B53B]/18 to-transparent" />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FFF1A8]/80 to-transparent" />
          </>
        )}
        <div className="relative h-36 overflow-hidden rounded-lg bg-[#2c3328]">
          {displayUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url("${displayUrl}")` }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/70">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
          <div className="absolute inset-0 ring-1 ring-inset ring-black/10" />
          <div className={`absolute inset-0 flex items-center justify-center bg-black/45 text-white transition-opacity ${isDragging || !hasImage ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
            <div className="flex flex-col items-center gap-2 text-center">
              <Upload className="h-6 w-6" />
              <span className="font-sans text-xs font-bold uppercase tracking-[0.16em]">
                Drop or click
              </span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openFilePicker();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1a1f18] px-4 py-2 text-sm font-bold text-[#FDF5CC] transition hover:bg-[#2c3328]"
            >
              <Upload className="h-4 w-4" />
              {displayUrl ? 'Change Image' : 'Upload Image'}
            </button>
            {(value || pendingFile) && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onFileChange(null);
                  onUrlChange('');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>

          {pendingFile ? (
            <p className="truncate font-sans text-xs font-medium text-gray-600 dark:text-[#A3B19B]">
              Ready to upload: {pendingFile.name}
            </p>
          ) : value ? (
            <p className="truncate font-sans text-xs font-medium text-gray-600 dark:text-[#A3B19B]">
              Stored URL: {value}
            </p>
          ) : (
            <p className="font-sans text-xs font-medium text-gray-500 dark:text-[#A3B19B]">
              Click anywhere in this container or drop an image here. JPG, PNG, or WebP. Maximum 5 MB.
            </p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={SERVICE_IMAGE_ACCEPT}
          className="sr-only"
          onChange={(event) => {
            selectFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
