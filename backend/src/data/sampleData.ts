import type {
  Customer, Address, Product, Order,
  OrderItem, Delivery, Invoice, Payment
} from '../types';

export const customers: Customer[] = [
  { id: 'C001', name: 'Acme Corporation', email: 'procurement@acme.com', phone: '+1-555-0101', segment: 'Enterprise', region: 'North America', created_at: '2022-01-15' },
  { id: 'C002', name: 'TechNova GmbH', email: 'orders@technova.de', phone: '+49-555-0202', segment: 'Enterprise', region: 'Europe', created_at: '2022-03-20' },
  { id: 'C003', name: 'Sunrise Retail Ltd', email: 'buying@sunrise.co.uk', phone: '+44-555-0303', segment: 'Retail', region: 'Europe', created_at: '2022-06-10' },
  { id: 'C004', name: 'Pacific Traders Inc', email: 'supply@pacific.com', phone: '+1-555-0404', segment: 'SMB', region: 'Asia Pacific', created_at: '2023-01-05' },
  { id: 'C005', name: 'Global Dynamics SA', email: 'purchase@globaldyn.fr', phone: '+33-555-0505', segment: 'Enterprise', region: 'Europe', created_at: '2023-04-18' },
];

export const addresses: Address[] = [
  { id: 'A001', street: '123 Corporate Blvd', city: 'New York', state: 'NY', country: 'USA', postal_code: '10001', type: 'Billing' },
  { id: 'A002', street: '456 Warehouse Ave', city: 'Newark', state: 'NJ', country: 'USA', postal_code: '07102', type: 'Shipping' },
  { id: 'A003', street: 'Technologiepark 7', city: 'Munich', state: 'Bavaria', country: 'Germany', postal_code: '80331', type: 'Billing' },
  { id: 'A004', street: 'Industriestrasse 22', city: 'Frankfurt', state: 'Hesse', country: 'Germany', postal_code: '60311', type: 'Shipping' },
  { id: 'A005', street: '10 High Street', city: 'London', state: 'England', country: 'UK', postal_code: 'EC1A 1BB', type: 'Billing' },
  { id: 'A006', street: '5 Logistics Park', city: 'Birmingham', state: 'England', country: 'UK', postal_code: 'B1 1AA', type: 'Shipping' },
  { id: 'A007', street: '99 Harbor Rd', city: 'San Francisco', state: 'CA', country: 'USA', postal_code: '94105', type: 'Shipping' },
  { id: 'A008', street: '14 Rue de Commerce', city: 'Paris', state: 'Île-de-France', country: 'France', postal_code: '75001', type: 'Billing' },
  { id: 'A009', street: '200 Boulevard Haussmann', city: 'Paris', state: 'Île-de-France', country: 'France', postal_code: '75008', type: 'Shipping' },
];

export const products: Product[] = [
  { id: 'P001', name: 'Industrial Pump Model X200', sku: 'SKU-PMP-200', category: 'Machinery', unit_price: 4500.00, uom: 'EA', weight_kg: 45.0 },
  { id: 'P002', name: 'Control Panel Unit CPL-500', sku: 'SKU-CPL-500', category: 'Electronics', unit_price: 1200.00, uom: 'EA', weight_kg: 8.5 },
  { id: 'P003', name: 'Stainless Steel Pipe DN100', sku: 'SKU-PIP-DN100', category: 'Materials', unit_price: 85.00, uom: 'M', weight_kg: 3.2 },
  { id: 'P004', name: 'Hydraulic Valve HV-750', sku: 'SKU-HV-750', category: 'Components', unit_price: 320.00, uom: 'EA', weight_kg: 2.1 },
  { id: 'P005', name: 'Sensor Module SM-900', sku: 'SKU-SM-900', category: 'Electronics', unit_price: 650.00, uom: 'EA', weight_kg: 0.8 },
  { id: 'P006', name: 'Safety Relief Valve SRV-1', sku: 'SKU-SRV-001', category: 'Safety', unit_price: 210.00, uom: 'EA', weight_kg: 1.5 },
  { id: 'P007', name: 'Electrical Cable 3x2.5mm', sku: 'SKU-CAB-325', category: 'Materials', unit_price: 4.50, uom: 'M', weight_kg: 0.1 },
  { id: 'P008', name: 'Compressor Unit CU-2000', sku: 'SKU-CMP-2000', category: 'Machinery', unit_price: 8900.00, uom: 'EA', weight_kg: 120.0 },
];

