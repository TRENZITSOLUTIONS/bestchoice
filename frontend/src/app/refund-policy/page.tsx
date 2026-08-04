import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy — Best Choice',
  description:
    'Best Choice returns and cancellations: a 7-day return window, category conditions for clothing, cosmetics and mobile accessories, and refunds via Razorpay.',
};

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7 py-10 sm:py-14">
      <article className="max-w-[72ch]">
        <p className="eyebrow">Legal</p>
        <h1 className="display text-3xl sm:text-4xl mt-2">Refund &amp; Cancellation Policy</h1>

        {/* Draft review notice — kept identical across all four policy pages. */}
        <div className="mt-7 rounded-lg border border-marigold bg-ivory-raised p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-marigold">
            Draft — pending owner review
          </p>
          <p className="mt-2 text-sm text-ink-soft leading-relaxed">
            This page is a <span className="font-semibold text-ink">draft prepared from the business
            owner&apos;s brief</span>. It has not yet been reviewed or approved by Best Choice, and it has
            not been checked by a lawyer. It must be read, corrected and approved by the business owner —
            and ideally by a qualified legal advisor in India — before this site goes live. Every value
            shown in square brackets is still unfilled and needs a real answer.
          </p>
        </div>
        <p className="mt-4 text-xs text-ink-soft">
          Last updated: <span className="num">[DATE - TO BE SET ON PUBLICATION]</span>
        </p>

        <p className="mt-8 text-ink-soft leading-relaxed">
          We want you to be happy with what you buy from Best Choice. This page explains when an order can
          be cancelled, when an item can be returned, and how a refund reaches you. Because we sell
          clothing, cosmetics and mobile accessories, the conditions are not the same for every category —
          please read the section that matches your item.
        </p>

        <div className="mt-10 grid gap-9 leading-relaxed">
          <section>
            <h2 className="display text-lg sm:text-xl mb-3">1. The short version</h2>
            <ul className="grid gap-2 text-ink-soft list-disc pl-5">
              <li>You can cancel an order at any time before it is dispatched.</li>
              <li>
                Eligible items can be returned within{' '}
                <span className="font-semibold text-ink">7 days of delivery</span>.
              </li>
              <li>Clothing must be unused, unwashed, and still have its original tags attached.</li>
              <li>Cosmetics cannot be returned once opened or used.</li>
              <li>Mobile accessories must be unused and in their original sealed packaging.</li>
              <li>Refunds go back to the payment method you originally used, through Razorpay.</li>
              <li>
                Best Choice Rewards points earned on a cancelled or refunded order are reversed.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">2. Cancelling an order</h2>
            <p className="text-ink-soft">
              An order can be cancelled at any point{' '}
              <span className="font-semibold text-ink">before it is dispatched</span>. Once the parcel has
              left us, it can no longer be cancelled — you would need to return it instead, under the rules
              below.
            </p>
            <p className="mt-3 text-ink-soft">
              To cancel, get in touch with us using the details in section 11 and quote your order number.
              If the order was already paid, the full amount is refunded to your original payment method.
            </p>
            <p className="mt-3 text-ink-soft">
              We may also cancel an order ourselves — for example if the item turns out to be out of stock,
              or if the delivery address cannot be served. In that case the full amount is refunded.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">3. The return window</h2>
            <p className="text-ink-soft">
              Return requests must reach us within{' '}
              <span className="font-semibold text-ink">7 days of the date the order was delivered</span>.
              We cannot accept a request made after that, so please check your order as soon as it arrives.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">4. Conditions by category</h2>

            <div className="mt-4 grid gap-4">
              <div className="rounded-lg border border-line bg-card p-4 sm:p-5">
                <h3 className="font-bold">Clothing — men&apos;s, women&apos;s and kids&apos; wear</h3>
                <p className="mt-2 text-sm text-ink-soft">
                  The garment must be <span className="font-semibold text-ink">unused and unwashed</span>,
                  with the <span className="font-semibold text-ink">original tags still attached</span>. It
                  should come back in a condition we could sell again — no stains, no marks from perfume or
                  cosmetics, no alterations, and no smell of wear. Please include any belt, spare button or
                  other item that came with it.
                </p>
              </div>

              <div className="rounded-lg border border-line bg-card p-4 sm:p-5">
                <h3 className="font-bold">Cosmetics</h3>
                <p className="mt-2 text-sm text-ink-soft">
                  For hygiene and safety reasons,{' '}
                  <span className="font-semibold text-ink">
                    cosmetics cannot be returned once they have been opened or used
                  </span>
                  . That includes a broken seal, a removed cap liner, a used applicator or a swatched
                  product. Unopened cosmetics still in their intact original packaging can be returned
                  within the 7-day window. This restriction does not affect your position if the item
                  arrives damaged, sealed but faulty, expired, or is not what you ordered — see section 8.
                </p>
              </div>

              <div className="rounded-lg border border-line bg-card p-4 sm:p-5">
                <h3 className="font-bold">Mobile accessories</h3>
                <p className="mt-2 text-sm text-ink-soft">
                  The accessory must be <span className="font-semibold text-ink">unused</span> and in its{' '}
                  <span className="font-semibold text-ink">original sealed packaging</span>. Once the seal
                  is broken we cannot resell the item, so we cannot accept it back — except where it is
                  faulty, damaged or the wrong item, which is covered in section 8. Ordering an accessory
                  that does not fit your device model is not on its own a fault in the product, so please
                  check compatibility before you order.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">5. What we cannot take back</h2>
            <ul className="grid gap-2 text-ink-soft list-disc pl-5">
              <li>Clothing that has been worn, washed, altered or has had its tags removed</li>
              <li>Cosmetics that have been opened, used, swatched or unsealed</li>
              <li>Mobile accessories whose sealed packaging has been opened</li>
              <li>Anything reported to us more than 7 days after delivery</li>
              <li>Items returned without their original packaging or free gifts</li>
              <li>Items damaged after delivery through misuse or ordinary wear</li>
              <li>
                <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                  [ANY FURTHER NON-RETURNABLE ITEMS - TO BE CONFIRMED]
                </code>{' '}
                — for example innerwear, swimwear or pierced jewellery, if the owner wants these excluded.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">6. How to start a return or cancellation</h2>
            <ol className="grid gap-2 text-ink-soft list-decimal pl-5">
              <li>
                Contact us within the applicable window using the details in section 11, with your order
                number and what you would like to do.
              </li>
              <li>
                Tell us the reason, and send photographs if the item arrived damaged, faulty or incorrect.
              </li>
              <li>
                We will confirm whether the item is eligible and tell you how to send it back or arrange
                collection.
              </li>
              <li>
                Keep the item, its tags and its original packaging intact until the return is settled.
              </li>
            </ol>
            <p className="mt-4 text-ink-soft">
              You can see your orders and their status on your{' '}
              <Link href="/account/orders" className="font-semibold text-kumkum hover:text-kumkum-deep">
                orders page
              </Link>
              .
            </p>
            <p className="mt-3 text-ink-soft">
              <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                [RETURN METHOD - TO BE CONFIRMED]
              </code>{' '}
              — the owner needs to confirm whether returns are collected by a courier, dropped at the
              Spencer Plaza branch, or posted back by the customer.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">7. Refunds</h2>
            <ul className="grid gap-2 text-ink-soft list-disc pl-5">
              <li>
                Approved refunds are sent back to the{' '}
                <span className="font-semibold text-ink">
                  original payment method through Razorpay
                </span>
                . We cannot redirect a refund to a different card, UPI ID or bank account.
              </li>
              <li>
                For a returned item, the refund is issued after we have received it and checked that it
                meets the conditions above.
              </li>
              <li>
                Once we release the refund, how quickly it appears in your account depends on Razorpay and
                on your bank or UPI provider.
              </li>
              <li>
                <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                  [REFUND PROCESSING TIME - TO BE CONFIRMED]
                </code>{' '}
                — the owner needs to state how long a refund takes, so customers have a real expectation.
              </li>
              <li>
                <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                  [SHIPPING CHARGES ON RETURNS - TO BE CONFIRMED]
                </code>{' '}
                — whether the original delivery charge is refunded, and who pays return shipping when the
                return is not our fault.
              </li>
              <li>
                <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                  [EXCHANGES - TO BE CONFIRMED]
                </code>{' '}
                — whether a size or colour exchange is offered instead of a refund, and on what terms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">
              8. Damaged, faulty, wrong or missing items
            </h2>
            <p className="text-ink-soft">
              If your parcel arrives damaged, if an item is faulty or expired, if you were sent the wrong
              item, or if something is missing, contact us as soon as you notice and send photographs of the
              item and the packaging. The category restrictions in section 4 do not stand in the way of
              putting this right — an opened cosmetic that was faulty or a sealed accessory that arrived
              broken is still our problem to fix.
            </p>
            <p className="mt-3 text-ink-soft">
              <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                [REPORTING WINDOW FOR DAMAGED OR MISSING ITEMS - TO BE CONFIRMED]
              </code>
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">9. Best Choice Rewards on refunds</h2>
            <ul className="grid gap-2 text-ink-soft list-disc pl-5">
              <li>
                <span className="font-semibold text-ink">
                  Points earned on an order that is cancelled or refunded are reversed
                </span>
                , because the purchase they were earned on no longer stands. If a refund is partial, the
                points reversed correspond to the refunded amount.
              </li>
              <li>
                <span className="font-semibold text-ink">
                  Points are never earned on shipping charges
                </span>{' '}
                — only on the value of the goods — so a refund of a delivery charge does not change your
                points balance.
              </li>
              <li>
                If you had already redeemed points that are later reversed, your balance can go short until
                it is made up by future purchases.
              </li>
              <li>
                Where points were redeemed against an order that is then refunded, the points used are
                handled as part of settling that refund.{' '}
                <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                  [TREATMENT OF REDEEMED POINTS ON REFUND - TO BE CONFIRMED]
                </code>
              </li>
            </ul>
            <p className="mt-4 text-ink-soft">
              The wider programme terms are in section 9 of our{' '}
              <Link href="/terms" className="font-semibold text-kumkum hover:text-kumkum-deep">
                Terms &amp; Conditions
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">10. Store pickup orders</h2>
            <p className="text-ink-soft">
              For an order collected at the Spencer Plaza branch, the 7-day window runs from the day you
              collect it, and the same category conditions apply. Please bring your order number when you
              come in about a return.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">11. Contact us</h2>
            <ul className="grid gap-2 text-ink-soft list-disc pl-5">
              <li>
                Email:{' '}
                <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                  [CONTACT EMAIL - TO BE PROVIDED]
                </code>
              </li>
              <li>
                Phone:{' '}
                <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                  [CONTACT PHONE - TO BE PROVIDED]
                </code>
              </li>
              <li>Best Choice, Spencer Plaza, Chennai, Tamil Nadu, India</li>
            </ul>
            <p className="mt-3 text-ink-soft">
              Nothing in this policy affects the rights you have as a consumer under Indian law.
            </p>
          </section>
        </div>

        <nav className="mt-14 border-t border-line pt-6">
          <h2 className="text-xs tracking-wide uppercase text-ink mb-3.5">More policies</h2>
          <ul className="grid gap-2 text-sm text-ink-soft sm:grid-cols-3">
            <li>
              <Link href="/shipping-policy" className="hover:text-kumkum">
                Shipping Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-kumkum">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-kumkum">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </nav>
      </article>
    </div>
  );
}
