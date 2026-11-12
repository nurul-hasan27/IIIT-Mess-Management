const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { initDatabase } = require('./init');
const { formatDate, getTodayString } = require('../utils/date');

function getRelativeDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return formatDate(d);
}

function seedDatabase(force = false) {
  initDatabase();

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0 && !force) {
    console.log('[Seed] Database already contains users. Skipping seed.');
    return;
  }

  if (force) {
    console.log('[Seed] Forcing re-seed. Clearing existing data...');
    db.exec(`
      DELETE FROM notifications;
      DELETE FROM announcements;
      DELETE FROM expenses;
      DELETE FROM payments;
      DELETE FROM bill_items;
      DELETE FROM bills;
      DELETE FROM complaints;
      DELETE FROM feedback;
      DELETE FROM meal_attendance;
      DELETE FROM menu_items;
      DELETE FROM menus;
      DELETE FROM users;
      DELETE FROM system_settings;
    `);
  }

  console.log('[Seed] Seeding database with realistic academic and mess data...');

  const insertUser = db.prepare(`
    INSERT INTO users (student_id, full_name, email, password_hash, role, department, year_of_study, hostel_room, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSetting = db.prepare(`
    INSERT OR REPLACE INTO system_settings (key, value, description)
    VALUES (?, ?, ?)
  `);

  const insertMenu = db.prepare(`
    INSERT INTO menus (date, meal_type, title, serving_time, is_special, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMenuItem = db.prepare(`
    INSERT INTO menu_items (menu_id, item_name, category, is_veg)
    VALUES (?, ?, ?, ?)
  `);

  const insertAttendance = db.prepare(`
    INSERT OR IGNORE INTO meal_attendance (student_id, date, meal_type, status, marked_by)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertFeedback = db.prepare(`
    INSERT OR IGNORE INTO feedback (student_id, date, meal_type, food_quality_rating, taste_rating, hygiene_rating, quantity_rating, overall_rating, comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (ticket_number, student_id, category, subject, description, priority, status, assigned_to, resolution_notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBill = db.prepare(`
    INSERT INTO bills (bill_number, student_id, billing_month, base_amount, special_diet_amount, rebate_amount, fine_amount, total_amount, paid_amount, due_amount, status, due_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBillItem = db.prepare(`
    INSERT INTO bill_items (bill_id, description, amount)
    VALUES (?, ?, ?)
  `);

  const insertPayment = db.prepare(`
    INSERT INTO payments (receipt_number, bill_id, student_id, amount, payment_date, payment_method, transaction_reference, status, recorded_by, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertExpense = db.prepare(`
    INSERT INTO expenses (title, category, amount, expense_date, vendor_name, invoice_number, description, recorded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (title, description, priority, author_id, publish_date, expiry_date, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, reference_id, is_read)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const staffHash = bcrypt.hashSync('Staff@123', 10);
  const studentHash = bcrypt.hashSync('Student@123', 10);

  const seedTransaction = db.transaction(() => {
    // 1. Settings
    insertSetting.run('mess_name', 'IIIT Bhubaneswar Central Mess', 'Name of the catering facility');
    insertSetting.run('academic_year', '2024-2025', 'Current academic session');
    insertSetting.run('monthly_base_charge', '3800', 'Standard monthly mess billing rate in INR');
    insertSetting.run('rebate_per_day', '90', 'Rebate per day for approved leave in INR');
    insertSetting.run('breakfast_timing', '07:30 AM - 09:30 AM', 'Daily breakfast serving hours');
    insertSetting.run('lunch_timing', '12:15 PM - 02:30 PM', 'Daily lunch serving hours');
    insertSetting.run('dinner_timing', '07:45 PM - 09:45 PM', 'Daily dinner serving hours');
    insertSetting.run('contact_phone', '+91 674 2306600', 'Mess helpline number');
    insertSetting.run('contact_email', 'mess-committee@iiit-bh.ac.in', 'Mess committee official email');

    // 2. Admin & Staff
    const adminRes = insertUser.run(
      'ADM001',
      'Dr. Bibhuti Bhusan Pradhan',
      'admin@iiit-bh.ac.in',
      adminHash,
      'admin',
      'Administration',
      null,
      'Faculty Quarters Q-04',
      '+91 94370 12345'
    );
    const adminId = adminRes.lastInsertRowid;

    const staff1Res = insertUser.run(
      'STF001',
      'Ramesh Chandra Jena',
      'staff1@iiit-bh.ac.in',
      staffHash,
      'staff',
      'Catering Services',
      null,
      'Staff Quarters S-12',
      '+91 98610 23456'
    );
    const staff1Id = staff1Res.lastInsertRowid;

    const staff2Res = insertUser.run(
      'STF002',
      'Prabhat Kumar Sahu',
      'staff2@iiit-bh.ac.in',
      staffHash,
      'staff',
      'Catering Services',
      null,
      'Staff Quarters S-14',
      '+91 97760 34567'
    );
    const staff2Id = staff2Res.lastInsertRowid;

    // 3. Students (22 students across branches & years)
    const studentsData = [
      { id: 'B121001', name: 'Aarav Sharma', email: 'b121001@iiit-bh.ac.in', dept: 'CSE', year: 3, room: 'Hostel-1, Room 101', phone: '+91 98765 43210' },
      { id: 'B121002', name: 'Ananya Pattnaik', email: 'b121002@iiit-bh.ac.in', dept: 'CSE', year: 3, room: 'Hostel-2, Room 204', phone: '+91 98765 43211' },
      { id: 'B121003', name: 'Rohan Mohanty', email: 'b121003@iiit-bh.ac.in', dept: 'ECE', year: 3, room: 'Hostel-1, Room 102', phone: '+91 98765 43212' },
      { id: 'B121004', name: 'Sneha Mishra', email: 'b121004@iiit-bh.ac.in', dept: 'IT', year: 2, room: 'Hostel-2, Room 112', phone: '+91 98765 43213' },
      { id: 'B121005', name: 'Subham Das', email: 'b121005@iiit-bh.ac.in', dept: 'EEE', year: 4, room: 'Hostel-1, Room 304', phone: '+91 98765 43214' },
      { id: 'B121006', name: 'Pooja Behera', email: 'b121006@iiit-bh.ac.in', dept: 'CSE', year: 2, room: 'Hostel-2, Room 305', phone: '+91 98765 43215' },
      { id: 'B121007', name: 'Debashis Nayak', email: 'b121007@iiit-bh.ac.in', dept: 'CE', year: 1, room: 'Hostel-3, Room 108', phone: '+91 98765 43216' },
      { id: 'B121008', name: 'Priyanka Tripathy', email: 'b121008@iiit-bh.ac.in', dept: 'ECE', year: 4, room: 'Hostel-2, Room 410', phone: '+91 98765 43217' },
      { id: 'B121009', name: 'Amitav Rout', email: 'b121009@iiit-bh.ac.in', dept: 'IT', year: 3, room: 'Hostel-1, Room 218', phone: '+91 98765 43218' },
      { id: 'B121010', name: 'Lipsa Biswal', email: 'b121010@iiit-bh.ac.in', dept: 'CSE', year: 1, room: 'Hostel-2, Room 102', phone: '+91 98765 43219' },
      { id: 'B121011', name: 'Siddharth Sahoo', email: 'b121011@iiit-bh.ac.in', dept: 'ECE', year: 2, room: 'Hostel-1, Room 115', phone: '+91 98765 43220' },
      { id: 'B121012', name: 'Ishita Panigrahi', email: 'b121012@iiit-bh.ac.in', dept: 'EEE', year: 3, room: 'Hostel-2, Room 215', phone: '+91 98765 43221' },
      { id: 'B121013', name: 'Alok Ranjan Barik', email: 'b121013@iiit-bh.ac.in', dept: 'IT', year: 4, room: 'Hostel-1, Room 320', phone: '+91 98765 43222' },
      { id: 'B121014', name: 'Monika Panda', email: 'b121014@iiit-bh.ac.in', dept: 'CSE', year: 2, room: 'Hostel-2, Room 322', phone: '+91 98765 43223' },
      { id: 'B121015', name: 'Kunal Ray', email: 'b121015@iiit-bh.ac.in', dept: 'CE', year: 3, room: 'Hostel-1, Room 225', phone: '+91 98765 43224' },
      { id: 'B121016', name: 'Swati Senapati', email: 'b121016@iiit-bh.ac.in', dept: 'ECE', year: 1, room: 'Hostel-2, Room 119', phone: '+91 98765 43225' },
      { id: 'B121017', name: 'Gourav Mohapatra', email: 'b121017@iiit-bh.ac.in', dept: 'EEE', year: 2, room: 'Hostel-1, Room 128', phone: '+91 98765 43226' },
      { id: 'B121018', name: 'Tanvi Kar', email: 'b121018@iiit-bh.ac.in', dept: 'IT', year: 3, room: 'Hostel-2, Room 229', phone: '+91 98765 43227' },
      { id: 'B121019', name: 'Ritesh Lenka', email: 'b121019@iiit-bh.ac.in', dept: 'CSE', year: 4, room: 'Hostel-1, Room 402', phone: '+91 98765 43228' },
      { id: 'B121020', name: 'Payal Samantaray', email: 'b121020@iiit-bh.ac.in', dept: 'ECE', year: 1, room: 'Hostel-2, Room 126', phone: '+91 98765 43229' },
      { id: 'B121021', name: 'Chirag Acharya', email: 'b121021@iiit-bh.ac.in', dept: 'CE', year: 2, room: 'Hostel-3, Room 210', phone: '+91 98765 43230' },
      { id: 'B121022', name: 'Simran Padhi', email: 'b121022@iiit-bh.ac.in', dept: 'IT', year: 4, room: 'Hostel-2, Room 402', phone: '+91 98765 43231' }
    ];

    const studentIds = [];
    for (const s of studentsData) {
      const res = insertUser.run(s.id, s.name, s.email, studentHash, 'student', s.dept, s.year, s.room, s.phone);
      studentIds.push({ dbId: res.lastInsertRowid, ...s });
    }

    // 4. Seven Days of Menus (From 3 days ago to 3 days ahead)
    const mealTemplates = [
      {
        breakfast: { title: 'Poha & Jalebi Breakfast', items: ['Indori Poha', 'Crispy Jalebi', 'Boiled Eggs / Banana', 'Green Mint Chutney', 'Special Adrak Chai'] },
        lunch: { title: 'Punjabi Rajma & Rice Feast', items: ['Steamed Basmati Rice', 'Kashmiri Rajma Masala', 'Bhindi Do Pyaza', 'Tawa Phulka Butter', 'Boondi Raita', 'Fresh Cucumber Salad'] },
        dinner: { title: 'Dal Makhani & Phulka Special', items: ['Tawa Phulka with Ghee', 'Slow-cooked Dal Makhani', 'Aloo Gobi Matar', 'Jeera Rice', 'Gulab Jamun (1 pc)', 'Papad & Pickle'] }
      },
      {
        breakfast: { title: 'Crispy Masala Dosa Delight', items: ['Masala Dosa with Potato Filling', 'Vegetable Sambar', 'Fresh Coconut Chutney', 'Tomato Onion Chutney', 'Filter Coffee / Milk'] },
        lunch: { title: 'Shahi Paneer Deluxe Thali', items: ['Jeera Pulao', 'Shahi Paneer Curry', 'Dal Tadka (Yellow Dal)', 'Aloo Jeera', 'Tandoori Roti', 'Mixed Veg Raita', 'Roasted Papad'] },
        dinner: { title: 'Homestyle Khichdi & Aloo Bharta', items: ['Moong Dal Khichdi with Ghee', 'Beguni / Baingan Bhaja', 'Aloo Chokha', 'Curd & Pickle', 'Papad', 'Semiya Payasam'] }
      },
      {
        breakfast: { title: 'Amritsari Aloo Paratha Feast', items: ['Aloo Paratha (2 pcs)', 'Fresh Curd / Dahi', 'Amul Butter Cube', 'Mixed Mango Pickle', 'Cutting Masala Chai'] },
        lunch: { title: 'Hyderabadi Veg Biryani Special', items: ['Veg Dum Biryani with Saffron', 'Mirchi Ka Salan', 'Burani Raita', 'Yellow Dal Fry', 'Rumali Roti', 'Gajar Ka Halwa'] },
        dinner: { title: 'Palak Paneer & Roti Dinner', items: ['Phulka (3 pcs)', 'Palak Paneer', 'Chana Dal Tadka', 'Steamed Rice', 'Green Salad with Lemon', 'Fruit Custard'] }
      },
      {
        // TODAY
        breakfast: { title: 'Idli Vada Sambar Extravaganza', items: ['Steamed Idli (3 pcs)', 'Medu Vada (1 pc)', 'Madras Sambar', 'Coconut & Pudina Chutney', 'Bournvita / Hot Tea'] },
        lunch: { title: 'North Indian Kadai Paneer Feast', items: ['Steamed Basmati Rice', 'Kadai Paneer Masala', 'Panchmel Dal', 'Seasonal Dry Veggie (Karela/Kundru)', 'Tawa Roti with Ghee', 'Kachumber Salad', 'Sweet Lassi'] },
        dinner: { title: 'Egg Curry / Malai Kofta & Pulao', items: ['Egg Curry (2 Eggs) / Malai Kofta', 'Peas Pulao', 'Dal Fry', 'Butter Roti (3 pcs)', 'Onion Laccha Salad', 'Moong Dal Halwa'] }
      },
      {
        breakfast: { title: 'Poori Chole & Suji Halwa', items: ['Crispy Poori (4 pcs)', 'Pindi Chole Masala', 'Desi Ghee Suji Halwa', 'Pickled Green Chili', 'Special Cardamom Tea'] },
        lunch: { title: 'Dal Makhani & Jeera Rice Thali', items: ['Jeera Rice', 'Authentic Dal Makhani', 'Soya Chaap Masala', 'Aloo Beans Fry', 'Phulka', 'Pineapple Raita', 'Papad'] },
        dinner: { title: 'South Indian Sambar Rice & Curd Rice', items: ['Bisi Bele Bath', 'Curd Rice with Tadka', 'Potato Kara Curry', 'Appalam / Papad', 'Pickle', 'Rasgulla (2 pcs)'] }
      },
      {
        breakfast: { title: 'Mixed Veg Upma & Peanut Chutney', items: ['Semolina Veggie Upma', 'Andhra Peanut Chutney', 'Boiled Sprouts Bowl', 'Fresh Banana (1 pc)', 'Ginger Tea / Milk'] },
        lunch: { title: 'Chole Bhature Weekend Special', items: ['Fluffy Bhature (2 pcs)', 'Delhi Style Chole', 'Jeera Pulao', 'Spicy Fried Chili', 'Onion Rings & Mint Dip', 'Chilled Kheer'] },
        dinner: { title: 'Paneer Bhurji & Paratha Night', items: ['Laccha Paratha (2 pcs)', 'Paneer Bhurji Curry', 'Dal Tadka', 'Plain Rice', 'Tomato Cucumber Salad', 'Custard Pudding'] }
      },
      {
        breakfast: { title: 'Paneer Kulcha & Chana Masala', items: ['Stuffed Paneer Kulcha (2 pcs)', 'Amritsari Chana', 'Sweet Curd', 'Lemon Pickle', 'Hot Masala Tea'] },
        lunch: { title: 'Sunday Grand Feast', items: ['Kashmiri Pulao with Nuts', 'Paneer Butter Masala', 'Mushroom Matar', 'Dal Maharani', 'Garlic Naan & Butter Roti', 'Boondi Raita', 'Vanilla Ice Cream'] },
        dinner: { title: 'Light Sunday Dinner', items: ['Phulka with Ghee', 'Mix Veg Kolhapuri', 'Moong Dal Soup', 'Steamed Rice', 'Papad', 'Fruit Salad'] }
      }
    ];

    const todayDate = new Date();
    for (let i = -3; i <= 3; i++) {
      const targetDate = new Date(todayDate);
      targetDate.setDate(targetDate.getDate() + i);
      const dateStr = formatDate(targetDate);
      const templateIdx = i + 3; // 0 to 6
      const template = mealTemplates[templateIdx];

      // Breakfast
      const bfRes = insertMenu.run(dateStr, 'breakfast', template.breakfast.title, '07:30 AM - 09:30 AM', templateIdx === 3 || templateIdx === 6 ? 1 : 0, adminId);
      for (const item of template.breakfast.items) {
        insertMenuItem.run(bfRes.lastInsertRowid, item, item.includes('Tea') || item.includes('Coffee') || item.includes('Bournvita') ? 'Beverage' : (item.includes('Chutney') || item.includes('Pickle') ? 'Side Dish' : 'Main Course'), item.includes('Egg') ? 0 : 1);
      }

      // Lunch
      const lunchRes = insertMenu.run(dateStr, 'lunch', template.lunch.title, '12:15 PM - 02:30 PM', templateIdx === 6 ? 1 : 0, adminId);
      for (const item of template.lunch.items) {
        insertMenuItem.run(lunchRes.lastInsertRowid, item, item.includes('Halwa') || item.includes('Jamun') || item.includes('Cream') || item.includes('Lassi') ? 'Dessert' : (item.includes('Raita') || item.includes('Salad') || item.includes('Papad') ? 'Side Dish' : 'Main Course'), 1);
      }

      // Dinner
      const dinnerRes = insertMenu.run(dateStr, 'dinner', template.dinner.title, '07:45 PM - 09:45 PM', 0, adminId);
      for (const item of template.dinner.items) {
        insertMenuItem.run(dinnerRes.lastInsertRowid, item, item.includes('Payasam') || item.includes('Custard') || item.includes('Jamun') || item.includes('Halwa') || item.includes('Kheer') || item.includes('Rasgulla') ? 'Dessert' : (item.includes('Salad') || item.includes('Papad') ? 'Side Dish' : 'Main Course'), item.includes('Egg') ? 0 : 1);
      }
    }

    // 5. Seed Attendance for Past Days and Today
    const meals = ['breakfast', 'lunch', 'dinner'];
    for (let dayOffset = -3; dayOffset <= 0; dayOffset++) {
      const d = getRelativeDate(dayOffset);
      const mealsToMark = dayOffset === 0 ? ['breakfast', 'lunch'] : meals;

      for (const meal of mealsToMark) {
        for (let sIdx = 0; sIdx < studentIds.length; sIdx++) {
          // 85% attendance rate
          const isPresent = (sIdx + dayOffset) % 7 !== 0;
          insertAttendance.run(
            studentIds[sIdx].dbId,
            d,
            meal,
            isPresent ? 'present' : 'absent',
            sIdx % 2 === 0 ? staff1Id : staff2Id
          );
        }
      }
    }

    // 6. Seed Realistic Feedback
    const sampleComments = [
      'Food was very tasty and served hot today! The paneer was soft.',
      'Sambar was a bit too spicy for breakfast, but idli was super soft.',
      'Hygiene in the mess hall has improved significantly. Great job!',
      'Loved the Sunday ice cream and dal makhani combo.',
      'Please increase the quantity of curd provided during lunch.',
      'The poori was slightly oily today, but chole was top-notch.',
      'Timely service and polite staff behavior. Very satisfied.'
    ];

    for (let dayOffset = -3; dayOffset <= 0; dayOffset++) {
      const d = getRelativeDate(dayOffset);
      for (let sIdx = 0; sIdx < 10; sIdx++) {
        const student = studentIds[sIdx];
        const quality = 3 + ((sIdx + dayOffset) % 3);
        const taste = 3 + ((sIdx * 2 + dayOffset) % 3);
        const hygiene = 4 + (sIdx % 2);
        const quantity = 4;
        const overall = Math.round((quality + taste + hygiene + quantity) / 4);
        const comment = sIdx < sampleComments.length ? sampleComments[sIdx] : null;

        insertFeedback.run(
          student.dbId,
          d,
          dayOffset === 0 ? 'breakfast' : 'lunch',
          quality,
          taste,
          hygiene,
          quantity,
          overall,
          comment
        );
      }
    }

    // 7. Seed Complaints across various categories and statuses
    const complaintsSeed = [
      {
        ticket: 'CMP-2024-001',
        studentIdx: 0,
        category: 'Food Quality',
        subject: 'Undercooked Rajma on Wednesday Lunch',
        desc: 'The rajma served on Wednesday afternoon was not properly cooked and hard to chew. Kindly ensure adequate cooking time.',
        priority: 'Medium',
        status: 'Resolved',
        assignee: staff1Id,
        notes: 'Spoke with head chef. Pressure cooking duration increased for kidney beans. Resolved on 10 Nov.',
        createdAt: '2024-11-09 14:20:00'
      },
      {
        ticket: 'CMP-2024-002',
        studentIdx: 1,
        category: 'Hygiene',
        subject: 'Water dispenser dripping near Washbasin 2',
        desc: 'The RO drinking water station near washbasin 2 has a constant slow drip creating a slippery water puddle.',
        priority: 'High',
        status: 'In Progress',
        assignee: staff2Id,
        notes: 'Plumber has been notified and spare gasket ordered. Expected completion by tomorrow.',
        createdAt: '2024-11-10 09:15:00'
      },
      {
        ticket: 'CMP-2024-003',
        studentIdx: 2,
        category: 'Billing',
        subject: 'Mess rebate not credited for Diwali vacation',
        desc: 'I had submitted an authorized leave form from 28 Oct to 02 Nov, but the November invoice did not reflect the 5-day rebate.',
        priority: 'High',
        status: 'Under Review',
        assignee: adminId,
        notes: 'Warden office verifying hostel entry/exit register with security desk.',
        createdAt: '2024-11-11 11:30:00'
      },
      {
        ticket: 'CMP-2024-004',
        studentIdx: 3,
        category: 'Menu',
        subject: 'Request for fruit variety in breakfast',
        desc: 'Currently only bananas are provided on alternating days. Please consider seasonal apples or oranges occasionally.',
        priority: 'Low',
        status: 'Submitted',
        assignee: null,
        notes: null,
        createdAt: '2024-11-11 17:45:00'
      },
      {
        ticket: 'CMP-2024-005',
        studentIdx: 4,
        category: 'Water',
        subject: 'Cold drinking water machine cooling issue',
        desc: 'The right side water cooler is dispensing normal temperature water during peak lunch hours.',
        priority: 'Medium',
        status: 'In Progress',
        assignee: staff1Id,
        notes: 'Compressor servicing scheduled with Voltas authorized technician.',
        createdAt: '2024-11-12 08:30:00'
      },
      {
        ticket: 'CMP-2024-006',
        studentIdx: 5,
        category: 'Staff Behaviour',
        subject: 'Rude response at counter 3 during dinner',
        desc: 'One of the serving helpers at counter 3 was dismissive when requested for extra dal spoon.',
        priority: 'High',
        status: 'Resolved',
        assignee: staff1Id,
        notes: 'Mess supervisor reprimanded the staff member and conducted an orientation briefing on courteous student interaction.',
        createdAt: '2024-11-08 21:00:00'
      },
      {
        ticket: 'CMP-2024-007',
        studentIdx: 6,
        category: 'Other',
        subject: 'Hand dryer in dining hall rest room not operating',
        desc: 'Electric hand dryer is turning off intermittently.',
        priority: 'Low',
        status: 'Rejected',
        assignee: staff2Id,
        notes: 'Rest room hand dryer belongs to Academic Block maintenance, not Mess facility. Forwarded to Institute Estate office.',
        createdAt: '2024-11-07 10:00:00'
      }
    ];

    for (const c of complaintsSeed) {
      insertComplaint.run(
        c.ticket,
        studentIds[c.studentIdx].dbId,
        c.category,
        c.subject,
        c.desc,
        c.priority,
        c.status,
        c.assignee,
        c.notes,
        c.createdAt
      );
    }

    // 8. Seed Monthly Bills and Bill Items
    const currMonth = '2024-11';
    const prevMonth = '2024-10';

    for (let sIdx = 0; sIdx < studentIds.length; sIdx++) {
      const student = studentIds[sIdx];

      // Previous Month Bill (October 2024) - Paid
      const prevBillNumber = `BILL-202410-${student.id}`;
      const prevTotal = 3800.0;
      const prevBillRes = insertBill.run(
        prevBillNumber,
        student.dbId,
        prevMonth,
        3800.0,
        0.0,
        0.0,
        0.0,
        prevTotal,
        prevTotal,
        0.0,
        'Paid',
        '2024-10-15',
        'October mess charges'
      );
      insertBillItem.run(prevBillRes.lastInsertRowid, 'Standard Monthly Mess Fee (October 2024)', 3800.0);

      // Payment for previous month
      insertPayment.run(
        `REC-202410-${String(sIdx + 1).padStart(3, '0')}`,
        prevBillRes.lastInsertRowid,
        student.dbId,
        prevTotal,
        '2024-10-10',
        sIdx % 3 === 0 ? 'UPI' : (sIdx % 3 === 1 ? 'Net Banking' : 'Debit Card'),
        `UPI/20241010/88921${sIdx + 100}`,
        'Completed',
        adminId,
        'Auto-reconciled institute bank payment'
      );

      // Current Month Bill (November 2024) - Mixed status
      const currBillNumber = `BILL-202411-${student.id}`;
      const rebate = sIdx % 4 === 0 ? 360.0 : 0.0; // 4 days rebate for some students
      const fine = sIdx === 7 ? 150.0 : 0.0;
      const currTotal = 3800.0 - rebate + fine;
      let currPaid = 0.0;
      let currStatus = 'Unpaid';

      if (sIdx < 10) {
        currPaid = currTotal;
        currStatus = 'Paid';
      } else if (sIdx < 15) {
        currPaid = 2000.0;
        currStatus = 'Partially Paid';
      } else {
        currPaid = 0.0;
        currStatus = 'Unpaid';
      }

      const currDue = currTotal - currPaid;
      const currBillRes = insertBill.run(
        currBillNumber,
        student.dbId,
        currMonth,
        3800.0,
        0.0,
        rebate,
        fine,
        currTotal,
        currPaid,
        currDue,
        currStatus,
        '2024-11-20',
        'November mess charges'
      );

      insertBillItem.run(currBillRes.lastInsertRowid, 'Standard Monthly Mess Fee (November 2024)', 3800.0);
      if (rebate > 0) {
        insertBillItem.run(currBillRes.lastInsertRowid, 'Approved Leave Rebate (4 Days @ ₹90/day)', -rebate);
      }
      if (fine > 0) {
        insertBillItem.run(currBillRes.lastInsertRowid, 'Late Payment Processing Surcharge', fine);
      }

      // Payments for current month if paid or partially paid
      if (currPaid > 0) {
        insertPayment.run(
          `REC-202411-${String(sIdx + 1).padStart(3, '0')}`,
          currBillRes.lastInsertRowid,
          student.dbId,
          currPaid,
          '2024-11-05',
          sIdx % 2 === 0 ? 'UPI' : 'Net Banking',
          `UPI/20241105/99182${sIdx + 100}`,
          'Completed',
          adminId,
          'Verified and credited'
        );
      }
    }

    // 9. Seed Mess Expenses for Current Month
    const expensesSeed = [
      { title: 'Aashirvaad Whole Wheat Atta (20 Bags x 50kg)', cat: 'Groceries', amt: 32500, date: getRelativeDate(-8), vendor: 'Odisha Agro Supplies', inv: 'INV-OAS-9081', desc: 'Monthly bulk procurement of grain' },
      { title: 'Fortune Sunlite Refined Oil & Mustard Oil (15 Tins)', cat: 'Cooking Supplies', amt: 28400, date: getRelativeDate(-7), vendor: 'Kalinga Wholesale Mart', inv: 'INV-KWM-3312', desc: 'Cooking medium for November' },
      { title: 'Fresh Amul Taaza Milk & Paneer Supply', cat: 'Dairy', amt: 19800, date: getRelativeDate(-5), vendor: 'OMFED Bhubaneswar Dairy', inv: 'INV-OMF-7744', desc: 'Weekly dairy supply' },
      { title: 'Green Vegetables, Onions & Potatoes Bulk', cat: 'Vegetables', amt: 14200, date: getRelativeDate(-3), vendor: 'Unit-1 Mandi Traders', inv: 'INV-MND-4411', desc: 'Twice-weekly vegetable dispatch' },
      { title: 'Commercial LPG Cylinder Refills (8 Cylinders)', cat: 'Cooking Supplies', amt: 17600, date: getRelativeDate(-2), vendor: 'Indane Commercial Gas Agency', inv: 'INV-IND-1109', desc: '19kg commercial cylinders' },
      { title: 'Mess Catering Support Staff Honorarium (Part-1)', cat: 'Staff', amt: 45000, date: getRelativeDate(-10), vendor: 'Catering Staff Pool', inv: 'INV-STF-202411', desc: 'Monthly helper wages' },
      { title: 'Dishwasher Machine Service & Water Softener Salt', cat: 'Maintenance', amt: 4850, date: getRelativeDate(-1), vendor: 'Apex Commercial Kitchen Equipments', inv: 'INV-APX-091', desc: 'Quarterly maintenance check' },
      { title: 'Stainless Steel Serving Spoons & Trays (Set of 40)', cat: 'Miscellaneous', amt: 3200, date: getRelativeDate(-6), vendor: 'Cuttack Metal Works', inv: 'INV-CMW-882', desc: 'Replacement cutlery' }
    ];

    for (const exp of expensesSeed) {
      insertExpense.run(exp.title, exp.cat, exp.amt, exp.date, exp.vendor, exp.inv, exp.desc, adminId);
    }

    // 10. Seed Announcements
    const announcementsSeed = [
      {
        title: 'Special Diwali & Foundation Day Grand Dinner Menu',
        desc: 'On the occasion of Institute Foundation Day this weekend, a special banquet dinner featuring Shahi Paneer, Kashmiri Pulao, Butter Naan, and Gulab Jamun will be served. All students are invited.',
        priority: 'High',
        pubDate: getRelativeDate(-3),
        expDate: getRelativeDate(7)
      },
      {
        title: 'Mess Rebate Application Deadline for Winter Recess',
        desc: 'Students proceeding on vacation during winter break must apply for mess rebate on or before November 25th through the hostel portal. No retroactive rebate requests will be entertained.',
        priority: 'Medium',
        pubDate: getRelativeDate(-5),
        expDate: getRelativeDate(15)
      },
      {
        title: 'Routine Deep Cleaning & Pest Control Schedule',
        desc: 'Comprehensive mess sanitation and pest prevention will be conducted this Saturday between 03:00 PM and 06:00 PM. Evening snacks service will operate from Counter 1 only.',
        priority: 'Low',
        pubDate: getRelativeDate(-1),
        expDate: getRelativeDate(4)
      }
    ];

    for (const ann of announcementsSeed) {
      insertAnnouncement.run(ann.title, ann.desc, ann.priority, adminId, ann.pubDate, ann.expDate, 1);
    }

    // 11. Seed Notifications for First 5 Students
    for (let s = 0; s < 5; s++) {
      const student = studentIds[s];
      insertNotification.run(
        student.dbId,
        'Mess Bill Generated',
        'Your monthly mess bill for November 2024 is now available. Kindly clear dues before 20th November.',
        'bill',
        null,
        0
      );
      insertNotification.run(
        student.dbId,
        'Diwali Grand Dinner Announcement',
        'A special festive dinner is scheduled for this coming Sunday. Check announcements for menu highlights.',
        'announcement',
        null,
        1
      );
      if (s === 0) {
        insertNotification.run(
          student.dbId,
          'Complaint Ticket Resolved: CMP-2024-001',
          'Your ticket concerning "Undercooked Rajma" has been resolved by Warden Dr. B. B. Pradhan.',
          'complaint',
          1,
          0
        );
      }
    }
  });

  seedTransaction();
  console.log('[Seed] Seeding completed successfully!');
}

module.exports = { seedDatabase };

if (require.main === module) {
  const force = process.argv.includes('--force');
  seedDatabase(force);
}
