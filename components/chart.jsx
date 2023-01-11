'use client'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import * as CONST from '../utils/constants'

function Chart({data}) {
  // const {gwfa} = CONST
  return (
    <div className="h-auto w-full shadow-md rounded-lg p-4 bg-slate-50 ">
      <LineChart width={500} height={300}>
        <XAxis dataKey="category" type="category" allowDuplicatedCategory={false} />
        <YAxis dataKey="value" />
        <Legend />
        {/* <Tooltip /> */}
        {data.map((s) => (
          <Line dot={false} dataKey="value" data={s.data} name={s.name} key={s.name} />
        ))}
      </LineChart>
    </div>
  )
}

export default Chart