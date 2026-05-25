// ============================================================
// Email Service — Send notifications
// ============================================================
const transporter = require('../config/email');
const { prisma } = require('../config/db');

const SMTP_CONFIGURED = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

/**
 * Send an email (or log it if SMTP not configured)
 * Checks user preference unless isCritical is true.
 */
const sendEmail = async ({ to, subject, html, isCritical = false }) => {
  // Check preference if not critical
  if (!isCritical) {
    try {
      const user = await prisma.users.findUnique({ where: { email: to } });
      if (user && user.email_notifications_enabled === false) {
        console.log(`🔕 Email skipped for ${to} (User opted out).`);
        return { messageId: 'opt-out', skipped: true };
      }
    } catch (prefErr) {
      console.error('Error checking user email preference:', prefErr.message);
    }
  }

  if (!SMTP_CONFIGURED) {
    console.log(`📧 [EMAIL LOG] To: ${to} | Subject: ${subject}`);
    return { messageId: 'log-only', logged: true };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'Helpdesk <noreply@helpdesk.com>',
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    // Don't throw — emails shouldn't break the flow
    return { error: error.message };
  }
};

/**
 * Send OTP verification email
 */
const sendOtpEmail = async (email, otp, purpose = 'registration') => {
  const purposeText = purpose === 'registration'
    ? 'complete your registration'
    : 'close your ticket';

  return sendEmail({
    to: email,
    subject: `Helpdesk — OTP Verification (${otp})`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; background: #f8f9fa; border-radius: 12px;">
        <h2 style="color: #1a1a2e; margin-bottom: 10px;">OTP Verification</h2>
        <p style="color: #444;">Use the following OTP to ${purposeText}:</p>
        <div style="background: #1a1a2e; color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 13px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #aaa; font-size: 12px;">— Helpdesk Support System</p>
      </div>
    `,
    isCritical: true,
  });
};

/**
 * Send ticket created notification
 */
const sendTicketCreatedEmail = async ({ email, ticketNumber, title, userName }) => {
  return sendEmail({
    to: email,
    subject: `Helpdesk — Ticket Created: ${ticketNumber}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; background: #f8f9fa; border-radius: 12px;">
        <h2 style="color: #1a1a2e;">Ticket Created</h2>
        <p style="color: #444;">Hello ${userName},</p>
        <p style="color: #444;">Your ticket has been created successfully.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr><td style="padding: 8px; color: #888; border-bottom: 1px solid #eee;">Ticket #</td><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">${ticketNumber}</td></tr>
          <tr><td style="padding: 8px; color: #888;">Subject</td><td style="padding: 8px;">${title}</td></tr>
        </table>
        <p style="color: #444;">Our team will review and assign it shortly.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #aaa; font-size: 12px;">— Helpdesk Support System</p>
      </div>
    `,
  });
};

/**
 * Send ticket updated notification
 */
const sendTicketUpdatedEmail = async ({ email, ticketNumber, title, status, updatedBy }) => {
  return sendEmail({
    to: email,
    subject: `Helpdesk — Ticket Updated: ${ticketNumber}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; background: #f8f9fa; border-radius: 12px;">
        <h2 style="color: #1a1a2e;">Ticket Updated</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr><td style="padding: 8px; color: #888; border-bottom: 1px solid #eee;">Ticket #</td><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">${ticketNumber}</td></tr>
          <tr><td style="padding: 8px; color: #888; border-bottom: 1px solid #eee;">Subject</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${title}</td></tr>
          <tr><td style="padding: 8px; color: #888; border-bottom: 1px solid #eee;">New Status</td><td style="padding: 8px; font-weight: bold; color: #e67e22; border-bottom: 1px solid #eee;">${status}</td></tr>
          <tr><td style="padding: 8px; color: #888;">Updated By</td><td style="padding: 8px;">${updatedBy}</td></tr>
        </table>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #aaa; font-size: 12px;">— Helpdesk Support System</p>
      </div>
    `,
  });
};

/**
 * Send ticket closed notification
 */
const sendTicketClosedEmail = async ({ email, ticketNumber, title }) => {
  return sendEmail({
    to: email,
    subject: `Helpdesk — Ticket Closed: ${ticketNumber}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; background: #f8f9fa; border-radius: 12px;">
        <h2 style="color: #27ae60;">Ticket Closed</h2>
        <p style="color: #444;">The following ticket has been closed:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr><td style="padding: 8px; color: #888; border-bottom: 1px solid #eee;">Ticket #</td><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">${ticketNumber}</td></tr>
          <tr><td style="padding: 8px; color: #888;">Subject</td><td style="padding: 8px;">${title}</td></tr>
        </table>
        <p style="color: #444;">Thank you for using the Helpdesk system. We appreciate your feedback!</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #aaa; font-size: 12px;">— Helpdesk Support System</p>
      </div>
    `,
  });
};

/**
 * Send ticket created notification to admin
 */
const sendTicketCreatedAdminEmail = async ({ email, ticketNumber, title, userName }) => {
  return sendEmail({
    to: email,
    subject: `Helpdesk — New Ticket Raised: ${ticketNumber}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; background: #f8f9fa; border-radius: 12px;">
        <h2 style="color: #1a1a2e;">📋 New Ticket Raised</h2>
        <p style="color: #444;">A new ticket has been raised by <strong>${userName}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr><td style="padding: 8px; color: #888; border-bottom: 1px solid #eee;">Ticket #</td><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">${ticketNumber}</td></tr>
          <tr><td style="padding: 8px; color: #888;">Subject</td><td style="padding: 8px;">${title}</td></tr>
        </table>
        <p style="color: #444;">Please review and assign it to the appropriate team.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #aaa; font-size: 12px;">— Helpdesk Support System</p>
      </div>
    `,
  });
};

/**
 * Send resolved notification with OTP to user
 */
const sendResolvedEmail = async ({ email, ticketNumber, title, otp, userName }) => {
  return sendEmail({
    to: email,
    subject: `Helpdesk — Ticket Resolved: ${ticketNumber} — Verification Required`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; background: #f8f9fa; border-radius: 12px;">
        <h2 style="color: #27ae60;">Ticket Resolved</h2>
        <p style="color: #444;">Hello ${userName || 'User'},</p>
        <p style="color: #444;">Your ticket <strong>${ticketNumber}</strong> — "<em>${title}</em>" has been marked as resolved by the technician.</p>
        <p style="color: #444;">Please share the following <strong>verification OTP</strong> with the technician to confirm closure:</p>
        <div style="background: #1a1a2e; color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 13px;">This OTP is valid for 10 minutes.</p>
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #856404; margin: 0; font-size: 14px;"><strong>📝 We'd love your feedback!</strong></p>
          <p style="color: #856404; margin: 5px 0 0; font-size: 13px;">After the ticket is closed, please log in to the Helpdesk portal and submit your feedback on the ticket page.</p>
        </div>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #aaa; font-size: 12px;">— Helpdesk Support System</p>
      </div>
    `,
  });
};

