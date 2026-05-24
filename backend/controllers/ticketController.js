// ============================================================
// Ticket Controller — CRUD, interactions, files, closure
// ============================================================
const { prisma } = require('../config/db');
const { createOTP, verifyOTP } = require('../services/otpService');
const { 
    sendOtpEmail, 
    sendTicketCreatedEmail, 
    sendTicketCreatedAdminEmail, 
    sendTicketUpdatedEmail, 
    sendTicketClosedEmail 
} = require('../services/emailService');
const { createNotification } = require('./notificationController');

// Helper to generate ticket number
const getNextTicketNumber = async () => {
    // Because Prisma doesn't natively expose the sequence easily without raw query,
    // we use a safe transaction to get an incrementing generic sequence or raw query:
    const result = await prisma.$queryRaw`SELECT nextval('ticket_number_seq') AS next_val`;
    const num = result[0].next_val.toString().padStart(7, '0');
    return `HD-${num}`;
};

/**
 * Create a new ticket
 * POST /api/tickets
 */
const createTicket = async (req, res, next) => {
    try {
        const {
            title, description, category_id, subcategory_id,
            priority, form_data, on_behalf, behalf_user_email
        } = req.body;

        if (!title || !description || !category_id) {
            return res.status(400).json({ error: 'Title, description, and category are required.' });
        }

        let behalfUserId = null;
        let creatorId = req.user.id;

        if (on_behalf && behalf_user_email) {
            const bUser = await prisma.users.findUnique({ where: { email: behalf_user_email } });
            if (!bUser) {
                return res.status(404).json({ error: 'Behalf user not found with that email.' });
            }
            behalfUserId = bUser.id;
        }

        // Auto-assign Logic
        let assignedTeamId = null;
        let assignedTo = null;

        if (subcategory_id) {
            const subcat = await prisma.subcategories.findUnique({ where: { id: subcategory_id } });
            if (subcat && subcat.assigned_team_id) {
                assignedTeamId = subcat.assigned_team_id;
                
                // Fetch tech members
                const members = await prisma.team_members.findMany({
                    where: { 
                        team_id: assignedTeamId, 
                        users: { role: 'technician', is_active: true } 
                    },
                    orderBy: { user_id: 'asc' }
                });

                if (members.length > 0) {
                    let nextIndex = 0;
                    if (subcat.last_assigned_user_id) {
                        const lastIdx = members.findIndex(m => m.user_id === subcat.last_assigned_user_id);
                        if (lastIdx !== -1 && lastIdx < members.length - 1) {
                            nextIndex = lastIdx + 1;
                        }
                    }
                    assignedTo = members[nextIndex].user_id;

                    // Update subcategory record
                    await prisma.subcategories.update({
                        where: { id: subcategory_id },
                        data: { last_assigned_user_id: assignedTo }
                    });
                }
            }
        }

        const ticketNumber = await getNextTicketNumber();

        // Create the ticket and log the audit row inside a transaction
        const ticket = await prisma.$transaction(async (tx) => {
            const t = await tx.tickets.create({
                data: {
                    ticket_number: ticketNumber,
                    title,
                    description,
                    category_id: category_id ? parseInt(category_id) : null,
                    subcategory_id: subcategory_id ? parseInt(subcategory_id) : null,
                    priority: priority || 'medium',
                    created_by: creatorId,
                    assigned_to: assignedTo,
                    assigned_team_id: assignedTeamId,
                    form_data: form_data ? form_data : undefined,
                    created_on_behalf: on_behalf || false,
                    behalf_user_id: behalfUserId
                }
            });

            await tx.audit_logs.create({
                data: {
                    entity_type: 'ticket',
                    entity_id: t.id,
                    action: 'created',
                    performed_by: creatorId,
                    new_values: { ticket_number: t.ticket_number, title: t.title, status: 'open' }
                }
            });

            return t;
        });

        // Email notifications
        const creatorEmail = req.user.email;
        const creatorName = req.user.name;
        
        await sendTicketCreatedEmail({
            email: creatorEmail,
            ticketNumber: ticket.ticket_number,
            title,
            userName: creatorName,
        });

        if (behalfUserId && behalf_user_email) {
            await sendTicketCreatedEmail({
                email: behalf_user_email,
                ticketNumber: ticket.ticket_number,
                title,
                userName: 'User',
            });
        }

        try {
            const admins = await prisma.users.findMany({ where: { role: 'admin', is_active: true } });
            for (const admin of admins) {
                if (admin.email !== creatorEmail) {
                    await sendTicketCreatedAdminEmail({
                        email: admin.email,
                        ticketNumber: ticket.ticket_number,
                        title,
                        userName: creatorName,
                    });
                    await createNotification(admin.id, 'New Ticket Raised', `Ticket ${ticket.ticket_number} has been created by ${creatorName}.`, 'ticket_created');
                }
            }
        } catch (emailErr) {
            console.error('Failed to send admin notification emails:', emailErr.message);
        }

        res.status(201).json({
            message: 'Ticket created successfully.',
            ticket: {
                id: ticket.id,
                ticket_number: ticket.ticket_number,
                assigned_team_id: ticket.assigned_team_id,
                assigned_to: ticket.assigned_to,
                status: ticket.status,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get list of tickets with filters
 */
const getTickets = async (req, res, next) => {
    try {
        const {
            status, category_id, assigned_to, team_id,
            search, page = 1, limit = 20
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = { AND: [] };
        if (status) where.AND.push({ status });
        if (category_id) where.AND.push({ category_id: parseInt(category_id) });
        if (assigned_to) where.AND.push({ assigned_to });
        if (team_id) where.AND.push({ assigned_team_id: parseInt(team_id) });
        
        if (search) {
            where.AND.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { ticket_number: { contains: search, mode: 'insensitive' } }
                ]
            });
        }

        // Role based access logic
        const role = req.user.role;
        const uid = req.user.id;

        if (role === 'technician') {
            where.AND.push({ assigned_to: uid });
        } else if (role === 'team_lead') {
            const leadingTeams = await prisma.teams.findMany({ where: { team_lead_id: uid }, select: { id: true } });
            const teamIds = leadingTeams.map(t => t.id);
            where.AND.push({
                OR: [
                    { assigned_to: uid },
                    { assigned_team_id: { in: teamIds } }
                ]
            });
        } else if (role === 'user') {
            where.AND.push({
                OR: [
                    { created_by: uid },
                    { behalf_user_id: uid }
                ]
            });
        }

        const [total, tickets] = await Promise.all([
            prisma.tickets.count({ where }),
            prisma.tickets.findMany({
                where,
                skip: offset,
                take,
                orderBy: { created_at: 'desc' },
                include: {
                    categories: { select: { name: true } },
                    subcategories: { select: { name: true } },
                    users_tickets_created_byTousers: { select: { name: true, email: true } },
                    users_tickets_assigned_toTousers: { select: { name: true, email: true } },
                    teams: { select: { name: true } }
                }
            })
        ]);

        const mappedTickets = tickets.map(t => ({
            id: t.id,
            ticket_number: t.ticket_number,
            title: t.title,
            description: t.description,
            category_name: t.categories?.name,
            subcategory_name: t.subcategories?.name,
            priority: t.priority,
            status: t.status,
            creator_name: t.users_tickets_created_byTousers?.name,
            creator_email: t.users_tickets_created_byTousers?.email,
            assignee_name: t.users_tickets_assigned_toTousers?.name,
            team_name: t.teams?.name,
            created_at: t.created_at,
            updated_at: t.updated_at,
            closed_at: t.closed_at
        }));

        res.json({
            tickets: mappedTickets,
            pagination: {
                page: parseInt(page),
                limit: take,
                total,
                pages: Math.ceil(total / take),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get ticket by ID
 */
const getTicketById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const ticket = await prisma.tickets.findUnique({
            where: { id },
            include: {
                categories: true,
                subcategories: true,
                users_tickets_created_byTousers: true,
                users_tickets_assigned_toTousers: true,
                users_tickets_behalf_user_idTousers: true,
                teams: true,
                ticket_files: { include: { users: { select: { name: true } } }, orderBy: { created_at: 'asc'} },
                ticket_items: { include: { users: { select: { name: true } } }, orderBy: { provided_at: 'asc'} },
                feedback: true,
                ticket_interactions: { 
                    include: { users: { select: { name: true, role: true } } },
                    orderBy: { created_at: 'asc' } 
                }
            }
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found.' });
        }

        // Access checks
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';
        const isCreator = ticket.created_by === userId;
        const isBehalfUser = ticket.behalf_user_id === userId;
        const isAssigned = ticket.assigned_to === userId;

        if (!isAdmin && !isCreator && !isBehalfUser && !isAssigned) {
            if (ticket.assigned_team_id) {
                const teamCheck = await prisma.team_members.findUnique({
                    where: { team_id_user_id: { team_id: ticket.assigned_team_id, user_id: userId } }
                });
                if (!teamCheck) {
                    return res.status(403).json({ error: 'You do not have access to this ticket.' });
                }
            } else {
                return res.status(403).json({ error: 'You do not have access to this ticket.' });
            }
        }

        // Filter interactions
        const isUserAccess = req.user.role === 'user';
        const interactions = ticket.ticket_interactions.filter(ti => {
            if (isUserAccess && ti.is_internal) return false;
            return true;
        }).map(ti => ({
            id: ti.id,
            message: ti.message,
            is_internal: ti.is_internal,
            user_id: ti.user_id,
            user_name: ti.users.name,
            user_role: ti.users.role,
            created_at: ti.created_at
        }));

        res.json({
            ticket: {
                id: ticket.id,
                ticket_number: ticket.ticket_number,
                title: ticket.title,
                description: ticket.description,
                category_id: ticket.category_id,
                category_name: ticket.categories?.name,
                subcategory_id: ticket.subcategory_id,
                subcategory_name: ticket.subcategories?.name,
                priority: ticket.priority,
                status: ticket.status,
                created_by: ticket.created_by,
                creator_name: ticket.users_tickets_created_byTousers?.name,
                creator_email: ticket.users_tickets_created_byTousers?.email,
                assigned_to: ticket.assigned_to,
                assignee_name: ticket.users_tickets_assigned_toTousers?.name,
                assigned_team_id: ticket.assigned_team_id,
                team_name: ticket.teams?.name,
                form_data: ticket.form_data,
                created_on_behalf: ticket.created_on_behalf,
                behalf_user_id: ticket.behalf_user_id,
                behalf_user_name: ticket.users_tickets_behalf_user_idTousers?.name,
                with_user_since: ticket.with_user_since,
                created_at: ticket.created_at,
                updated_at: ticket.updated_at
            },
            interactions,
            files: ticket.ticket_files.map(f => ({
                id: f.id, original_name: f.original_name, stored_name: f.stored_name, 
                file_size: f.file_size, mime_type: f.mime_type, 
                uploaded_by_name: f.users.name, created_at: f.created_at
            })),
            items: ticket.ticket_items.map(i => ({
                id: i.id, item_name: i.item_name, item_type: i.item_type,
                quantity: i.quantity, serial_number: i.serial_number, notes: i.notes,
                provided_by_name: i.users?.name, provided_at: i.provided_at
            })),
            feedback: ticket.feedback,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add interaction
 */
const addInteraction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { message, is_internal } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        if (is_internal && req.user.role === 'user') {
            return res.status(403).json({ error: 'Unauthorized to add internal notes.' });
        }

        const isInternal = (req.user.role !== 'user') && (is_internal || false);

        await prisma.$transaction(async (tx) => {
            await tx.ticket_interactions.create({
                data: {
                    ticket_id: id,
                    user_id: req.user.id,
                    message,
                    is_internal: isInternal
                }
            });
            await tx.tickets.update({ where: { id }, data: { updated_at: new Date() } });
        });

        // Notify
        const ticket = await prisma.tickets.findUnique({
            where: { id },
            include: { users_tickets_created_byTousers: true, users_tickets_assigned_toTousers: true }
        });

        if (ticket) {
            const notifyEmails = new Set();
            if (ticket.users_tickets_created_byTousers?.email) notifyEmails.add(ticket.users_tickets_created_byTousers.email);
            if (ticket.users_tickets_assigned_toTousers?.email) notifyEmails.add(ticket.users_tickets_assigned_toTousers.email);
            notifyEmails.delete(req.user.email);

            for (const email of notifyEmails) {
                await sendTicketUpdatedEmail({
                    email,
                    ticketNumber: ticket.ticket_number,
                    title: ticket.title,
                    status: 'New message',
                    updatedBy: req.user.name,
                });
                
                // Add DB notification for the recipients
                const recipientUser = await prisma.users.findUnique({ where: { email } });
                if (recipientUser) {
                    await createNotification(recipientUser.id, 'New Message', `New message on ticket ${ticket.ticket_number} from ${req.user.name}.`, 'message');
                }
            }
        }

        res.status(201).json({ message: 'Interaction added.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Upload files
 */
const uploadFiles = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded.' });
        }

        const uploaded = [];
        for (const file of req.files) {
            await prisma.ticket_files.create({
                data: {
                    ticket_id: id,
                    uploaded_by: req.user.id,
                    original_name: file.originalname,
                    stored_name: file.filename,
                    file_size: file.size,
                    mime_type: file.mimetype
                }
            });
            uploaded.push({ original_name: file.originalname, stored_name: file.filename, size: file.size });
        }

        res.status(201).json({ message: `${uploaded.length} file(s) uploaded successfully.`, files: uploaded });
    } catch (error) {
        next(error);
    }
};

/**
 * Request close OTP
 */
const requestClose = async (req, res, next) => {
    try {
        const { id } = req.params;

        const ticket = await prisma.tickets.findUnique({
            where: { id },
            include: { users_tickets_created_byTousers: true, users_tickets_behalf_user_idTousers: true }
        });

        if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
        
        const otpSetting = await prisma.system_settings.findUnique({ where: { setting_key: 'otp_enabled' } });
        const otpEnabled = otpSetting ? otpSetting.setting_value === 'true' : true;

        if (!otpEnabled) {
            return res.json({ message: 'OTP not required for closure.', otpRequired: false });
        }

        const userEmail = ticket.behalf_user_id 
            ? ticket.users_tickets_behalf_user_idTousers?.email 
            : ticket.users_tickets_created_byTousers?.email;

        if (!userEmail) return res.status(400).json({ error: 'Cannot determine user email for OTP.' });

        const otp = await createOTP(userEmail, 'ticket_closure', null, id);
        await sendOtpEmail(userEmail, otp, 'ticket_closure');

        res.json({ message: 'Closure OTP sent to the user.', email: userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') });
    } catch (error) {
        next(error);
    }
};

/**
 * Close ticket
 */
const closeTicket = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { otp, email } = req.body;

        const setting = await prisma.system_settings.findUnique({ where: { setting_key: 'otp_enabled' } });
        const otpEnabled = setting ? setting.setting_value === 'true' : true;

        if (otpEnabled) {
            if (!otp || !email) return res.status(400).json({ error: 'OTP and email are required.' });
            const otpResult = await verifyOTP(email, otp, 'ticket_closure');
            if (!otpResult.isValid) return res.status(400).json({ error: 'Invalid or expired OTP.' });
        }

        await prisma.$transaction(async (tx) => {
            const oldTicket = await tx.tickets.findUnique({ where: { id } });
            await tx.tickets.update({
                where: { id },
                data: {
                    status: 'closed',
                    closed_at: new Date(),
                    with_user_since: null,
                    updated_at: new Date()
                }
            });
            await tx.audit_logs.create({
                data: {
                    entity_type: 'ticket', entity_id: id, action: 'closed', performed_by: req.user.id,
                    old_values: { status: oldTicket.status }, new_values: { status: 'closed' }
                }
            });
        });

        const ticketInfo = await prisma.tickets.findUnique({
            where: { id },
            include: { users_tickets_created_byTousers: true, users_tickets_assigned_toTousers: true }
        });

        const emails = new Set();
        if (ticketInfo.users_tickets_created_byTousers?.email) emails.add(ticketInfo.users_tickets_created_byTousers.email);
        if (ticketInfo.users_tickets_assigned_toTousers?.email) emails.add(ticketInfo.users_tickets_assigned_toTousers.email);

        const admins = await prisma.users.findMany({ where: { role: 'admin', is_active: true } });
        admins.forEach(a => emails.add(a.email));

        for (const recipient of emails) {
            await sendTicketClosedEmail({ email: recipient, ticketNumber: ticketInfo.ticket_number, title: ticketInfo.title });
            
            const recipientUser = await prisma.users.findUnique({ where: { email: recipient } });
            if (recipientUser && recipientUser.id !== req.user.id) {
                await createNotification(recipientUser.id, 'Ticket Closed', `Ticket ${ticketInfo.ticket_number} has been closed.`, 'status_change');
            }
        }

        res.json({ message: 'Ticket closed successfully.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Submit feedback
 */
const submitFeedback = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5.' });

        const ticket = await prisma.tickets.findUnique({ where: { id } });
        if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
        if (ticket.status !== 'closed' && ticket.status !== 'resolved') {
            return res.status(400).json({ error: 'Feedback can only be submitted for resolved or closed tickets.' });
        }

        await prisma.feedback.upsert({
            where: { ticket_id: id },
            update: { rating, comment, created_at: new Date() },
            create: { ticket_id: id, user_id: req.user.id, rating, comment }
        });

        res.json({ message: 'Feedback submitted successfully.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Add item
 */
const addItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { item_name, item_type, quantity, serial_number, notes } = req.body;

        if (!item_name) return res.status(400).json({ error: 'Item name is required.' });

        await prisma.ticket_items.create({
            data: {
                ticket_id: id,
                item_name, item_type, quantity: quantity || 1, serial_number, notes, provided_by: req.user.id
            }
        });

        res.status(201).json({ message: 'Item added successfully.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Get categories
 */
const getCategories = async (req, res, next) => {
    try {
        const cats = await prisma.categories.findMany({
            where: { is_active: true },
            include: {
                subcategories: {
                    where: { is_active: true },
                    include: { teams: { select: { name: true } } }
                }
            },
            orderBy: { name: 'asc' }
        });

        const mapped = cats.map(c => ({
            id: c.id, name: c.name, description: c.description,
            subcategories: c.subcategories.map(s => ({
                id: s.id, name: s.name, description: s.description,
                assigned_team_id: s.assigned_team_id,
                assigned_team_name: s.teams?.name
            }))
        }));

        res.json({ categories: mapped });
    } catch (error) {
        next(error);
    }
};

/**
 * Get form fields
 */
const getFormFields = async (req, res, next) => {
    try {
        const { subcategoryId } = req.params;
        const fields = await prisma.form_fields.findMany({
            where: { subcategory_id: parseInt(subcategoryId) },
            orderBy: { display_order: 'asc' }
        });
        res.json({ fields });
    } catch (error) {
        next(error);
    }
};

/**
 * Set Priority
 */
const setPriority = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { priority } = req.body;
        
        if (req.user.role !== 'admin' && req.user.role !== 'team_lead') {
            return res.status(403).json({ error: 'Only Admin or Team Lead can set priority.' });
        }
        
        const validPriorities = ['low', 'medium', 'high', 'critical'];
        if (!validPriorities.includes(priority)) return res.status(400).json({ error: 'Invalid priority value.' });

        await prisma.$transaction(async (tx) => {
            await tx.tickets.update({ where: { id }, data: { priority, updated_at: new Date() } });
            await tx.ticket_interactions.create({
                data: { ticket_id: id, user_id: req.user.id, message: `Priority updated to ${priority}`, is_internal: true }
            });
        });

        res.json({ message: 'Priority updated successfully.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Reopen
 */
const reopenTicket = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin' && req.user.role !== 'team_lead') {
            return res.status(403).json({ error: 'Only Admin or Team Lead can reopen tickets.' });
        }

        const ticket = await prisma.tickets.findUnique({ where: { id } });
        if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });
        if (ticket.status !== 'closed') return res.status(400).json({ error: 'Only closed tickets can be reopened.' });

        await prisma.$transaction(async (tx) => {
            await tx.tickets.update({
                where: { id },
                data: { status: 'open', resolved_at: null, closed_at: null, updated_at: new Date() }
            });
            await tx.ticket_interactions.create({
                data: { ticket_id: id, user_id: req.user.id, message: 'Ticket reopened due to feedback or review.', is_internal: true }
            });
        });

        res.json({ message: 'Ticket has been reopened.' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTicket, getTickets, getTicketById,
    addInteraction, uploadFiles, requestClose, closeTicket,
    submitFeedback, addItem, getCategories, getFormFields,
    setPriority, reopenTicket,
};
