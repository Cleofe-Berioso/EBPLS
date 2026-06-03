const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const app = await prisma.businessApplication.findFirst({
    where: { applicationNumber: 'CLOSURE-RELEASED-001' },
    select: { id: true, applicationNumber: true, status: true }
  });
  console.log(JSON.stringify(app, null, 2));
  await prisma.$disconnect();
})();
