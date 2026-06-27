'use client';

export default function AdminRefundsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Refunds</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-gray-500">Refund requests can be processed via Django Admin at <code className="bg-gray-100 px-2 py-0.5 rounded">/django-admin/orders/refund/</code></p>
        <p className="text-sm text-gray-400 mt-2">Razorpay refund API integration pending.</p>
      </div>
    </div>
  );
}
