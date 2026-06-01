'use client'
import { LineChart, Line, XAxis, YAxis, Legend, ResponsiveContainer, Tooltip } from "recharts";
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


function Chart({ title, ylabel, xlabel, formatted, name, referenceData}) {

  const data: typeof referenceData = useMemo(() => {
      return referenceData
    },
    [referenceData]
  )

  return (
    <div className="h-[28rem] w-[44rem]  relative py-8 mr-8">
      <div className="flex flex-col justify-center w-full items-center">
        <p className="text-slate-900 text-sm ">{title}</p>
      </div>
      <ResponsiveContainer minWidth={0}>
        <LineChart>
          <XAxis dataKey="category" type="category" height={40} allowDuplicatedCategory={false} label={{value: xlabel, position: "insideBottom", offset: -2}} tick={{fontSize: 12}} />
          <YAxis dataKey="value" label={{ value: ylabel, angle: -90, position: 'insideLeft'}} tick={{fontSize: 12}} />
          <Legend verticalAlign="top" align="right" height={12}/>
          <Tooltip />
          <Line dot={false} dataKey="value" data={data[0].data} name={data[0].name} key={data[0].name} stroke="#ff50ff" strokeWidth={1} />
          <Line dot={false} dataKey="value" data={data[1].data} name={data[1].name} key={data[1].name} stroke="#00537f" strokeWidth={1} />
          <Line dot={false} dataKey="value" data={data[2].data} name={data[2].name} key={data[2].name} stroke="#da5f33" strokeWidth={1} />
          <Line dot={false} dataKey="value" data={data[3].data} name={data[3].name} key={data[3].name} stroke="#005344" strokeWidth={1} />
          <Line dot={false} dataKey="value" data={data[4].data} name={data[4].name} key={data[4].name} stroke="#0ff0cf" strokeWidth={1} />
          <Line dot={false} dataKey="value" data={formatted} name={name} key={name} stroke="#0000ff" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default Chart