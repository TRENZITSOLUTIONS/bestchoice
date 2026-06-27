'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminCouponsPage() {
  const [form, setForm] = useState({
    code: '', discount_type: 'percentage', discount_value: '',
    min_cart_value: '0', max_discount: '', usage_limit: '0',
    valid_from: '', valid_till: '',
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/coupons/', form);
      toast.success('Coupon created!');
      setForm({ code: '', discount_type: 'percentage', discount_value: '', min_cart_value: '0', max_discount: '', usage_limit: '0', valid_from: '', valid_till: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Coupons</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg">
        <h2 className="font-semibold mb-4">Create New Coupon</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <input type="text" placeholder="Coupon Code" required value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
          <input type="number" step="0.01" placeholder="Discount Value" required value={form.discount_value}
            onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input type="number" step="0.01" placeholder="Min Cart Value" value={form.min_cart_value}
            onChange={(e) => setForm({ ...form, min_cart_value: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input type="number" step="0.01" placeholder="Max Discount (for % coupons)" value={form.max_discount}
            onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input type="number" placeholder="Usage Limit (0 = unlimited)" value={form.usage_limit}
            onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Valid From</label>
              <input type="datetime-local" required value={form.valid_from}
                onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Valid Till</label>
              <input type="datetime-local" required value={form.valid_till}
                onChange={(e) => setForm({ ...form, valid_till: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-300">
            {loading ? 'Creating...' : 'Create Coupon'}
          </button>
        </form>
      </div>
    </div>
  );
}
