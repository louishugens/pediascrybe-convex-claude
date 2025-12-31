import Print from "@/components/printCharts";
import { differenceInMonths } from 'date-fns';
import { getCurrentDoctor } from "@/lib/convex-data";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Params = Promise<{ patientId: string }>

const PrintPage = async (props: { params: Params }) => {
  const { patientId } = await props.params;
  const doctor = await getCurrentDoctor();

  if (!doctor) {
    return <div>Doctor not found</div>;
  }

  const patient = await fetchAuthQuery(api.patients.getPatientWithAppointments, {
    patientId: patientId as Id<"patients">
  });

  if (!patient) {
    return <div>Patient not found</div>;
  }

  const appointments = patient.appointments;
  const referenceData = await fetchAuthQuery(api.charts.getChartReference, {
    chartId: patient.sex === 'female' ? 'ghfa5To19' : 'bhfa5To19'
  });

  let formatted: { age: number; value: number }[] = [];

  appointments?.map((appointment: any) => {
    if (appointment.height) {
      const ageInMonths = differenceInMonths(appointment.startDate, patient.birthdate ?? new Date());
      if (ageInMonths >= 61 && ageInMonths <= 228) {
        let app = { 
          age: ageInMonths, 
          value: appointment.height 
        };
        formatted.push(app);
      }
    }
  });

  const formatReferenceData = (data: any, formatted: { age: number; value: number }[]) => {
    const format: any[] = [];

    const maxLength = Math.max(
      (data?.p03 as number[])?.length || 0,
      (data?.p15 as number[])?.length || 0,
      (data?.p50 as number[])?.length || 0,
      (data?.p85 as number[])?.length || 0,
      (data?.p97 as number[])?.length || 0
    );

    for (let index = 0; index < maxLength; index++) {
      const ageInMonths = 61 + index;
      const patientDataForMonth = formatted.find(item => item.age === ageInMonths);

      format.push({
        age: ageInMonths,
        '3rd': data?.p03?.[index] ?? null,
        '15th': data?.p15?.[index] ?? null,
        '50th': data?.p50?.[index] ?? null,
        '85th': data?.p85?.[index] ?? null,
        '97th': data?.p97?.[index] ?? null,
        [patient.firstname ?? 'patient']: patientDataForMonth?.value ?? null
      });
    }

    return format;
  };

  const data = referenceData ? formatReferenceData(referenceData, formatted) : null;

  return (
    <>
      <Print 
        type="hfa5To19" 
        title="Height for Age (5-19 years)" 
        ylabel="Height (in cm)" 
        xlabel="Age (in months)" 
        patient={patient} 
        doctor={doctor} 
        data={data} 
        yUnit={'cm'} 
        xUnit={'months'} 
        mesure={'age'} 
      />
    </>
  );
};

export default PrintPage;
