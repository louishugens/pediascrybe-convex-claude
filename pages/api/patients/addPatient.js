import prisma from '../../../utils/prisma';

module.exports = async (req, res) => {
  const {firstname, lastname, email, birthdate, religion, sex, mothername, phone, id, allergies, history} = req.body

  try{
    await prisma.doctor.update({
      where:{
        id: id
      },
      data: {
        patients:{
          create:{
            firstname, lastname, email, birthdate, religion, sex, mothername, phone, allergies, history
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