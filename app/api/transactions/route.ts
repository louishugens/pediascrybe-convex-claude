import { NextRequest, NextResponse } from 'next/server'
import { fetchAuthQuery, isAuthenticated } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'

export async function GET(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated()

    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const dateStr = searchParams.get('date')
    const doctorId = searchParams.get('doctorId')

    if (!dateStr) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 })
    }

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    // Parse date string properly - format is yyyy-MM-dd
    const [year, month, day] = dateStr.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    
    console.log(`API: Requested date string: ${dateStr}`)
    console.log(`API: Parsed local date: ${localDate.toISOString()}`)

    const transactions = await fetchAuthQuery(api.appointments.getDailyTransactions, {
      doctorId: doctorId as any,
      date: localDate.getTime(),
    })
    
    console.log(`API: Found ${transactions.length} transactions`)

    // Serialize dates to ISO strings
    const serializedTransactions = transactions.map(t => ({
      ...t,
      date: new Date(t.date).toISOString()
    }))

    return NextResponse.json({ transactions: serializedTransactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
