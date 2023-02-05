import prisma from '../../../utils/prisma';

module.exports = async (req, res) => {
  const {firstname, lastname, email, birthdate, mothername, sex, religion, phone, id} = req.body
  console.log('body :>> ', req.body);

  try{
    await prisma.patient.update({
      where:{
        id: id
      },
      data: {
        firstname, lastname, email, birthdate, mothername, sex, religion, phone
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