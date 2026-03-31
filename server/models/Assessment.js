const mongoose = require('mongoose');

const READING_LEVELS  = ['Cannot Read', 'Letter', 'Word', 'Paragraph', 'Story'];
const ARITH_LEVELS    = ['Cannot Solve', 'Number Recognition', 'Subtraction', 'Division'];

const assessmentSchema = new mongoose.Schema({
  studentName:      { type: String, required: true },
  studentId:        { type: String },
  className:        { type: String, required: true },
  readingLevel:     { type: String, enum: READING_LEVELS, required: true },
  arithmeticLevel:  { type: String, enum: ARITH_LEVELS,   required: true },
  date:             { type: Date, default: Date.now },
  teacher:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradeStatus:      { type: String, enum: ['At Grade Level', 'Below Grade Level'] },
}, { timestamps: true });

// Auto-compute grade status before save
const READING_SCORE = { 'Cannot Read': 0, 'Letter': 1, 'Word': 2, 'Paragraph': 3, 'Story': 4 };
assessmentSchema.pre('save', function () {
  this.gradeStatus = READING_SCORE[this.readingLevel] >= 3
    ? 'At Grade Level' : 'Below Grade Level';
});

module.exports = mongoose.model('Assessment', assessmentSchema);