export const orders: Order[] = [
  { id: 'ORD001', order_number: 'SO-2024-0001', customer_id: 'C001', status: 'Delivered', priority: 'High', order_date: '2024-01-10', requested_delivery_date: '2024-02-01', shipping_address_id: 'A002', total_amount: 23850.00, currency: 'USD', sales_org: '1000', distribution_channel: '10' },
  { id: 'ORD002', order_number: 'SO-2024-0002', customer_id: 'C002', status: 'Shipped', priority: 'Medium', order_date: '2024-01-15', requested_delivery_date: '2024-02-10', shipping_address_id: 'A004', total_amount: 15600.00, currency: 'EUR', sales_org: '2000', distribution_channel: '10' },
  { id: 'ORD003', order_number: 'SO-2024-0003', customer_id: 'C003', status: 'Delivered', priority: 'Low', order_date: '2024-01-20', requested_delivery_date: '2024-02-15', shipping_address_id: 'A006', total_amount: 5320.00, currency: 'GBP', sales_org: '3000', distribution_channel: '20' },
  { id: 'ORD004', order_number: 'SO-2024-0004', customer_id: 'C001', status: 'Confirmed', priority: 'High', order_date: '2024-02-05', requested_delivery_date: '2024-03-01', shipping_address_id: 'A002', total_amount: 43200.00, currency: 'USD', sales_org: '1000', distribution_channel: '10' },
  { id: 'ORD005', order_number: 'SO-2024-0005', customer_id: 'C004', status: 'Delivered', priority: 'Medium', order_date: '2024-02-10', requested_delivery_date: '2024-03-05', shipping_address_id: 'A007', total_amount: 12450.00, currency: 'USD', sales_org: '1000', distribution_channel: '30' },
  { id: 'ORD006', order_number: 'SO-2024-0006', customer_id: 'C005', status: 'Open', priority: 'Medium', order_date: '2024-02-20', requested_delivery_date: '2024-03-20', shipping_address_id: 'A009', total_amount: 9870.00, currency: 'EUR', sales_org: '4000', distribution_channel: '10' },
  { id: 'ORD007', order_number: 'SO-2024-0007', customer_id: 'C002', status: 'Cancelled', priority: 'Low', order_date: '2024-02-25', requested_delivery_date: '2024-03-25', shipping_address_id: 'A004', total_amount: 3200.00, currency: 'EUR', sales_org: '2000', distribution_channel: '10' },
  { id: 'ORD008', order_number: 'SO-2024-0008', customer_id: 'C003', status: 'Confirmed', priority: 'High', order_date: '2024-03-01', requested_delivery_date: '2024-04-01', shipping_address_id: 'A006', total_amount: 78600.00, currency: 'GBP', sales_org: '3000', distribution_channel: '10' },
];

