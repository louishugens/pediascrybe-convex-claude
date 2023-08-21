import prisma from '../../../utils/prisma';

module.exports = async (req, res) => {
  const {height, weight, head, motif, findings, arm, sao2, temperature, appointmentId} = req.body

  try{
    const appointment = await prisma.appointment.update({
      where:{
        id: appointmentId
      },
      data: {
        height, weight, head, motif, findings, arm, sao2, temperature
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