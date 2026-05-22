/**
 * Database seeding.
 *  - `seedDatabase()` is called on server start and seeds only when empty.
 *  - `npm run seed` runs this file directly with --force (clears + reseeds).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Role = require('../models/Role');
const Unit = require('../models/Unit');
const User = require('../models/User');
const Employee = require('../models/Employee');

const ROLE_DEFS = [
  {
    roleName: 'Super Admin',
    roleType: 'SuperAdmin',
    kind: 'master',
    status: 'active',
    // SuperAdmin bypasses every check — permissions kept empty by design.
    flatPermissions: {},
  },
  {
    roleName: 'Unit Manager',
    roleType: 'Manager',
    kind: 'master',
    status: 'active',
    flatPermissions: {
      'dashboard.read': true,
      'employees.read': true,
      'employees.create': true,
      'employees.edit': true,
      'employees.delete': true,
      'attendance.read': true,
      'attendance.export': true,
      'settings.units.read': true,
      'settings.users.read': true,
    },
  },
  {
    roleName: 'HR Executive',
    roleType: 'Staff',
    kind: 'master',
    status: 'active',
    flatPermissions: {
      'dashboard.read': true,
      'employees.read': true,
      'employees.create': true,
      'employees.edit': true,
      'attendance.read': true,
      'attendance.export': true,
    },
  },
  {
    roleName: 'Auditor (Read-only)',
    roleType: 'Staff',
    kind: 'master',
    status: 'active',
    flatPermissions: {
      'dashboard.read': true,
      'employees.read': true,
      'attendance.read': true,
    },
  },
];

const UNIT_DEFS = [
  {
    unitName: 'Delhi NCR Hub', unitCode: 'UNIT-DEL-01',
    address: 'Plot 24, Sector 63, Industrial Area', city: 'Noida', state: 'Uttar Pradesh',
    lat: 28.628, lng: 77.381, geofenceRadius: 150,
    phone: '+91 98110 22001', email: 'del.hub@headsupeye.com', status: 'active',
  },
  {
    unitName: 'Bhiwandi Hub', unitCode: 'UNIT-MUM-01',
    address: 'Survey 88, Mankoli Naka, Bhiwandi', city: 'Mumbai', state: 'Maharashtra',
    lat: 19.296, lng: 73.063, geofenceRadius: 200,
    phone: '+91 98200 22002', email: 'mum.hub@headsupeye.com', status: 'active',
  },
  {
    unitName: 'Bangalore Hub', unitCode: 'UNIT-BLR-01',
    address: 'KIADB Industrial Area, Nelamangala', city: 'Bengaluru', state: 'Karnataka',
    lat: 13.099, lng: 77.394, geofenceRadius: 120,
    phone: '+91 98450 22003', email: 'blr.hub@headsupeye.com', status: 'active',
  },
  {
    unitName: 'Pune Chakan Hub', unitCode: 'UNIT-PUN-01',
    address: 'Chakan MIDC Phase 2', city: 'Pune', state: 'Maharashtra',
    lat: 18.76, lng: 73.842, geofenceRadius: 180,
    phone: '+91 99220 22004', email: 'pun.hub@headsupeye.com', status: 'active',
  },
  {
    unitName: 'Hyderabad Hub', unitCode: 'UNIT-HYD-01',
    address: 'Medchal Industrial Estate', city: 'Hyderabad', state: 'Telangana',
    lat: 17.63, lng: 78.481, geofenceRadius: 150,
    phone: '+91 90000 22005', email: 'hyd.hub@headsupeye.com', status: 'inactive',
  },
];

// [name, employeeCode, unitCode, designation, gender, faceEnrolled]
const EMPLOYEE_DEFS = [
  ['Amit Kumar', 'EMP-DEL-001', 'UNIT-DEL-01', 'forklift_operator', 'male', true],
  ['Priya Sharma', 'EMP-DEL-002', 'UNIT-DEL-01', 'inventory_clerk', 'female', true],
  ['Sandeep Singh', 'EMP-DEL-003', 'UNIT-DEL-01', 'loader', 'male', false],
  ['Rohit Yadav', 'EMP-DEL-004', 'UNIT-DEL-01', 'picker_packer', 'male', true],
  ['Imran Shaikh', 'EMP-MUM-001', 'UNIT-MUM-01', 'shift_supervisor', 'male', true],
  ['Sunita Patil', 'EMP-MUM-002', 'UNIT-MUM-01', 'picker_packer', 'female', false],
  ['Ganesh Jadhav', 'EMP-MUM-003', 'UNIT-MUM-01', 'general_worker', 'male', true],
  ['Kavya Reddy', 'EMP-BLR-001', 'UNIT-BLR-01', 'inventory_clerk', 'female', true],
  ['Manjunath Gowda', 'EMP-BLR-002', 'UNIT-BLR-01', 'forklift_operator', 'male', false],
  ['Pooja Deshmukh', 'EMP-PUN-001', 'UNIT-PUN-01', 'picker_packer', 'female', true],
  ['Vikram More', 'EMP-PUN-002', 'UNIT-PUN-01', 'security_guard', 'male', true],
  ['Sai Teja', 'EMP-HYD-001', 'UNIT-HYD-01', 'general_worker', 'male', false],
];

async function seedDatabase({ force = false } = {}) {
  const count = await User.countDocuments();
  if (count > 0 && !force) {
    console.log('Seed skipped — database already has data');
    return;
  }

  if (force) {
    await Promise.all([
      Role.deleteMany({}),
      Unit.deleteMany({}),
      User.deleteMany({}),
      Employee.deleteMany({}),
    ]);
    console.log('Cleared existing data');
  }

  const roles = await Role.insertMany(ROLE_DEFS);
  const roleId = (name) => roles.find((r) => r.roleName === name)._id;

  const units = await Unit.insertMany(UNIT_DEFS);
  const unitId = (code) => units.find((u) => u.unitCode === code)._id;

  await User.insertMany([
    {
      name: 'Shariq Ansari', email: 'admin@headsupeye.com', phoneNumber: '+91 75059 53827',
      password: bcrypt.hashSync('admin123', 10), roleId: roleId('Super Admin'),
      unitIds: units.map((u) => u._id), status: 'active',
    },
    {
      name: 'Rahul Verma', email: 'manager@headsupeye.com', phoneNumber: '+91 98110 40001',
      password: bcrypt.hashSync('manager123', 10), roleId: roleId('Unit Manager'),
      unitIds: [unitId('UNIT-DEL-01'), unitId('UNIT-MUM-01')], status: 'active',
    },
    {
      name: 'Sneha Kulkarni', email: 'hr@headsupeye.com', phoneNumber: '+91 98200 40002',
      password: bcrypt.hashSync('hr123', 10), roleId: roleId('HR Executive'),
      unitIds: [unitId('UNIT-MUM-01'), unitId('UNIT-PUN-01')], status: 'active',
    },
  ]);

  await Employee.insertMany(
    EMPLOYEE_DEFS.map(([name, code, unitCode, designation, gender, faceEnrolled], i) => ({
      name,
      employeeCode: code,
      phoneNumber: `+91 9${String(800000000 + i * 111111).slice(0, 9)}`,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@headsupeye.com`,
      // Default mobile-app login password for seeded workers.
      password: bcrypt.hashSync('worker123', 10),
      gender,
      designation,
      unitId: unitId(unitCode),
      salary: 18000 + i * 1000,
      weekOff: ['sunday', 'monday', 'tuesday'][i % 3],
      faceEnrolled,
      faceUpdatedAt: faceEnrolled ? new Date() : null,
      status: 'active',
    }))
  );

  console.log(
    `Seed complete: ${roles.length} roles, ${units.length} units, 3 users, ${EMPLOYEE_DEFS.length} employees`
  );
}

module.exports = { seedDatabase };

// Run directly: `npm run seed` (force reseed).
if (require.main === module) {
  const force = process.argv.includes('--force');
  (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/headsupeye');
      await seedDatabase({ force });
      await mongoose.disconnect();
      process.exit(0);
    } catch (error) {
      console.error('Seed failed:', error);
      process.exit(1);
    }
  })();
}
