'use client'
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from "recharts";
import * as CONST from '../utils/constants'
// import { Card, Title, LineChart } from "@tremor/react";

import Link from 'next/link'
import { useMemo } from "react";
import { PrinterIcon } from '@heroicons/react/24/outline';




function Chart({patient, type, title, unit, referenceData}) {
  // console.log('patient :>> ', patient);

  const data = useMemo(() => {
    return referenceData
  }, [referenceData])
  
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
      {/* <Card className='mt-6'>
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
      </Card> */}
    </div>
  )
}

export default Chart