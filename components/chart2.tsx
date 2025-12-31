'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from "recharts";
import * as CONST from '../utils/constants'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Link from 'next/link'
import { useMemo } from "react";
import { PrinterIcon } from '@heroicons/react/24/outline';

const COLORS = {
  '3rd': '#ef4444',      // red
  '15th': '#f97316',     // orange
  '50th': '#3b82f6',     // blue
  '85th': '#eab308',     // yellow
  '97th': '#22c55e',     // green
  patient: '#a855f7',    // purple
};

function Chart({patient, type, title, unit, referenceData}: {
  patient: any;
  type: string;
  title: string;
  unit: string;
  referenceData: any[];
}) {
  const data = useMemo(() => {
    return referenceData
  }, [referenceData])
  
  const valueFormatter = (value: number) => `${new Intl.NumberFormat("us").format(value)} ${unit}`;
 
  return (
    <div className="w-full shadow-md rounded-lg p-8 mb-8">
      <div className="flex flex-row-reverse justify-between w-full items-start">
        <Link href={`/user/patients/${patient._id}/charts/print-${type}`} className="text-foreground text-sm">
          <PrinterIcon className="h-4 w-4 ml-2" />
        </Link>
      </div>
      <Card className='mt-6'>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={480}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis tickFormatter={(value) => `${value}`} />
              <Tooltip formatter={(value: number) => valueFormatter(value)} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="3rd" 
                stroke={COLORS['3rd']} 
                dot={false}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="15th" 
                stroke={COLORS['15th']} 
                dot={false}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="50th" 
                stroke={COLORS['50th']} 
                dot={false}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="85th" 
                stroke={COLORS['85th']} 
                dot={false}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="97th" 
                stroke={COLORS['97th']} 
                dot={false}
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey={patient.firstname} 
                stroke={COLORS.patient} 
                strokeWidth={2}
                dot={{ fill: COLORS.patient }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export default Chart
