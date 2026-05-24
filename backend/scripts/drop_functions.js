const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, pool } = require('../config/db');

async function drop() {
    try {
        console.log('Dropping functions...');
        await query('DROP FUNCTION IF EXISTS sp_report_by_technician(DATE, DATE);');
        await query('DROP FUNCTION IF EXISTS sp_report_by_team(DATE, DATE);');
        console.log('Functions dropped.');
    } catch (e) {
        console.error('Failed:', e);
    } finally {
        pool.end();
        process.exit();
    }
}
drop();
