import Print from "@/components/printCharts";
import { differenceInDays } from 'date-fns'
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
    chartId: patient.sex === 'female' ? 'gbfa' : 'bbfa'
  });

  let formatted: { age: number; value: number }[] = [];

  appointments?.map((appointment: any) => {
    if (appointment.weight && appointment.height) {
      let val = appointment.weight;
      val = val / Math.pow(appointment.height / 100, 2);
      let app = { 
        age: differenceInDays(appointment.startDate, patient.birthdate || new Date()), 
        value: parseFloat(val.toPrecision(5)) 
      };
      formatted.push(app);
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
      const patientDataForDay = formatted.find(item => item.age === index);

      format.push({
        age: index,
        '3rd': data?.p03?.[index] ?? null,
        '15th': data?.p15?.[index] ?? null,
        '50th': data?.p50?.[index] ?? null,
        '85th': data?.p85?.[index] ?? null,
        '97th': data?.p97?.[index] ?? null,
        [patient.firstname ?? 'patient']: patientDataForDay?.value ?? null
      });
    }

    return format;
  };

  const data = referenceData ? formatReferenceData(referenceData, formatted) : null;

  return (
    <>
      <Print 
        type="bfa" 
        title="BMI for Age" 
        ylabel="BMI (in kg/m^2)" 
        xlabel="Age (in days)" 
        patient={patient} 
        doctor={doctor} 
        data={data} 
        yUnit={'kg/m^2'} 
        xUnit={'days'} 
        mesure={'age'} 
      />
    </>
  );
};

export default PrintPage;
