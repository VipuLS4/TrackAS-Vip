// Payments API for TrackAS
// Handles payment processing, wallet management, and escrow

import { vercelErrorHandler } from '../backend/utils/vercelErrorHandler.js';
import { VercelErrorFactory, VERCEL_ERROR_CODES } from '../backend/utils/vercelErrorTypes.js';

// Mock database - In production, replace with actual database
const payments = new Map();
const wallets = new Map();
const transactions = new Map();

// Initialize with demo data
const initializeDemoData = () => {
  // Demo wallets
  wallets.set('comp_001', {
    userId: 'comp_001',
    userType: 'company',
    balance: 50000,
    currency: 'INR',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  });

  wallets.set('drv_001', {
    userId: 'drv_001',
    userType: 'driver',
    balance: 15000,
    currency: 'INR',
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  });

  // Demo payments
  const demoPayments = [
    {
      id: 'PAY_001',
      shipmentId: 'SHIP_001',
      trackingId: 'TRK123456789',
      payerId: 'comp_001',
      payerType: 'company',
      payeeId: 'drv_001',
      payeeType: 'driver',
      amount: 2500,
      currency: 'INR',
      status: 'pending',
      type: 'escrow',
      description: 'Payment for shipment delivery',
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z'
    },
    {
      id: 'PAY_002',
      shipmentId: 'SHIP_002',
      trackingId: 'TRK987654321',
      payerId: 'comp_001',
      payerType: 'company',
      payeeId: 'drv_001',
      payeeType: 'driver',
      amount: 1800,
      currency: 'INR',
      status: 'completed',
      type: 'escrow',
      description: 'Payment for shipment delivery',
      createdAt: '2024-01-10T07:30:00Z',
      updatedAt: '2024-01-12T15:30:00Z'
    }
  ];

  demoPayments.forEach(payment => {
    payments.set(payment.id, payment);
  });

  // Demo transactions
  const demoTransactions = [
    {
      id: 'TXN_001',
      walletId: 'comp_001',
      type: 'debit',
      amount: 2500,
      currency: 'INR',
      description: 'Escrow payment for shipment TRK123456789',
      status: 'completed',
      createdAt: '2024-01-15T09:00:00Z'
    },
    {
      id: 'TXN_002',
      walletId: 'drv_001',
      type: 'credit',
      amount: 1800,
      currency: 'INR',
      description: 'Payment received for shipment TRK987654321',
      status: 'completed',
      createdAt: '2024-01-12T15:30:00Z'
    }
  ];

  demoTransactions.forEach(transaction => {
    if (!transactions.has(transaction.walletId)) {
      transactions.set(transaction.walletId, []);
    }
    transactions.get(transaction.walletId).push(transaction);
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

    const { action, paymentId } = req.query;
    const body = req.body || {};

    switch (action) {
      case 'create':
        return await handleCreatePayment(req, res, body);
      case 'process':
        return await handleProcessPayment(req, res, body);
      case 'release':
        return await handleReleasePayment(req, res, body);
      case 'refund':
        return await handleRefundPayment(req, res, body);
      case 'list':
        return await handleListPayments(req, res, body);
      case 'get':
        return await handleGetPayment(req, res, paymentId);
      case 'wallet':
        return await handleWalletOperations(req, res, body);
      case 'transactions':
        return await handleGetTransactions(req, res, body);
      default:
        return res.status(400).json({
          error: 'Invalid action',
          message: 'Supported actions: create, process, release, refund, list, get, wallet, transactions'
        });
    }
    
  } catch (error) {
    const vercelError = await vercelErrorHandler.handleVercelError(error, {
      endpoint: '/api/payments',
      method: req.method,
      action: req.query.action,
      paymentId: req.query.paymentId
    });
    
    return res.status(vercelError.statusCode).json(JSON.parse(vercelError.body));
  }
}

// Create payment
async function handleCreatePayment(req, res, body) {
  const {
    shipmentId,
    trackingId,
    payerId,
    payerType,
    payeeId,
    payeeType,
    amount,
    currency = 'INR',
    type = 'escrow',
    description
  } = body;

  if (!shipmentId || !payerId || !payeeId || !amount) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Shipment ID, payer ID, payee ID, and amount are required'
    });
  }

  // Check if payer has sufficient balance
  const payerWallet = wallets.get(payerId);
  if (!payerWallet) {
    return res.status(404).json({
      error: 'Wallet not found',
      message: 'Payer wallet not found'
    });
  }

  if (payerWallet.balance < amount) {
    return res.status(400).json({
      error: 'Insufficient balance',
      message: 'Payer does not have sufficient balance'
    });
  }

  const paymentId = 'PAY_' + Date.now();
  const payment = {
    id: paymentId,
    shipmentId,
    trackingId,
    payerId,
    payerType,
    payeeId,
    payeeType,
    amount: parseFloat(amount),
    currency,
    status: 'pending',
    type,
    description: description || 'Payment for shipment delivery',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  payments.set(paymentId, payment);

  return res.status(201).json({
    success: true,
    message: 'Payment created successfully',
    data: {
      payment
    }
  });
}

