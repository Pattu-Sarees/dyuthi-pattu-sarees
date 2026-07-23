import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { buildReport, toCSV, REPORT_TYPES, type ReportType } from '@/lib/reports'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return !!user && isAdminEmail(user.email)
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const typeParam = sp.get('type') || 'sales'
  const type = (REPORT_TYPES as readonly string[]).includes(typeParam) ? (typeParam as ReportType) : 'sales'
  const filters = {
    type,
    from: sp.get('from'),
    to: sp.get('to'),
    category: sp.get('category'),
  }

  const result = await buildReport(filters)

  // Export modes
  const format = sp.get('format')
  if (format === 'csv' || format === 'excel') {
    const csv = toCSV(result)
    const ext = format === 'excel' ? 'xls' : 'csv'
    // CSV opens natively in Excel; for .xls we still send CSV (Excel parses it).
    return new NextResponse(csv, {
      headers: {
        'Content-Type': format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv',
        'Content-Disposition': `attachment; filename="${type}-report-${new Date().toISOString().slice(0, 10)}.${ext}"`,
      },
    })
  }

  return NextResponse.json(result)
}
