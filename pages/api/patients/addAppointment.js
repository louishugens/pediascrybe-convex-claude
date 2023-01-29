import prisma from '../../../utils/prisma';

module.exports = async (req, res) => {
  const {height, weight, head, motif, findings, exams, medication, patientId, doctorId} = req.body
  console.log('body :>> ', req.body);

  try{
    const appointment = await prisma.appointment.create({
      // where:{
      //   id: patientId
      // },
      data: {
        // appointments:{
        //   create:{
            height, weight, head, motif, findings, exams, medication, doctorId, patientId
        //   }
        // }
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