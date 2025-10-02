// Authentication API for TrackAS
// Handles login, registration, and authentication for all user types

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { vercelErrorHandler } from '../backend/utils/vercelErrorHandler.js';
import { VercelErrorFactory, VERCEL_ERROR_CODES } from '../backend/utils/vercelErrorTypes.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Mock database - In production, replace with actual database
const users = {
  companies: new Map(),
  drivers: new Map(),
  admins: new Map()
};

// Initialize with demo data
const initializeDemoData = () => {
  // Demo Company
  users.companies.set('company@demo.com', {
    id: 'comp_001',
    email: 'company@demo.com',
    password: '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV0wX1yZ2',
    name: 'Demo Logistics Company',
    type: 'company',
    status: 'active',
    createdAt: new Date().toISOString()
  });

  // Demo Driver
  users.drivers.set('driver@demo.com', {
    id: 'drv_001',
    email: 'driver@demo.com',
    password: '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV0wX1yZ2',
    name: 'John Driver',
    type: 'driver',
    status: 'active',
    vehicleNumber: 'MH-12-AB-1234',
    phone: '+91-9876543210',
    createdAt: new Date().toISOString()
  });

  // Demo Admin
  users.admins.set('admin@demo.com', {
    id: 'adm_001',
    email: 'admin@demo.com',
    password: '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV0wX1yZ2',
    name: 'Admin User',
    type: 'admin',
    status: 'active',
    role: 'super_admin',
    createdAt: new Date().toISOString()
  });
};

// Initialize demo data
initializeDemoData();

export default async function handler(req, res) {
  const startTime = Date.now();
  
  try {
    const { method } = req;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    if (method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    const { action, userType } = req.query;
    const body = req.body || {};

    switch (action) {
      case 'login':
        return await handleLogin(req, res, userType, body);
      case 'register':
        return await handleRegister(req, res, userType, body);
      case 'verify':
        return await handleVerify(req, res, body);
      case 'logout':
        return await handleLogout(req, res, body);
      case 'profile':
        return await handleProfile(req, res, body);
      case 'update-profile':
        return await handleUpdateProfile(req, res, body);
      default:
        return res.status(400).json({
          error: 'Invalid action',
          message: 'Supported actions: login, register, verify, logout, profile, update-profile'
        });
    }
    
  } catch (error) {
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      endpoint: '/api/auth',
      method: req.method,
      action: req.query.action,
      userType: req.query.userType
    });
    
    return res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
  }
}

// Login handler
async function handleLogin(req, res, userType, body) {
  const { email, password } = body;
  
  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing credentials',
      message: 'Email and password are required'
    });
  }

  if (!userType || !['company', 'driver', 'admin'].includes(userType)) {
    return res.status(400).json({
      error: 'Invalid user type',
      message: 'User type must be company, driver, or admin'
    });
  }

  const userStore = users[userType + 's'];
  const user = userStore.get(email);
  
  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Email or password is incorrect'
    });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Email or password is incorrect'
    });
  }

  if (user.status !== 'active') {
    return res.status(403).json({
      error: 'Account disabled',
      message: 'Your account has been disabled. Please contact support.'
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      type: user.type,
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      token,
      expiresIn: JWT_EXPIRES_IN
    }
  });
}

// Registration handler
async function handleRegister(req, res, userType, body) {
  const { email, password, name, ...additionalData } = body;
  
  if (!email || !password || !name) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Email, password, and name are required'
    });
  }

  if (!userType || !['company', 'driver', 'admin'].includes(userType)) {
    return res.status(400).json({
      error: 'Invalid user type',
      message: 'User type must be company, driver, or admin'
    });
  }

  const userStore = users[userType + 's'];
  
  if (userStore.has(email)) {
    return res.status(409).json({
      error: 'User already exists',
      message: 'An account with this email already exists'
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Generate user ID
  const userId = `${userType.substring(0, 3)}_${Date.now()}`;
  
  // Create user object
  const user = {
    id: userId,
    email,
    password: hashedPassword,
    name,
    type: userType,
    status: 'active',
    createdAt: new Date().toISOString(),
    ...additionalData
  };

  // Add user-specific fields based on type
  if (userType === 'driver') {
    user.vehicleNumber = additionalData.vehicleNumber || '';
    user.phone = additionalData.phone || '';
  } else if (userType === 'admin') {
    user.role = additionalData.role || 'admin';
  }

  // Store user
  userStore.set(email, user);

  // Generate JWT token
  const token = jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      type: user.type,
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: userWithoutPassword,
      token,
      expiresIn: JWT_EXPIRES_IN
    }
  });
}

// Token verification handler
async function handleVerify(req, res, body) {
  const { token } = body;
  
  if (!token) {
    return res.status(400).json({
      error: 'Missing token',
      message: 'Token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user in appropriate store
    let user = null;
    for (const [storeName, store] of Object.entries(users)) {
      for (const [email, userData] of store) {
        if (userData.id === decoded.id) {
          user = userData;
          break;
        }
      }
      if (user) break;
    }

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User associated with this token not found'
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: userWithoutPassword,
        token: decoded
      }
    });
    
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Token is invalid or expired'
    });
  }
}

// Logout handler
async function handleLogout(req, res, body) {
  // In a real application, you would invalidate the token
  // For now, we'll just return success
  return res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
}

// Get user profile
async function handleProfile(req, res, body) {
  const { token } = body;
  
  if (!token) {
    return res.status(400).json({
      error: 'Missing token',
      message: 'Token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user
    let user = null;
    for (const [storeName, store] of Object.entries(users)) {
      for (const [email, userData] of store) {
        if (userData.id === decoded.id) {
          user = userData;
          break;
        }
      }
      if (user) break;
    }

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword
      }
    });
    
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Token is invalid or expired'
    });
  }
}

// Update user profile
async function handleUpdateProfile(req, res, body) {
  const { token, ...updateData } = body;
  
  if (!token) {
    return res.status(400).json({
      error: 'Missing token',
      message: 'Token is required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user
    let user = null;
    let userStore = null;
    let userEmail = null;
    
    for (const [storeName, store] of Object.entries(users)) {
      for (const [email, userData] of store) {
        if (userData.id === decoded.id) {
          user = userData;
          userStore = store;
          userEmail = email;
          break;
        }
      }
      if (user) break;
    }

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Update user data
    const updatedUser = {
      ...user,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    // Store updated user
    userStore.set(userEmail, updatedUser);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userWithoutPassword
      }
    });
    
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Token is invalid or expired'
    });
  }
}

