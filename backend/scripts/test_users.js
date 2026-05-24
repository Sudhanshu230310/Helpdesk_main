const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, pool } = require('../config/db');

async function test() {
    try {
        console.log('Testing sp_get_all_users...');
        const res = await query('SELECT * FROM sp_get_all_users(NULL, 50, 0)');
        console.log(`Success: ${res.rows.length} users returned.`);
    } catch (e) {
        console.error('Error in sp_get_all_users:', e.message);
    } finally {
        pool.end();
        process.exit();
    }
}
test();
