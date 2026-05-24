// ============================================================
// Admin Controller — Reports, user/team/category management via Prisma
// ============================================================
const { prisma } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { parse } = require('csv-parse/sync');
const { sendWelcomeEmail } = require('../services/emailService');
const { generateReportPdf } = require('../services/pdfService');

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res, next) => {
    try {
        const role = req.user.role;
        const uid = req.user.id;

        const where = {};
        if (role === 'technician') where.assigned_to = uid;
        if (role === 'team_lead') {
            const teams = await prisma.teams.findMany({ where: { team_lead_id: uid }, select: { id: true } });
            where.OR = [{ assigned_to: uid }, { assigned_team_id: { in: teams.map(t => t.id) } }];
        }
        if (role === 'user') {
            where.OR = [{ created_by: uid }, { behalf_user_id: uid }];
        }

        const [total, open, resolved, closed, in_progress] = await Promise.all([
            prisma.tickets.count({ where }),
            prisma.tickets.count({ where: { ...where, status: 'open' } }),
            prisma.tickets.count({ where: { ...where, status: 'resolved' } }),
            prisma.tickets.count({ where: { ...where, status: 'closed' } }),
            prisma.tickets.count({ where: { ...where, status: 'in_progress' } }),
        ]);

        const avgResolutionTimeResult = await prisma.$queryRaw`
            SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_res_hours
            FROM tickets WHERE status IN ('resolved', 'closed') AND resolved_at IS NOT NULL
        `;

        res.json({
            stats: {
                total_tickets: total,
                open_tickets: open,
                resolved_tickets: resolved,
                closed_tickets: closed,
                in_progress_tickets: in_progress,
                sla_breached: 0, // Simplified for now
                avg_resolution_hours: avgResolutionTimeResult[0]?.avg_res_hours || 0,
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get report by category
 */
const reportByCategory = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        let where = {};
        if (start_date && end_date) {
            where.created_at = { gte: new Date(start_date), lte: new Date(end_date) };
        }

        const groups = await prisma.tickets.groupBy({
            by: ['category_id'],
            _count: { _all: true },
            where
        });

        const categories = await prisma.categories.findMany();
        
        const report = groups.map(g => ({
            category_name: categories.find(c => c.id === g.category_id)?.name || 'Unknown',
            total_tickets: g._count._all,
            resolved_count: 0 // Simplification for immediate Prisma parity
        }));

        res.json({ report });
    } catch (error) {
        next(error);
    }
};

/**
 * Get report by subcategory
 */
const reportBySubcategory = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        let where = {};
        if (start_date && end_date) {
            where.created_at = { gte: new Date(start_date), lte: new Date(end_date) };
        }

        const groups = await prisma.tickets.groupBy({
            by: ['category_id', 'subcategory_id'],
            _count: { _all: true },
            where
        });

        const [categories, subcategories] = await Promise.all([
            prisma.categories.findMany(),
            prisma.subcategories.findMany()
        ]);
        
        const report = groups.map(g => ({
            category_name: categories.find(c => c.id === g.category_id)?.name || 'Unknown',
            subcategory_name: subcategories.find(s => s.id === g.subcategory_id)?.name || 'Unknown',
            total_tickets: g._count._all
        }));

        res.json({ report });
    } catch (error) {
        next(error);
    }
};

/**
 * Get report by technician
 */
const reportByTechnician = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        let where = { assigned_to: { not: null } };
        if (start_date && end_date) {
            where.created_at = { gte: new Date(start_date), lte: new Date(end_date) };
        }

        const groups = await prisma.tickets.groupBy({
            by: ['assigned_to'],
            _count: { _all: true },
            where
        });

        const technicians = await prisma.users.findMany({
            where: { id: { in: groups.map(g => g.assigned_to) } },
            select: { id: true, name: true, email: true }
        });
        
        const report = groups.map(g => {
            const tech = technicians.find(t => t.id === g.assigned_to);
            return {
                technician_name: tech?.name || 'Unassigned',
                technician_email: tech?.email,
                total_tickets: g._count._all
            };
        });

        res.json({ report });
    } catch (error) {
        next(error);
    }
};

/**
 * Get ticket turnaround time
 */
