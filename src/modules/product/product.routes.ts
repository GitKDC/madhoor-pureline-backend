import { Router } from 'express';
import { protect, isAdmin } from '../../middlewares/auth';
import { 
    getProducts, 
    getOneProduct, 
    createProduct, 
    updateProduct, 
    deleteProduct 
} from './product.controller';

const router = Router();

// --- Public Routes ---
// Anyone can view products
router.get('/', getProducts);
router.get('/:id', getOneProduct);


// --- Admin Routes ---
// Only logged-in admins can create, update, or delete products
router.post('/', protect, isAdmin, createProduct);
router.put('/:id', protect, isAdmin, updateProduct);
router.delete('/:id', protect, isAdmin, deleteProduct);

export default router;
