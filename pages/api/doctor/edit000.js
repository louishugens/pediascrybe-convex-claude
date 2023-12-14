import prisma from '../../../utils/prisma';

module.exports = async (req, res) => {
  const {firstname, lastname, email, phone, spec, address, id} = req.body
  console.log('body :>> ', req.body);

  try{
    await prisma.doctor.update({
      where:{
        id: id
      },
      data: {
        firstname, lastname, email, phone, spec, address
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