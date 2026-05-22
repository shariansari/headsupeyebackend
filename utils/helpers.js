/** Shared helpers for controllers. */

/** Escape a user string so it is safe inside a RegExp. */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Flatten a (populated) Employee for the panel:
 * `unitId` → string id, plus flat `unitName` / `unitCode`.
 */
function reshapeEmployee(doc) {
  const e = doc && doc.toObject ? doc.toObject() : { ...doc };
  delete e.password;
  const unit = e.unitId;
  if (unit && typeof unit === 'object' && unit._id) {
    e.unitName = unit.unitName || '—';
    e.unitCode = unit.unitCode || '—';
    e.unitId = unit._id;
  } else {
    e.unitName = '—';
    e.unitCode = '—';
  }
  return e;
}

/**
 * Flatten a (populated) User for the panel: strip secrets, expose
 * `roleId`/`unitIds` as ids plus display `roleName` / `roleType` / `unitNames`.
 */
function reshapeUser(doc) {
  const u = doc && doc.toObject ? doc.toObject() : { ...doc };
  delete u.password;
  delete u.jwtToken;

  const role = u.roleId;
  if (role && typeof role === 'object' && role._id) {
    u.roleName = role.roleName || '—';
    u.roleType = role.roleType || '—';
    u.roleId = role._id;
  } else {
    u.roleName = '—';
    u.roleType = '—';
  }

  const units = Array.isArray(u.unitIds) ? u.unitIds : [];
  if (units.length && typeof units[0] === 'object') {
    u.unitNames = units.map((x) => x.unitName);
    u.unitIds = units.map((x) => x._id);
  } else {
    u.unitNames = [];
  }
  return u;
}

/** Great-circle distance between two coordinates, in metres. */
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Shape an Employee for the mobile app: drop the password, expose `unit` as a
 * nested object (with geofence fields the app needs).
 */
function employeeForApp(doc) {
  const e = doc && doc.toObject ? doc.toObject() : { ...doc };
  delete e.password;
  const u = e.unitId;
  e.unit =
    u && typeof u === 'object'
      ? {
          _id: u._id,
          unitName: u.unitName,
          unitCode: u.unitCode,
          lat: u.lat,
          lng: u.lng,
          geofenceRadius: u.geofenceRadius,
        }
      : null;
  delete e.unitId;
  return e;
}

module.exports = {
  escapeRegex,
  reshapeEmployee,
  reshapeUser,
  distanceMeters,
  employeeForApp,
};
