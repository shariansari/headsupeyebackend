const Role = require('../models/Role');
const User = require('../models/User');
const { escapeRegex } = require('../utils/helpers');

/** Add display-only fields the panel's role list expects. */
async function withCounts(role) {
  const userCount = await User.countDocuments({ roleId: role._id });
  const permissionCount =
    role.roleType === 'SuperAdmin'
      ? 'All'
      : Object.values(role.flatPermissions || {}).filter(Boolean).length;
  return { ...role, userCount, permissionCount };
}

class RoleController {
  async search(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status } = req.body;

      const query = {};
      if (status) query.status = status;
      if (search && String(search).trim()) {
        const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
        query.$or = [{ roleName: rx }, { roleType: rx }];
      }

      const result = await Role.paginate(query, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        lean: true,
      });
      result.docs = await Promise.all(result.docs.map(withCounts));

      res.json({ statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) return res.status(400).json({ error: 'Role ID is required' });

      const role = await Role.findById(_id);
      if (!role) return res.status(404).json({ error: 'Role not found' });

      res.json({ statusCode: 200, data: role });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const { roleName, roleType, flatPermissions, status } = req.body;
      if (!roleName) return res.status(400).json({ error: 'roleName is required' });

      const role = new Role({
        roleName,
        roleType: roleType || 'Staff',
        kind: 'master',
        flatPermissions: flatPermissions || {},
        status: status || 'active',
      });
      await role.save();

      res.status(201).json({ statusCode: 201, message: 'Role created successfully', data: role });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { _id, ...updateData } = req.body;
      if (!_id) return res.status(400).json({ error: 'Role ID is required' });

      const role = await Role.findByIdAndUpdate(_id, updateData, {
        new: true,
        runValidators: true,
      });
      if (!role) return res.status(404).json({ error: 'Role not found' });

      res.json({ statusCode: 200, message: 'Role updated successfully', data: role });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async remove(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) return res.status(400).json({ error: 'Role ID is required' });

      const role = await Role.findById(_id);
      if (!role) return res.status(404).json({ error: 'Role not found' });
      if (role.roleType === 'SuperAdmin') {
        return res.status(403).json({ error: 'The Super Admin role cannot be deleted' });
      }

      const inUse = await User.countDocuments({ roleId: _id });
      if (inUse > 0) {
        return res
          .status(409)
          .json({ error: `Cannot delete — ${inUse} user(s) still have this role` });
      }

      await Role.findByIdAndDelete(_id);
      res.json({ statusCode: 200, message: 'Role deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new RoleController();
