import express from 'express';
import { query } from '../db.js';
import { authenticateUser, generateToken } from '../utils/auth.js';
import { validateLogin, validateCompanyRegistration, validateDriverRegistration, validateRequest } from '../utils/validation.js';
import { hashPassword } from '../utils/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Login endpoint
router.post('/login', validateLogin, validateRequest, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authenticateUser(email, password);
    const token = generateToken({ id: user.id, role: user.role });
    
    logger.info(`User login: ${email}`, { userId: user.id, role: user.role });
    
    res.json({ 
      success: true,
      token, 
      role: user.role,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    logger.warn(`Login failed for email: ${req.body.email}`, { error: error.message });
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Company registration
router.post('/register/company', validateCompanyRegistration, validateRequest, async (req, res) => {
  try {
    const { email, password, name, address, tin, bank_account_number, bank_ifsc, bank_name, account_holder } = req.body;
    
    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const userResult = await query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
      [email, hashedPassword, 'COMPANY']
    );
    
    const userId = userResult.rows[0].id;
    
    // Create company
    await query(
      `INSERT INTO companies (user_id, name, email, address, tin, bank_account_number, bank_ifsc, bank_name, account_holder, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')`,
      [userId, name, email, address, tin, bank_account_number, bank_ifsc, bank_name, account_holder]
    );
    
    logger.info(`Company registered: ${email}`, { userId, companyName: name });
    
    res.json({ 
      success: true, 
      message: 'Company registered successfully. Awaiting admin approval.' 
    });
  } catch (error) {
    logger.error('Company registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Driver registration
router.post('/register/operator', validateDriverRegistration, validateRequest, async (req, res) => {
  try {
    const { email, password, name, mobile, license_no, bank_account_number, bank_ifsc, bank_name, account_holder } = req.body;
    
    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const userResult = await query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
      [email, hashedPassword, 'OPERATOR']
    );
    
    const userId = userResult.rows[0].id;
    
    // Create operator
    await query(
      `INSERT INTO operators (user_id, name, mobile, license_no, bank_account_number, bank_ifsc, bank_name, account_holder, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING')`,
      [userId, name, mobile, license_no, bank_account_number, bank_ifsc, bank_name, account_holder]
    );
    
    logger.info(`Driver registered: ${email}`, { userId, driverName: name });
    
    res.json({ 
      success: true, 
      message: 'Driver registered successfully. Awaiting admin approval.' 
    });
  } catch (error) {
    logger.error('Driver registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

export default router;
