const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');
require('../models/Unit');
const { escapeRegex, reshapeEmployee, employeeForApp } = require('../utils/helpers');

const UNIT_POPULATE = { path: 'unitId', select: 'unitName unitCode' };

/** Next sequential employee code — EMP-001, EMP-002, … (auto-generated). */
async function nextEmployeeCode() {
  const employees = await Employee.find({ employeeCode: /^EMP-\d+$/ }, 'employeeCode').lean();
  let max = 0;
  for (const e of employees) {
    const m = /^EMP-(\d+)$/.exec(e.employeeCode || '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `EMP-${String(max + 1).padStart(3, '0')}`;
}

class EmployeeController {
  async search(req, res) {
    try {
      const { page = 1, limit = 10, search = '', unitId, status, faceEnrolled } = req.body;

      const query = {};
      if (unitId) query.unitId = unitId;
      if (status) query.status = status;
      if (faceEnrolled === true || faceEnrolled === false) query.faceEnrolled = faceEnrolled;
      if (search && String(search).trim()) {
        const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
        query.$or = [
          { name: rx },
          { employeeCode: rx },
          { phoneNumber: rx },
          { email: rx },
        ];
      }

      const result = await Employee.paginate(query, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
        populate: UNIT_POPULATE,
        lean: true,
      });
      result.docs = result.docs.map(reshapeEmployee);

      res.json({ statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) return res.status(400).json({ error: 'Employee ID is required' });

      const employee = await Employee.findById(_id).populate(UNIT_POPULATE);
      if (!employee) return res.status(404).json({ error: 'Employee not found' });

      res.json({ statusCode: 200, data: reshapeEmployee(employee) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const { name, unitId } = req.body;
      if (!name || !unitId) {
        return res.status(400).json({ error: 'name and unitId are required' });
      }

      // Face enrolment is owned by the mobile app — always starts empty.
      const base = {
        ...req.body,
        faceEnrolled: false,
        faceUpdatedAt: null,
        faceId: null,
      };
      // Hash the app-login password, if one was provided.
      if (base.password) {
        base.password = await bcrypt.hash(base.password, 10);
      }

      // employeeCode is generated automatically — any value sent is ignored.
      let employee = null;
      for (let attempt = 0; attempt < 5 && !employee; attempt++) {
        try {
          const doc = new Employee({ ...base, employeeCode: await nextEmployeeCode() });
          await doc.save();
          employee = doc;
        } catch (err) {
          // Concurrent creates can collide on the generated code — retry.
          if (err.code === 11000 && attempt < 4) continue;
          throw err;
        }
      }
      await employee.populate(UNIT_POPULATE);

      res.status(201).json({
        statusCode: 201,
        message: 'Employee created successfully',
        data: reshapeEmployee(employee),
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      // employeeCode is immutable; faceEnrolled/faceUpdatedAt/faceId are not editable here.
      const { _id, employeeCode, faceEnrolled, faceUpdatedAt, faceId, ...updateData } = req.body;
      if (!_id) return res.status(400).json({ error: 'Employee ID is required' });

      // Only re-hash the app-login password when a new one is supplied.
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      } else {
        delete updateData.password;
      }

      const employee = await Employee.findByIdAndUpdate(_id, updateData, {
        new: true,
        runValidators: true,
      }).populate(UNIT_POPULATE);
      if (!employee) return res.status(404).json({ error: 'Employee not found' });

      res.json({
        statusCode: 200,
        message: 'Employee updated successfully',
        data: reshapeEmployee(employee),
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async remove(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) return res.status(400).json({ error: 'Employee ID is required' });

      const employee = await Employee.findByIdAndDelete(_id);
      if (!employee) return res.status(404).json({ error: 'Employee not found' });

      res.json({ statusCode: 200, message: 'Employee deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /** Mobile app — the signed-in worker's own profile (with unit + geofence). */
  async me(req, res) {
    try {
      const employeeId = req.auth?.employeeId;
      if (!employeeId) {
        return res.status(401).json({ error: 'Employee authentication required' });
      }
      const employee = await Employee.findById(employeeId).populate('unitId');
      if (!employee) return res.status(404).json({ error: 'Employee not found' });
      res.json({ statusCode: 200, data: employeeForApp(employee) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Mobile app — mark the worker's face as enrolled.
   * TODO: index the captured selfie into an AWS Rekognition collection and
   * store the returned FaceId here. For now this only flips the enrolment flag.
   */
  async enrollFace(req, res) {
    try {
      const employeeId = req.auth?.employeeId;
      if (!employeeId) {
        return res.status(401).json({ error: 'Employee authentication required' });
      }
      const employee = await Employee.findByIdAndUpdate(
        employeeId,
        { faceEnrolled: true, faceUpdatedAt: new Date() },
        { new: true }
      ).populate('unitId');
      if (!employee) return res.status(404).json({ error: 'Employee not found' });
      res.json({
        statusCode: 200,
        message: 'Face enrolled',
        data: employeeForApp(employee),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Admin panel — reset an employee's Face ID so they can enrol again.
   * Clears the enrolment flags; the worker re-enrols from the mobile app.
   * TODO: when AWS Rekognition is wired, also delete the indexed face here.
   */
  async resetFace(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) return res.status(400).json({ error: 'Employee ID is required' });

      const employee = await Employee.findByIdAndUpdate(
        _id,
        { faceEnrolled: false, faceUpdatedAt: null, faceId: null },
        { new: true }
      ).populate(UNIT_POPULATE);
      if (!employee) return res.status(404).json({ error: 'Employee not found' });

      res.json({
        statusCode: 200,
        message: 'Face ID reset — the employee can enrol again from the app',
        data: reshapeEmployee(employee),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new EmployeeController();
