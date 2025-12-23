import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem } from './cart.controller';
import { protect } from '../../middleware/auth';

const cartRoutes = Router();

// All cart routes are protected
cartRoutes.use(protect);

cartRoutes.get('/', getCart);
cartRoutes.post('/', addToCart);
cartRoutes.put('/items/:itemId', updateCartItem);
cartRoutes.delete('/items/:itemId', removeCartItem);

export default cartRoutes;
