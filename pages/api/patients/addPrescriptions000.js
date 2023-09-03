import prisma from '../../../utils/prisma';

module.exports = async (req, res) => {
  const {medication, appointmentId} = req.body

  try{
    const appointment = await prisma.appointment.update({
      where:{
        id: appointmentId
      },
      data: {
        medication
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