const getTicketTurnaround = async (req, res, next) => {
    try {
        const { ticketId } = req.params;
        
        // Prisma doesn't support interval math well, so we use raw SQL
        const result = await prisma.$queryRaw`
            SELECT 
                ticket_number,
                created_at,
                resolved_at,
                EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 as turnaround_hours
            FROM tickets
            WHERE id = ${ticketId}::uuid
        `;

        res.json({ turnaround: result[0] || null });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all users
 */
const getAllUsers = async (req, res, next) => {
    try {
        const { role, page = 1, limit = 50 } = req.query;
        const take = parseInt(limit);
        const skip = (parseInt(page) - 1) * take;

        const where = role ? { role } : {};

        const [total, users] = await Promise.all([
            prisma.users.count({ where }),
            prisma.users.findMany({ where, skip, take, orderBy: { name: 'asc' } })
        ]);

        res.json({
            users: users.map(u => ({ ...u, password_hash: undefined })),
            pagination: { page: parseInt(page), limit: take, total, pages: Math.ceil(total / take) },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Teams
 */
const getTeams = async (req, res, next) => {
    try {
        const teams = await prisma.teams.findMany({ orderBy: { name: 'asc' } });
        res.json({ teams });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new team
 */
const createTeam = async (req, res, next) => {
    try {
        const { name, description, team_lead_id } = req.body;
        if (!name) return res.status(400).json({ error: 'Team name is required.' });

        const team = await prisma.teams.create({
            data: { name, description, team_lead_id }
        });
        res.status(201).json({ message: 'Team created successfully.', team });
    } catch (error) {
        next(error);
    }
};

/**
 * Add member to team
 */
const addTeamMember = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        await prisma.team_members.create({
            data: { team_id: parseInt(id), user_id }
        });

        res.json({ message: 'Team member added successfully.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Categories
 */
const getCategories = async (req, res, next) => {
    try {
        const cats = await prisma.categories.findMany({
            include: {
                subcategories: { include: { teams: { select: { name: true } } } }
            },
            orderBy: { name: 'asc' }
        });

        const formatted = cats.map(c => ({
            id: c.id, name: c.name, description: c.description,
            subcategories: c.subcategories.map(s => ({
                id: s.id, name: s.name, description: s.description,
                assigned_team_id: s.assigned_team_id,
                assigned_team_name: s.teams?.name
            }))
        }));

        res.json({ categories: formatted });
    } catch (error) {
        next(error);
    }
};

/**
 * Create Category
 */
const createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const category = await prisma.categories.create({
            data: { name, description }
        });
        res.status(201).json({ message: 'Category created successfully.', category });
    } catch (error) {
        next(error);
    }
};

/**
 * Create Subcategory
 */
const createSubcategory = async (req, res, next) => {
    try {
        const { category_id, name, description, assigned_team_id } = req.body;
        const sub = await prisma.subcategories.create({
            data: { category_id, name, description, assigned_team_id }
        });
        res.status(201).json({ message: 'Subcategory created successfully.', subcategory: sub });
    } catch (error) {
        next(error);
    }
};

/**
 * Get holidays
 */
const getHolidays = async (req, res, next) => {
    try {
        const holidays = await prisma.holidays.findMany({ orderBy: { holiday_date: 'asc' } });
        res.json({ holidays });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a holiday
 */
const createHoliday = async (req, res, next) => {
    try {
        const { name, holiday_date, is_recurring } = req.body;
        if (!name || !holiday_date) {
            return res.status(400).json({ error: 'Name and holiday date are required.' });
        }

        const holiday = await prisma.holidays.create({
            data: {
                name,
                holiday_date: new Date(holiday_date),
                is_recurring: !!is_recurring
            }
        });

        res.status(201).json({ message: 'Holiday created successfully.', holiday });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'A holiday on this date already exists.' });
        }
        next(error);
    }
};

/**
 * Delete a holiday by ID (admin only)
 */
const deleteHoliday = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'Holiday ID is required.' });
        const existing = await prisma.holidays.findUnique({ where: { id: parseInt(id) } });
        if (!existing) return res.status(404).json({ error: 'Holiday not found.' });
        await prisma.holidays.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Holiday deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a single user
 */
const createUser = async (req, res, next) => {
    try {
        const { name, email, role, department, phone, team_id, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required.' });

        const userRole = ['user', 'technician', 'team_lead', 'admin'].includes(role) ? role : 'user';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await prisma.users.create({
            data: { name, email, password_hash: passwordHash, phone, department, role: userRole, is_verified: true, is_active: true }
        });

        // Send welcome email with the credentials
        await sendWelcomeEmail({ email, name, tempPassword: password, role: userRole });

        if ((userRole === 'technician' || userRole === 'team_lead') && team_id) {
            await prisma.team_members.create({ data: { team_id: parseInt(team_id), user_id: newUser.id } });
            if (userRole === 'team_lead') {
                await prisma.teams.update({ where: { id: parseInt(team_id) }, data: { team_lead_id: newUser.id } });
            }
        }

        res.status(201).json({ message: 'User created successfully.', user: newUser });
    } catch (error) {
        if (error.code === 'P2002') return res.status(409).json({ error: 'Email already registered.' });
        next(error);
    }
};


/**
 * Bulk create users from CSV
 */
const bulkCreateUsers = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'CSV file is required.' });
        }

        const csvContent = req.file.buffer.toString('utf-8');
        let records;
        try {
            records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });
        } catch (parseErr) {
            return res.status(400).json({ error: 'Invalid CSV format.' });
        }

        const results = { success: [], failed: [] };
        
        for (const row of records) {
            const { name, email, role, department, phone } = row;
            if (!name || !email) {
                results.failed.push({ email: email || 'unknown', error: 'Missing name or email' });
                continue;
            }

            try {
                const tempPassword = crypto.randomBytes(4).toString('hex');
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(tempPassword, salt);

                const user = await prisma.users.create({
                    data: {
                        name,
                        email,
                        password_hash: passwordHash,
                        role: role || 'user',
                        department,
                        phone,
                        is_verified: true,
                        is_active: true
                    }
                });

                await sendWelcomeEmail({ email, name, tempPassword, role: user.role });
                results.success.push({ email, name });
            } catch (err) {
                results.failed.push({ email, error: err.message });
            }
        }

        res.json({
            message: `Import complete. ${results.success.length} success, ${results.failed.length} failed.`,
            results
        });
    } catch (error) {
        next(error);
    }
};
// Delete a user by ID (admin only)
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: 'User ID is required.' });
        const existing = await prisma.users.findUnique({ where: { id } });
        if (!existing) return res.status(404).json({ error: 'User not found.' });
        await prisma.users.delete({ where: { id } });
        res.json({ message: 'User deleted successfully.' });
    } catch (error) {
        next(error);
    }
};
/**
 * Get Settings
 */
