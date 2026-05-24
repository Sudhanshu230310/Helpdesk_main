const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query, pool } = require('../config/db');

async function seed() {
    try {
        console.log('Seeding dummy tickets...');
        
        // Ensure there is a category
        let catRes = await query('SELECT id FROM categories LIMIT 1');
        let categoryId;
        if (catRes.rows.length === 0) {
            console.log('Creating dummy category & subcategory...');
            catRes = await query(`INSERT INTO categories (name, description) VALUES ('Hardware', 'Hardware Issues') RETURNING id`);
            categoryId = catRes.rows[0].id;
        } else {
            categoryId = catRes.rows[0].id;
        }

        // Get or Create subcategory
        let subRes = await query('SELECT id FROM subcategories WHERE category_id = $1 LIMIT 1', [categoryId]);
        let subcategoryId;
        if (subRes.rows.length === 0) {
            subRes = await query(`INSERT INTO subcategories (category_id, name) VALUES ($1, 'Laptop Replacement') RETURNING id`, [categoryId]);
            subcategoryId = subRes.rows[0].id;
        } else {
            subcategoryId = subRes.rows[0].id;
        }

        // Ensure there is an admin/creator
        let userRes = await query("SELECT id FROM users LIMIT 1");
        if (userRes.rows.length === 0) {
            userRes = await query("INSERT INTO users (name, email, role, is_active, is_verified) VALUES ('Seed User', 'seed@example.com', 'admin', true, true) RETURNING id");
        }
        const createdBy = userRes.rows[0].id;

        // Dummy tickets
        const tickets = [
            { title: 'My laptop screen is flickering', priority: 'high', desc: 'The display constantly flickers when I open IDEs.' },
            { title: 'Need access to VPN', priority: 'medium', desc: 'I am working from home tomorrow and cannot access the portal.' },
            { title: 'Mouse is double clicking randomly', priority: 'low', desc: 'Hardware defect on the logitech mouse.' },
            { title: 'Printer in 4th floor is jammed', priority: 'high', desc: 'Paper jam occurred during a 100 page print.' },
            { title: 'Blue screen on waking from sleep', priority: 'critical', desc: 'Windows crashes with BSOD IRQL_NOT_LESS_OR_EQUAL.' }
        ];

        for (const t of tickets) {
            await query(
                'SELECT * FROM sp_create_ticket($1, $2, $3, $4, $5, $6)',
                [t.title, t.desc, categoryId, subcategoryId, t.priority, createdBy]
            );
        }

        console.log(`Seeded ${tickets.length} tickets successfully.`);
    } catch (e) {
        console.error('Seeding failed:', e);
    } finally {
        pool.end();
        process.exit();
    }
}

seed();
