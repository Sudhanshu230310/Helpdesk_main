const cron = require('node-cron');
const { prisma } = require('../config/db');
const { calculateBusinessHours } = require('../utils/businessHours');

const startCronJobs = () => {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Running escalation check...');
        try {
            // Find all open/in_progress tickets
            const tickets = await prisma.tickets.findMany({
                where: { status: { in: ['open', 'in_progress'] } },
                include: { subcategories: true, teams: true }
            });

            for (const ticket of tickets) {
                const limit = ticket.subcategories?.escalation_hours || 48; // Default 48 hrs
                
                // Calculate lapsed business hours
                const hours = await calculateBusinessHours(ticket.created_at, new Date());

                if (hours > limit) {
                    const teamLeadId = ticket.teams?.team_lead_id;

                    // Escalate to team lead if they aren't already assigned
                    if (teamLeadId && ticket.assigned_to !== teamLeadId) {
                        await prisma.$transaction(async (tx) => {
                            await tx.tickets.update({
                                where: { id: ticket.id },
                                data: {
                                    assigned_to: teamLeadId,
                                    priority: 'high',
                                    updated_at: new Date()
                                }
                            });
                            
                            await tx.ticket_interactions.create({
                                data: {
                                    ticket_id: ticket.id,
                                    user_id: teamLeadId,
                                    message: 'Ticket automatically escalated due to SLA breach.',
                                    is_internal: true
                                }
                            });
                        });
                        console.log(`[CRON] Ticket ${ticket.id} escalated to Team Lead.`);
                    }
                }
            }
        } catch (error) {
            console.error('[CRON] Escalation error:', error);
        }
    });
};

module.exports = { startCronJobs };