const getSettings = async (req, res, next) => {
    try {
        const dbSettings = await prisma.system_settings.findMany();
        const settings = {};
        dbSettings.forEach(r => settings[r.setting_key] = r.setting_value);
        res.json({ settings });
    } catch (error) {
        next(error);
    }
};

/**
 * Update Settings
 */
const updateSettings = async (req, res, next) => {
    try {
        const { key, value } = req.body;
        await prisma.system_settings.upsert({
            where: { setting_key: key },
            update: { setting_value: String(value), updated_at: new Date() },
            create: { setting_key: key, setting_value: String(value) }
        });
        res.json({ message: 'Settings updated successfully.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Generate Pdf Report
 */
const generatePdfReport = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        let where = {};
        if (start_date && end_date) {
            where.created_at = { gte: new Date(start_date), lte: new Date(end_date) };
        }

        // Fetch data for PDF
        const [catGroups, subGroups, techGroups] = await Promise.all([
            prisma.tickets.groupBy({ by: ['category_id'], _count: { _all: true }, where }),
            prisma.tickets.groupBy({ by: ['category_id', 'subcategory_id'], _count: { _all: true }, where }),
            prisma.tickets.groupBy({ by: ['assigned_to'], _count: { _all: true }, where: { ...where, assigned_to: { not: null } } })
        ]);

        const [categories, subcategories, technicians] = await Promise.all([
            prisma.categories.findMany(),
            prisma.subcategories.findMany(),
            prisma.users.findMany({ where: { id: { in: techGroups.map(g => g.assigned_to) } } })
        ]);

        const catData = catGroups.map(g => ({
            category_name: categories.find(c => c.id === g.category_id)?.name || 'Unknown',
            total_tickets: g._count._all
        }));

        const subData = subGroups.map(g => ({
            category_name: categories.find(c => c.id === g.category_id)?.name || 'Unknown',
            subcategory_name: subcategories.find(s => s.id === g.subcategory_id)?.name || 'Unknown',
            total_tickets: g._count._all
        }));

        const techData = techGroups.map(g => {
            const tech = technicians.find(t => t.id === g.assigned_to);
            return {
                technician_name: tech?.name || 'Unassigned',
                total_tickets: g._count._all
            };
        });

        const pdfBuffer = await generateReportPdf(catData, subData, techData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=helpdesk_report.pdf');
        res.send(pdfBuffer);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats, reportByCategory, reportBySubcategory, reportByTechnician, getTicketTurnaround,
    getAllUsers, getTeams, createTeam, addTeamMember, getCategories, createCategory, createSubcategory,
    getHolidays, createHoliday, deleteHoliday, createUser, bulkCreateUsers, deleteUser, getSettings, updateSettings, generatePdfReport,
};
