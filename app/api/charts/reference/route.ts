import { type NextRequest, NextResponse } from 'next/server'
import prisma from '@/utils/prisma'


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const chartId = searchParams.get('chartId')

    if (!chartId) {
      return NextResponse.json(
        { error: 'Chart ID is required' },
        { status: 400 }
      )
    }

    const referenceData = await prisma.charts.findUnique({
      where: { id: chartId }
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