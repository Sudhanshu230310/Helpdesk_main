const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, pool } = require('../config/db');
const fs = require('fs');

async function run() {
    try {
        const sqlPath = path.join(__dirname, '../../backend/prisma/stored_procedures.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await query(sql);
        console.log('Stored procedures updated successfully.');
    } catch (e) {
        console.error('Error updating DB:', e);
    } finally {
        pool.end();
        process.exit();
    }
}
run();
