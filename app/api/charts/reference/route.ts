import { type NextRequest, NextResponse } from 'next/server'
import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const chartId = searchParams.get('chartId')
    const sex = searchParams.get('sex') as 'male' | 'female' | null

    if (!chartId) {
      return NextResponse.json(
        { error: 'Chart ID is required' },
        { status: 400 }
      )
    }

    const referenceData = await fetchAuthQuery(api.charts.getReferenceData, { 
      chartType: chartId,
      sex: sex
    })

    if (!referenceData) {
      return NextResponse.json(
        { error: 'Reference data not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(referenceData)
  } catch (error) {
    console.error('Error fetching reference data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
