const { prisma } = require('./config/db');

async function testPrisma() {
    try {
        console.log('Testing Prisma findMany on users...');
        const users = await prisma.users.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });
        console.log(`Success: Prisma returned ${users.length} users.`);
        console.log('Sample user:', users[0]);
    } catch (e) {
        console.error('Prisma query failed:', e);
    } finally {
        await prisma.$disconnect();
        process.exit();
    }
}

testPrisma();
