import prisma from '../../../utils/prisma';

module.exports = async (req, res) => {
  const {doctorId} = req.query

  try{
    const doctor = await prisma.doctor.findUnique({
      where:{
        id:doctorId
      },
    })
    res.json(doctor)
  }
  catch(e){
    console.log('error :>> ', e);
    res.json({
      e
    })
  }
}