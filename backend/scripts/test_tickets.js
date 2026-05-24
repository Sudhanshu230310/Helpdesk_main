const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, pool } = require('../config/db');

async function test() {
    try {
        console.log('Testing sp_get_tickets for admin...');
        const adminRes = await query('SELECT id FROM users WHERE email = $1', ['admin@helpdesk.com']);
        const adminId = adminRes.rows[0].id;
        console.log('Admin ID:', adminId);

        const ticketsRes = await query(
            'SELECT * FROM sp_get_tickets(p_role := $1, p_user_id := $2, p_limit := 100)',
            ['admin', adminId]
        );
        console.log('Admin Tickets Count:', ticketsRes.rows.length);

        console.log('Testing sp_get_dashboard_stats...');
        const statsRes = await query(
            'SELECT * FROM sp_get_dashboard_stats($1, $2)',
            [adminId, 'admin']
        );
        console.log('Admin Stats:', statsRes.rows[0]);

    } catch (e) {
        console.error('Test failed:', e);
    } finally {
        pool.end();
        process.exit();
    }
}
test();
