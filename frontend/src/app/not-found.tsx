import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display text-3xl mt-2 mb-4">We couldn&apos;t find that page</h1>
      <p className="text-ink-soft mb-7">The page you&apos;re looking for may have moved or no longer exists.</p>
      <Link href="/" className="inline-block bg-kumkum hover:bg-kumkum-deep text-white font-bold text-sm px-6 py-3 rounded">
        Back to home
      </Link>
    </div>
  );
}
