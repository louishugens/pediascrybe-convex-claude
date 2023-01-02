import prisma from '../../../utils/prisma';

module.exports = async (req, res) => {
  const {firstname, lastname, email, birthdate, id} = req.body
  console.log('body :>> ', req.body);

  try{
    await prisma.doctor.update({
      where:{
        id: id
      },
      data: {
        patients:{
          create:{
            firstname, lastname, email, birthdate
          }
        }
      }
    })
    res.json({
      message: 'Patient créé avec succès'
    })
  }
  catch(e){
    console.log('error :>> ', e);
    res.json({
      e
    })
  }
}