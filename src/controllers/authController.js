const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const secretKey = process.env.SECRET_TOKEN;

const register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already taken' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    const payload = { _id: newUser._id, username: newUser.username };
    const token = jwt.sign(payload, secretKey, { expiresIn: '5s' });

    return res.status(200).json({ message: 'Registration successful', token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const payload = { _id: user._id, username: user.username };
    const token = jwt.sign(payload, secretKey, { expiresIn: '45m' });

    return res.status(200).json({ token, _id: user._id, username: user.username, email: user.email });
  } catch (error) {
    console.error('Error finding user:', error);
    return res.status(500).json({ error: 'Failed to find user' });
  }
};

const verifyToken = async (req, res) => {
  try {
    const { _id, username } = req.body;
    const user = await User.findById(_id);
    if (user && user.username === username) {
      res.status(200).json({ message: 'Token verified and matched' });
    } else {
      res.status(401).json({ message: 'Token verification failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token verification failed' });
  }
};

module.exports = { register, login, verifyToken };
