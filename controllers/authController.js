const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { employeeForApp } = require('../utils/helpers');
require('../models/Role');
require('../models/Unit');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await User.findOne({ email: String(email).toLowerCase().trim() })
        .populate('roleId')
        .populate('unitIds', 'unitName unitCode');

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const passwordOk = await bcrypt.compare(password, user.password || '');
      if (!passwordOk) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Your account is inactive. Contact an administrator.' });
      }

      const token = jwt.sign(
        { userId: user._id, roleId: user.roleId?._id || null },
        process.env.JWT_SECRET || 'headsupeye-dev-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      user.jwtToken = token;
      await user.save();

      const role = user.roleId
        ? {
            _id: user.roleId._id,
            roleName: user.roleId.roleName,
            roleType: user.roleId.roleType,
            flatPermissions: user.roleId.flatPermissions || {},
          }
        : null;

      const units = (user.unitIds || []).map((u) => ({
        _id: u._id,
        unitName: u.unitName,
        unitCode: u.unitCode,
      }));

      res.json({
        statusCode: 200,
        data: {
          token,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            status: user.status,
            role,
            units,
          },
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /** Mobile-app login for warehouse/unit workers (Employee accounts). */
  async employeeLogin(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const employee = await Employee.findOne({
        email: String(email).toLowerCase().trim(),
      }).populate('unitId');

      if (!employee || !employee.password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const passwordOk = await bcrypt.compare(password, employee.password);
      if (!passwordOk) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (employee.status !== 'active') {
        return res
          .status(403)
          .json({ error: 'Your account is inactive. Contact your administrator.' });
      }

      const token = jwt.sign(
        { employeeId: employee._id },
        process.env.JWT_SECRET || 'headsupeye-dev-secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        statusCode: 200,
        data: { token, employee: employeeForApp(employee) },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AuthController();
