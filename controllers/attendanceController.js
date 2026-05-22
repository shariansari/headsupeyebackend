const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
require('../models/Unit');
const { distanceMeters } = require('../utils/helpers');

/** Today as YYYY-MM-DD. */
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/** Sum the closed work intervals (an open interval while 'working' is excluded). */
function computeWorkedMinutes(events) {
  let total = 0;
  let workStart = null;
  for (const e of events) {
    if (e.type === 'punch-in' || e.type === 'break-end') {
      workStart = new Date(e.at).getTime();
    } else if (e.type === 'break-start' || e.type === 'punch-out') {
      if (workStart != null) {
        total += (new Date(e.at).getTime() - workStart) / 60000;
        workStart = null;
      }
    }
  }
  return Math.round(total);
}

// Which current statuses each punch type is allowed from, and the resulting status.
const ALLOWED_FROM = {
  'punch-in': ['not-started'],
  'break-start': ['working'],
  'break-end': ['on-break'],
  'punch-out': ['working', 'on-break'],
};
const NEXT_STATUS = {
  'punch-in': 'working',
  'break-start': 'on-break',
  'break-end': 'working',
  'punch-out': 'done',
};

class AttendanceController {
  /** Today's attendance record for the signed-in worker (null if none yet). */
  async today(req, res) {
    try {
      const employeeId = req.auth?.employeeId;
      if (!employeeId) {
        return res.status(401).json({ error: 'Employee authentication required' });
      }
      const doc = await Attendance.findOne({ employeeId, date: todayKey() });
      res.json({ statusCode: 200, data: doc });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /** Record a punch — enforces geofence and valid status transitions. */
  async punch(req, res) {
    try {
      const employeeId = req.auth?.employeeId;
      if (!employeeId) {
        return res.status(401).json({ error: 'Employee authentication required' });
      }
      const { type, lat, lng } = req.body;
      if (!NEXT_STATUS[type]) {
        return res.status(400).json({ error: 'Invalid punch type' });
      }

      const employee = await Employee.findById(employeeId).populate('unitId');
      if (!employee) return res.status(404).json({ error: 'Employee not found' });
      const unit = employee.unitId;

      // Geofence — punch is allowed only within the unit's radius.
      if (unit && unit.lat != null && unit.lng != null && lat != null && lng != null) {
        const dist = distanceMeters(lat, lng, unit.lat, unit.lng);
        const radius = unit.geofenceRadius || 150;
        if (dist > radius) {
          return res.status(403).json({
            error: `You are ${Math.round(dist)} m from ${unit.unitName} — punch is allowed only within ${radius} m.`,
          });
        }
      }

      const date = todayKey();
      let doc = await Attendance.findOne({ employeeId, date });
      const currentStatus = doc?.status || 'not-started';

      if (!ALLOWED_FROM[type].includes(currentStatus)) {
        return res
          .status(409)
          .json({ error: `Cannot "${type}" while your status is "${currentStatus}".` });
      }

      if (!doc) {
        doc = new Attendance({ employeeId, unitId: unit?._id, date, events: [] });
      }
      doc.events.push({ type, at: new Date(), lat, lng });
      doc.status = NEXT_STATUS[type];
      doc.workedMinutes = computeWorkedMinutes(doc.events);
      await doc.save();

      res.json({ statusCode: 200, message: 'Punch recorded', data: doc });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /** Past attendance days for the signed-in worker. */
  async history(req, res) {
    try {
      const employeeId = req.auth?.employeeId;
      if (!employeeId) {
        return res.status(401).json({ error: 'Employee authentication required' });
      }
      const { page = 1, limit = 30 } = req.body;
      const result = await Attendance.paginate(
        { employeeId },
        { page: parseInt(page), limit: parseInt(limit), sort: { date: -1 } }
      );
      res.json({ statusCode: 200, data: result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AttendanceController();
