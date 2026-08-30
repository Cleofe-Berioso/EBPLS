require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg(
  { connectionString: process.env.DATABASE_URL },
  { schema: "ebpls" }
);
const prisma = new PrismaClient({ adapter });

async function main() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, numeric_precision, numeric_scale, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'ebpls'
      AND table_name = 'BusinessRecord'
      AND column_name IN (
        'tin','businessArea','totalFloorArea','totalEmployees','maleEmployees',
        'femaleEmployees','employeesWithinMunicipality','deliveryVehicles','assetSize'
      )
    ORDER BY column_name
  `);
  console.log(JSON.stringify(cols, null, 2));

  const dirtyTin = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS dirty_count
    FROM ebpls."BusinessRecord"
    WHERE tin IS NULL
  `);
  console.log("tin_null_count", dirtyTin);

  const sample = await prisma.businessRecord.findFirst({
    select: {
      businessName: true,
      tin: true,
      assetSize: true,
      deliveryVehicles: true,
      totalEmployees: true,
      businessArea: true,
    },
  });
  console.log("sample_record", sample);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
