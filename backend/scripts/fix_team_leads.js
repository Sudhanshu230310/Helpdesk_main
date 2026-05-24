const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, pool } = require('../config/db');

async function fixTeamLeads() {
    try {
        console.log('Fixing existing team leads...');
        
        // Find users who have role = 'team_lead'
        const res = await query(`
            SELECT u.id as user_id, tm.team_id 
            FROM users u
            JOIN team_members tm ON u.id = tm.user_id
            WHERE u.role = 'team_lead'
        `);
        
        console.log(`Found ${res.rows.length} team leads in team_members.`);

        for (const row of res.rows) {
            await query('UPDATE teams SET team_lead_id = $1 WHERE id = $2', [row.user_id, row.team_id]);
            console.log(`Updated team ${row.team_id} with team_lead_id = ${row.user_id}`);
        }
    } catch (e) {
        console.error('Failed:', e);
    } finally {
        pool.end();
        process.exit();
    }
}

fixTeamLeads();
