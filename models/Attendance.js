const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// A single punch event within a day.
const eventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['punch-in', 'break-start', 'break-end', 'punch-out'],
      required: true,
    },
    at: { type: Date, default: Date.now },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
);

// One attendance document per employee per day.
const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    date: { type: String, required: true }, // YYYY-MM-DD
    events: [eventSchema],
    status: {
      type: String,
      enum: ['not-started', 'working', 'on-break', 'done'],
      default: 'not-started',
    },
    workedMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Attendance', attendanceSchema);
