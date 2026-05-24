require('dotenv').config();
const { sendOtpEmail } = require('../services/emailService');

async function testOtpEmail() {
  console.log('🚀 Starting OTP Email Service Test...');
  
  const testEmail = process.env.SMTP_USER;
  const testOtp = '123456';
  const purpose = 'registration';

  console.log(`📧 Sending OTP ${testOtp} to ${testEmail} for ${purpose}...`);

  try {
    const result = await sendOtpEmail(testEmail, testOtp, purpose);

    if (result.error) {
      console.error('❌ Failed to send OTP email:', result.error);
    } else {
      console.log('✅ OTP Email sent successfully!');
      console.log('Message ID:', result.messageId);
    }
  } catch (error) {
    console.error('💥 Critical error during OTP email test:');
    console.error(error);
  } finally {
    process.exit();
  }
}

testOtpEmail();
