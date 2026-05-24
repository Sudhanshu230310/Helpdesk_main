const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function test() {
    console.log("Trying new PrismaClient({})...");
    try {
        const p1_5 = new PrismaClient({});
        console.log("p1_5 success");
    } catch (e) {
        console.error("p1_5 failed:", e.message);
    }

    console.log("Trying new PrismaClient({ datasources: { db: { url: ... } } })...");
    try {
        const p2 = new PrismaClient({
            datasources: {
                db: {
                    url: process.env.DATABASE_URL
                }
            }
        });
        console.log("p2 success");
    } catch (e) {
        console.error("p2 failed:", e.message);
    }

    console.log("Trying new PrismaClient({ datasource: { url: ... } })...");
    try {
        const p4 = new PrismaClient({
            datasource: {
                url: process.env.DATABASE_URL
            }
        });
        console.log("p4 success");
    } catch (e) {
        console.error("p4 failed:", e.message);
    }

    console.log("Trying new PrismaClient({ datasourceUrl: ... })...");
    try {
        const p5 = new PrismaClient({
            datasourceUrl: process.env.DATABASE_URL
        });
        console.log("p5 success");
    } catch (e) {
        console.error("p5 failed:", e.message);
    }
}

test();
