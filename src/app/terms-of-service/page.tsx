import Link from 'next/link'

export const metadata = { title: 'Terms of Service | Dyuthi Pattu Sarees' }

export default function TermsOfServicePage() {
  return (
    <div className="bg-[#FFFDF7] min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1
          className="text-3xl md:text-4xl font-bold text-center text-[#4E1E24] mb-8"
          style={{ fontFamily: 'var(--font-kurale), serif' }}
        >
          Terms of Service
        </h1>

        <div className="text-gray-700 text-sm md:text-[15px] leading-relaxed space-y-8">
          <p className="font-semibold text-[#4E1E24]">Last Updated: 28/06/2026</p>

          <Section title="1. Acceptance of Terms">
            <p>
              Welcome to <strong className="font-semibold text-[#4E1E24]">Dyuthi Pattu Sarees</strong>. By accessing,
              browsing, or placing an order through the Dyuthi Pattu Sarees website, you agree to be bound by these Terms
              of Service. If you do not agree with any part of these terms, please refrain from using our website and
              services.
            </p>
          </Section>

          <Section title="2. Product Information &amp; Availability">
            <p>
              We make every effort to ensure that product descriptions, images, pricing, and availability information are
              accurate and up to date. However, errors may occasionally occur, and we reserve the right to correct,
              update, or discontinue products without prior notice.
            </p>
          </Section>

          <Section title="3. Handloom Product Characteristics">
            <p>
              Our sarees are crafted using traditional weaving techniques. Slight variations in colour, texture, weaving
              patterns, zari work, and finishing are natural characteristics of authentic handloom products and contribute
              to their uniqueness. Such variations shall not be considered defects.
            </p>
          </Section>

          <Section title="4. Orders &amp; Order Acceptance">
            <p>
              All orders are subject to availability and acceptance. Dyuthi Pattu Sarees reserves the right to accept,
              decline, cancel, or limit any order at its sole discretion, including cases involving pricing errors,
              suspected fraudulent activity, or product unavailability.
            </p>
          </Section>

          <Section title="5. Pricing &amp; Payment">
            <p>All prices displayed on the website are in Indian Rupees (INR) unless otherwise specified.</p>
            <p>
              Full payment must be completed before an order is processed and dispatched. Payments are securely processed
              through trusted payment gateways, and we do not store sensitive payment information on our servers.
            </p>
          </Section>

          <Section title="6. Shipping &amp; Delivery">
            <p>Shipping charges, delivery estimates, and available shipping options will be displayed during checkout.</p>
            <p>
              While we strive to dispatch and deliver orders within the estimated timeframe, delays may occasionally occur
              due to courier disruptions, weather conditions, public holidays, customs procedures, or other unforeseen
              circumstances.
            </p>
            <p>
              For complete details, please refer to our{' '}
              <Link href="/shipping-policy" className="font-semibold text-[#C2185B] hover:text-[#a01049]">Shipping Policy</Link>.
            </p>
          </Section>

          <Section title="7. Returns, Exchanges &amp; Refunds">
            <p>
              Returns, exchanges, and refunds are governed by our{' '}
              <Link href="/refund-policy" className="font-semibold text-[#C2185B] hover:text-[#a01049]">Refund &amp; Exchange Policy</Link>.
            </p>
            <p>
              Customers are encouraged to review the policy carefully before placing an order to understand eligibility,
              timelines, and applicable conditions.
            </p>
          </Section>

          <Section title="8. Intellectual Property Rights">
            <p>
              All content available on this website, including logos, designs, product photographs, graphics, text,
              videos, and branding elements, is the exclusive property of Dyuthi Pattu Sarees.
            </p>
            <p>No content may be copied, reproduced, distributed, modified, or used without prior written consent.</p>
          </Section>

          <Section title="9. User Conduct &amp; Website Usage">
            <p className="mb-2">By using our website, you agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Use the website for any unlawful or fraudulent purpose.</li>
              <li>Interfere with the security or functionality of the website.</li>
              <li>Attempt unauthorized access to systems, accounts, or data.</li>
              <li>Upload malicious software or harmful content.</li>
              <li>Misrepresent your identity or provide false information.</li>
            </ul>
          </Section>

          <Section title="10. Limitation of Liability &amp; Governing Law">
            <p>
              Dyuthi Pattu Sarees shall not be liable for any indirect, incidental, consequential, or special damages
              arising from the use of our website, products, or services.
            </p>
            <p>
              These Terms of Service shall be governed by the laws of India, and any disputes arising from the use of this
              website shall be subject to the jurisdiction of the courts located in Telangana, India.
            </p>
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
