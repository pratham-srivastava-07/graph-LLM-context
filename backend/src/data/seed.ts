import { getDb, createSchema } from '../services/db';
import {
  customers, addresses, products, orders,
  orderItems, deliveries, invoices, payments
} from './sampleData';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');

function seed(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  createSchema();
  const db = getDb();

  console.log('🌱 Seeding database...');

  // Clear existing data
  db.exec(`
    DELETE FROM payments;
    DELETE FROM invoices;
    DELETE FROM deliveries;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM products;
    DELETE FROM addresses;
    DELETE FROM customers;
  `);

  const insertCustomer = db.prepare(`INSERT INTO customers VALUES (@id,@name,@email,@phone,@segment,@region,@created_at)`);
  const insertAddress = db.prepare(`INSERT INTO addresses VALUES (@id,@street,@city,@state,@country,@postal_code,@type)`);
  const insertProduct = db.prepare(`INSERT INTO products VALUES (@id,@name,@sku,@category,@unit_price,@uom,@weight_kg)`);
  const insertOrder = db.prepare(`INSERT INTO orders VALUES (@id,@order_number,@customer_id,@status,@priority,@order_date,@requested_delivery_date,@shipping_address_id,@total_amount,@currency,@sales_org,@distribution_channel)`);
  const insertItem = db.prepare(`INSERT INTO order_items VALUES (@id,@order_id,@product_id,@quantity,@unit_price,@discount_pct,@net_amount,@line_number)`);
  const insertDelivery = db.prepare(`INSERT INTO deliveries VALUES (@id,@delivery_number,@order_id,@address_id,@status,@carrier,@tracking_number,@shipped_date,@delivered_date,@estimated_delivery)`);
  const insertInvoice = db.prepare(`INSERT INTO invoices VALUES (@id,@invoice_number,@order_id,@status,@issue_date,@due_date,@total_amount,@tax_amount,@currency,@billing_address_id)`);
  const insertPayment = db.prepare(`INSERT INTO payments VALUES (@id,@payment_reference,@invoice_id,@amount,@currency,@method,@status,@payment_date,@cleared_date)`);

  const seedAll = db.transaction(() => {
    customers.forEach(r => insertCustomer.run(r));
    addresses.forEach(r => insertAddress.run(r));
    products.forEach(r => insertProduct.run(r));
    orders.forEach(r => insertOrder.run(r));
    orderItems.forEach(r => insertItem.run(r));
    deliveries.forEach(r => insertDelivery.run(r));
    invoices.forEach(r => insertInvoice.run(r));
    payments.forEach(r => insertPayment.run(r));
  });

  seedAll();

  console.log(`✅ Seeded:
    - ${customers.length} customers
    - ${addresses.length} addresses
    - ${products.length} products
    - ${orders.length} orders
    - ${orderItems.length} order items
    - ${deliveries.length} deliveries
    - ${invoices.length} invoices
    - ${payments.length} payments`);
}

seed();
export { seed };