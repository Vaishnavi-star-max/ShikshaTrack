const router  = require('express').Router();
const auth    = require('../middleware/auth');
const User    = require('../models/User');
const Student = require('../models/Student');
const Class   = require('../models/Class');

// Admin-only guard
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Admin access required' });
  next();
}

// GET /admin/students — all students across all teachers
router.get('/students', auth, adminOnly, async (req, res) => {
  try {
    const students = await Student.find()
      .populate('teacher', 'name email')
      .populate('class', 'name grade')
      .sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /admin/teachers — all teachers
router.get('/teachers', auth, adminOnly, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password').sort({ createdAt: -1 });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /admin/stats — school-wide stats
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const [totalStudents, totalTeachers, totalClasses, belowGrade, atGrade] = await Promise.all([
      Student.countDocuments(),
      User.countDocuments({ role: 'teacher' }),
      Class.countDocuments(),
      Student.countDocuments({ gradeStatus: 'Below Grade Level' }),
      Student.countDocuments({ gradeStatus: 'At Grade Level' }),
    ]);

    const readingDist = await Student.aggregate([
      { $group: { _id: '$readingLevel', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const arithDist = await Student.aggregate([
      { $group: { _id: '$arithmeticLevel', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalStudents, totalTeachers, totalClasses, belowGrade, atGrade,
      readingDist:  readingDist.map(d => ({ level: d._id, count: d.count })),
      arithDist:    arithDist.map(d => ({ level: d._id, count: d.count })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /admin/teacher/:id — remove a teacher
router.delete('/teacher/:id', auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Teacher deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
