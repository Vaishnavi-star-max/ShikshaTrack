const router     = require('express').Router();
const Assessment = require('../models/Assessment');
const auth       = require('../middleware/auth');

// Get all students (derived from assessments)
router.get('/', auth, async (req, res) => {
  try {
    const all = await Assessment.find({ teacher: req.user.id }).sort({ date: -1 });

    const studentMap = {};
    for (const a of all) {
      const key = a.studentName;
      if (!studentMap[key]) {
        studentMap[key] = {
          _id: key,
          name: a.studentName,
          className: a.className,
          lastAssessment: a.date,
          gradeStatus: a.gradeStatus,
        };
      }
    }
    res.json(Object.values(studentMap));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single student detail
router.get('/:id', auth, async (req, res) => {
  try {
    const assessments = await Assessment.find({ teacher: req.user.id, studentName: req.params.id }).sort({ date: -1 });
    if (!assessments.length) return res.status(404).json({ message: 'Student not found' });
    const latest = assessments[0];
    res.json({
      _id: latest.studentName,
      name: latest.studentName,
      className: latest.className,
      gradeStatus: latest.gradeStatus,
      lastAssessment: latest.date,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
