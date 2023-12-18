'use client'
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from "recharts";
import * as CONST from '../utils/constants'
import { Card, Title, LineChart } from "@tremor/react";

import Link from 'next/link'
import { useMemo } from "react";
import { bhfa } from '@prisma/client';
import { differenceInDays } from 'date-fns';
import { PrinterIcon } from '@heroicons/react/24/outline';




function Chart({patient, type, title, unit, referenceData}) {
  // console.log('patient :>> ', patient);
  const formatReferenceData = (data: bhfa, patient: string, appointments, birthdate) => {
    
    let formatted = {}

    if (Array.isArray(data.p03)) {
      console.log('hello :>>');
      for(let day = 0; day < data.p03.length; day++){
        if (!formatted[day]) {
          formatted[day] = { day, '3rd': 0, '15th': 0, '50th': 0, '85th': 0, '97th': 0};
          formatted[day][`${patient}`] = null
        }
        formatted[day]['3rd'] += data.p03[day]
      }
    }

    if (Array.isArray(data.p15)) {
      for(let i = 0; i < data.p15.length; i++){
        formatted[i]['15th'] = data.p15[i]
      }
    }

    if (Array.isArray(data.p50)) {
      for(let i = 0; i < data.p50.length; i++){
        formatted[i]['50th'] = data.p50[i]
      }
    }

    if (Array.isArray(data.p85)) {
      for(let i = 0; i < data.p85.length; i++){
        formatted[i]['85th'] = data.p85[i]
      }
    }

    if (Array.isArray(data.p97)) {
      for(let i = 0; i < data.p97.length; i++){
        formatted[i]['97th'] = data.p97[i]
      }
    }

    for(let i = 0; i < appointments.length; i++){
      const day = differenceInDays(appointments[i].startDate, birthdate || new Date())
      console.log('day :>> ', day);
      const height = parseFloat(appointments[i]?.height)
      console.log('height :>> ', height);
      if(height){
        formatted[day][`${patient}`] = height
      }
    }

    const result = Object.values(formatted);
    return result
  }


  const data = useMemo(() => {
    // return formatReferenceData(referenceData, patient.firstname, patient.appointments, patient.birthdate)
    return referenceData
  }, [referenceData])

  console.log('data :>> ', data);
  const valueFormatter = (number) => `${new Intl.NumberFormat("us").format(number).toString()} ${unit}`;
 
  return (
    <div className=" w-full shadow-md rounded-lg p-8 mb-8">
      <div className="flex flex-row-reverse justify-between w-full items-start">
        {/* <p className="text-slate-900 text-sm ">{title}</p> */}
        <Link href={`/user/patients/${patient.id}/charts/print-${type}`} className=" text-foreground text-sm">
          {/* Print */}
          <PrinterIcon className="h-4 w-4 ml-2" />
        </Link>
      </div>
      <Card className='mt-6'>
        <Title>{title}</Title>
        <LineChart
          className="mt-6 h-[30rem] "
          data={data}
          index="day"
          categories={['3rd', '15th', '50th', '85th', '97th', patient.firstname]}
          colors={['red', 'orange', 'blue', 'yellow', 'green', 'purple']}
          valueFormatter={valueFormatter}
          // yAxisWidth={100}
          curveType={'monotone'}
          showGridLines={true}
          showXAxis={true}
          showYAxis={true}
          showAnimation={true}
          animationDuration={1000}
          showLegend={true}
          showTooltip={true}
          connectNulls={true}
        />
      </Card>
    </div>
  )
}

export default Chart