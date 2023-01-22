import Chart from './chart'

const Charts = ({sex}) => {
  return (
    <>
      <p className="mt-4 text-slate-900 text-base font-semibold">Child Growth Charts</p>
      <div className="grid grid-cols-2 gap-4 mt-4 w-full">
        <Chart sex={sex} type="wfa" title="Weight for Age" ylabel="Weight (in kg)" xlabel="Age (in days)" />
        <Chart sex={sex} type="wfl" title="Weight for Height" ylabel="Weight (in kg)" xlabel="Height (in cm)" />
        <Chart sex={sex} type="bfa" title="BMI for Age" ylabel="BMI (in kg/m^2)" xlabel="Age (in days)" />
        <Chart sex={sex} type="hcfa" title="Head Circumference for Age" ylabel="HC (in cm)" xlabel="Age (in days)" />
        
      </div>
    </>
  )
}

export default Charts