'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import * as CONST from '../utils/constants'

function Chart({sex, type, title, ylabel, xlabel}) {
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
    <div className="h-auto w-full shadow-md rounded-lg p-4 bg-slate-50 ">
      <div className="flex flex-col justify-center w-full items-center">
        <p className="text-slate-900 text-sm ">{title}</p>

      </div>
      <LineChart width={500} height={300}>
        <XAxis dataKey="category" type="category" allowDuplicatedCategory={false} label={{value: xlabel, position: "insideBottom", offset: -5}} tick={{fontSize: 12}} />
        <YAxis dataKey="value" label={{ value: ylabel, angle: -90, position: 'insideLeft'}} tick={{fontSize: 12}} />
        {/* <CartesianGrid strokeDasharray="3 3" /> */}
        <Legend verticalAlign="bottom" height={16}/>
        {/* <Tooltip /> */}
        {/* {data.map((s) => ( */}
          <Line dot={false} dataKey="value" data={data[0].data} name={data[0].name} key={data[0].name} stroke="#005fff99" strokeWidth={1} />
          <Line dot={false} dataKey="value" data={data[1].data} name={data[1].name} key={data[1].name} stroke="#00537f99" strokeWidth={1} />
          <Line dot={false} dataKey="value" data={data[2].data} name={data[2].name} key={data[2].name} stroke="#da5f3399" strokeWidth={1} />
          <Line dot={false} dataKey="value" data={data[3].data} name={data[3].name} key={data[3].name} stroke="#00534499" strokeWidth={1} />
          <Line dot={false} dataKey="value" data={data[4].data} name={data[4].name} key={data[4].name} stroke="#0f50cf99" strokeWidth={1} />
        {/* ))} */}
      </LineChart>
    </div>
  )
}

export default Chart