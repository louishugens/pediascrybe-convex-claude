import prisma from '../../../utils/prisma';

module.exports = async (req, res) => {
  const {appointmentId} = req.body
  console.log('body :>> ', req.body);

  try{
    const appointment = await prisma.appointment.delete({
      where:{
        id: appointmentId
      },
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