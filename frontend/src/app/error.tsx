'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-300 mb-4">Oops!</h1>
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-gray-500 mb-6">An unexpected error occurred. Please try again.</p>
        <button onClick={reset} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition">
          Try Again
        </button>
      </div>
    </div>
  );
}
