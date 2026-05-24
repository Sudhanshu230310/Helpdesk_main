require('dotenv').config();
const path = require('path');

const API_URL = 'http://localhost:2300/api';

async function testVisibility() {
  console.log('🚀 Starting Technician Visibility Test...');
  
  try {
    // 1. Login as Suresh (Technician)
    console.log('🔐 Logging in as Suresh...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: '2023csb1152+4@iitrpr.ac.in',
        password: 'password123'
      })
    });
    
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Logged in as Suresh!');

    // 2. Get Tickets
    console.log('📬 Fetching tickets for Suresh...');
    const res = await fetch(`${API_URL}/tickets`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error(`Fetch tickets failed: ${res.status}`);
    const data = await res.json();
    
    console.log(`✅ Suresh can see ${data.tickets.length} ticket(s).`);
    data.tickets.forEach(t => {
        console.log(`- [${t.ticket_number}] ${t.title} | Assigned to: ${t.assignee_name}`);
    });

    const anyNotSuresh = data.tickets.some(t => t.assignee_name !== 'suresh');
    if (anyNotSuresh) {
        console.error('❌ BUG: Suresh can see tickets not assigned to him!');
    } else {
        console.log('✅ SUCCESS: Suresh only sees his assigned tickets.');
    }

  } catch (error) {
    console.error('❌ Test failed:');
    console.error(error.message);
  } finally {
    process.exit();
  }
}

testVisibility();
