const { PrismaClient } = require("@prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: "file:./prisma/dev.db" }),
});

(async () => {
  const users = await prisma.user.findMany({
    select: { email: true, role: true },
    orderBy: { email: "asc" },
  });
  console.log(users);
  await prisma.$disconnect();
})();
