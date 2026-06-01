'use client'
import { LineChart, Line, XAxis, YAxis, Legend, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import Link from 'next/link'
import { useMemo } from "react";


interface chart {
  category: number;
  value: number;
}

interface data {
  data: chart[];
  name: string;
}

interface referenceData {
  id: string;
  p03: number[];
  p15: number[];
  p50: number[];
  p85: number[];
  p97: number[];
  height: number[];
}

const formatReferenceData = (data: referenceData) => {
  let formatted: data[] = []
  let line: data = {
    data: [],
    name: ""
  }

  if (Array.isArray(data.p03)) {
    line = {data: [], name: '3rd'}
    for(let day = 0; day < data.p03.length; day++){
      line.data.push({category: day, value: data.p03[day]})
    }
  }
  formatted.push(line)

  if (Array.isArray(data.p15)) {
    line = {data: [], name: '15th'}
    for(let day = 0; day < data.p15.length; day++){
      line.data.push({category: day, value: data.p15[day]})
    }
  }

  formatted.push(line)

  if (Array.isArray(data.p50)) {
    line = {data: [], name: '50th'}
    for(let day = 0; day < data.p50.length; day++){
      line.data.push({category: day, value: data.p50[day]})
    }
  }

  formatted.push(line)

  if (Array.isArray(data.p85)) {
    line = {data: [], name: '85th'}
    for(let day = 0; day < data.p85.length; day++){
      line.data.push({category: day, value: data.p85[day]})
    }
  }

  formatted.push(line)

  if (Array.isArray(data.p97)) {
    line = {data: [], name: '97th'}
    for(let day = 0; day < data.p97.length; day++){
      line.data.push({category: day, value: data.p97[day]})
    }
  }

  formatted.push(line)

  return formatted

}


function Chart({patient, type, title, ylabel, xlabel, formatted, name, referenceData}) {
  const data: typeof referenceData = useMemo(() => {
    return referenceData
  }, [referenceData])
  

  return (
    <div className="w-full shadow-md rounded-lg p-8 mb-8">
      <div className="flex flex-row justify-between w-full items-start">
        <p className="text-slate-900 text-sm">{title}</p>
        <Link href={`/user/patients/${patient._id}/charts/print-${type}`} className="px-4 py-2 rounded-full bg-muted text-primary text-sm">
          Export
        </Link>
      </div>
      <ResponsiveContainer height={550} minWidth={0}>
        <LineChart
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          data={[data, formatted]}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="category" 
            type="category" 
            height={40} 
            allowDuplicatedCategory={false} 
            label={{value: xlabel, position: "insideBottom", offset: -2}} 
            tick={{fontSize: 12}} 
          />
          <YAxis 
            dataKey="value" 
            label={{ value: ylabel, angle: -90, position: 'insideLeft'}} 
            tick={{fontSize: 12}} 
          />
          <Legend verticalAlign="top" align="right" height={12}/>
          <Tooltip />
          {data.map((line, index) => (
            <Line 
              key={line.name}
              type="monotone"
              dot={false}
              dataKey="value"
              data={line.data}
              name={line.name}
              stroke={[
                "#ff50ff",
                "#00537f",
                "#da5f33",
                "#005344",
                "#0ff0cf"
              ][index]}
              strokeWidth={1}
            />
          ))}
          <Line 
            type="monotone"
            dot={false}
            dataKey="value"
            data={formatted}
            name={name}
            stroke="#0000ff"
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default Chart