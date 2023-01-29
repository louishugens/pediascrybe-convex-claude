import Print from "../../../../../../../components/print";
import prisma from "../../../../../../../utils/prisma";

async function getAppointment(appointmentId) {
  const appointment = await prisma.appointment.findUnique({
    where:{
      id:appointmentId
    },
  })
  return appointment
}

async function getPatient(patientId) {
  const patient = await prisma.patient.findUnique({
    where:{
      id:patientId
    },
  })
  return patient
}

async function getDoctor(doctorId) {
  const doctor = await prisma.doctor.findUnique({
    where:{
      id:doctorId
    },
  })
  return doctor
}

const PrintPage = async ({params: {doctorId, patientId, appointmentId}}) => {
  let appointment = await getAppointment(appointmentId)
  const patient = await getPatient(patientId)
  const doctor = await getDoctor(doctorId)
  // appointment.startDate = JSON.parse(JSON.stringify(appointment.startDate))
  return (
    <>
      <Print appointment={appointment} patient={patient} doctor={doctor} exams={true} data-superjson />
    </>
  );
};

export default PrintPage;