/**
 * Send welcome email to admin-created user
 */
const sendWelcomeEmail = async ({ email, name, tempPassword, role }) => {
  return sendEmail({
    to: email,
    subject: 'Helpdesk — Your Account Has Been Created',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; background: #f8f9fa; border-radius: 12px;">
        <h2 style="color: #1a1a2e;">Welcome to Helpdesk</h2>
        <p style="color: #444;">Hello ${name},</p>
        <p style="color: #444;">An account has been created for you on the Helpdesk system. Here are your login credentials:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr><td style="padding: 8px; color: #888; border-bottom: 1px solid #eee;">Email</td><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">${email}</td></tr>
          <tr><td style="padding: 8px; color: #888; border-bottom: 1px solid #eee;">Temporary Password</td><td style="padding: 8px; font-weight: bold; color: #e74c3c; border-bottom: 1px solid #eee;">${tempPassword}</td></tr>
          <tr><td style="padding: 8px; color: #888;">Role</td><td style="padding: 8px; text-transform: capitalize;">${role}</td></tr>
        </table>
        <p style="color: #e74c3c; font-size: 13px; font-weight: bold;">⚠️ Please change your password after your first login.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #aaa; font-size: 12px;">— Helpdesk Support System</p>
      </div>
    `,
    isCritical: true,
  });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendTicketCreatedEmail,
  sendTicketUpdatedEmail,
  sendTicketClosedEmail,
  sendTicketCreatedAdminEmail,
  sendResolvedEmail,
  sendWelcomeEmail,
};
