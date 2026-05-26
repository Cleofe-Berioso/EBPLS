const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'prisma', 'dev.db');
console.log('dbPath:', dbPath);
// libsql requires forward slashes for Windows paths
const dbUrl = 'file:///' + dbPath.replace(/\\/g, '/');
console.log('dbUrl:', dbUrl);
const client = createClient({ url: dbUrl });
const adapter = new PrismaLibSql(client);
const prisma = new PrismaClient({ adapter });

prisma.$connect()
  .then(() => {
    console.log('DB connect OK');
    return prisma.$disconnect();
  })
  .catch(e => {
    console.error('DB error:', e.message);
    process.exit(1);
  });
