import Chart from "@/components/chartShad"
import { differenceInDays } from 'date-fns'
import { fetchAuthQuery } from '@/lib/auth-server'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

interface ChartData {
  p03?: number[];
  p15?: number[];
  p50?: number[];
  p85?: number[];
  p97?: number[];
}

type Params = Promise<{ patientId: string }>

const BFAChart = async ({ params }: { params: Params }) => {
  const { patientId } = await params;

  const patientData = await fetchAuthQuery(api.charts.getPatientChartData, { 
    patientId: patientId as Id<"patients">,
    chartType: "bfa"
  });
  
  if (!patientData) {
    return <div>Patient not found</div>;
  }
  
  const { patient, appointments } = patientData;
  const referenceData = await fetchAuthQuery(api.charts.getReferenceData, { 
    chartType: "bfa",
    sex: patient?.sex ?? null
  });
  const referenceData5To19 = await fetchAuthQuery(api.charts.getReferenceData, { 
    chartType: "bfa5To19",
    sex: patient?.sex ?? null
  });

  let formatted: { age: number; value: number; }[] = []
  let formatted5To19: { age: number; value: number; }[] = []

  appointments?.map(appointment => {
    if(appointment.weight && appointment.height){
      let val = appointment.weight
      val = val / Math.pow(appointment.height / 100, 2)
      if(differenceInDays(appointment.startDate, patient?.birthdate!) / 30.4375 > 60){
        let app = {age: Math.floor(differenceInDays(appointment.startDate, patient?.birthdate!)/30.4375), value: parseFloat(val.toPrecision(5))}
        formatted5To19.push(app)
      }else{
        let app = {age: differenceInDays(appointment.startDate, patient?.birthdate!), value: parseFloat(val.toPrecision(5))}
        formatted.push(app)
      }
    }  
  })

  const formatReferenceData = (data: ChartData, formatted: { age: number; value: number; }[]) => {
    const format: { 
      age: number; 
      '3rd': number | null; 
      '15th': number | null; 
      '50th': number | null; 
      '85th': number | null; 
      '97th': number | null; 
      [key: string]: number | null 
    }[] = [];

    const maxLength = Math.max(
      (data.p03 as number[])?.length || 0,
      (data.p15 as number[])?.length || 0,
      (data.p50 as number[])?.length || 0,
      (data.p85 as number[])?.length || 0,
      (data.p97 as number[])?.length || 0
    );

    for (let index = 0; index < maxLength; index++) {
      const patientDataForDay = formatted.find(item => item.age === index);

      format.push({ 
        age: index, 
        '3rd': data.p03?.[index] ?? null, 
        '15th': data.p15?.[index] ?? null, 
        '50th': data.p50?.[index] ?? null, 
        '85th': data.p85?.[index] ?? null, 
        '97th': data.p97?.[index] ?? null,
        [patient?.firstname ?? 'patient']: patientDataForDay?.value ?? null
      });
    }

    return format;
  };

  const formatReferenceData5To19 = (data: ChartData, formatted5To19: { age: number; value: number; }[]) => {
    const format: { 
      age: number; 
      '3rd': number | null; 
      '15th': number | null; 
      '50th': number | null; 
      '85th': number | null; 
      '97th': number | null; 
      [key: string]: number | null 
    }[] = [];

    const maxLength = Math.max(
      (data.p03 as number[])?.length || 0,
      (data.p15 as number[])?.length || 0,
      (data.p50 as number[])?.length || 0,
      (data.p85 as number[])?.length || 0,
      (data.p97 as number[])?.length || 0
    );

    for (let index = 60; index < maxLength + 60; index++) {
      const patientDataForDay = formatted5To19.find(item => item.age === index);

      format.push({ 
        age: index, 
        '3rd': data.p03?.[index - 60] ?? null, 
        '15th': data.p15?.[index - 60] ?? null, 
        '50th': data.p50?.[index - 60] ?? null, 
        '85th': data.p85?.[index - 60] ?? null, 
        '97th': data.p97?.[index - 60] ?? null,
        [patient?.firstname ?? 'patient']: patientDataForDay?.value ?? null
      });
    }

    return format;
  };

  const data = referenceData ? formatReferenceData(referenceData as ChartData, formatted) : null;
  const data5To19 = referenceData5To19 ? formatReferenceData5To19(referenceData5To19 as ChartData, formatted5To19) : null;

  return (
    <>
      <Chart patient={patient} title="BMI for Age (0-5 years)" type="bfa" ylabel="BMI (in kg/m^2)" xlabel="Age (in days)" name={patient?.firstname} data={data} yUnit={'kg/m^2'} xUnit={'days'} showTitle={true} mesure={'age'} />
      <Chart patient={patient} title="BMI for Age (5-19 years)" type="bfa5To19" ylabel="BMI (in kg/m^2)" xlabel="Age (in months)" name={patient?.firstname} data={data5To19} yUnit={'kg/m^2'} xUnit={'months'} showTitle={true} mesure={'age'} />
    </>
  )
}
 
export default BFAChart
