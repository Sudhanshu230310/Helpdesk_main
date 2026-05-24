// ============================================================
// Technician Controller — Ticket management for technicians
// ============================================================
const { prisma } = require('../config/db');
const { createOTP } = require('../services/otpService');
const { sendTicketUpdatedEmail, sendResolvedEmail } = require('../services/emailService');
const { createNotification } = require('./notificationController');

/**
 * Get tickets assigned to the technician
 * GET /api/technicians/tickets
 */
const getMyTickets = async (req, res, next) => {
    try {
        const { status, category_id, search, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {
            assigned_to: req.user.id
        };

        if (status) where.status = status;
        if (category_id) where.category_id = parseInt(category_id);
        
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { ticket_number: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [totalCount, tickets] = await Promise.all([
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
                total: totalCount,
                pages: Math.ceil(totalCount / take),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Assign/reassign a ticket to a technician
 * PUT /api/technicians/tickets/:id/assign
 */
const assignTicket = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { assigned_to } = req.body;

        if (!assigned_to) {
            return res.status(400).json({ error: 'assigned_to (technician ID) is required.' });
        }

        const currentTicket = await prisma.tickets.findUnique({ where: { id } });
        if (!currentTicket) return res.status(404).json({ error: 'Ticket not found.' });

        if (req.user.role === 'technician' && currentTicket.assigned_to) {
            return res.status(403).json({ error: 'Technicians are not authorized to reassign already assigned tickets.' });
        }

        await prisma.$transaction(async (tx) => {
            const oldAssigned = currentTicket.assigned_to;
            await tx.tickets.update({
                where: { id },
                data: {
                    assigned_to,
                    status: 'in_progress',
                    with_user_since: null,
                    updated_at: new Date()
                }
            });
            await tx.audit_logs.create({
                data: {
                    entity_type: 'ticket',
                    entity_id: id,
                    action: 'assigned',
                    performed_by: req.user.id,
                    old_values: { assigned_to: oldAssigned },
                    new_values: { assigned_to }
                }
            });
        });

        const refreshedTicket = await prisma.tickets.findUnique({
            where: { id },
            include: { users_tickets_assigned_toTousers: true, users_tickets_created_byTousers: true }
        });

        if (refreshedTicket.users_tickets_assigned_toTousers?.email) {
            await sendTicketUpdatedEmail({
                email: refreshedTicket.users_tickets_assigned_toTousers.email,
                ticketNumber: refreshedTicket.ticket_number,
                title: refreshedTicket.title,
                status: 'Assigned to you',
                updatedBy: req.user.name,
            });
            await createNotification(assigned_to, 'Ticket Assigned', `Ticket ${refreshedTicket.ticket_number} has been assigned to you.`, 'assignment');
        }
        if (refreshedTicket.users_tickets_created_byTousers?.email) {
            await sendTicketUpdatedEmail({
                email: refreshedTicket.users_tickets_created_byTousers.email,
                ticketNumber: refreshedTicket.ticket_number,
                title: refreshedTicket.title,
                status: 'Assigned to technician',
                updatedBy: req.user.name,
            });
            await createNotification(refreshedTicket.created_by, 'Technician Assigned', `A technician has been assigned to your ticket ${refreshedTicket.ticket_number}.`, 'assignment');
        }

        res.json({ message: 'Ticket assigned successfully.' });
    } catch (error) {
        next(error);
    }
};

/**
 * Update ticket status
 * PUT /api/technicians/tickets/:id/status
 */
const updateTicketStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['open', 'in_progress', 'with_user', 'resolved'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}.` });
        }

        const ticket = await prisma.tickets.findUnique({
            where: { id },
            include: { users_tickets_created_byTousers: true, users_tickets_behalf_user_idTousers: true, users_tickets_assigned_toTousers: true }
        });

        if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

        await prisma.$transaction(async (tx) => {
            const oldStatus = ticket.status;
            await tx.tickets.update({
                where: { id },
                data: {
                    status,
                    with_user_since: status === 'with_user' ? new Date() : null,
                    resolved_at: status === 'resolved' ? new Date() : ticket.resolved_at,
                    updated_at: new Date()
                }
            });
            await tx.audit_logs.create({
                data: {
                    entity_type: 'ticket', entity_id: id, action: 'status_changed', performed_by: req.user.id,
                    old_values: { status: oldStatus }, new_values: { status }
                }
            });
        });

        let otpSent = false;
        let otpEmail = '';

        const otpSetting = await prisma.system_settings.findUnique({ where: { setting_key: 'otp_enabled' } });
        const otpEnabled = otpSetting ? otpSetting.setting_value === 'true' : true;

        if (status === 'resolved') {
            const userEmail = ticket.behalf_user_id 
                ? ticket.users_tickets_behalf_user_idTousers?.email 
                : ticket.users_tickets_created_byTousers?.email;
            
            const userName = ticket.behalf_user_id 
                ? ticket.users_tickets_behalf_user_idTousers?.name 
                : ticket.users_tickets_created_byTousers?.name;

            if (userEmail) {
                if (otpEnabled) {
                    const otp = await createOTP(userEmail, 'ticket_closure', null, id);
                    await sendResolvedEmail({
                        email: userEmail,
                        ticketNumber: ticket.ticket_number,
                        title: ticket.title,
                        otp,
                        userName,
                    });
                    await createNotification(ticket.behalf_user_id || ticket.created_by, 'Ticket Resolved', `Your ticket ${ticket.ticket_number} has been resolved. OTP sent to your email.`, 'status_change');
                    otpSent = true;
                    otpEmail = userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3');
                } else {
                    // Send resolution email WITHOUT OTP
                    await sendResolvedEmail({
                        email: userEmail,
                        ticketNumber: ticket.ticket_number,
                        title: ticket.title,
                        otp: null,
                        userName,
                    });
                    await createNotification(ticket.behalf_user_id || ticket.created_by, 'Ticket Resolved', `Your ticket ${ticket.ticket_number} has been resolved.`, 'status_change');
                }
            }
        }

        const notifyEmails = new Set();
        if (ticket.users_tickets_created_byTousers?.email) notifyEmails.add(ticket.users_tickets_created_byTousers.email);
        if (ticket.users_tickets_assigned_toTousers?.email) notifyEmails.add(ticket.users_tickets_assigned_toTousers.email);
        notifyEmails.delete(req.user.email);

        if (status !== 'resolved') {
            for (const email of notifyEmails) {
                await sendTicketUpdatedEmail({
                    email,
                    ticketNumber: ticket.ticket_number,
                    title: ticket.title,
                    status: status.replace('_', ' '),
                    updatedBy: req.user.name,
                });

                const recipientUser = await prisma.users.findUnique({ where: { email } });
                if (recipientUser) {
                    await createNotification(recipientUser.id, 'Status Updated', `Ticket ${ticket.ticket_number} status changed to ${status.replace('_', ' ')}.`, 'status_change');
                }
            }
        }

        const responseData = { message: `Ticket status updated to "${status}".` };
        if (otpSent) {
            responseData.otpSent = true;
            responseData.otpEmail = otpEmail;
        }
        res.json(responseData);
    } catch (error) {
        next(error);
    }
};

/**
 * Get team members
 * GET /api/technicians/team-members
 */
const getTeamMembers = async (req, res, next) => {
    try {
        const tMembers = await prisma.team_members.findMany({
            where: { users: { role: { in: ['technician', 'admin', 'team_lead'] }, is_active: true } },
            include: { users: true, teams: true },
            orderBy: [{ teams: { name: 'asc' } }, { users: { name: 'asc' } }]
        });

        const members = tMembers.map(m => ({
            id: m.users.id,
            name: m.users.name,
            email: m.users.email,
            department: m.users.department,
            team_name: m.teams.name
        }));

        res.json({ members });
    } catch (error) {
        next(error);
    }
};

module.exports = { getMyTickets, assignTicket, updateTicketStatus, getTeamMembers };
