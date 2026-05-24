const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, pool } = require('../config/db');

async function run() {
    try {
        console.log('Running stored_procedures.sql...');
        const sql = fs.readFileSync(path.join(__dirname, '../../backend/prisma/stored_procedures.sql'), 'utf-8');
        await query(sql);
        console.log('Successfully re-applied stored procedures.');
    } catch (e) {
        console.error('Failed:', e);
    } finally {
        pool.end();
        process.exit();
    }
}
run();
