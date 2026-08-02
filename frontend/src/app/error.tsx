'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7 py-24 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display text-3xl mt-2 mb-4">We hit a snag</h1>
      <p className="text-ink-soft mb-7">Please try again — if this keeps happening, contact us.</p>
      <button onClick={reset} className="bg-kumkum hover:bg-kumkum-deep text-white font-bold text-sm px-6 py-3 rounded">
        Try again
      </button>
    </div>
  );
}
