import Print from "@/components/printCharts";
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
    chartId: patient.sex === 'female' ? 'gwfl' : 'bwfl'
  });

  let formatted: { age: number; value: number }[] = [];

  appointments?.map((appointment: any) => {
    if (appointment.weight && appointment.height) {
      if (appointment.height >= 65 && appointment.height <= 120) {
        let app = { 
          age: Math.round(appointment.height * 10) / 10, 
          value: appointment.weight 
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
      const height = 65 + index * 0.5;
      const patientDataForHeight = formatted.find(item => Math.abs(item.age - height) < 0.5);

      format.push({
        age: height,
        '3rd': data?.p03?.[index] ?? null,
        '15th': data?.p15?.[index] ?? null,
        '50th': data?.p50?.[index] ?? null,
        '85th': data?.p85?.[index] ?? null,
        '97th': data?.p97?.[index] ?? null,
        [patient.firstname ?? 'patient']: patientDataForHeight?.value ?? null
      });
    }

    return format;
  };

  const data = referenceData ? formatReferenceData(referenceData, formatted) : null;

  return (
    <>
      <Print 
        type="wfl" 
        title="Weight for Length (65-120 cm)" 
        ylabel="Weight (in kg)" 
        xlabel="Length (in cm)" 
        patient={patient} 
        doctor={doctor} 
        data={data} 
        yUnit={'kg'} 
        xUnit={'cm'} 
        mesure={'length'} 
      />
    </>
  );
};

export default PrintPage;
