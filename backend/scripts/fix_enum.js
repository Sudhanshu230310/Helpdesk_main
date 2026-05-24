const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, pool } = require('../config/db');

async function fix() {
    try {
        console.log('Fixing user_role enum...');
        await query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'team_lead'`);
        console.log('Added team_lead to user_role ENUM.');
    } catch (e) {
        console.error('Failed to add enum value (if duplicate_object, it is fine):', e.message);
    } finally {
        pool.end();
        process.exit();
    }
}
fix();
