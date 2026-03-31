const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const mongoose = require('mongoose');

function ensureDbConnected(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: 'Database not connected. Please retry in a few seconds.' });
    return false;
  }
  return true;
}

// Register
router.post('/register', async (req, res) => {
  try {
    if (!ensureDbConnected(res)) return;
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const role = req.body?.role;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required' });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, role });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    if (!ensureDbConnected(res)) return;
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
