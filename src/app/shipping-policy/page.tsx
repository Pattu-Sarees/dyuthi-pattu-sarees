import Link from 'next/link'

export const metadata = { title: 'Shipping & Delivery Information | Dyuthi Pattu Sarees' }

export default function ShippingPolicyPage() {
  return (
    <div className="bg-[#FFFDF7] min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1
          className="text-3xl md:text-4xl font-bold text-center text-[#4E1E24] mb-8"
          style={{ fontFamily: 'var(--font-kurale), serif' }}
        >
          Shipping &amp; Delivery Information
        </h1>

        <div className="text-gray-700 text-sm md:text-[15px] leading-relaxed space-y-8">
          <p>
            Thank you for shopping at <strong className="font-semibold text-[#4E1E24]">Dyuthi Pattu Sarees</strong>. We
            are committed to delivering your order safely, securely, and in a timely manner. Please review the
            information below to understand our shipping and delivery process.
          </p>

          <Section title="1. Shipping Coverage">
            <p>
              We currently offer shipping across India and select international destinations. Whether you are ordering
              from within the country or overseas, we strive to ensure a smooth and reliable delivery experience.
            </p>
          </Section>

          <Section title="2. Processing &amp; Dispatch">
            <p>All orders are carefully inspected and prepared for shipment before dispatch.</p>
            <p>
              Orders are typically processed and dispatched within 1–3 business days from the date of order
              confirmation. During peak seasons, festive periods, or special promotions, dispatch timelines may be
              slightly extended.
            </p>
          </Section>

          <Section title="3. Shipping Partners">
            <p>
              To ensure safe and efficient delivery, we work with trusted courier and logistics partners. Courier
              services are selected based on the delivery location and service availability.
            </p>
          </Section>

          <Section title="4. Shipping Charges">
            <p>Shipping charges, if applicable, will be displayed during checkout before payment confirmation.</p>
            <p>
              Any promotional offers providing free shipping will be clearly mentioned on the website and will be subject
              to applicable terms and conditions.
            </p>
          </Section>

          <Section title="5. Estimated Delivery Timelines">
            <p>Delivery timelines may vary depending on the destination and courier service availability.</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Within India: Typically 3–5 business days after dispatch.</li>
              <li>International Orders: Typically 7–15 business days after dispatch.</li>
            </ul>
            <p className="mt-2">
              Please note that delivery timelines are estimates and may occasionally be affected by factors beyond our
              control, including weather conditions, public holidays, customs clearance, or courier network delays.
            </p>
          </Section>

          <Section title="6. Order Tracking">
            <p>
              Once your order has been dispatched, a tracking number and shipment details will be shared via email, SMS,
              or WhatsApp.
            </p>
            <p>
              Customers can use the tracking information to monitor the progress of their shipment and stay updated on the
              estimated delivery date.
            </p>
          </Section>

          <Section title="7. Packaging">
            <p>Every saree is carefully packed to ensure it reaches you in excellent condition.</p>
            <p>
              We take special care in packaging our products to protect them during transit while maintaining a premium
              unboxing experience for our customers.
            </p>
          </Section>

          <Section title="8. International Orders">
            <p>
              For international shipments, customs duties, import taxes, and other local charges (if applicable) are the
              responsibility of the customer and are not included in the product or shipping charges paid at checkout.
            </p>
            <p>
              We recommend checking with your local customs authorities regarding any applicable fees before placing an
              order.
            </p>
          </Section>

          <Section title="9. Delivery Delays">
            <p>
              While we make every effort to deliver orders within the estimated timeframe, delays may occasionally occur
              due to unforeseen circumstances such as courier disruptions, weather conditions, customs procedures, or
              regional restrictions.
            </p>
            <p>We appreciate your understanding and patience in such situations.</p>
          </Section>

          <Section title="10. Incorrect Shipping Information">
            <p>Customers are requested to provide accurate shipping details while placing an order.</p>
            <p>
              <strong className="font-semibold text-[#4E1E24]">Dyuthi Pattu Sarees</strong> shall not be responsible for
              delays, failed deliveries, or additional charges arising from incorrect or incomplete shipping information
              provided by the customer.
            </p>
          </Section>

          <Section title="11. Damaged or Incorrect Deliveries">
            <p>
              If you receive a damaged package or an incorrect product, please contact us within 48 hours of delivery and
              provide the required photographs and unboxing video for verification.
            </p>
            <p>
              Please refer to our{' '}
              <Link href="/refund-policy" className="font-semibold text-[#C2185B] hover:text-[#a01049]">
                Refund &amp; Exchange Policy
              </Link>{' '}
              for complete details.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              If you have any questions regarding shipping, delivery, or order tracking, please visit{' '}
              <Link href="/contact" className="font-semibold text-[#C2185B] hover:text-[#a01049]">Contact</Link>
            </p>
            <p className="mt-2 font-medium">Note: Please keep your Order ID handy for quicker assistance.</p>
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
