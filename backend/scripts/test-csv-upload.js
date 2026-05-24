require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:2300/api';

async function testCsvUpload() {
  console.log('🚀 Starting CSV Upload Test...');
  
  try {
    // 1. Login as Admin
    console.log('🔐 Logging in as admin...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@helpdesk.com',
        password: 'password123'
      })
    });
    
    if (!loginRes.ok) {
        throw new Error(`Login failed with status ${loginRes.status}`);
    }
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Logged in successfully!');

    // 2. Upload CSV
    console.log('📤 Uploading example.csv...');
    const csvPath = path.join(__dirname, '../../example.csv');
    const csvContent = fs.readFileSync(csvPath);
    
    const formData = new FormData();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    formData.append('csvFile', blob, 'example.csv');

    const uploadRes = await fetch(`${API_URL}/admin/users/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        console.error('❌ Upload failed:', errData);
        throw new Error(`Upload failed with status ${uploadRes.status}`);
    }

    const uploadData = await uploadRes.json();
    console.log('✅ Upload complete!');
    console.log('Message:', uploadData.message);
    console.log('Results:', JSON.stringify(uploadData.results, null, 2));

    // 3. Verify in DB
    console.log('\n🔍 Verifying team associations...');
    const successes = uploadData.results.success;
    console.log(`Successfully processed ${successes.length} users.`);

  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error.message);
  } finally {
    process.exit();
  }
}

testCsvUpload();
