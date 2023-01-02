import prisma from '../../../utils/prisma';

module.exports = async (req, res) => {
  const {id} = req.body
  console.log('body :>> ', req.body);

  try{
    const patients = await prisma.doctor.findunique({
      where:{
        id:id
      },
      select:{
        patients:{
          firstname: true,
          lastname: true,
          age: true
        }
      }
    })
    res.json(patients)
    console.log('patients', patients)
  }
  catch(e){
    console.log('error :>> ', e);
    res.json({
      e
    })
  }
}