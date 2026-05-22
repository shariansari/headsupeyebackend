const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// Flat dot-notation permission role (e.g. { 'employees.read': true }).
const roleSchema = new mongoose.Schema(
  {
    roleName: { type: String, required: true, trim: true },
    roleType: {
      type: String,
      enum: ['SuperAdmin', 'Admin', 'Manager', 'Staff'],
      default: 'Staff',
    },
    kind: { type: String, enum: ['master', 'assigned'], default: 'master' },
    flatPermissions: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    parentRoleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'roles' }
);

roleSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Role', roleSchema);
