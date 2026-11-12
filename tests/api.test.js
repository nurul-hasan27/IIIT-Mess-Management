/**
 * IIIT Bhubaneswar Mess Management System
 * Comprehensive End-to-End API & Integration Test Suite
 */

const http = require('http');
const app = require('../server/server');
const db = require('../server/config/database');

let server;
let port;
let baseUrl;

// Helper to keep cookies across requests (session support)
class SessionAgent {
  constructor() {
    this.cookies = '';
  }

  async request(path, options = {}) {
    const url = `${baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers
    };

    if (this.cookies) {
      headers['Cookie'] = this.cookies;
    }

    const res = await fetch(url, {
      ...options,
      headers
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      this.cookies = setCookie.split(';')[0];
    }

    let body;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }

    return { status: res.status, ok: res.ok, body, headers: res.headers };
  }

  get(path, query = {}) {
    const q = new URLSearchParams(query).toString();
    const fullPath = path + (q ? (path.includes('?') ? '&' : '?') + q : '');
    return this.request(fullPath, { method: 'GET' });
  }

  post(path, data) {
    return this.request(path, { method: 'POST', body: JSON.stringify(data) });
  }

  put(path, data) {
    return this.request(path, { method: 'PUT', body: JSON.stringify(data) });
  }

  delete(path) {
    return this.request(path, { method: 'DELETE' });
  }
}

async function runTests() {
  console.log('====================================================');
  console.log(' STARTING IIIT MESS MANAGEMENT COMPREHENSIVE TESTS');
  console.log('====================================================\n');

  // Start test server on random open port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`[Test Harness] Running test server at ${baseUrl}\n`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✕ FAILED: ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Student Registration
    // -------------------------------------------------------------
    console.log('[Test 1] Student Registration');
    const studentAgent = new SessionAgent();
    const testRoll = `TEST${Date.now().toString().slice(-4)}`;
    const testEmail = `test.${testRoll.toLowerCase()}@iiit-bh.ac.in`;

    const regRes = await studentAgent.post('/api/auth/register', {
      full_name: 'Test Candidate Student',
      student_id: testRoll,
      email: testEmail,
      department: 'CSE',
      year_of_study: 3,
      hostel_room: 'Hostel-1, Room 999',
      phone: '+91 99999 88888',
      password: 'TestPassword@123',
      confirm_password: 'TestPassword@123'
    });

    assert(regRes.status === 201, `Registration returned HTTP 201 (Got ${regRes.status})`);
    assert(regRes.body.user && regRes.body.user.student_id === testRoll, 'User session initialized with registered student ID');

    // -------------------------------------------------------------
    // Test 2: Student Login
    // -------------------------------------------------------------
    console.log('\n[Test 2] Student Login');
    const studentLoginRes = await studentAgent.post('/api/auth/login', {
      identifier: testEmail,
      password: 'TestPassword@123'
    });
    assert(studentLoginRes.status === 200, 'Student login succeeded with 200');
    assert(studentLoginRes.body.user.role === 'student', 'Logged in user role is student');

    // -------------------------------------------------------------
    // Test 3: Admin Login
    // -------------------------------------------------------------
    console.log('\n[Test 3] Admin Login');
    const adminAgent = new SessionAgent();
    const adminLoginRes = await adminAgent.post('/api/auth/login', {
      identifier: 'admin@iiit-bh.ac.in',
      password: 'Admin@123'
    });
    assert(adminLoginRes.status === 200, 'Admin login succeeded with 200');
    assert(adminLoginRes.body.user.role === 'admin', 'Logged in user role is admin');

    // -------------------------------------------------------------
    // Test 4: Staff Login
    // -------------------------------------------------------------
    console.log('\n[Test 4] Staff Login');
    const staffAgent = new SessionAgent();
    const staffLoginRes = await staffAgent.post('/api/auth/login', {
      identifier: 'staff1@iiit-bh.ac.in',
      password: 'Staff@123'
    });
    assert(staffLoginRes.status === 200, 'Staff login succeeded with 200');
    assert(staffLoginRes.body.user.role === 'staff', 'Logged in user role is staff');

    // -------------------------------------------------------------
    // Test 5: Logout
    // -------------------------------------------------------------
    console.log('\n[Test 5] Logout');
    const logoutRes = await studentAgent.post('/api/auth/logout');
    assert(logoutRes.status === 200, 'Logout returned HTTP 200');
    const meRes = await studentAgent.get('/api/auth/me');
    assert(meRes.status === 401, 'Subsequent request to /api/auth/me returns 401 Unauthorized');

    // Re-login student for remaining student workflows
    await studentAgent.post('/api/auth/login', {
      identifier: testEmail,
      password: 'TestPassword@123'
    });

    // -------------------------------------------------------------
    // Test 6: Unauthorized Route Protection
    // -------------------------------------------------------------
    console.log('\n[Test 6] Unauthorized & Role-Based Route Protection');
    const unauthAgent = new SessionAgent();
    const unauthRes = await unauthAgent.get('/api/students');
    assert(unauthRes.status === 401, 'Unauthenticated request to admin endpoint returns 401');

    const forbiddenRes = await studentAgent.get('/api/students');
    assert(forbiddenRes.status === 403, 'Student requesting admin endpoint returns 403 Forbidden');

    // -------------------------------------------------------------
    // Test 7: Student Dashboard Loading
    // -------------------------------------------------------------
    console.log('\n[Test 7] Student Dashboard Loading');
    const studentDash = await studentAgent.get('/api/dashboard/student');
    assert(studentDash.status === 200, 'Student dashboard endpoint returns 200');
    assert(typeof studentDash.body.stats?.currentMonthBill === 'number', 'Stats contains currentMonthBill');
    assert(Array.isArray(studentDash.body.todayMenus), 'todayMenus is an array');

    // -------------------------------------------------------------
    // Test 8: Menu Creation (Admin)
    // -------------------------------------------------------------
    console.log('\n[Test 8] Menu Creation');
    const testMenuDate = '2026-12-01';
    const menuCreateRes = await adminAgent.post('/api/menus', {
      date: testMenuDate,
      meal_type: 'lunch',
      title: 'Automated Test Kashmiri Feast',
      serving_time: '12:30 PM - 02:30 PM',
      is_special: 1,
      items: ['Kashmiri Dum Aloo', 'Jeera Pulao', 'Phulka', 'Fruit Custard']
    });
    assert(menuCreateRes.status === 201, 'Menu created successfully with 201');
    const createdMenuId = menuCreateRes.body.menuId;
    assert(createdMenuId > 0, `Returned valid menuId: ${createdMenuId}`);

    // -------------------------------------------------------------
    // Test 9: Menu Editing (Admin)
    // -------------------------------------------------------------
    console.log('\n[Test 9] Menu Editing');
    const menuEditRes = await adminAgent.put(`/api/menus/${createdMenuId}`, {
      title: 'Updated Kashmiri Feast Deluxe',
      serving_time: '12:00 PM - 02:30 PM',
      items: ['Kashmiri Dum Aloo', 'Jeera Pulao', 'Phulka', 'Saffron Kheer']
    });
    assert(menuEditRes.status === 200, 'Menu updated successfully with 200');

    // -------------------------------------------------------------
    // Test 10: Menu Deletion (Admin)
    // -------------------------------------------------------------
    console.log('\n[Test 10] Menu Deletion');
    const menuDelRes = await adminAgent.delete(`/api/menus/${createdMenuId}`);
    assert(menuDelRes.status === 200, 'Menu deleted successfully with 200');

    // -------------------------------------------------------------
    // Test 11: Student Feedback Submission
    // -------------------------------------------------------------
    console.log('\n[Test 11] Student Feedback Submission');
    const fbRes = await studentAgent.post('/api/feedback', {
      date: new Date().toISOString().slice(0, 10),
      meal_type: 'lunch',
      food_quality_rating: 5,
      taste_rating: 5,
      hygiene_rating: 5,
      quantity_rating: 4,
      overall_rating: 5,
      comments: 'Automated test: Food quality was excellent today!'
    });
    assert(fbRes.status === 201, 'Feedback saved with 201');

    // -------------------------------------------------------------
    // Test 12: Complaint Submission (Student)
    // -------------------------------------------------------------
    console.log('\n[Test 12] Complaint Submission');
    const compRes = await studentAgent.post('/api/complaints', {
      category: 'Food Quality',
      subject: 'Test complaint: Dal was oversalted',
      description: 'The dal during lunch had excess salt. Please verify seasoning before serving.',
      priority: 'Medium'
    });
    assert(compRes.status === 201, 'Complaint created with 201');
    assert(compRes.body.ticketNumber && compRes.body.ticketNumber.startsWith('CMP-'), 'Valid ticket number generated');
    const complaintId = compRes.body.complaintId;

    // -------------------------------------------------------------
    // Test 13: Complaint Status Update (Admin / Staff)
    // -------------------------------------------------------------
    console.log('\n[Test 13] Complaint Status Update');
    const compUpdateRes = await adminAgent.put(`/api/complaints/${complaintId}`, {
      status: 'Resolved',
      resolution_notes: 'Spoke to chef; salt ratio corrected across kitchen batches.'
    });
    assert(compUpdateRes.status === 200, 'Complaint status updated with 200');

    // -------------------------------------------------------------
    // Test 14: Meal Attendance Marking
    // -------------------------------------------------------------
    console.log('\n[Test 14] Meal Attendance Marking & Duplication Prevention');
    const todayStr = new Date().toISOString().slice(0, 10);
    const attRes = await staffAgent.post('/api/attendance', {
      date: todayStr,
      meal_type: 'dinner',
      student_id: studentLoginRes.body.user.id,
      status: 'present'
    });
    assert(attRes.status === 200, 'Attendance marked with 200');

    // Ensure duplicate mark replaces/updates cleanly without SQL error
    const attDupRes = await staffAgent.post('/api/attendance', {
      date: todayStr,
      meal_type: 'dinner',
      student_id: studentLoginRes.body.user.id,
      status: 'absent'
    });
    assert(attDupRes.status === 200, 'Subsequent attendance update handled cleanly without constraint error');

    // -------------------------------------------------------------
    // Test 15: Batch Bill Generation
    // -------------------------------------------------------------
    console.log('\n[Test 15] Bill Generation');
    const testBillingMonth = '2026-12';
    const genRes = await adminAgent.post('/api/bills/generate', {
      billing_month: testBillingMonth,
      base_rate: 3800,
      due_date: `${testBillingMonth}-20`
    });
    assert(genRes.status === 200, 'Batch billing executed with 200');
    assert(genRes.body.generatedCount > 0, `Generated bills count: ${genRes.body.generatedCount}`);

    // -------------------------------------------------------------
    // Test 16: Payment Recording
    // -------------------------------------------------------------
    console.log('\n[Test 16] Payment Recording');
    const testPayRef = `TEST-TXN-${Date.now()}`;
    const payRes = await studentAgent.post('/api/bills/payments', {
      amount: 1500,
      payment_method: 'UPI',
      transaction_reference: testPayRef,
      notes: 'Test partial mess fee payment'
    });
    assert(payRes.status === 201, 'Payment recorded with 201');
    assert(payRes.body.receiptNumber && payRes.body.receiptNumber.startsWith('REC-'), 'Receipt number generated');

    // Check duplicate payment reference prevention
    const payDupRes = await studentAgent.post('/api/bills/payments', {
      amount: 1500,
      payment_method: 'UPI',
      transaction_reference: testPayRef
    });
    assert(payDupRes.status === 409, 'Duplicate transaction reference correctly rejected with 409 Conflict');

    // -------------------------------------------------------------
    // Test 17: Expense Creation & Breakdown (Admin)
    // -------------------------------------------------------------
    console.log('\n[Test 17] Expense Creation');
    const expRes = await adminAgent.post('/api/expenses', {
      title: 'Automated Test: Mustard Oil Tins Procurement',
      category: 'Cooking Supplies',
      amount: 8500,
      expense_date: todayStr,
      vendor_name: 'Test Oil Mill Supplies',
      invoice_number: 'INV-TEST-001'
    });
    assert(expRes.status === 201, 'Expense created with 201');

    // -------------------------------------------------------------
    // Test 18: Announcement Publication
    // -------------------------------------------------------------
    console.log('\n[Test 18] Announcement Publication');
    const annRes = await adminAgent.post('/api/announcements', {
      title: 'Automated Test: Mess Committee Meeting',
      description: 'Monthly student dining committee meeting in Conference Room 2.',
      priority: 'High'
    });
    assert(annRes.status === 201, 'Announcement broadcasted with 201');

    // -------------------------------------------------------------
    // Test 19: Notification Reading
    // -------------------------------------------------------------
    console.log('\n[Test 19] Notifications Reading');
    const notifRes = await studentAgent.get('/api/notifications');
    assert(notifRes.status === 200, 'Notifications retrieved with 200');
    assert(Array.isArray(notifRes.body.notifications), 'Notifications list is an array');

    const readAllRes = await studentAgent.put('/api/notifications/read-all');
    assert(readAllRes.status === 200, 'Mark all notifications as read succeeded with 200');

    // -------------------------------------------------------------
    // Test 20: Search and Filtering
    // -------------------------------------------------------------
    console.log('\n[Test 20] Search and Filtering');
    const filterRes = await adminAgent.get('/api/students', { search: testRoll });
    assert(filterRes.status === 200, 'Student search returned 200');
    assert(filterRes.body.students.length === 1, `Search by roll number returned exactly 1 student`);

    // -------------------------------------------------------------
    // Test 21: Database Persistence Verification
    // -------------------------------------------------------------
    console.log('\n[Test 21] Database Relational Integrity & Persistence');
    const testUserInDb = db.prepare('SELECT * FROM users WHERE student_id = ?').get(testRoll);
    assert(testUserInDb && testUserInDb.email === testEmail, 'User record physically verified in SQLite database file');

    const totalStudentsInDb = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
    assert(totalStudentsInDb >= 23, `Active student records in SQLite: ${totalStudentsInDb}`);

  } catch (err) {
    console.error('\nFatal test runner error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
  }

  console.log('\n====================================================');
  console.log(` TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
