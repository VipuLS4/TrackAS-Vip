import { body, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

export const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

export const validateCompanyRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Company name must be at least 2 characters'),
  body('address').trim().isLength({ min: 10 }).withMessage('Address must be at least 10 characters'),
  body('tin').isLength({ min: 10, max: 15 }).withMessage('TIN must be 10-15 characters'),
  body('bank_account_number').isLength({ min: 9, max: 18 }).withMessage('Invalid account number'),
  body('bank_ifsc').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC code'),
  body('bank_name').trim().isLength({ min: 2 }).withMessage('Bank name required'),
  body('account_holder').trim().isLength({ min: 2 }).withMessage('Account holder name required')
];

export const validateDriverRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('mobile').matches(/^[6-9]\d{9}$/).withMessage('Invalid mobile number'),
  body('license_no').isLength({ min: 10, max: 20 }).withMessage('Invalid license number'),
  body('bank_account_number').isLength({ min: 9, max: 18 }).withMessage('Invalid account number'),
  body('bank_ifsc').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Invalid IFSC code'),
  body('bank_name').trim().isLength({ min: 2 }).withMessage('Bank name required'),
  body('account_holder').trim().isLength({ min: 2 }).withMessage('Account holder name required')
];

export const validateShipment = [
  body('pickup').trim().isLength({ min: 10 }).withMessage('Pickup address required'),
  body('destination').trim().isLength({ min: 10 }).withMessage('Destination address required'),
  body('weight').isFloat({ min: 0.1 }).withMessage('Weight must be positive'),
  body('length').isFloat({ min: 0.1 }).withMessage('Length must be positive'),
  body('width').isFloat({ min: 0.1 }).withMessage('Width must be positive'),
  body('height').isFloat({ min: 0.1 }).withMessage('Height must be positive'),
  body('customer_name').trim().isLength({ min: 2 }).withMessage('Customer name required'),
  body('customer_phone').matches(/^[6-9]\d{9}$/).withMessage('Invalid customer phone'),
  body('customer_email').isEmail().withMessage('Invalid customer email'),
  body('cost').isFloat({ min: 1 }).withMessage('Cost must be positive')
];