// Process payment
async function handleProcessPayment(req, res, body) {
  const { paymentId } = body;

  if (!paymentId) {
    return res.status(400).json({
      error: 'Missing payment ID',
      message: 'Payment ID is required'
    });
  }

  const payment = payments.get(paymentId);
  if (!payment) {
    return res.status(404).json({
      error: 'Payment not found',
      message: 'No payment found with this ID'
    });
  }

  if (payment.status !== 'pending') {
    return res.status(400).json({
      error: 'Invalid payment status',
      message: 'Payment is not in pending status'
    });
  }

  // Check payer balance
  const payerWallet = wallets.get(payment.payerId);
  if (!payerWallet || payerWallet.balance < payment.amount) {
    return res.status(400).json({
      error: 'Insufficient balance',
      message: 'Payer does not have sufficient balance'
    });
  }

  // Deduct amount from payer wallet
  payerWallet.balance -= payment.amount;
  payerWallet.updatedAt = new Date().toISOString();
  wallets.set(payment.payerId, payerWallet);

  // Add transaction record
  const debitTransaction = {
    id: 'TXN_' + Date.now(),
    walletId: payment.payerId,
    type: 'debit',
    amount: payment.amount,
    currency: payment.currency,
    description: `Escrow payment for shipment ${payment.trackingId}`,
    status: 'completed',
    createdAt: new Date().toISOString()
  };

  if (!transactions.has(payment.payerId)) {
    transactions.set(payment.payerId, []);
  }
  transactions.get(payment.payerId).push(debitTransaction);

  // Update payment status
  payment.status = 'escrowed';
  payment.updatedAt = new Date().toISOString();
  payments.set(paymentId, payment);

  return res.status(200).json({
    success: true,
    message: 'Payment processed successfully',
    data: {
      payment,
      transaction: debitTransaction
    }
  });
}

// Release payment
async function handleReleasePayment(req, res, body) {
  const { paymentId, reason } = body;

  if (!paymentId) {
    return res.status(400).json({
      error: 'Missing payment ID',
      message: 'Payment ID is required'
    });
  }

  const payment = payments.get(paymentId);
  if (!payment) {
    return res.status(404).json({
      error: 'Payment not found',
      message: 'No payment found with this ID'
    });
  }

  if (payment.status !== 'escrowed') {
    return res.status(400).json({
      error: 'Invalid payment status',
      message: 'Payment is not in escrowed status'
    });
  }

  // Add amount to payee wallet
  const payeeWallet = wallets.get(payment.payeeId);
  if (!payeeWallet) {
    return res.status(404).json({
      error: 'Payee wallet not found',
      message: 'Payee wallet not found'
    });
  }

  payeeWallet.balance += payment.amount;
  payeeWallet.updatedAt = new Date().toISOString();
  wallets.set(payment.payeeId, payeeWallet);

  // Add transaction record
  const creditTransaction = {
    id: 'TXN_' + Date.now(),
    walletId: payment.payeeId,
    type: 'credit',
    amount: payment.amount,
    currency: payment.currency,
    description: `Payment received for shipment ${payment.trackingId}`,
    status: 'completed',
    createdAt: new Date().toISOString()
  };

  if (!transactions.has(payment.payeeId)) {
    transactions.set(payment.payeeId, []);
  }
  transactions.get(payment.payeeId).push(creditTransaction);

  // Update payment status
  payment.status = 'completed';
  payment.updatedAt = new Date().toISOString();
  payments.set(paymentId, payment);

  return res.status(200).json({
    success: true,
    message: 'Payment released successfully',
    data: {
      payment,
      transaction: creditTransaction
    }
  });
}

