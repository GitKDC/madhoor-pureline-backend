import { Router } from 'express';
import { protect, isAdmin } from '../../middleware/auth';
import {
  createBuyNowOrder,
  verifyPaymentAndCreateOrder,
  getAllOrdersForAdmin,
  getOrderInvoice,
} from './order.controller';

const router = Router();

// --- User Routes (Protected) ---
// All these routes require a user to be logged in
router.post('/buy-now', protect, createBuyNowOrder);
router.post('/verify-payment', protect, verifyPaymentAndCreateOrder);
router.get('/:orderId/invoice', protect, getOrderInvoice);


// --- Admin Routes (Protected) ---
// This route requires an admin to be logged in
router.get('/admin/all', protect, isAdmin, getAllOrdersForAdmin);


export default router;
