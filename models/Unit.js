const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// A site — office, branch, store, etc. Holds the geofence used for punch-in.
const unitSchema = new mongoose.Schema(
  {
    unitName: { type: String, required: true, trim: true },
    unitCode: { type: String, required: true, unique: true, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    // Punch-in is allowed only within this radius (metres) of the unit.
    geofenceRadius: { type: Number, default: 150 },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

unitSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Unit', unitSchema);
