import { Request, Response } from 'express';
import prisma from '../../db';

// GET /api/cart - Get the user's cart
export const getCart = async (req: Request, res: Response) => {

  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  try {
    const cart = await prisma.cart.findUnique({
      where: {
        userId: req.user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.status(200).json({ data: cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching cart' });
  }
};

// POST /api/cart - Add an item to the cart
export const addToCart = async (req: Request, res: Response) => {
  const { productId, quantity } = req.body;

  if (!productId || quantity === undefined) {
    return res.status(400).json({ message: 'Missing productId or quantity' });
  }

  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const userCart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
    });

    if (!userCart) {
        return res.status(404).json({ message: "User cart not found"});
    }

    // Check if the item is already in the cart
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: userCart.id,
        productId,
      },
    });

    if (existingCartItem) {
      // If it exists, update the quantity
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: {
          quantity: existingCartItem.quantity + parseInt(quantity, 10),
        },
        include: { product: true }
      });
      return res.status(200).json({ data: updatedItem });
    } else {
      // If it doesn't exist, create a new cart item
      const newCartItem = await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId,
          quantity: parseInt(quantity, 10),
        },
        include: { product: true }
      });
      return res.status(201).json({ data: newCartItem });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding item to cart' });
  }
};

// PUT /api/cart/items/:itemId - Update cart item quantity
export const updateCartItem = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const { itemId } = req.params;
  const { quantity } = req.body;

  if (!itemId) {
    return res.status(400).json({ message: 'Item ID is required in URL' });
  }

  if (quantity === undefined || parseInt(quantity, 10) < 0) {
    return res.status(400).json({ message: 'Invalid quantity provided' });
  }

  try {
    // This query ensures a user can only update items in their own cart
    const updateResult = await prisma.cartItem.updateMany({
        where: {
            id: itemId,
            cart: {
                userId: req.user.id,
            }
        },
        data: {
            quantity: parseInt(quantity, 10),
        }
    });

    if (updateResult.count === 0) {
        return res.status(404).json({ message: 'Cart item not found or you do not have permission to update it.'});
    }

    // If quantity is 0, delete the item
    if (parseInt(quantity, 10) === 0) {
        await prisma.cartItem.deleteMany({
            where: {
                id: itemId,
                cart: {
                    userId: req.user.id
                }
            }
        });
        return res.status(200).json({ message: 'Item removed from cart' });
    }

    res.status(200).json({ message: 'Cart item updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating cart item' });
  }
};


// DELETE /api/cart/items/:itemId - Remove an item from the cart
export const removeCartItem = async (req: Request, res: Response) => {
  const { itemId } = req.params;

  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (!itemId) {
    return res.status(400).json({ message: 'Item ID is required in URL' });
  }
  
  try {
    // This query ensures a user can only delete items from their own cart
    const deleteResult = await prisma.cartItem.deleteMany({
      where: {
        id: itemId,
        cart: {
          userId: req.user.id,
        },
      },
    });

    if (deleteResult.count === 0) {
        return res.status(404).json({ message: 'Cart item not found or you do not have permission to delete it.' });
    }

    res.status(200).json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error removing item from cart' });
  }
};

