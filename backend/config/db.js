// ============================================================
// Database Configuration — PostgreSQL Connection Pool & Prisma
// ============================================================
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false,
    max: 20,                // Maximum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// For Prisma 7+ with Driver Adapters
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Test connection on startup
pool.on('connect', () => {
    console.log('📦 Connected to PostgreSQL (via Pool)');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL pool error:', err.message);
});

/**
 * Execute a query using the connection pool (legacy support)
 * @param {string} text - SQL query or function call
 * @param {Array} params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 Query (${duration}ms):`, text.substring(0, 80));
        }
        return result;
    } catch (error) {
        console.error('❌ Query error:', error.message);
        throw error;
    }
};

module.exports = { pool, query, prisma };
