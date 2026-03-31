const router  = require('express').Router();
const auth    = require('../middleware/auth');
const Class   = require('../models/Class');
const Student = require('../models/Student');

const READING_SCORE = { 'Cannot Read':0,'Letter':1,'Word':2,'Paragraph':3,'Story':4 };

function gradeStatus(readingLevel) {
  return READING_SCORE[readingLevel] >= 3 ? 'At Grade Level' : 'Below Grade Level';
}

// POST /teacher/class — create a class
router.post('/class', auth, async (req, res) => {
  try {
    const { name, grade, school } = req.body;
    if (!name || !grade) return res.status(400).json({ message: 'name and grade are required' });
    const cls = await Class.create({ name, grade, school, teacher: req.user.id });
    res.status(201).json(cls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /teacher/classes — list teacher's classes
router.get('/classes', auth, async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.user.id }).sort({ createdAt: -1 });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /teacher/student — add student with learning level
router.post('/student', auth, async (req, res) => {
  try {
    const { name, studentId, classId, readingLevel, arithmeticLevel } = req.body;
    if (!name || !classId) return res.status(400).json({ message: 'name and classId are required' });

    // verify class belongs to this teacher
    const cls = await Class.findOne({ _id: classId, teacher: req.user.id });
    if (!cls) return res.status(403).json({ message: 'Class not found or not yours' });

    const student = await Student.create({
      name, studentId,
      class: classId,
      teacher: req.user.id,
      readingLevel:    readingLevel    || 'Cannot Read',
      arithmeticLevel: arithmeticLevel || 'Cannot Solve',
      gradeStatus:     gradeStatus(readingLevel || 'Cannot Read'),
    });
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /teacher/class/:id/students — students in a class
router.get('/class/:id/students', auth, async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, teacher: req.user.id });
    if (!cls) return res.status(403).json({ message: 'Class not found or not yours' });
    const students = await Student.find({ class: req.params.id }).sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /teacher/student/:id — update student levels
router.put('/student/:id', auth, async (req, res) => {
  try {
    const { readingLevel, arithmeticLevel } = req.body;
    const update = {};
    if (readingLevel)    { update.readingLevel = readingLevel; update.gradeStatus = gradeStatus(readingLevel); }
    if (arithmeticLevel)   update.arithmeticLevel = arithmeticLevel;

    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.id },
      update,
      { new: true }
    );
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /teacher/student/:id
router.delete('/student/:id', auth, async (req, res) => {
  try {
    await Student.findOneAndDelete({ _id: req.params.id, teacher: req.user.id });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
