'use client';

import { useRef } from 'react';
import {
  useProductImages,
  useUploadProductImage,
  useUpdateProductImage,
  useDeleteProductImage,
} from '@/hooks/useStaff';
import { mediaUrl } from '@/lib/format';

export function ImageManager({ productId }: { productId: number }) {
  const { data: images, isLoading } = useProductImages(productId);
  const upload = useUploadProductImage(productId);
  const update = useUpdateProductImage(productId);
  const remove = useDeleteProductImage(productId);
  const fileInput = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload.mutate(file);
    e.target.value = '';
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-faint">
          The photo marked Primary is used as the default everywhere.
        </span>
        <button
          onClick={() => fileInput.current?.click()}
          disabled={upload.isPending}
          className="text-xs font-bold text-marigold-lit whitespace-nowrap disabled:opacity-50"
        >
          {upload.isPending ? 'Uploading…' : '+ Upload photo'}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
      </div>
      {upload.isError && <p className="text-xs text-kumkum">Could not upload that photo.</p>}

      {isLoading ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : !images?.length ? (
        <p className="text-sm text-ink-soft">No photos yet - shoppers see a placeholder until one&apos;s added.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {images.map((img) => (
            <div key={img.id} className="group relative border border-line">
              {/* Freshly uploaded thumbnails are on the local filesystem/S3, an
                  arbitrary host next/image can't be configured for up front -
                  a plain img avoids fighting its remote-pattern allowlist. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(img.thumb || img.image)}
                alt={img.alt_text}
                className="aspect-square w-full object-cover"
              />
              {img.is_primary ? (
                <span className="absolute left-1 top-1 bg-kumkum px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-white">
                  Primary
                </span>
              ) : (
                <button
                  onClick={() => update.mutate({ id: img.id, is_primary: true })}
                  disabled={update.isPending}
                  className="absolute inset-x-0 bottom-0 bg-ivory/90 py-1 text-[0.6rem] font-bold uppercase opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                >
                  Make primary
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm('Delete this photo?')) remove.mutate(img.id);
                }}
                aria-label="Delete photo"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center bg-ivory/90 text-xs font-bold leading-none text-kumkum opacity-0 transition-opacity group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
