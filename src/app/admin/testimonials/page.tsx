import { redirect } from 'next/navigation'

// The testimonials admin grew into the full Reviews management screen.
export default function AdminTestimonialsRedirect() {
  redirect('/admin/reviews')
}
