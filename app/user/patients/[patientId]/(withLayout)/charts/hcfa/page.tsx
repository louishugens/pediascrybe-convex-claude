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

const HCFAChart = async ({ params }: { params: Params }) => {
  const { patientId } = await params;

  const patientData = await fetchAuthQuery(api.charts.getPatientChartData, { 
    patientId: patientId as Id<"patients">,
    chartType: "hcfa"
  });
  
  if (!patientData) {
    return <div>Patient not found</div>;
  }
  
  const { patient, appointments } = patientData;
  const referenceData = await fetchAuthQuery(api.charts.getReferenceData, { 
    chartType: "hcfa",
    sex: patient?.sex ?? null
  });

  let formatted: { age: number; value: number; }[] = []

  appointments?.map(appointment => {
    if(appointment.head){
      let app = {age: differenceInDays(appointment.startDate, patient?.birthdate ?? new Date().getTime()), value: appointment.head}
      formatted.push(app)
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

  const data = referenceData ? formatReferenceData(referenceData as ChartData, formatted) : null;
  
  return (
    <Chart patient={patient} type="hcfa" title="Head Circumference for Age" ylabel="HC (in cm)" xlabel="Age (in days)" name={patient?.firstname} data={data} yUnit={'cm'} xUnit={'days'} showTitle={true} mesure={'age'}/>
  )
}

export default HCFAChart
