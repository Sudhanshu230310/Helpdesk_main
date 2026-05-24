const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, pool } = require('../config/db');

async function test() {
    try {
        console.log('Testing sp_report_by_category...');
        const resCat = await query('SELECT * FROM sp_report_by_category(NULL, NULL)');
        console.log(`Success: ${resCat.rows.length} rows.`);

        console.log('Testing sp_report_by_team...');
        const resTeam = await query('SELECT * FROM sp_report_by_team(NULL, NULL)');
        console.log(`Success: ${resTeam.rows.length} rows.`);

        console.log('Testing sp_report_by_technician...');
        const resTech = await query('SELECT * FROM sp_report_by_technician(NULL, NULL)');
        console.log(`Success: ${resTech.rows.length} rows.`);
        
    } catch (e) {
        console.error('Error in reports:', e.message);
    } finally {
        pool.end();
        process.exit();
    }
}
test();
