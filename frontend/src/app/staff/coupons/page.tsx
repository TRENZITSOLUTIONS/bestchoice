'use client';

import { useState } from 'react';
import { useCreateCoupon, useStaffCoupons, useToggleCoupon } from '@/hooks/useStaff';
import {
  EmptyState,
  ErrorState,
  Panel,
  StatusPill,
  TableScroll,
  money,
  shortDate,
} from '@/components/staff/ui';

function isoDaysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 16);
}

export default function StaffCouponsPage() {
  const { data: coupons, isLoading, isError } = useStaffCoupons();
  const createCoupon = useCreateCoupon();
  const toggleCoupon = useToggleCoupon();

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_cart_value: '0',
    max_discount: '',
    valid_from: isoDaysFromNow(0),
    valid_till: isoDaysFromNow(30),
    usage_limit: '0',
    per_user_limit: '1',
    description: '',
  });

  function field<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    createCoupon.mutate(
      {
        ...form,
        max_discount: form.max_discount || null,
        usage_limit: Number(form.usage_limit),
        per_user_limit: Number(form.per_user_limit),
        valid_from: new Date(form.valid_from).toISOString(),
        valid_till: new Date(form.valid_till).toISOString(),
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm((f) => ({ ...f, code: '', discount_value: '', description: '' }));
        },
        onError: (err: unknown) => {
          const data = (err as { response?: { data?: Record<string, string[] | string> } })
            ?.response?.data;
          setError(
            data
              ? Object.entries(data)
                  .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
                  .join(' · ')
              : 'Could not create that coupon.'
          );
        },
      }
    );
  }

  return (
    <div className="grid gap-5">
      <Panel
        title="Coupons"
        action={
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-kumkum hover:bg-kumkum-deep text-white text-xs font-bold rounded px-3.5 py-1.5"
          >
            {showForm ? 'Cancel' : 'New coupon'}
          </button>
        }
      >
        {showForm && (
          <form onSubmit={handleCreate} className="grid gap-3 mb-6 pb-6 border-b border-line">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="grid gap-1">
                <span className="eyebrow">Code</span>
                <input
                  required
                  value={form.code}
                  onChange={(e) => field('code', e.target.value.toUpperCase())}
                  placeholder="DIWALI25"
                  className="border border-line rounded px-3 py-2 bg-ivory text-sm"
                />
              </label>
              <label className="grid gap-1">
                <span className="eyebrow">Type</span>
                <select
                  value={form.discount_type}
                  onChange={(e) => field('discount_type', e.target.value)}
                  className="border border-line rounded px-3 py-2 bg-ivory text-sm"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="eyebrow">
                  {form.discount_type === 'percentage' ? 'Percent off' : 'Rupees off'}
                </span>
                <input
                  required
                  type="number"
                  min="1"
                  max={form.discount_type === 'percentage' ? '100' : undefined}
                  value={form.discount_value}
                  onChange={(e) => field('discount_value', e.target.value)}
                  className="border border-line rounded px-3 py-2 bg-ivory text-sm num"
                />
              </label>
              <label className="grid gap-1">
                <span className="eyebrow">Minimum cart (₹)</span>
                <input
                  type="number"
                  min="0"
                  value={form.min_cart_value}
                  onChange={(e) => field('min_cart_value', e.target.value)}
                  className="border border-line rounded px-3 py-2 bg-ivory text-sm num"
                />
              </label>
              <label className="grid gap-1">
                <span className="eyebrow">Max discount (₹, optional)</span>
                <input
                  type="number"
                  min="0"
                  value={form.max_discount}
                  onChange={(e) => field('max_discount', e.target.value)}
                  placeholder="No cap"
                  className="border border-line rounded px-3 py-2 bg-ivory text-sm num"
                />
              </label>
              <label className="grid gap-1">
                <span className="eyebrow">Total uses (0 = unlimited)</span>
                <input
                  type="number"
                  min="0"
                  value={form.usage_limit}
                  onChange={(e) => field('usage_limit', e.target.value)}
                  className="border border-line rounded px-3 py-2 bg-ivory text-sm num"
                />
              </label>
              <label className="grid gap-1">
                <span className="eyebrow">Uses per customer</span>
                <input
                  type="number"
                  min="1"
                  value={form.per_user_limit}
                  onChange={(e) => field('per_user_limit', e.target.value)}
                  className="border border-line rounded px-3 py-2 bg-ivory text-sm num"
                />
              </label>
              <label className="grid gap-1">
                <span className="eyebrow">Starts</span>
                <input
                  required
                  type="datetime-local"
                  value={form.valid_from}
                  onChange={(e) => field('valid_from', e.target.value)}
                  className="border border-line rounded px-3 py-2 bg-ivory text-sm"
                />
              </label>
              <label className="grid gap-1">
                <span className="eyebrow">Ends</span>
                <input
                  required
                  type="datetime-local"
                  value={form.valid_till}
                  onChange={(e) => field('valid_till', e.target.value)}
                  className="border border-line rounded px-3 py-2 bg-ivory text-sm"
                />
              </label>
            </div>
            <label className="grid gap-1">
              <span className="eyebrow">Description (shown to staff only)</span>
              <input
                value={form.description}
                onChange={(e) => field('description', e.target.value)}
                className="border border-line rounded px-3 py-2 bg-ivory text-sm"
              />
            </label>
            {error && <p className="text-kumkum text-sm">{error}</p>}
            <button
              type="submit"
              disabled={createCoupon.isPending}
              className="bg-kumkum hover:bg-kumkum-deep text-white font-bold text-sm rounded px-5 py-2.5 justify-self-start disabled:opacity-50"
            >
              {createCoupon.isPending ? 'Creating…' : 'Create coupon'}
            </button>
          </form>
        )}

        {isLoading ? (
          <p className="text-sm text-ink-soft py-6">Loading…</p>
        ) : isError ? (
          <ErrorState />
        ) : !coupons?.length ? (
          <EmptyState message="No coupons yet." />
        ) : (
          <TableScroll>
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-ink-soft">
                  <th className="font-medium pb-2">Code</th>
                  <th className="font-medium pb-2">Discount</th>
                  <th className="font-medium pb-2">Min cart</th>
                  <th className="font-medium pb-2">Valid</th>
                  <th className="font-medium pb-2 text-right">Used</th>
                  <th className="font-medium pb-2">State</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="py-2.5 font-bold num">{c.code}</td>
                    <td className="py-2.5">
                      {c.discount_type === 'percentage'
                        ? `${Number(c.discount_value)}%`
                        : money(c.discount_value)}
                      {c.max_discount && (
                        <span className="text-ink-soft"> · max {money(c.max_discount)}</span>
                      )}
                    </td>
                    <td className="py-2.5 num">{money(c.min_cart_value)}</td>
                    <td className="py-2.5 text-ink-soft whitespace-nowrap">
                      {shortDate(c.valid_from)} – {shortDate(c.valid_till)}
                    </td>
                    <td className="py-2.5 text-right num">
                      {c.used_count}
                      {c.usage_limit > 0 && <span className="text-ink-soft">/{c.usage_limit}</span>}
                    </td>
                    <td className="py-2.5">
                      <StatusPill
                        value={c.is_active ? 'approved' : 'cancelled'}
                        label={c.is_active ? 'Active' : 'Inactive'}
                      />
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() =>
                          toggleCoupon.mutate({ id: c.id, is_active: !c.is_active })
                        }
                        disabled={toggleCoupon.isPending}
                        className="text-xs font-bold underline disabled:opacity-50 whitespace-nowrap"
                      >
                        {c.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Panel>
    </div>
  );
}
