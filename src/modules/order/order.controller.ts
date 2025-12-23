import { Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Prisma } from '@prisma/client';
import prisma from '../../db';
import { generateInvoicePDF } from './order.utils';

// Initialize Razorpay client
// Make sure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are in your .env file
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// --- User Checkout Flow ---

// POST /api/orders/buy-now
// Creates a Razorpay order for a single product purchase
export const createBuyNowOrder = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Product ID and a valid quantity are required' });
    }

    try {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const totalAmount = product.price * quantity;

        const options = {
            amount: totalAmount * 100, // Amount in the smallest currency unit (paise)
            currency: 'INR',
            receipt: `receipt_order_${new Date().getTime()}`,
        };

        const order = await razorpay.orders.create(options);
        res.status(201).json({ order, key_id: process.env.RAZORPAY_KEY_ID });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating Razorpay order' });
    }
};


// POST /api/orders/verify-payment
// Verifies the payment and creates an order in the database
export const verifyPaymentAndCreateOrder = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    const userId = req.user.id;

    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        items, // Expecting an array of { productId, quantity }
        shippingAddress // Added shippingAddress
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !items || !Array.isArray(items) || !shippingAddress) {
        return res.status(400).json({ message: 'Missing required fields. Payment details, items, and shipping address are required.' });
    }
    
    // --- Verify Signature ---
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body.toString())
        .digest('hex');
        
    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Invalid payment signature' });
    }

    try {
        // --- Calculate Total and Prepare Order Items ---
        let totalAmount = 0;
        const productIds = items.map((item: { productId: string; }) => item.productId);

        const products = await prisma.product.findMany({
            where: { id: { in: productIds } }
        });

        const itemsToOrder: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = items.map((item: { productId: string; quantity: number; }) => {
            const product = products.find(p => p.id === item.productId);
            if (!product) {
                throw new Error(`Product with ID ${item.productId} not found`);
            }
            totalAmount += product.price * item.quantity;
            return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price // Capture price at time of order
            };
        });


        // --- Create Order in DB ---
        // Explicitly define the type for our order data to ensure type safety
        const orderData: Prisma.OrderCreateInput = {
            user: {
                connect: { id: userId },
            },
            totalAmount: totalAmount, // Changed from 'total' to 'totalAmount'
            shippingAddress: shippingAddress, // Added shippingAddress
            status: 'PAID',
            paymentId: razorpay_payment_id,
            items: {
                create: itemsToOrder,
            },
        };

        const newOrder = await prisma.order.create({
            data: orderData,
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });
        
        res.status(201).json({ message: 'Payment verified and order created', data: newOrder });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error processing order' });
    }
};

// --- Admin & User Order Management ---

// GET /api/orders
// Fetches all orders (for admin) or the user's own orders
export const getOrders = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    try {
        const whereClause = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
        
        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                user: {
                    select: { name: true, email: true }
                },
                items: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json({ data: orders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

// GET /api/orders/:id/invoice
// Generates and sends a PDF invoice for an order
export const getOrderInvoice = async (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'Order ID is required' });
    }

    try {
        const whereClause = req.user.role === 'ADMIN' ? { id } : { id, userId: req.user.id };

        const order = await prisma.order.findFirst({
            where: whereClause,
            include: {
                user: true,
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or you do not have permission to view it' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.id}.pdf`);
        
        generateInvoicePDF(order, (chunk) => res.write(chunk), () => res.end());

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating invoice' });
    }
};

