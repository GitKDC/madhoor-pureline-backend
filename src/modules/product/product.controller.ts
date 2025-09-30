import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../db';

// --- Public Access ---

// GET /api/products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    res.status(200).json({ data: products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};

// GET /api/products/:id
export const getOneProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching product' });
  }
};


// --- Admin Access ---

// POST /api/products
export const createProduct = async (req: Request, res: Response) => {
  const { name, description, price, imageUrl } = req.body;

  if (!name || !description || price === undefined) {
    return res.status(400).json({ message: 'Missing required fields: name, description, price' });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
      },
    });
    res.status(201).json({ data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating product' });
  }
};

// PUT /api/products/:id
export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, price, imageUrl } = req.body;

  try {
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: price !== undefined ? parseFloat(price) : undefined,
        imageUrl,
      },
    });
    res.status(200).json({ data: updatedProduct });
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle case where product to update is not found
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Product not found' });
      }
    }
    res.status(500).json({ message: 'Error updating product' });
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.product.delete({
      where: { id },
    });
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle case where product to delete is not found
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Product not found' });
      }
    }
    res.status(500).json({ message: 'Error deleting product' });
  }
};

