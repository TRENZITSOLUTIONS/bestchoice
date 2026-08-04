import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Best Choice',
  description:
    'How Best Choice collects, uses and shares customer information — Google Sign-In, Razorpay payments, delivery details and order emails.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-7 py-10 sm:py-14">
      <article className="max-w-[72ch]">
        <p className="eyebrow">Legal</p>
        <h1 className="display text-3xl sm:text-4xl mt-2">Privacy Policy</h1>

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
          This policy explains what information Best Choice collects when you browse or buy from this
          website, why we collect it, and who else handles it. Best Choice is a clothing and general
          store operating from the Spencer Plaza branch in Chennai, Tamil Nadu, India, selling
          men&apos;s wear, women&apos;s wear, kids&apos; wear, cosmetics and mobile accessories.
        </p>

        <div className="mt-10 grid gap-9 leading-relaxed">
          <section>
            <h2 className="display text-lg sm:text-xl mb-3">1. Information we collect</h2>
            <p className="text-ink-soft">
              We only collect what we need to take an order, deliver it and support you afterwards.
            </p>

            <h3 className="font-bold mt-5 mb-1.5">Details you give us</h3>
            <ul className="grid gap-2 text-ink-soft list-disc pl-5">
              <li>Your name</li>
              <li>Your email address</li>
              <li>Your phone number</li>
              <li>Your delivery address</li>
            </ul>

            <h3 className="font-bold mt-5 mb-1.5">Information Google gives us when you sign in</h3>
            <p className="text-ink-soft">
              Customer accounts on this site use Google Sign-In. When you choose to sign in, Google
              confirms your identity to us and provides your email address, your name and basic profile
              information such as your profile picture. Best Choice never creates or stores a password
              for a customer account, so there is no customer password held on our systems. The
              Google sign-in button is loaded from Google&apos;s own servers, and Google&apos;s privacy
              policy governs what Google itself collects during sign-in.
            </p>

            <h3 className="font-bold mt-5 mb-1.5">Order information</h3>
            <p className="text-ink-soft">
              What you bought, the size or variant you chose, the order value, the delivery address you
              entered, the status of the order, and your Best Choice Rewards points balance and history.
            </p>

            <h3 className="font-bold mt-5 mb-1.5">Payment information</h3>
            <p className="text-ink-soft">
              Payments on this site are processed by Razorpay. Card numbers, UPI IDs, netbanking logins
              and any other payment credentials are entered on Razorpay&apos;s payment interface and go
              directly to Razorpay. Those details are never sent to or stored on Best Choice servers. We
              receive only a payment reference and whether the payment succeeded or failed.
            </p>

            <h3 className="font-bold mt-5 mb-1.5">Reviews you choose to post</h3>
            <p className="text-ink-soft">
              If you write a product review, we store your star rating, your review text and any images
              you upload. Your display name is shown publicly next to the review, along with a note of
              whether it came from a verified purchase. Please do not include personal details in review
              text or review photographs, as reviews are visible to everyone.
            </p>

            <h3 className="font-bold mt-5 mb-1.5">Information kept in your browser</h3>
            <p className="text-ink-soft">
              To keep you signed in between visits, your sign-in tokens and basic profile details are
              stored in your browser&apos;s own local storage under the name{' '}
              <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                bestchoice-auth
              </code>
              . You can remove this at any time by signing out or by clearing site data in your browser.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">2. How we use your information</h2>
            <ul className="grid gap-2 text-ink-soft list-disc pl-5">
              <li>To take, confirm, pack and deliver your order</li>
              <li>To process payments and refunds through Razorpay</li>
              <li>To send you order confirmation and shipping emails</li>
              <li>To operate the Best Choice Rewards loyalty programme, including earning and reversing points</li>
              <li>To handle cancellations, returns and exchanges</li>
              <li>To answer your questions and provide customer support</li>
              <li>To publish reviews you have chosen to submit</li>
              <li>To keep records of our sales as a business is expected to</li>
              <li>To detect and prevent fraudulent orders and misuse of the site</li>
            </ul>
            <p className="mt-4 text-ink-soft">
              <span className="font-semibold text-ink">Promotional email:</span>{' '}
              <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                [MARKETING EMAIL PRACTICE - TO BE CONFIRMED]
              </code>{' '}
              — the owner needs to confirm whether Best Choice sends promotional or offer emails, and how a
              customer opts out, before this section can be finalised.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">3. Who else handles your information</h2>
            <p className="text-ink-soft">
              We share information with the following third parties only so that they can perform their
              part of your order. We do not sell your personal information.
            </p>
            <ul className="mt-4 grid gap-3 text-ink-soft list-disc pl-5">
              <li>
                <span className="font-semibold text-ink">Razorpay</span> — to collect payment and to send
                refunds back to your original payment method.
              </li>
              <li>
                <span className="font-semibold text-ink">Google</span> — to sign you in and confirm your
                identity.
              </li>
              <li>
                <span className="font-semibold text-ink">Amazon Web Services</span> — product images on
                this site are stored on AWS S3 and served through AWS CloudFront, so your browser requests
                images directly from AWS.
              </li>
              <li>
                <span className="font-semibold text-ink">Delivery partners</span> — your name, delivery
                address and phone number are passed to whoever carries the parcel.{' '}
                <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                  [DELIVERY PARTNERS - TO BE PROVIDED]
                </code>
              </li>
              <li>
                <span className="font-semibold text-ink">Email delivery</span> — your email address is used
                to send order confirmation and shipping emails.{' '}
                <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                  [EMAIL SERVICE PROVIDER - TO BE PROVIDED]
                </code>
              </li>
            </ul>
            <p className="mt-4 text-ink-soft">
              We may also disclose information where we are required to by law, by a court, or by a
              government authority, or where it is necessary to investigate fraud or protect our rights.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">4. Cookies and browser storage</h2>
            <p className="text-ink-soft">
              The sign-in session described above is held in your browser&apos;s local storage rather than
              in a Best Choice cookie. Google&apos;s sign-in service may set its own cookies when you use
              the sign-in button.
            </p>
            <p className="mt-3 text-ink-soft">
              <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                [ANALYTICS AND ADVERTISING - TO BE CONFIRMED]
              </code>{' '}
              — the owner needs to confirm whether any analytics or advertising tools are in use on the
              live site, because that would change what this section has to say.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">5. How long we keep it</h2>
            <p className="text-ink-soft">
              We keep order and payment records for as long as we need them to complete the order, handle
              any return or refund, and maintain our sales and accounting records.{' '}
              <code className="rounded border border-line bg-ivory-raised px-1.5 py-0.5 text-[0.85em] font-semibold text-ink">
                [RETENTION PERIOD - TO BE CONFIRMED]
              </code>
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">6. Your choices</h2>
            <ul className="grid gap-2 text-ink-soft list-disc pl-5">
              <li>
                You can view and update the name, phone number and addresses on your account from your{' '}
                <Link href="/account" className="font-semibold text-kumkum hover:text-kumkum-deep">
                  account page
                </Link>
                .
              </li>
              <li>
                You can ask us for a copy of the information we hold about you, ask us to correct it, or
                ask us to close your account and delete it.
              </li>
              <li>
                You can remove this site&apos;s access to your Google account at any time from your Google
                account&apos;s security settings.
              </li>
              <li>
                Closing your account does not erase records of completed orders that we need to keep for
                accounting purposes.
              </li>
            </ul>
            <p className="mt-4 text-ink-soft">
              To make any of these requests, contact us using the details in section 9.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">7. Security</h2>
            <p className="text-ink-soft">
              This site is served over an encrypted connection, payment details are handled entirely by
              Razorpay rather than by us, and no customer passwords exist for us to lose. That said, no
              website or method of transmitting information over the internet is completely secure, and we
              cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">8. Children</h2>
            <p className="text-ink-soft">
              Accounts and orders on this site are meant to be created and placed by adults. We sell
              kids&apos; wear, but it is intended to be bought by a parent or guardian. We do not
              knowingly collect information from children.
            </p>
          </section>

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">9. Contact us</h2>
            <p className="text-ink-soft">
              For any question about this policy or about the information we hold:
            </p>
            <ul className="mt-3 grid gap-2 text-ink-soft list-disc pl-5">
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

          <section>
            <h2 className="display text-lg sm:text-xl mb-3">10. Changes to this policy</h2>
            <p className="text-ink-soft">
              If we change how we handle your information, we will update this page and change the
              &ldquo;Last updated&rdquo; date at the top.
            </p>
          </section>
        </div>

        <nav className="mt-14 border-t border-line pt-6">
          <h2 className="text-xs tracking-wide uppercase text-ink mb-3.5">More policies</h2>
          <ul className="grid gap-2 text-sm text-ink-soft sm:grid-cols-3">
            <li>
              <Link href="/terms" className="hover:text-kumkum">
                Terms &amp; Conditions
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
