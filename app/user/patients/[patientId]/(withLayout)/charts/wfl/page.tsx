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

const WFLChart = async ({ params }: { params: Params }) => {
  const { patientId } = await params;
  
  const patientData = await fetchAuthQuery(api.charts.getPatientChartData, { 
    patientId: patientId as Id<"patients">,
    chartType: "wfl"
  });
  
  if (!patientData) {
    return <div>Patient not found</div>;
  }
  
  const { patient, appointments } = patientData;
  const referenceData = await fetchAuthQuery(api.charts.getReferenceData, { 
    chartType: "wfl",
    sex: patient?.sex ?? null
  });
  const referenceData0To2 = await fetchAuthQuery(api.charts.getReferenceData, { 
    chartType: "wfl0To2",
    sex: patient?.sex ?? null
  });

  let formatted: { length: number; value: number; }[] = []
  let formatted_0_2: { length: number; value: number; }[] = []

  appointments?.map(appointment => {
    if(appointment.weight && appointment.height){
      let app = {length: appointment.height, value: appointment.weight}
      if(differenceInDays(appointment.startDate, patient?.birthdate ?? new Date().getTime()) < 365*2){
        formatted_0_2.push(app)
      }else{
        formatted.push(app)
      }
    }
  })

  const formatReferenceData = (data: ChartData, formatted: { length: number; value: number; }[]) => {
    const format: { 
      length: number | undefined; 
      '3rd': number | null; 
      '15th': number | null; 
      '50th': number | null; 
      '85th': number | null; 
      '97th': number | null; 
      [key: string]: number | null | undefined
    }[] = [];

    const maxLength = Math.max(
      (data.p03 as number[])?.length || 0,
      (data.p15 as number[])?.length || 0,
      (data.p50 as number[])?.length || 0,
      (data.p85 as number[])?.length || 0,
      (data.p97 as number[])?.length || 0
    );

    // Start at 45 cm and increment by 0.1 cm
    for (let i = 0; i < maxLength; i++) {
      const lengthValue = 65 + (i * 0.1);
      const patientDataForDay = formatted.find(item => Math.abs(item.length - lengthValue) < 0.05);

      format.push({ 
        length: lengthValue, 
        '3rd': data.p03?.[i] ?? null, 
        '15th': data.p15?.[i] ?? null, 
        '50th': data.p50?.[i] ?? null, 
        '85th': data.p85?.[i] ?? null, 
        '97th': data.p97?.[i] ?? null,
        [patient?.firstname ?? 'patient']: patientDataForDay?.value ?? null
      });
    }

    return format;
  };

  const formatReferenceData_0_2 = (data: ChartData, formatted: { length: number; value: number; }[]) => {
    const format: { 
      length: number | undefined; 
      '3rd': number | null; 
      '15th': number | null; 
      '50th': number | null; 
      '85th': number | null; 
      '97th': number | null; 
      [key: string]: number | null | undefined
    }[] = []; 

    const maxLength = Math.max(
      (data.p03 as number[])?.length || 0,
      (data.p15 as number[])?.length || 0,
      (data.p50 as number[])?.length || 0,
      (data.p85 as number[])?.length || 0,
      (data.p97 as number[])?.length || 0
    );  

    for (let i = 0; i < maxLength; i++) {
      const lengthValue = 45 + (i * 0.5);
      const patientDataForDay = formatted.find(item => Math.abs(item.length - lengthValue) < 0.05); 

      format.push({ 
        length: lengthValue, 
        '3rd': data.p03?.[i] ?? null, 
        '15th': data.p15?.[i] ?? null, 
        '50th': data.p50?.[i] ?? null, 
        '85th': data.p85?.[i] ?? null, 
        '97th': data.p97?.[i] ?? null,
        [patient?.firstname ?? 'patient']: patientDataForDay?.value ?? null
      });
    }

    return format;
  };

  const data = referenceData ? formatReferenceData(referenceData as ChartData, formatted) : [];
  const data_0_2 = referenceData0To2 ? formatReferenceData_0_2(referenceData0To2 as ChartData, formatted_0_2) : [];
  
  return (
    <>
      <Chart patient={patient} type="wfl0To2" title="Weight for Length (0-2 years)" ylabel={'Weight (kg)'} xlabel={'Length (cm)'} name={patient?.firstname ?? 'patient'} data={data_0_2} yUnit={'kg'} xUnit={'cm'} showTitle={true} mesure={'length'} />
      <Chart patient={patient} type="wfl" title="Weight for Length (2-5 years)" ylabel={'Weight (kg)'} xlabel={'Length (cm)'} name={patient?.firstname ?? 'patient'} data={data} yUnit={'kg'} xUnit={'cm'} showTitle={true} mesure={'length'} />
    </>
  )
}
 
export default WFLChart
