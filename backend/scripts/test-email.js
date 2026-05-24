require('dotenv').config();
const transporter = require('../config/email');
const { sendEmail } = require('../services/emailService');

async function testEmail() {
  console.log('🚀 Starting Email Service Test...');
  console.log('SMTP Config:');
  console.log('- Host:', process.env.SMTP_HOST);
  console.log('- Port:', process.env.SMTP_PORT);
  console.log('- User:', process.env.SMTP_USER);
  console.log('- From:', process.env.SMTP_FROM);

  try {
    // 1. Verify connection
    console.log('\n🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection is successful!');

    // 2. Send test email
    const testRecipient = process.env.SMTP_USER; // Sending to self for test
    console.log(`\n📧 Sending test email to: ${testRecipient}...`);
    
    const result = await sendEmail({
      to: testRecipient,
      subject: '🧪 Helpdesk Email Service Test',
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #f4f4f4; border-radius: 10px;">
          <h2 style="color: #2c3e50;">Email Service Test</h2>
          <p>This is a test email sent from the Helpdesk project to verify that the email service is working correctly.</p>
          <hr>
          <p style="font-size: 12px; color: #7f8c8d;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `,
    });

    if (result.error) {
      console.error('❌ Failed to send email:', result.error);
    } else {
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', result.messageId);
    }
  } catch (error) {
    console.error('💥 Critical error during email test:');
    console.error(error);
  } finally {
    process.exit();
  }
}

testEmail();