export const orderItems: OrderItem[] = [
  { id: 'OI001', order_id: 'ORD001', product_id: 'P001', quantity: 2, unit_price: 4500.00, discount_pct: 5, net_amount: 8550.00, line_number: 1 },
  { id: 'OI002', order_id: 'ORD001', product_id: 'P002', quantity: 5, unit_price: 1200.00, discount_pct: 5, net_amount: 5700.00, line_number: 2 },
  { id: 'OI003', order_id: 'ORD001', product_id: 'P003', quantity: 100, unit_price: 85.00, discount_pct: 0, net_amount: 8500.00, line_number: 3 },
  { id: 'OI004', order_id: 'ORD001', product_id: 'P004', quantity: 5, unit_price: 320.00, discount_pct: 10, net_amount: 1440.00, line_number: 4 },
  { id: 'OI005', order_id: 'ORD002', product_id: 'P002', quantity: 8, unit_price: 1200.00, discount_pct: 0, net_amount: 9600.00, line_number: 1 },
  { id: 'OI006', order_id: 'ORD002', product_id: 'P005', quantity: 10, unit_price: 650.00, discount_pct: 8, net_amount: 5980.00, line_number: 2 },
  { id: 'OI007', order_id: 'ORD003', product_id: 'P006', quantity: 12, unit_price: 210.00, discount_pct: 0, net_amount: 2520.00, line_number: 1 },
  { id: 'OI008', order_id: 'ORD003', product_id: 'P007', quantity: 200, unit_price: 4.50, discount_pct: 0, net_amount: 900.00, line_number: 2 },
  { id: 'OI009', order_id: 'ORD003', product_id: 'P004', quantity: 4, unit_price: 320.00, discount_pct: 12, net_amount: 1126.00, line_number: 3 },
  { id: 'OI010', order_id: 'ORD004', product_id: 'P008', quantity: 2, unit_price: 8900.00, discount_pct: 10, net_amount: 16020.00, line_number: 1 },
  { id: 'OI011', order_id: 'ORD004', product_id: 'P001', quantity: 4, unit_price: 4500.00, discount_pct: 10, net_amount: 16200.00, line_number: 2 },
  { id: 'OI012', order_id: 'ORD004', product_id: 'P005', quantity: 3, unit_price: 650.00, discount_pct: 5, net_amount: 1852.50, line_number: 3 },
  { id: 'OI013', order_id: 'ORD005', product_id: 'P002', quantity: 6, unit_price: 1200.00, discount_pct: 0, net_amount: 7200.00, line_number: 1 },
  { id: 'OI014', order_id: 'ORD005', product_id: 'P006', quantity: 8, unit_price: 210.00, discount_pct: 5, net_amount: 1596.00, line_number: 2 },
  { id: 'OI015', order_id: 'ORD005', product_id: 'P007', quantity: 400, unit_price: 4.50, discount_pct: 0, net_amount: 1800.00, line_number: 3 },
  { id: 'OI016', order_id: 'ORD006', product_id: 'P005', quantity: 8, unit_price: 650.00, discount_pct: 5, net_amount: 4940.00, line_number: 1 },
  { id: 'OI017', order_id: 'ORD006', product_id: 'P004', quantity: 5, unit_price: 320.00, discount_pct: 0, net_amount: 1600.00, line_number: 2 },
  { id: 'OI018', order_id: 'ORD006', product_id: 'P007', quantity: 300, unit_price: 4.50, discount_pct: 0, net_amount: 1350.00, line_number: 3 },
  { id: 'OI019', order_id: 'ORD007', product_id: 'P002', quantity: 2, unit_price: 1200.00, discount_pct: 0, net_amount: 2400.00, line_number: 1 },
  { id: 'OI020', order_id: 'ORD007', product_id: 'P006', quantity: 4, unit_price: 210.00, discount_pct: 0, net_amount: 840.00, line_number: 2 },
  { id: 'OI021', order_id: 'ORD008', product_id: 'P008', quantity: 5, unit_price: 8900.00, discount_pct: 5, net_amount: 42275.00, line_number: 1 },
  { id: 'OI022', order_id: 'ORD008', product_id: 'P001', quantity: 4, unit_price: 4500.00, discount_pct: 0, net_amount: 18000.00, line_number: 2 },
  { id: 'OI023', order_id: 'ORD008', product_id: 'P002', quantity: 8, unit_price: 1200.00, discount_pct: 10, net_amount: 8640.00, line_number: 3 },
];

