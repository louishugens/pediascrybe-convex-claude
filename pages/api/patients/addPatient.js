import prisma from '../../../utils/prisma';

module.exports = async (req, res) => {
  const {name, price, companyId, costs} = req.body
  console.log('body :>> ', req.body);
  console.log('name :>> ', name);
  try{
    await prisma.article.create({
      data: {
        name: name,
        price: price,
        companyId: companyId,
        status: 'Actif',
        costs: {
          create: costs.map(cost => ({
            cost: cost.cost,
            provider: {
              connect: {
                id: cost.provider
              }
            }
          }))
        }
      }
    })
    res.json({
      message: 'Article créé avec succès'
    })
  }
  catch(e){
    console.log('error :>> ', e);
    res.json({
      e
    })
  }
}