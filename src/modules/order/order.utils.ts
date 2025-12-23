import PDFDocument from 'pdfkit';
import { Order, User, OrderItem, Product } from '@prisma/client';

// Define a more specific type for our hydrated order object
type FullOrder = Order & {
    user: User;
    items: (OrderItem & {
        product: Product;
    })[];
};

export const generateInvoicePDF = (
  order: FullOrder,
  dataCallback: (chunk: any) => void,
  endCallback: () => void
) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.on('data', dataCallback);
  doc.on('end', endCallback);

  // Header
  doc
    .fontSize(20)
    .text('Invoice', { align: 'center' });

  doc.moveDown();

  // Company and Customer Info
  doc.fontSize(12);
  doc.text('Madhoor Pureline', { align: 'left' });
  doc.text(`Invoice #: ${order.id}`, { align: 'right' });
  doc.text(`Date: ${order.createdAt.toLocaleDateString()}`, { align: 'right' });
  
  doc.moveDown();
  
  doc.text('Bill To:', { align: 'left' });
  doc.text(order.user.name || 'Valued Customer');
  doc.text(order.user.email);

  doc.moveDown(2);

  // Table Header
  const tableTop = doc.y;
  doc.font('Helvetica-Bold');
  doc.text('Item', 50, tableTop);
  doc.text('Quantity', 280, tableTop, { width: 90, align: 'right' });
  doc.text('Unit Price', 370, tableTop, { width: 90, align: 'right' });
  doc.text('Total', 0, tableTop, { width: 450, align: 'right' });
  doc.font('Helvetica');
  
  // Draw horizontal line
  doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

  // Table Rows
  let itemY = tableTop + 30;
  order.items.forEach(item => {
    doc.text(item.product.name, 50, itemY);
    doc.text(item.quantity.toString(), 280, itemY, { width: 90, align: 'right' });
    doc.text(`Rs. ${item.price.toFixed(2)}`, 370, itemY, { width: 90, align: 'right' });
    doc.text(`Rs. ${(item.price * item.quantity).toFixed(2)}`, 0, itemY, { width: 450, align: 'right' });
    itemY += 25;
  });

  // Draw horizontal line
  doc.moveTo(50, itemY).lineTo(550, itemY).stroke();

  // Total
  doc.moveDown();
  doc.font('Helvetica-Bold');
  doc.text(`Total Amount: Rs. ${order.totalAmount.toFixed(2)}`, { align: 'right' });
  doc.font('Helvetica');
  doc.moveDown();
  doc.text(`Payment ID: ${order.paymentId}`, { align: 'right' });


  // Footer
  doc.fontSize(10).text('Thank you for your purchase!', 50, doc.page.height - 50, {
      align: 'center',
      lineBreak: false
  });


  doc.end();
};
