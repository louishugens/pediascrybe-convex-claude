'use client'
import { LineChart, Line, XAxis, YAxis, Legend, ResponsiveContainer, Tooltip } from "recharts";
import * as CONST from '../utils/constants'
import Link from 'next/link'
import { useMemo } from "react";

function Chart({patient, type, title, ylabel, xlabel, formatted, name}) {
  // console.log('patient :>> ', patient);
  const data = useMemo(() => {
    if(patient.sex === 'male') {
      switch (type) {
        case 'wfa':
          return CONST.bwfa
        case 'wfl':
          return CONST.bwfl
        case 'bfa':
          return CONST.bbfa
        case 'hcfa':
          return CONST.bhcfa
        default:
          break;
      }
    }
    if(patient.sex ==='female') {
      switch (type) {
        case 'wfa':
          return CONST.gwfa
        case 'wfl':
          return CONST.gwfl
        case 'bfa':
          return CONST.gbfa
        case 'hcfa':
          return CONST.ghcfa
        default:
          break;
      }
    }
  },
  [patient, type]
  )

  // console.log('data :>> ', data);


  // const sex = patient.sex
  // let data
  // if (sex == 'male') {
  //   switch (type) {
  //     case 'wfa':
  //       data = CONST.bwfa
  //       break;
  //     case 'wfl':
  //       data = CONST.bwfl
  //       break;
  //     case 'bfa':
  //       data = CONST.bbfa
  //       break;
  //     case 'hcfa':
  //       data = CONST.bhcfa
  //       break;       
  //     default:
  //       break;
  //   }
  // }
  // if (sex == 'female') {
  //   switch (type) {
  //     case 'wfa':
  //       data = CONST.gwfa
  //       break;
  //     case 'wfl':
  //       data = CONST.gwfl
  //       break;
  //     case 'bfa':
  //       data = CONST.gbfa
  //       break;
  //     case 'hcfa':
  //       data = CONST.ghcfa
  //       break;
  //     default:
  //       break;
  //   }
  // }
 
  return (
    <div className="w-full shadow-md rounded-lg p-8 mb-8">
      <div className="flex flex-row justify-between w-full items-start mb-4">
        <p className="text-slate-900 text-sm ">{title}</p>
        <Link href={`/user/patients/${patient.id}/charts/print-${type}`} className="px-4 py-2 rounded-full bg-slate-200 text-blue-500 text-sm">
          Export
        </Link>
      </div>
      {/* <div className="pb"> */}
      <ResponsiveContainer height={500} >
        <LineChart width={900} height={500}>
          <XAxis dataKey="category" type="category" height={55} allowDuplicatedCategory={false} label={{value: xlabel, position: "insideBottom"}} tick={{fontSize: 12}} />
          <YAxis dataKey="value" label={{ value: ylabel, angle: -90, position: 'insideLeft'}} tick={{fontSize: 12}} />
          <Legend verticalAlign="top" align="right" height={16}/>
          <Tooltip />
          <Line dot={false} dataKey="value" data={data[0].data} name={data[0].name} key={data[0].name} stroke="#ff50ff" strokeWidth={1} />
          <Line dot={false} dataKey="value" data={data[1].data} name={data[1].name} key={data[1].name} stroke="#00537f" strokeWidth={1} />
          <Line dot={false} dataKey="value" data={data[2].data} name={data[2].name} key={data[2].name} stroke="#da5f33" strokeWidth={1} />
          <Line dot={false} dataKey="value" data={data[3].data} name={data[3].name} key={data[3].name} stroke="#005344" strokeWidth={1} />
          <Line dot={false} dataKey="value" data={data[4].data} name={data[4].name} key={data[4].name} stroke="#0ff0cf" strokeWidth={1} />
          <Line dot={false} dataKey="value" data={formatted} name={name} key={name} stroke="#0000ff" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
      {/* </div> */}
    </div>
  )
}

export default Chart