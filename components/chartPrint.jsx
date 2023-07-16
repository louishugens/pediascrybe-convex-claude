'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from "recharts";
import * as CONST from '../utils/constants'

function Chart({sex, type, title, ylabel, xlabel, formatted, name}) {
  let data
  if (sex == 'male') {
    switch (type) {
      case 'wfa':
        data = CONST.bwfa
        break;
      case 'wfl':
        data = CONST.bwfl
        break;
      case 'bfa':
        data = CONST.bbfa
        break;
      case 'hcfa':
        data = CONST.bhcfa
        break;       
      default:
        break;
    }
  }
  if (sex == 'female') {
    switch (type) {
      case 'wfa':
        data = CONST.gwfa
        break;
      case 'wfl':
        data = CONST.gwfl
        break;
      case 'bfa':
        data = CONST.gbfa
        break;
      case 'hcfa':
        data = CONST.ghcfa
        break;
      default:
        break;
    }
  }
 
  return (
    <div className="h-[28rem] w-[44rem]  relative py-8 mr-8">
      <div className="flex flex-col justify-center w-full items-center">
        <p className="text-slate-900 text-sm ">{title}</p>
      </div>
      <ResponsiveContainer>
        <LineChart>
          <XAxis dataKey="category" type="category" allowDuplicatedCategory={false} label={{value: xlabel, position: "insideBottom", offset: -5}} tick={{fontSize: 12}} />
          <YAxis dataKey="value" label={{ value: ylabel, angle: -90, position: 'insideLeft'}} tick={{fontSize: 12}} />
          <Legend verticalAlign="bottom" height={16}/>
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