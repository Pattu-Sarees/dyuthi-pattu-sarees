import Link from 'next/link'

export const metadata = { title: 'Refund & Exchange Policy | Dyuthi Pattu Sarees' }

export default function RefundPolicyPage() {
  return (
    <div className="bg-[#FFFDF7] min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1
          className="text-3xl md:text-4xl font-bold text-center text-[#4E1E24] mb-8"
          style={{ fontFamily: 'var(--font-kurale), serif' }}
        >
          Refund &amp; Exchange Policy
        </h1>

        <div className="text-gray-700 text-sm md:text-[15px] leading-relaxed space-y-8">
          <p>
            Thank you for shopping at <strong className="font-semibold text-[#4E1E24]">Dyuthi Pattu Sarees</strong>. We are committed to providing you with quality sarees and a
            seamless shopping experience. Every saree is carefully inspected before dispatch to ensure it reaches you
            safely and in good condition. In the unlikely event of any issue with your order, our Refund &amp; Exchange
            Policy is designed to provide a fair and transparent resolution.
          </p>

          <Section title="1. Return &amp; Exchange Window">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>We accept return or exchange requests within 72 hours of delivery.</li>
              <li>All requests must be submitted within this period along with the required proof for verification.</li>
            </ul>
          </Section>

          <Section title="2. Eligibility for Refund or Exchange">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>If any product is received damaged or if a wrong saree/product/colour is delivered, a refund will be given or an exchange can be arranged.</li>
              <li>Refund or exchange applies only for wrong or damaged products.</li>
              <li>In Kalamkari dying/printing mistakes and stains are unavoidable and these are not considered as a reason for exchange/return.</li>
              <li>No refund or exchange will be provided for size, colour, or design or misprints preferences.</li>
              <li>In any case wrong saree/colour got delivered please don&apos;t open saree in full as foldings matter a lot in handlooms. Strictly no return/exchange accepted in such case.</li>
            </ul>
          </Section>

          <Section title="3. Product Condition Requirements">
            <p className="mb-2">To be eligible for a return or exchange, the product must:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Be unused, unworn, and unwashed.</li>
              <li>Be returned with original tags, packaging, and accessories intact.</li>
              <li>Be in the same condition as received.</li>
            </ul>
            <p className="mt-2">
              Products showing signs of use, alteration, washing, fall &amp; pico work, or damage after delivery will not
              qualify for return or exchange.
            </p>
          </Section>

          <Section title="4. Unboxing Proof Requirement">
            <p className="mb-2">To ensure a fair and transparent resolution process, customers must provide:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>A clear, continuous, and unedited unboxing video recorded from the moment the package is opened.</li>
              <li>The product and issue must be clearly visible in the video.</li>
            </ul>
            <p className="mt-2">Claims submitted without valid unboxing proof may not be eligible for approval.</p>
          </Section>

          <Section title="5. Non-Returnable &amp; Non-Exchangeable Items">
            <p className="mb-2">Returns, exchanges, or refunds will not be accepted for:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Change of mind after purchase.</li>
              <li>Personal preferences regarding colour, design, fabric feel, or appearance.</li>
              <li>Minor handloom irregularities inherent to handcrafted products.</li>
              <li>Products that have been worn, washed, altered, or customized.</li>
              <li>Sarees with fall, pico, stitching, or any custom modifications completed upon request.</li>
              <li>Products purchased during clearance, special sale, or promotional events (unless damaged or incorrect).</li>
            </ul>
          </Section>

          <Section title="6. Return, Exchange &amp; Refund Process">
            <p className="font-medium text-[#4E1E24]">Step 1: Submit Your Request</p>
            <p className="mb-2">Contact us within 72 hours of delivery and provide:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Order Number</li>
              <li>Reason for return or exchange</li>
              <li>Unboxing video</li>
              <li>Supporting photographs (if applicable)</li>
            </ul>
            <p className="font-medium text-[#4E1E24] mt-4">Step 2: Review &amp; Verification</p>
            <p>Our team will review the submitted details and respond within 2 business days.</p>
            <p className="font-medium text-[#4E1E24] mt-4">Step 3: Approval &amp; Return</p>
            <p>If approved, return instructions will be shared.</p>
            <p className="font-medium text-[#4E1E24] mt-4">Step 4: Refund or Exchange</p>
            <p className="mb-2">Upon successful inspection of the returned product:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Exchange orders will be processed and dispatched at the earliest.</li>
              <li>Approved refunds will be initiated to the original payment method within 5–7 business days.</li>
            </ul>
          </Section>

          <Section title="7. Order Cancellation">
            <p>Orders may be cancelled before dispatch.</p>
            <p>Once an order has been shipped, cancellation requests cannot be accommodated.</p>
          </Section>

          <Section title="8. Important Information">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>All return, exchange, and refund requests are subject to verification and approval.</li>
              <li>We reserve the right to decline requests that do not meet the policy requirements.</li>
              <li>This policy may be revised or updated without prior notice.</li>
            </ul>
          </Section>

          <Section title="9. Contact Us">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                For any assistance regarding returns, exchanges, or refunds, please visit{' '}
                <Link href="/contact" className="font-semibold text-[#C2185B] hover:text-[#a01049]">Contact</Link>
              </li>
            </ul>
            <p className="mt-2 font-medium">Note: Please mention your Order ID for faster assistance.</p>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg md:text-xl font-bold text-[#4E1E24] mb-2" dangerouslySetInnerHTML={{ __html: title }} />
      {children}
    </section>
  )
}
