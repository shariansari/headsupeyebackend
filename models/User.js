const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// Panel / back-office user.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phoneNumber: { type: String, trim: true },
    password: { type: String, required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    unitIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Unit' }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    jwtToken: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema);