export const deliveries: Delivery[] = [
  { id: 'DEL001', delivery_number: 'DN-2024-0001', order_id: 'ORD001', address_id: 'A002', status: 'Delivered', carrier: 'FedEx', tracking_number: 'FX123456789', shipped_date: '2024-01-18', delivered_date: '2024-01-25', estimated_delivery: '2024-01-26' },
  { id: 'DEL002', delivery_number: 'DN-2024-0002', order_id: 'ORD002', address_id: 'A004', status: 'In Transit', carrier: 'DHL', tracking_number: 'DHL987654321', shipped_date: '2024-01-22', delivered_date: null, estimated_delivery: '2024-02-05' },
  { id: 'DEL003', delivery_number: 'DN-2024-0003', order_id: 'ORD003', address_id: 'A006', status: 'Delivered', carrier: 'UPS', tracking_number: 'UPS111222333', shipped_date: '2024-01-28', delivered_date: '2024-02-03', estimated_delivery: '2024-02-05' },
  { id: 'DEL004', delivery_number: 'DN-2024-0004', order_id: 'ORD005', address_id: 'A007', status: 'Delivered', carrier: 'FedEx', tracking_number: 'FX444555666', shipped_date: '2024-02-18', delivered_date: '2024-02-24', estimated_delivery: '2024-02-25' },
  { id: 'DEL005', delivery_number: 'DN-2024-0005', order_id: 'ORD004', address_id: 'A002', status: 'Pending', carrier: 'FedEx', tracking_number: null as unknown as string, shipped_date: null, delivered_date: null, estimated_delivery: '2024-03-10' },
];

export const invoices: Invoice[] = [
  { id: 'INV001', invoice_number: 'IV-2024-0001', order_id: 'ORD001', status: 'Paid', issue_date: '2024-01-26', due_date: '2024-02-25', total_amount: 23850.00, tax_amount: 3577.50, currency: 'USD', billing_address_id: 'A001' },
  { id: 'INV002', invoice_number: 'IV-2024-0002', order_id: 'ORD003', status: 'Paid', issue_date: '2024-02-04', due_date: '2024-03-05', total_amount: 5320.00, tax_amount: 1064.00, currency: 'GBP', billing_address_id: 'A005' },
  { id: 'INV003', invoice_number: 'IV-2024-0003', order_id: 'ORD005', status: 'Partial', issue_date: '2024-02-25', due_date: '2024-03-26', total_amount: 12450.00, tax_amount: 1867.50, currency: 'USD', billing_address_id: 'A007' },
  { id: 'INV004', invoice_number: 'IV-2024-0004', order_id: 'ORD002', status: 'Issued', issue_date: '2024-02-10', due_date: '2024-03-11', total_amount: 15600.00, tax_amount: 2964.00, currency: 'EUR', billing_address_id: 'A003' },
  { id: 'INV005', invoice_number: 'IV-2024-0005', order_id: 'ORD004', status: 'Draft', issue_date: '2024-03-01', due_date: '2024-03-31', total_amount: 43200.00, tax_amount: 8208.00, currency: 'USD', billing_address_id: 'A001' },
];

export const payments: Payment[] = [
  { id: 'PAY001', payment_reference: 'PAY-2024-0001', invoice_id: 'INV001', amount: 23850.00, currency: 'USD', method: 'Bank Transfer', status: 'Cleared', payment_date: '2024-02-20', cleared_date: '2024-02-22' },
  { id: 'PAY002', payment_reference: 'PAY-2024-0002', invoice_id: 'INV002', amount: 5320.00, currency: 'GBP', method: 'Bank Transfer', status: 'Cleared', payment_date: '2024-03-01', cleared_date: '2024-03-03' },
  { id: 'PAY003', payment_reference: 'PAY-2024-0003', invoice_id: 'INV003', amount: 6000.00, currency: 'USD', method: 'Credit Card', status: 'Cleared', payment_date: '2024-03-15', cleared_date: '2024-03-15' },
  { id: 'PAY004', payment_reference: 'PAY-2024-0004', invoice_id: 'INV004', amount: 7800.00, currency: 'EUR', method: 'ACH', status: 'Pending', payment_date: '2024-03-05', cleared_date: null },
];