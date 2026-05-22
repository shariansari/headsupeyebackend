const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('../models/Role');
require('../models/Unit');
const { escapeRegex, reshapeUser } = require('../utils/helpers');

const POPULATE = [
  { path: 'roleId', select: 'roleName roleType' },
  { path: 'unitIds', select: 'unitName unitCode' },
];

class UserController {
  async search(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status, roleId } = req.body;

      const query = {};
      if (status) query.status = status;
      if (roleId) query.roleId = roleId;
      if (search && String(search).trim()) {
        const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
        query.$or = [{ name: rx }, { email: rx }, { phoneNumber: rx }];
      }

      const result = await User.paginate(query, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        select: '-password -jwtToken',
        populate: POPULATE,
        lean: true,
      });
      result.docs = result.docs.map(reshapeUser);

      res.json({ statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) return res.status(400).json({ error: 'User ID is required' });

      const user = await User.findById(_id).select('-password -jwtToken').populate(POPULATE);
      if (!user) return res.status(404).json({ error: 'User not found' });

      res.json({ statusCode: 200, data: reshapeUser(user) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const { name, email, password, roleId } = req.body;
      if (!name || !email || !password || !roleId) {
        return res.status(400).json({ error: 'name, email, password and roleId are required' });
      }

      const user = new User({
        ...req.body,
        password: await bcrypt.hash(password, 10),
      });
      await user.save();
      await user.populate(POPULATE);

      res.status(201).json({
        statusCode: 201,
        message: 'User created successfully',
        data: reshapeUser(user),
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: `Email "${req.body.email}" is already registered` });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { _id, ...updateData } = req.body;
      if (!_id) return res.status(400).json({ error: 'User ID is required' });

      // Only re-hash when a new password is actually supplied.
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      } else {
        delete updateData.password;
      }

      const user = await User.findByIdAndUpdate(_id, updateData, {
        new: true,
        runValidators: true,
      })
        .select('-password -jwtToken')
        .populate(POPULATE);
      if (!user) return res.status(404).json({ error: 'User not found' });

      res.json({
        statusCode: 200,
        message: 'User updated successfully',
        data: reshapeUser(user),
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: `Email "${req.body.email}" is already registered` });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async remove(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) return res.status(400).json({ error: 'User ID is required' });

      const user = await User.findByIdAndDelete(_id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      res.json({ statusCode: 200, message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new UserController();
