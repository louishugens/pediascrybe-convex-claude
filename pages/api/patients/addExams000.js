import prisma from '../../../utils/prisma';

module.exports = async (req, res) => {
  const {exams, appointmentId} = req.body

  try{
    const appointment = await prisma.appointment.update({
      where:{
        id: appointmentId
      },
      data: {
        exams
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