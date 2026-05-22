const Employee = require('../models/Employee');
const Unit = require('../models/Unit');
const User = require('../models/User');
const Role = require('../models/Role');
const { reshapeEmployee } = require('../utils/helpers');

class DashboardController {
  async stats(req, res) {
    try {
      // Optionally scope employee figures to one unit.
      const unitId = req.body.unitId || null;
      const empFilter = unitId ? { unitId } : {};

      const [
        totalEmployees,
        activeEmployees,
        faceEnrolled,
        totalUnits,
        activeUnits,
        totalUsers,
        totalRoles,
      ] = await Promise.all([
        Employee.countDocuments(empFilter),
        Employee.countDocuments({ ...empFilter, status: 'active' }),
        Employee.countDocuments({ ...empFilter, faceEnrolled: true }),
        Unit.countDocuments({}),
        Unit.countDocuments({ status: 'active' }),
        User.countDocuments({}),
        Role.countDocuments({}),
      ]);

      const units = await Unit.find({}).select('unitName unitCode').lean();
      const employeesByUnit = await Promise.all(
        units.map(async (u) => ({
          unitId: u._id,
          unitName: u.unitName,
          unitCode: u.unitCode,
          count: await Employee.countDocuments({ unitId: u._id }),
        }))
      );

      const recent = await Employee.find(empFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('unitId', 'unitName unitCode')
        .lean();

      res.json({
        statusCode: 200,
        data: {
          totalEmployees,
          activeEmployees,
          totalUnits,
          activeUnits,
          totalUsers,
          totalRoles,
          faceEnrolled,
          facePending: totalEmployees - faceEnrolled,
          employeesByUnit,
          recentEmployees: recent.map(reshapeEmployee),
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new DashboardController();
