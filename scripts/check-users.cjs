const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const adapter = new PrismaLibSql({ url: 'file:C:/Users/Windows/Desktop/new ebpls design/ebpls/prisma/dev.db' });
const p = new PrismaClient({ adapter });
p.user.findMany({
  where: { email: { contains: 'qa.' } },
  select: { email: true, name: true, role: true },
  orderBy: { createdAt: 'desc' },
  take: 5
}).then(r => {
  console.log(JSON.stringify(r, null, 2));
  return p.$disconnect();
}).catch(e => { console.error(e); process.exit(1); });
