import { prisma } from "./prisma";
import { BANGALORE_PINCODES } from "./seedData";

export async function seedDatabase() {
  console.log("Seeding Bangalore pincodes into MongoDB cache table...");
  
  if (!prisma || !prisma.pincodeCache) {
    console.log("Prisma client not connected; skipping seed.");
    return;
  }

  try {
    // Delete existing records to ensure clean seed
    await prisma.pincodeCache.deleteMany({});
    
    // Create new records
    const result = await prisma.pincodeCache.createMany({
      data: BANGALORE_PINCODES.map((item) => ({
        pincode: item.code,
        areaName: item.areaName,
        district: item.district,
        state: item.state,
      })),
    });

    console.log(`Successfully seeded ${result.count} pincodes into cache!`);
    return result;
  } catch (error) {
    console.error("Error during database seeding:", error);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
