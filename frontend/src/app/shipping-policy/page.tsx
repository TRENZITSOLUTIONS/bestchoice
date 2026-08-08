import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Shipping Policy — Best Choice',
  description:
    'Best Choice delivery timelines across Tamil Nadu, South India and the rest of India, free delivery over ₹500, and store pickup at the Spencer Plaza branch.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7 py-10 sm:py-14">
      <article className="max-w-[72ch]">
        <p className="eyebrow">Legal</p>
        <h1 className="display text-3xl sm:text-4xl mt-2">Shipping Policy</h1>

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
          We ship across India from our Spencer Plaza branch in Chennai, and you can also collect your
          order in store. This page explains how long an order takes to reach you, what delivery costs, and
          what happens when something goes wrong on the way.
        </p>

        <div className="mt-10 grid gap-9 leading-relaxed">
          <section>
            <h2 className="display text-lg sm:text-xl mb-3">1. Where we deliver</h2>
            <p className="text-ink-soft">
              We deliver to addresses across India, with our quickest service in Tamil Nadu. Delivery to a
              particular pin code depends on whether our delivery partners serve it; if we cannot reach your
              address, we will tell you and refund the order in full.
            </p>
            <p className="mt-3 text-ink-soft">
              <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                [INTERNATIONAL SHIPPING - TO BE CONFIRMED]
              </code>{' '}
              — this policy currently assumes deliveries within India only.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">2. Order processing</h2>
            <p className="text-ink-soft">
              Orders are picked, packed and handed to a delivery partner{' '}
              <span className="font-semibold text-ink">
                within 24 to 48 hours of payment confirmation
              </span>
              . Processing begins only once Razorpay confirms your payment, so a failed or pending payment
              will hold the order.
            </p>
            <p className="mt-3 text-ink-soft">
              <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                [PROCESSING ON SUNDAYS AND PUBLIC HOLIDAYS - TO BE CONFIRMED]
              </code>
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">3. Delivery timelines</h2>
            <p className="text-ink-soft">
              The estimates below are counted in business days{' '}
              <span className="font-semibold text-ink">after</span> the 24 to 48 hour processing period, so
              please add processing time to work out when a parcel should arrive.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <th className="py-2.5 pr-4 font-bold">Destination</th>
                    <th className="py-2.5 font-bold">Estimated delivery</th>
                  </tr>
                </thead>
                <tbody className="text-ink-soft">
                  <tr className="border-b border-line">
                    <td className="py-2.5 pr-4">Tamil Nadu</td>
                    <td className="py-2.5 num">2 to 4 business days</td>
                  </tr>
                  <tr className="border-b border-line">
                    <td className="py-2.5 pr-4">
                      South India (outside Tamil Nadu)
                    </td>
                    <td className="py-2.5 num">3 to 6 business days</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4">Rest of India</td>
                    <td className="py-2.5">
                      Longer than the above.{' '}
                      <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                        [REST OF INDIA TIMELINE - TO BE CONFIRMED]
                      </code>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-ink-soft">
              These are estimates rather than guarantees. Remote areas, and pin codes served less often by
              our delivery partners, can take longer.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">4. Delivery charges</h2>
            <ul className="grid gap-2 text-ink-soft list-disc pl-5">
              <li>
                <span className="font-semibold text-ink">
                  Delivery is free on orders of ₹500 and above.
                </span>
              </li>
              <li>
                For orders below ₹500, a delivery charge applies and is shown at checkout before you pay.{' '}
                <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                  [DELIVERY CHARGE BELOW ₹500 - TO BE CONFIRMED]
                </code>
              </li>
              <li>
                The ₹500 threshold is measured on the order value after any discount, and before the
                delivery charge itself.
              </li>
              <li>
                Best Choice Rewards points are{' '}
                <span className="font-semibold text-ink">not earned on delivery charges</span> — only on the
                value of the goods.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">5. Store pickup at Spencer Plaza</h2>
            <p className="text-ink-soft">
              You can choose to collect your order at our Spencer Plaza branch in Chennai instead of having
              it delivered. There is no delivery charge on a pickup order. We will let you know when the
              order is ready, and you should bring your order number with you.
            </p>
            <p className="mt-3 text-ink-soft">
              45, Spencer Plaza Mall, Floor 1, Anna Salai, Chennai, Tamil Nadu 600002.{' '}
              <Link href="/our-stores" className="font-semibold text-kumkum hover:text-kumkum-deep">
                Map and directions
              </Link>
              .
            </p>
            <p className="mt-3 text-ink-soft">
              <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                [PICKUP HOURS AND HOW LONG AN ORDER IS HELD - TO BE CONFIRMED]
              </code>
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">6. Tracking your order</h2>
            <p className="text-ink-soft">
              We send an order confirmation email when your payment is confirmed, and a shipping email when
              the parcel is dispatched. You can also see the status of every order on your{' '}
              <Link href="/account/orders" className="font-semibold text-kumkum hover:text-kumkum-deep">
                orders page
              </Link>
              . Please make sure the email address and phone number on your account are correct, since
              delivery partners often call before arriving.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">7. Delivery attempts</h2>
            <ul className="grid gap-2 text-ink-soft list-disc pl-5">
              <li>
                Someone should be available at the address to receive the parcel, or reachable on the phone
                number you gave us.
              </li>
              <li>
                If a delivery cannot be completed, the delivery partner will usually try again before
                returning the parcel to us.
              </li>
              <li>
                An incomplete or incorrect address, or an unreachable phone number, is the most common cause
                of a failed delivery, and we cannot take responsibility for details entered incorrectly at
                checkout.
              </li>
              <li>
                <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                  [NUMBER OF DELIVERY ATTEMPTS AND WHAT HAPPENS TO A RETURNED PARCEL - TO BE CONFIRMED]
                </code>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">8. Delays outside our control</h2>
            <p className="text-ink-soft">
              Once a parcel is with a delivery partner, its progress is largely out of our hands. Weather,
              transport disruption, strikes, local restrictions, festival-season volume and similar events
              can all add days to a delivery. We will help you chase a delayed parcel, but we cannot
              guarantee a delivery date in these situations.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">9. Split deliveries</h2>
            <p className="text-ink-soft">
              An order containing several items may be sent in more than one parcel, and the parcels may not
              arrive on the same day. If your order looks incomplete, please check your shipping emails
              before reporting a missing item.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">10. Damaged or missing parcels</h2>
            <p className="text-ink-soft">
              If a parcel arrives damaged, opened or with something missing, contact us as soon as you notice
              and send photographs of the parcel and its contents. This is handled under our{' '}
              <Link href="/refund-policy" className="font-semibold text-kumkum hover:text-kumkum-deep">
                Refund &amp; Cancellation Policy
              </Link>
              , which also covers the 7-day return window and how refunds are paid back through Razorpay.
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
          </section>
        </div>

        <nav className="mt-14 border-t border-line pt-6">
          <h2 className="text-xs tracking-wide uppercase text-ink mb-3.5">More policies</h2>
          <ul className="grid gap-2 text-sm text-ink-soft sm:grid-cols-3">
            <li>
              <Link href="/refund-policy" className="hover:text-kumkum">
                Refund &amp; Cancellation
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
