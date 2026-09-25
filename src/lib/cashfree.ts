// Cashfree Payment Gateway — server-side helper.
//
// Credentials & mode come from env:
//   CASHFREE_APP_ID          (server secret — App ID / x-client-id)
//   CASHFREE_SECRET_KEY      (server secret — Secret Key / x-client-secret)
//   NEXT_PUBLIC_CASHFREE_MODE  'sandbox' | 'production'  (also read by the client SDK)
//
// We call Cashfree's REST API directly with fetch — no server SDK needed.
// API reference: https://docs.cashfree.com/reference (PG Orders, API version 2023-08-01)

const API_VERSION = '2023-08-01'

export function cashfreeMode(): 'sandbox' | 'production' {
  return process.env.NEXT_PUBLIC_CASHFREE_MODE === 'production' ? 'production' : 'sandbox'
}

function baseUrl(): string {
  return cashfreeMode() === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg'
}

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-version': API_VERSION,
    'x-client-id': process.env.CASHFREE_APP_ID || '',
    'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
  }
}

export interface CfCreateOrderInput {
  amount: number
  customerId: string
  customerPhone: string
  customerEmail?: string
  returnUrl?: string
}

export interface CfOrder {
  order_id: string
  cf_order_id?: string
  payment_session_id?: string
  order_status?: string
  order_amount?: number
  [k: string]: unknown
}

// Create a Cashfree order. Returns the order (with payment_session_id) used by
// the browser SDK to open the checkout.
export async function cfCreateOrder(input: CfCreateOrderInput): Promise<CfOrder> {
  const body = {
    order_amount: Number(input.amount.toFixed(2)),
    order_currency: 'INR',
    customer_details: {
      customer_id: input.customerId,
      customer_phone: input.customerPhone,
      ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
    },
    ...(input.returnUrl ? { order_meta: { return_url: input.returnUrl } } : {}),
  }

  const res = await fetch(`${baseUrl()}/orders`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as CfOrder & { message?: string }
  if (!res.ok || !json.payment_session_id) {
    throw new Error(json?.message || 'Cashfree order creation failed')
  }
  return json
}

// Fetch a Cashfree order to verify its real status server-side (never trust the
// client). order_status === 'PAID' means the payment actually succeeded.
export async function cfGetOrder(orderId: string): Promise<CfOrder | null> {
  const res = await fetch(`${baseUrl()}/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: headers(),
  })
  if (!res.ok) return null
  return (await res.json()) as CfOrder
}
