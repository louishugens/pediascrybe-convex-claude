import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getDailyTransactions } from '@/db/queries'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const dateStr = searchParams.get('date')

    if (!dateStr) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    // Parse date string properly - format is yyyy-MM-dd
    // Create date in local timezone
    const [year, month, day] = dateStr.split('-').map(Number)
    const localDate = new Date(year, month - 1, day)
    
    console.log(`API: Requested date string: ${dateStr}`)
    console.log(`API: Parsed local date: ${localDate.toISOString()}`)
    console.log(`API: User ID: ${user.id}`)

    const transactions = await getDailyTransactions(user.id, localDate)
    
    console.log(`API: Found ${transactions.length} transactions`)

    // Serialize dates to ISO strings
    const serializedTransactions = transactions.map(t => ({
      ...t,
      date: t.date.toISOString()
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

