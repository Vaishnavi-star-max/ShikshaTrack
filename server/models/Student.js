const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  studentId:        { type: String },
  class:            { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacher:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  readingLevel:     { type: String, enum: ['Cannot Read','Letter','Word','Paragraph','Story'], default: 'Cannot Read' },
  arithmeticLevel:  { type: String, enum: ['Cannot Solve','Number Recognition','Subtraction','Division'], default: 'Cannot Solve' },
  gradeStatus:      { type: String, enum: ['At Grade Level','Below Grade Level'], default: 'Below Grade Level' },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
