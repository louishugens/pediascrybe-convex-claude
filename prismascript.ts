
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log("Starting the vaccine seeding process...");

  const vaccines = [
    {
      name: "BCG (Bacillus Calmette-Guérin)",
      doses: [{ doseCount: 1, maxAge: 0, doseType: "regular" }]
    },
    {
      name: "Hepatitis B",
      doses: [
        { doseCount: 1, maxAge: 0, doseType: "regular" },
        { doseCount: 2, maxAge: 2, doseType: "regular" },
        { doseCount: 3, maxAge: 18, doseType: "regular" }
      ]
    },
    {
      name: "Polio (OPV/IPV)",
      doses: [
        { doseCount: 1, maxAge: 2, doseType: "regular" },
        { doseCount: 2, maxAge: 4, doseType: "regular" },
        { doseCount: 3, maxAge: 18, doseType: "regular" },
        { doseCount: 4, maxAge: 72, doseType: "regular" }
      ]
    },
    {
      name: "DTP/DTaP (Diphtheria, Tetanus, Pertussis)",
      doses: [
        { doseCount: 1, maxAge: 2, doseType: "regular" },
        { doseCount: 2, maxAge: 4, doseType: "regular" },
        { doseCount: 3, maxAge: 6, doseType: "regular" },
        { doseCount: 4, maxAge: 18, doseType: "regular" },
        { doseCount: 5, maxAge: 72, doseType: "regular" }
      ]
    },
    {
      name: "Hib (Haemophilus influenzae type B)",
      doses: [
        { doseCount: 1, maxAge: 2, doseType: "regular" },
        { doseCount: 2, maxAge: 4, doseType: "regular" },
        { doseCount: 3, maxAge: 6, doseType: "regular" },
        { maxAge: 15, doseType: "booster" }
      ]
    },
    {
      name: "Pneumococcal Conjugate Vaccine (PCV)",
      doses: [
        { doseCount: 1, maxAge: 2, doseType: "regular" },
        { doseCount: 2, maxAge: 4, doseType: "regular" },
        { doseCount: 3, maxAge: 6, doseType: "regular" },
        { doseCount: 4, maxAge: 15, doseType: "regular" }
      ]
    },
    {
      name: "Rotavirus Vaccine",
      doses: [
        { doseCount: 1, maxAge: 2, doseType: "regular" },
        { doseCount: 2, maxAge: 4, doseType: "regular" },
        { doseCount: 3, maxAge: 6, doseType: "regular" }
      ]
    },
    {
      name: "MMR (Measles, Mumps, Rubella)",
      doses: [
        { doseCount: 1, maxAge: 15, doseType: "regular" },
        { doseCount: 2, maxAge: 72, doseType: "regular" }
      ]
    },
    {
      name: "Rubella",
      doses: [{ doseCount: 1, maxAge: 12, doseType: "regular" }]
    },
    {
      name: "Human Papillomavirus (HPV)",
      doses: [
        { doseCount: 1, maxAge: 168, doseType: "regular" },
        { doseCount: 2, maxAge: 180, doseType: "regular" }
      ]
    },
    {
      name: "Yellow Fever",
      doses: [{ doseCount: 1, maxAge: 12, doseType: "regular" }]
    },
    {
      name: "Influenza (Flu)",
      doses: [
        { doseCount: 1, maxAge: 6, doseType: "regular" },
        { doseType: "annual" }
      ]
    },
    {
      name: "Varicella (Chickenpox)",
      doses: [
        { doseCount: 1, maxAge: 15, doseType: "regular" },
        { doseCount: 2, maxAge: 72, doseType: "regular" }
      ]
    },
    {
      name: "Hepatitis A",
      doses: [
        { doseCount: 1, maxAge: 23, doseType: "regular" },
        { doseCount: 2, maxAge: 41, doseType: "regular" }
      ]
    },
    {
      name: "Meningococcal Vaccine",
      doses: [
        { doseCount: 1, maxAge: 144, doseType: "regular" },
        { maxAge: 192, doseType: "booster" }
      ]
    }
  ];

  for (const vaccine of vaccines) {
    console.log(`Processing vaccine: ${vaccine.name}`);
    try {
      console.log("Preparing to create vaccine in database...");
      const createdVaccine = await prisma.vaccinReference.create({
        data: {
          name: vaccine.name,
          doses: {
            create: vaccine.doses.map(dose => ({
              doseCount: dose.doseCount,
              maxAge: dose.maxAge,
              doseType: dose.doseType
            }))
          }
        }
      });
      console.log(`Created vaccine: ${createdVaccine.name}`);
    } catch (error) {
      console.error(`Failed to create vaccine: ${vaccine.name}`, error.message);
      console.error(error.stack); // Log the stack trace for more details
    }
  }
}

main()
  .catch(e => {
    console.error("An error occurred during the seeding process:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Disconnecting from the database...");
    await prisma.$disconnect();
    console.log("Disconnected from the database.");
  });