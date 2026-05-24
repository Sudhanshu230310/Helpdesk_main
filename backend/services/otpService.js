// ============================================================
// OTP Service — Generate, store, and verify OTPs using Prisma
// ============================================================
const { prisma } = require('../config/db');

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create and store an OTP in the database
 * @param {string} email
 * @param {string} purpose - 'registration' or 'ticket_closure'
 * @param {string|null} userId
 * @param {string|null} ticketId
 * @returns {Promise<string>} The generated OTP code
 */
const createOTP = async (email, purpose, userId = null, ticketId = null) => {
    const otp = generateOTP();

    await prisma.$transaction(async (tx) => {
        // Invalidate previous unused OTPs of same purpose for this email
        await tx.otp_verifications.updateMany({
            where: {
                email,
                purpose,
                is_used: false,
            },
            data: {
                is_used: true,
            },
        });

        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        // Create new
        await tx.otp_verifications.create({
            data: {
                email,
                otp_code: otp,
                purpose,
                user_id: userId,
                ticket_id: ticketId,
                expires_at: expiresAt,
            },
        });
    });

    return otp;
};

/**
 * Verify an OTP from the database
 * @param {string} email
 * @param {string} otpCode
 * @param {string} purpose
 * @returns {Promise<{isValid: boolean, userId: string|null, ticketId: string|null}>}
 */
const verifyOTP = async (email, otpCode, purpose) => {
    const otpRecord = await prisma.otp_verifications.findFirst({
        where: {
            email,
            otp_code: otpCode,
            purpose,
            is_used: false,
            expires_at: {
                gt: new Date(),
            },
        },
        orderBy: {
            created_at: 'desc',
        },
    });

    if (!otpRecord) {
        return { isValid: false, userId: null, ticketId: null };
    }

    // Mark as used
    await prisma.otp_verifications.update({
        where: { id: otpRecord.id },
        data: { is_used: true },
    });

    return {
        isValid: true,
        userId: otpRecord.user_id,
        ticketId: otpRecord.ticket_id,
    };
};

module.exports = { generateOTP, createOTP, verifyOTP };
