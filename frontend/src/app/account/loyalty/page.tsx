'use client';

import { useLoyaltyBalance, useLoyaltyTransactions } from '@/hooks/useLoyalty';
import { AccountNav } from '@/components/account/AccountNav';

export default function LoyaltyPage() {
  const { data: balance } = useLoyaltyBalance();
  const { data: transactions } = useLoyaltyTransactions();

  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7 py-7">
      <h1 className="display text-2xl mb-6">Best Choice Rewards</h1>
      <div className="grid sm:grid-cols-[200px_1fr] gap-8">
        <AccountNav />
        <div>
          <div className="bg-ink text-ivory rounded-md p-7 mb-6 flex justify-between items-center flex-wrap gap-4">
            <div>
              <p className="eyebrow text-marigold">Available balance</p>
              <p className="display text-4xl mt-1.5 num">{balance?.points ?? 0} pts</p>
            </div>
            {balance && balance.expiring_soon > 0 && (
              <div className="text-right text-sm">
                <p className="text-marigold font-bold">{balance.expiring_soon} pts expiring soon</p>
                {balance.next_expiry_date && <p className="opacity-70">on {new Date(balance.next_expiry_date).toLocaleDateString()}</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="border border-line rounded p-4.5 text-center">
              <div className="text-xl font-extrabold num">{balance?.lifetime_earned ?? 0}</div>
              <div className="text-xs text-ink-soft mt-1">Lifetime earned</div>
            </div>
            <div className="border border-line rounded p-4.5 text-center">
              <div className="text-xl font-extrabold num">{balance?.lifetime_spent ?? 0}</div>
              <div className="text-xs text-ink-soft mt-1">Lifetime redeemed</div>
            </div>
          </div>

          <h3 className="font-bold mb-3">History</h3>
          <div className="grid gap-2">
            {transactions?.map((t, i) => (
              <div key={i} className="flex justify-between text-sm border-b border-line py-2.5">
                <div>
                  <p className="font-medium">{t.description}</p>
                  <p className="text-ink-soft text-xs">{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`font-bold num ${t.points > 0 ? 'text-leaf' : 'text-kumkum'}`}>
                  {t.points > 0 ? '+' : ''}{t.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
