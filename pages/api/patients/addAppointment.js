import prisma from '../../../utils/prisma';

module.exports = async (req, res) => {
  const {height, weight, head, motif, findings, exams, medication, patientId, doctorId} = req.body
  console.log('body :>> ', req.body);

  try{
    await prisma.patient.update({
      where:{
        id: patientId
      },
      data: {
        appointments:{
          create:{
            height, weight, head, motif, findings, exams, medication, doctorId
          }
        }
      }
    })
    res.json({
      message: 'Appointment créé avec succès'
    })
  }
  catch(e){
    console.log('error :>> ', e);
    res.json({
      e
    })
  }
}