const router     = require('express').Router();
const Assessment = require('../models/Assessment');
const auth       = require('../middleware/auth');

// Create assessment
router.post('/', auth, async (req, res) => {
  try {
    const assessment = await Assessment.create({ ...req.body, teacher: req.user.id });
    res.status(201).json(assessment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get assessments (optionally filter by studentId name)
router.get('/', auth, async (req, res) => {
  try {
    const filter = { teacher: req.user.id };
    if (req.query.studentId) filter.studentName = req.query.studentId; // using name as ID for simplicity
    const assessments = await Assessment.find(filter).sort({ date: -1 }).limit(200);
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const all = await Assessment.find({ teacher: req.user.id });

    // Unique students by name
    const studentNames = [...new Set(all.map(a => a.studentName))];
    const totalStudents = studentNames.length;

    // Latest assessment per student
    const latestMap = {};
    for (const a of all) {
      if (!latestMap[a.studentName] || new Date(a.date) > new Date(latestMap[a.studentName].date))
        latestMap[a.studentName] = a;
    }
    const latest = Object.values(latestMap);
    const belowGrade = latest.filter(a => a.gradeStatus === 'Below Grade Level').length;
    const atGrade    = latest.filter(a => a.gradeStatus === 'At Grade Level').length;

    // Reading distribution
    const readingLevels = ['Cannot Read','Letter','Word','Paragraph','Story'];
    const readingDist = readingLevels.map(level => ({
      level, count: latest.filter(a => a.readingLevel === level).length
    }));

    // Arithmetic distribution
    const arithLevels = ['Cannot Solve','Number Recognition','Subtraction','Division'];
    const arithDist = arithLevels.map(level => ({
      level, count: latest.filter(a => a.arithmeticLevel === level).length
    }));

    res.json({ totalStudents, belowGrade, atGrade, totalAssessments: all.length, readingDist, arithDist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
