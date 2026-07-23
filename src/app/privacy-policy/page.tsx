import Link from 'next/link'

export const metadata = { title: 'Privacy Policy | Dyuthi Pattu Sarees' }

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[#FFFDF7] min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1
          className="text-3xl md:text-4xl font-bold text-center text-[#4E1E24] mb-8"
          style={{ fontFamily: 'var(--font-kurale), serif' }}
        >
          Privacy Policy
        </h1>

        <div className="text-gray-700 text-sm md:text-[15px] leading-relaxed space-y-8">
          <div>
            <p className="font-semibold text-[#4E1E24] mb-4">Last Updated: 28/06/2026</p>
            <p>
              Thank you for visiting <strong className="font-semibold text-[#4E1E24]">Dyuthi Pattu Sarees</strong>. We value
              your trust and are committed to protecting your personal information. This Privacy Policy explains how we
              collect, use, and safeguard the information you share with us while using our website and services.
            </p>
          </div>

          <Section title="1. Information We Collect">
            <p className="mb-2">When you place an order, create an account, or contact us, we may collect information such as:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Name</li>
              <li>Email Address</li>
              <li>Phone Number</li>
              <li>Billing &amp; Shipping Address</li>
              <li>Payment and Transaction Details</li>
              <li>Account Preferences and Order History</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <p className="mb-2">We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Process and fulfill orders</li>
              <li>Provide customer support</li>
              <li>Arrange shipping and delivery</li>
              <li>Send order updates and notifications</li>
              <li>Improve our website, products, and services</li>
              <li>Share promotional offers and marketing communications (with the option to opt out)</li>
            </ul>
          </Section>

          <Section title="3. Payment Security">
            <p>
              All payments are processed through secure and trusted payment gateways. We do not store your complete credit
              card, debit card, or banking information on our servers.
            </p>
          </Section>

          <Section title="4. Sharing of Information">
            <p>We do not sell, rent, or trade your personal information to third parties.</p>
            <p className="mb-2">Your information may be shared only with trusted service providers involved in:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Payment processing</li>
              <li>Shipping and delivery</li>
              <li>Website operations</li>
              <li>Customer support services</li>
            </ul>
            <p className="mt-2">These partners are required to protect your information and use it only for authorized purposes.</p>
          </Section>

          <Section title="5. Cookies &amp; Website Analytics">
            <p>
              Our website may use cookies and similar technologies to enhance your browsing experience, remember
              preferences, analyze website traffic, and improve our services.
            </p>
            <p>You may disable cookies through your browser settings if preferred.</p>
          </Section>

          <Section title="6. Data Security">
            <p>
              We implement reasonable security measures to protect your personal information from unauthorized access,
              misuse, disclosure, or alteration.
            </p>
            <p>
              While we strive to maintain a secure environment, no online transmission or storage system can be
              guaranteed to be completely secure.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p className="mb-2">You may request to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Update your account details</li>
              <li>Request deletion of your personal information, subject to applicable legal and business requirements</li>
              <li>Unsubscribe from promotional communications at any time</li>
            </ul>
          </Section>

          <Section title="8. Contact &amp; Policy Updates">
            <p>
              We may update this Privacy Policy periodically to reflect changes in our practices, services, or legal
              requirements.
            </p>
            <p>
              For any questions regarding this Privacy Policy or the handling of your personal information, please visit{' '}
              <Link href="/contact" className="font-semibold text-[#C2185B] hover:text-[#a01049]">Contact</Link>
            </p>
          </Section>

          <p className="font-medium">By using our website, you agree to the terms outlined in this Privacy Policy.</p>
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
