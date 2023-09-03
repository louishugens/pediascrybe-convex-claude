import prisma from '../../../utils/prisma';

module.exports = async (req, res) => {
  const {height, weight, head, motif, findings, arm, sao2, temperature, patientId, doctorId} = req.body

  try{
    const appointment = await prisma.appointment.create({
      data: {
        height, weight, head, motif, findings, arm, sao2, temperature, doctorId, patientId
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