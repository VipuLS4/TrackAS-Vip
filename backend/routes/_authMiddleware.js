import { verifyToken } from '../utils/auth.js';
import { query } from '../db.js';
import logger from '../utils/logger.js';

export function requireAuth(role = null) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      
      // Get user details
      const userResult = await query(
        'SELECT id, email, role FROM users WHERE id = $1',
        [decoded.id]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      const user = userResult.rows[0];
      
      // Check role if specified
      if (role && user.role !== role) {
        logger.warn(`Access denied for user ${user.id}`, { 
          requiredRole: role, 
          userRole: user.role 
        });
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      logger.warn('Authentication failed', { error: error.message });
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}
