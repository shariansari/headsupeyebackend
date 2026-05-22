const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// A worker assigned to a Unit. They use the mobile app for face attendance....
const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    employeeCode: { type: String, required: true, unique: true, trim: true },
    phoneNumber: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    // Set from the admin panel — the worker signs into the mobile app with it.
    password: { type: String },
    gender: { type: String },
    designation: { type: String },
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    salary: { type: Number, default: 0 },
    weekOff: { type: String },
    // Face is enrolled by the worker from the mobile app (AWS Rekognition) —
    // never set from the panel.
    faceEnrolled: { type: Boolean, default: false },
    faceUpdatedAt: { type: Date, default: null },
    faceId: { type: String, default: null },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

employeeSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Employee', employeeSchema);
