import prisma from '../../../utils/prisma';

module.exports = async (req, res) => {
  const {height, weight, head, motif, findings, exams, medication, appointmentId} = req.body
  console.log('body :>> ', req.body);

  try{
    const appointment = await prisma.appointment.update({
      where:{
        id: appointmentId
      },
      data: {
        height, weight, head, motif, findings, exams, medication
      }
    })
    res.status(200).json(appointment)
  }
  catch(e){
    console.log('error :>> ', e);
    res.json({
      e
    })
  }
}