const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, pool } = require('../config/db');

async function test() {
    try {
        console.log('Testing sp_get_categories_with_subcategories...');
        await query('SELECT * FROM sp_get_categories_with_subcategories()');
        console.log('Testing sp_get_all_teams...');
        await query('SELECT * FROM sp_get_all_teams()');
        console.log('Testing settings & holidays...');
        await query('SELECT * FROM system_settings');
        await query('SELECT * FROM holidays');
        console.log('All passing!');
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        pool.end();
        process.exit();
    }
}
test();
