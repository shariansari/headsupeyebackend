const Unit = require('../models/Unit');
const Employee = require('../models/Employee');
const { escapeRegex } = require('../utils/helpers');

/** Next sequential unit code — UNIT-001, UNIT-002, … (codes are auto-generated). */
async function nextUnitCode() {
  const units = await Unit.find({ unitCode: /^UNIT-\d+$/ }, 'unitCode').lean();
  let max = 0;
  for (const u of units) {
    const m = /^UNIT-(\d+)$/.exec(u.unitCode || '');
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `UNIT-${String(max + 1).padStart(3, '0')}`;
}

class UnitController {
  async search(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status } = req.body;

      const query = {};
      if (status) query.status = status;
      if (search && String(search).trim()) {
        const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
        query.$or = [
          { unitName: rx },
          { unitCode: rx },
          { city: rx },
          { address: rx },
          { state: rx },
        ];
      }

      const result = await Unit.paginate(query, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 },
      });

      res.json({ statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) return res.status(400).json({ error: 'Unit ID is required' });

      const unit = await Unit.findById(_id);
      if (!unit) return res.status(404).json({ error: 'Unit not found' });

      res.json({ statusCode: 200, data: unit });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const { unitName } = req.body;
      if (!unitName) return res.status(400).json({ error: 'unitName is required' });

      // unitCode is generated automatically — any value sent by the client is ignored.
      let unit = null;
      for (let attempt = 0; attempt < 5 && !unit; attempt++) {
        try {
          const doc = new Unit({ ...req.body, unitCode: await nextUnitCode() });
          await doc.save();
          unit = doc;
        } catch (err) {
          // Concurrent creates can collide on the generated code — retry.
          if (err.code === 11000 && attempt < 4) continue;
          throw err;
        }
      }

      res.status(201).json({ statusCode: 201, message: 'Unit created successfully', data: unit });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      // unitCode is immutable — it is auto-generated at creation.
      const { _id, unitCode, ...updateData } = req.body;
      if (!_id) return res.status(400).json({ error: 'Unit ID is required' });

      const unit = await Unit.findByIdAndUpdate(_id, updateData, {
        new: true,
        runValidators: true,
      });
      if (!unit) return res.status(404).json({ error: 'Unit not found' });

      res.json({ statusCode: 200, message: 'Unit updated successfully', data: unit });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async remove(req, res) {
    try {
      const { _id } = req.body;
      if (!_id) return res.status(400).json({ error: 'Unit ID is required' });

      const assigned = await Employee.countDocuments({ unitId: _id });
      if (assigned > 0) {
        return res.status(409).json({
          error: 'Cannot delete — employees are still assigned to this unit',
        });
      }

      const unit = await Unit.findByIdAndDelete(_id);
      if (!unit) return res.status(404).json({ error: 'Unit not found' });

      res.json({ statusCode: 200, message: 'Unit deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new UnitController();
