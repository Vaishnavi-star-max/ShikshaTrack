const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name:     { type: String, required: true },          // e.g. "Class 3A"
  grade:    { type: String, required: true },          // e.g. "Class 3"
  teacher:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  school:   { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
