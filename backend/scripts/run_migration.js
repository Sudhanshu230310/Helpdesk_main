const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, pool } = require('../config/db');

async function run() {
    try {
        console.log('Running migration_sprint2.sql...');
        const sql = fs.readFileSync(path.join(__dirname, '../../backend/prisma/migration_sprint2.sql'), 'utf-8');
        await query(sql);
        console.log('Successfully applied migration.');
    } catch (e) {
        console.error('Failed:', e);
    } finally {
        pool.end();
        process.exit();
    }
}
run();