// Refund payment
async function handleRefundPayment(req, res, body) {
  const { paymentId, reason } = body;

  if (!paymentId) {
    return res.status(400).json({
      error: 'Missing payment ID',
      message: 'Payment ID is required'
    });
  }

  const payment = payments.get(paymentId);
  if (!payment) {
    return res.status(404).json({
      error: 'Payment not found',
      message: 'No payment found with this ID'
    });
  }

  if (!['escrowed', 'completed'].includes(payment.status)) {
    return res.status(400).json({
      error: 'Invalid payment status',
      message: 'Payment cannot be refunded in current status'
    });
  }

  // Refund amount to payer wallet
  const payerWallet = wallets.get(payment.payerId);
  if (!payerWallet) {
    return res.status(404).json({
      error: 'Payer wallet not found',
      message: 'Payer wallet not found'
    });
  }

  payerWallet.balance += payment.amount;
  payerWallet.updatedAt = new Date().toISOString();
  wallets.set(payment.payerId, payerWallet);

  // Add transaction record
  const refundTransaction = {
    id: 'TXN_' + Date.now(),
    walletId: payment.payerId,
    type: 'credit',
    amount: payment.amount,
    currency: payment.currency,
    description: `Refund for payment ${paymentId}: ${reason || 'No reason provided'}`,
    status: 'completed',
    createdAt: new Date().toISOString()
  };

  if (!transactions.has(payment.payerId)) {
    transactions.set(payment.payerId, []);
  }
  transactions.get(payment.payerId).push(refundTransaction);

  // Update payment status
  payment.status = 'refunded';
  payment.updatedAt = new Date().toISOString();
  payments.set(paymentId, payment);

  return res.status(200).json({
    success: true,
    message: 'Payment refunded successfully',
    data: {
      payment,
      transaction: refundTransaction
    }
  });
}

// List payments
async function handleListPayments(req, res, body) {
  const { userId, userType, status, limit = 10, offset = 0 } = body;

  let filteredPayments = Array.from(payments.values());

  // Apply filters
  if (userId) {
    filteredPayments = filteredPayments.filter(p => 
      p.payerId === userId || p.payeeId === userId
    );
  }
  if (userType) {
    filteredPayments = filteredPayments.filter(p => 
      p.payerType === userType || p.payeeType === userType
    );
  }
  if (status) {
    filteredPayments = filteredPayments.filter(p => p.status === status);
  }

  // Sort by creation date (newest first)
  filteredPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Apply pagination
  const paginatedPayments = filteredPayments.slice(offset, offset + parseInt(limit));

  return res.status(200).json({
    success: true,
    data: {
      payments: paginatedPayments,
      pagination: {
        total: filteredPayments.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + parseInt(limit) < filteredPayments.length
      }
    }
  });
}

// Get payment
async function handleGetPayment(req, res, paymentId) {
  if (!paymentId) {
    return res.status(400).json({
      error: 'Missing payment ID',
      message: 'Payment ID is required'
    });
  }

  const payment = payments.get(paymentId);
  if (!payment) {
    return res.status(404).json({
      error: 'Payment not found',
      message: 'No payment found with this ID'
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      payment
    }
  });
}

// Wallet operations
async function handleWalletOperations(req, res, body) {
  const { action, userId, amount, currency = 'INR' } = body;

  if (!userId) {
    return res.status(400).json({
      error: 'Missing user ID',
      message: 'User ID is required'
    });
  }

  let wallet = wallets.get(userId);
  if (!wallet) {
    // Create new wallet
    wallet = {
      userId,
      userType: 'unknown',
      balance: 0,
      currency,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    wallets.set(userId, wallet);
  }

  switch (action) {
    case 'get':
      return res.status(200).json({
        success: true,
        data: {
          wallet
        }
      });

    case 'add-funds':
      if (!amount || amount <= 0) {
        return res.status(400).json({
          error: 'Invalid amount',
          message: 'Amount must be greater than 0'
        });
      }

      wallet.balance += parseFloat(amount);
      wallet.updatedAt = new Date().toISOString();
      wallets.set(userId, wallet);

      // Add transaction record
      const transaction = {
        id: 'TXN_' + Date.now(),
        walletId: userId,
        type: 'credit',
        amount: parseFloat(amount),
        currency,
        description: 'Funds added to wallet',
        status: 'completed',
        createdAt: new Date().toISOString()
      };

      if (!transactions.has(userId)) {
        transactions.set(userId, []);
      }
      transactions.get(userId).push(transaction);

      return res.status(200).json({
        success: true,
        message: 'Funds added successfully',
        data: {
          wallet,
          transaction
        }
      });

    default:
      return res.status(400).json({
        error: 'Invalid action',
        message: 'Supported actions: get, add-funds'
      });
  }
}

// Get transactions
async function handleGetTransactions(req, res, body) {
  const { userId, limit = 10, offset = 0 } = body;

  if (!userId) {
    return res.status(400).json({
      error: 'Missing user ID',
      message: 'User ID is required'
    });
  }

  const userTransactions = transactions.get(userId) || [];

  // Sort by creation date (newest first)
  userTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Apply pagination
  const paginatedTransactions = userTransactions.slice(offset, offset + parseInt(limit));

  return res.status(200).json({
    success: true,
    data: {
      transactions: paginatedTransactions,
      pagination: {
        total: userTransactions.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: offset + parseInt(limit) < userTransactions.length
      }
    }
  });
}

