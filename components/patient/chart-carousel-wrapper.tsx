import { differenceInDays } from 'date-fns';
import { fetchAuthQuery } from '@/lib/auth-server';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import ChartCarousel from './chart-carousel';

interface ReferenceData {
  p03?: number[];
  p15?: number[];
  p50?: number[];
  p85?: number[];
  p97?: number[];
}

interface FormattedChartData {
  age?: number;
  length?: number;
  '3rd': number | null;
  '15th': number | null;
  '50th': number | null;
  '85th': number | null;
  '97th': number | null;
  [key: string]: number | null | undefined;
}

interface Appointment {
  startDate: number;
  weight?: number;
  height?: number;
  head?: number;
}

interface ChartCarouselWrapperProps {
  patientId: string;
}

export default async function ChartCarouselWrapper({ patientId }: ChartCarouselWrapperProps) {
  // Fetch patient data
  const patientData = await fetchAuthQuery(api.charts.getPatientChartData, {
    patientId: patientId as Id<"patients">,
    chartType: "wfa"
  }).catch(() => null);
  
  if (!patientData || !patientData.patient) {
    return null;
  }
  
  const { patient, appointments } = patientData;
  const patientName = patient?.firstname ?? 'patient';
  const birthdate = patient?.birthdate ?? new Date().getTime();

  // Fetch reference data for all chart types in parallel
  const [wfaRef, hfaRef, wflRef, bfaRef, hcfaRef] = await Promise.all([
    fetchAuthQuery(api.charts.getReferenceData, { chartType: "wfa", sex: patient?.sex ?? null }),
    fetchAuthQuery(api.charts.getReferenceData, { chartType: "hfa", sex: patient?.sex ?? null }),
    fetchAuthQuery(api.charts.getReferenceData, { chartType: "wfl0To2", sex: patient?.sex ?? null }),
    fetchAuthQuery(api.charts.getReferenceData, { chartType: "bfa", sex: patient?.sex ?? null }),
    fetchAuthQuery(api.charts.getReferenceData, { chartType: "hcfa", sex: patient?.sex ?? null }),
  ]);

  // Helper to format age-based reference data
  const formatAgeBasedData = (
    data: ReferenceData | null, 
    patientValues: { age: number; value: number }[]
  ): FormattedChartData[] => {
    if (!data) return [];
    
    const maxLength = Math.max(
      data.p03?.length || 0,
      data.p15?.length || 0,
      data.p50?.length || 0,
      data.p85?.length || 0,
      data.p97?.length || 0
    );

    const format: FormattedChartData[] = [];
    for (let index = 0; index < maxLength; index++) {
      const patientDataForDay = patientValues.find(item => item.age === index);
      format.push({ 
        age: index, 
        '3rd': data.p03?.[index] ?? null, 
        '15th': data.p15?.[index] ?? null, 
        '50th': data.p50?.[index] ?? null, 
        '85th': data.p85?.[index] ?? null, 
        '97th': data.p97?.[index] ?? null,
        [patientName]: patientDataForDay?.value ?? null
      });
    }
    return format;
  };

  // Helper to format length-based reference data (WFL 0-2)
  const formatLengthBasedData = (
    data: ReferenceData | null, 
    patientValues: { length: number; value: number }[]
  ): FormattedChartData[] => {
    if (!data) return [];
    
    const maxLength = Math.max(
      data.p03?.length || 0,
      data.p15?.length || 0,
      data.p50?.length || 0,
      data.p85?.length || 0,
      data.p97?.length || 0
    );

    const format: FormattedChartData[] = [];
    for (let i = 0; i < maxLength; i++) {
      const lengthValue = 45 + (i * 0.5);
      const patientDataForLength = patientValues.find(item => Math.abs(item.length - lengthValue) < 0.25);
      format.push({ 
        length: lengthValue, 
        '3rd': data.p03?.[i] ?? null, 
        '15th': data.p15?.[i] ?? null, 
        '50th': data.p50?.[i] ?? null, 
        '85th': data.p85?.[i] ?? null, 
        '97th': data.p97?.[i] ?? null,
        [patientName]: patientDataForLength?.value ?? null
      });
    }
    return format;
  };

  // Format patient data for each chart type
  const wfaPatientData: { age: number; value: number }[] = [];
  const hfaPatientData: { age: number; value: number }[] = [];
  const wflPatientData: { length: number; value: number }[] = [];
  const bfaPatientData: { age: number; value: number }[] = [];
  const hcfaPatientData: { age: number; value: number }[] = [];

  appointments?.forEach((appointment: Appointment) => {
    const ageInDays = differenceInDays(appointment.startDate, birthdate);

    // WFA: Weight for Age
    if (appointment.weight) {
      wfaPatientData.push({ age: ageInDays, value: appointment.weight });
    }

    // HFA: Height for Age (0-5 years only)
    if (appointment.height && ageInDays / 30.4375 <= 60) {
      hfaPatientData.push({ age: ageInDays, value: appointment.height });
    }

    // WFL: Weight for Length (0-2 years)
    if (appointment.weight && appointment.height && ageInDays < 365 * 2) {
      wflPatientData.push({ length: appointment.height, value: appointment.weight });
    }

    // BFA: BMI for Age (0-5 years only)
    if (appointment.weight && appointment.height && ageInDays / 30.4375 <= 60) {
      const bmi = appointment.weight / Math.pow(appointment.height / 100, 2);
      bfaPatientData.push({ age: ageInDays, value: parseFloat(bmi.toPrecision(5)) });
    }

    // HCFA: Head Circumference for Age
    if (appointment.head) {
      hcfaPatientData.push({ age: ageInDays, value: appointment.head });
    }
  });

  // Format all chart data
  const allChartData = {
    wfa: formatAgeBasedData(wfaRef as ReferenceData | null, wfaPatientData),
    hfa: formatAgeBasedData(hfaRef as ReferenceData | null, hfaPatientData),
    wfl: formatLengthBasedData(wflRef as ReferenceData | null, wflPatientData),
    bfa: formatAgeBasedData(bfaRef as ReferenceData | null, bfaPatientData),
    hcfa: formatAgeBasedData(hcfaRef as ReferenceData | null, hcfaPatientData),
  };

  return (
    <ChartCarousel 
      patient={patient} 
      patientId={patientId} 
      allChartData={allChartData}
    />
  );
}
