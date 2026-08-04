import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions — Best Choice',
  description:
    'The terms that apply when you shop with Best Choice — products, pricing, orders, payments, Best Choice Rewards, acceptable use and governing law.',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7 py-10 sm:py-14">
      <article className="max-w-[72ch]">
        <p className="eyebrow">Legal</p>
        <h1 className="display text-3xl sm:text-4xl mt-2">Terms &amp; Conditions</h1>

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
          These terms apply whenever you browse this website, create an account, or place an order with
          Best Choice. By using the site you agree to them. If you do not agree, please do not use the
          site.
        </p>

        <div className="mt-10 grid gap-9 leading-relaxed">
          <section>
            <h2 className="display text-lg sm:text-xl mb-3">1. Who we are</h2>
            <p className="text-ink-soft">
              Best Choice is a clothing and general store operating from the Spencer Plaza branch in
              Chennai, Tamil Nadu, India. In these terms, &ldquo;we&rdquo;, &ldquo;us&rdquo; and
              &ldquo;Best Choice&rdquo; mean that business, and &ldquo;you&rdquo; means the person using
              the site.
            </p>
            <p className="mt-3 text-ink-soft">
              <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                [LEGAL ENTITY NAME AND REGISTRATION DETAILS - TO BE PROVIDED]
              </code>
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">2. Your account</h2>
            <ul className="grid gap-2 text-ink-soft list-disc pl-5">
              <li>
                Customer accounts are created and accessed through Google Sign-In. There is no separate
                Best Choice password to set or remember.
              </li>
              <li>
                Because your account is tied to your Google account, keeping your Google account secure is
                your responsibility. Orders placed through a signed-in session are treated as placed by you.
              </li>
              <li>
                You must be old enough to enter into a contract under Indian law in order to place an order.
              </li>
              <li>
                The information you give us — name, phone number and delivery address — must be accurate and
                current. We are not responsible for a delivery that fails because the address or phone number
                you supplied was wrong.
              </li>
              <li>
                We may suspend or close an account that is being used fraudulently or in breach of these terms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">3. What we sell</h2>
            <p className="text-ink-soft">
              We sell across five categories: men&apos;s wear, women&apos;s wear, kids&apos; wear,
              cosmetics, and mobile accessories. Some points apply differently depending on the category.
            </p>

            <h3 className="font-bold mt-5 mb-1.5">Clothing — men&apos;s, women&apos;s and kids&apos; wear</h3>
            <p className="text-ink-soft">
              Colours can look different from one screen to another, and fabric texture is hard to judge
              from a photograph, so slight variation between the product image and the item you receive is
              normal. Please check the size guidance on the product page before ordering, as sizing varies
              between brands and styles.
            </p>

            <h3 className="font-bold mt-5 mb-1.5">Cosmetics</h3>
            <p className="text-ink-soft">
              Shade names and swatch images are a guide, not an exact match to how a product will appear on
              your skin. Always read the ingredient list and the manufacturer&apos;s directions on the
              product itself, and patch test before first use if you have sensitive skin or known
              allergies. Nothing on this site is medical advice, and product descriptions are not a promise
              of any particular result.
            </p>

            <h3 className="font-bold mt-5 mb-1.5">Mobile accessories</h3>
            <p className="text-ink-soft">
              Please confirm that an accessory is compatible with your exact device model before ordering.
              Compatibility information on a product page is provided as a guide, and choosing the right
              accessory for your device remains your responsibility.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">4. Pricing and availability</h2>
            <ul className="grid gap-2 text-ink-soft list-disc pl-5">
              <li>All prices on this site are shown in Indian Rupees (₹).</li>
              <li>
                <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                  [TAX TREATMENT - TO BE CONFIRMED]
                </code>{' '}
                — the owner needs to confirm whether displayed prices include applicable taxes, and this
                section must say so plainly.
              </li>
              <li>
                Prices, offers and discounts can change at any time. The price that applies to your order
                is the price shown when the order is placed.
              </li>
              <li>
                Stock is limited and shared with the physical store, so an item shown as available may sell
                out before your order is processed.
              </li>
              <li>
                Product descriptions, images and specifications are provided as accurately as we can manage,
                but we do not warrant that every detail is free of error.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">5. Orders</h2>
            <ul className="grid gap-2 text-ink-soft list-disc pl-5">
              <li>
                Placing an order is an offer to buy. The order confirmation email acknowledges that we have
                received it; the contract is formed when we accept the order and dispatch it, or make it
                ready for collection.
              </li>
              <li>
                We may decline or cancel an order — before or after confirmation — where the item is out of
                stock, where a price or description was listed in error, where the delivery address cannot
                be served, or where we suspect fraud or resale. If we cancel a paid order, the full amount
                is refunded.
              </li>
              <li>
                Quantity limits may apply to promotional items.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">6. Payment</h2>
            <p className="text-ink-soft">
              Online payments are processed by Razorpay, which supports UPI, cards and netbanking. Your
              payment details are entered with Razorpay and are never stored on Best Choice servers. An
              order is processed once Razorpay confirms the payment. If a payment fails or is reversed, the
              order will not be dispatched.
            </p>
            <p className="mt-3 text-ink-soft">
              <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                [CASH ON DELIVERY AND IN-STORE PAYMENT OPTIONS - TO BE CONFIRMED]
              </code>
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">7. Delivery and store pickup</h2>
            <p className="text-ink-soft">
              We deliver across India, with the fastest timelines in Tamil Nadu, and we also offer
              collection at the Spencer Plaza branch. Processing times, delivery estimates and the free
              delivery threshold are set out in our{' '}
              <Link href="/shipping-policy" className="font-semibold text-kumkum hover:text-kumkum-deep">
                Shipping Policy
              </Link>
              , which forms part of these terms. Delivery estimates are estimates, not guarantees.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">8. Cancellations, returns and refunds</h2>
            <p className="text-ink-soft">
              You can cancel an order before it is dispatched, and eligible items can be returned within 7
              days of delivery. Conditions differ by category — in particular, cosmetics cannot be returned
              once opened or used. The full rules are in our{' '}
              <Link href="/refund-policy" className="font-semibold text-kumkum hover:text-kumkum-deep">
                Refund &amp; Cancellation Policy
              </Link>
              , which forms part of these terms.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">9. Best Choice Rewards</h2>
            <p className="text-ink-soft">
              Best Choice Rewards is our loyalty programme. The following terms apply to it.
            </p>
            <ul className="mt-3 grid gap-2 text-ink-soft list-disc pl-5">
              <li>Points are earned on eligible purchases made through your signed-in account.</li>
              <li>
                <span className="font-semibold text-ink">Points are not earned on shipping charges</span> —
                only on the value of the goods.
              </li>
              <li>
                <span className="font-semibold text-ink">
                  Points earned on an order that is later cancelled or refunded are reversed.
                </span>{' '}
                If you have already spent those points, the reversal can leave your balance short until it
                is made up.
              </li>
              <li>
                Points have no cash value, cannot be sold or transferred to another person, and cannot be
                exchanged for money.
              </li>
              <li>
                <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                  [EARN RATE, REDEMPTION VALUE AND EXPIRY - TO BE CONFIRMED]
                </code>{' '}
                — the owner needs to state how many points an order earns, what a point is worth when
                redeemed, any minimum redemption, and whether points expire.
              </li>
              <li>
                We may change, pause or discontinue the programme, and we may withdraw points obtained
                through abuse, cancelled orders or fraudulent activity.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">10. Reviews and content you post</h2>
            <ul className="grid gap-2 text-ink-soft list-disc pl-5">
              <li>
                Reviews must be your own honest experience of the product. Your display name and, where
                applicable, a verified-purchase note are shown publicly with your review.
              </li>
              <li>
                Do not post anything unlawful, abusive, obscene, misleading, or that infringes someone
                else&apos;s rights, and do not post other people&apos;s personal details.
              </li>
              <li>
                By posting a review or image, you give us permission to display it on this site in
                connection with the product.
              </li>
              <li>We may remove or decline to publish any review that breaches these terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">11. Acceptable use</h2>
            <p className="text-ink-soft">You agree not to:</p>
            <ul className="mt-3 grid gap-2 text-ink-soft list-disc pl-5">
              <li>Place fraudulent orders, or use a payment method you are not authorised to use</li>
              <li>
                Buy products for commercial resale without our written agreement, or place bulk orders to
                exploit an offer
              </li>
              <li>
                Scrape, copy, harvest or bulk-download content, prices or images from the site, whether
                manually or by any automated means
              </li>
              <li>
                Attempt to gain unauthorised access to the site, our accounts or our systems, or interfere
                with the site&apos;s normal operation
              </li>
              <li>Abuse the returns process or the loyalty programme</li>
              <li>Use the site for anything unlawful</li>
            </ul>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">12. Intellectual property</h2>
            <p className="text-ink-soft">
              The Best Choice name and logo, and the text, layout and photography on this site, belong to
              Best Choice or to the parties who licensed them to us. You may not reproduce or reuse them
              commercially without our permission. Brand names and trademarks of the products we stock
              remain the property of their respective owners.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">13. Third-party services</h2>
            <p className="text-ink-soft">
              This site relies on outside services — Google for sign-in, Razorpay for payments, Amazon Web
              Services for hosting product images, and delivery partners for shipping. Those services have
              their own terms, and we are not responsible for their acts or omissions. How we handle your
              information alongside them is described in our{' '}
              <Link href="/privacy" className="font-semibold text-kumkum hover:text-kumkum-deep">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">14. Availability of the site</h2>
            <p className="text-ink-soft">
              We aim to keep the site available, but we do not guarantee uninterrupted access. The site may
              be unavailable for maintenance or for reasons outside our control, and we may change or
              withdraw features at any time.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">15. Our responsibility to you</h2>
            <p className="text-ink-soft">
              We are responsible for supplying goods that match their description and are of the quality
              you are entitled to expect, and for the remedies set out in our Refund &amp; Cancellation
              Policy. Beyond that, we are not liable for indirect or consequential losses — for example
              lost profit, lost opportunity, or loss arising from a delivery delay caused by a carrier,
              weather, strike or other event outside our control.
            </p>
            <p className="mt-3 text-ink-soft">
              Nothing in these terms limits or excludes any liability that cannot lawfully be limited or
              excluded under Indian law, including consumer protection law.
            </p>
            <p className="mt-3 text-ink-soft">
              <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                [LIABILITY CAP - TO BE REVIEWED BY A LAWYER]
              </code>
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">16. Governing law and jurisdiction</h2>
            <p className="text-ink-soft">
              These terms are governed by the laws of India. Any dispute arising out of them or out of your
              use of this site is subject to the exclusive jurisdiction of the courts at Chennai, Tamil
              Nadu, India.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">17. Changes to these terms</h2>
            <p className="text-ink-soft">
              We may update these terms from time to time. The version published on this page when you
              place an order is the version that applies to that order.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">18. Contact us</h2>
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
              <Link href="/privacy" className="hover:text-kumkum">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-kumkum">
                Refund &amp; Cancellation
              </Link>
            </li>
            <li>
              <Link href="/shipping-policy" className="hover:text-kumkum">
                Shipping Policy
              </Link>
            </li>
          </ul>
        </nav>
      </article>
    </div>
  );
}
