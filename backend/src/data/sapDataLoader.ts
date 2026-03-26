import fs from 'fs';
import path from 'path';
import type {
  Customer, Address, Product, Order,
  OrderItem, Delivery, Invoice, Payment
} from '../types';

interface SAPBusinessPartner {
  businessPartner: string;
  customer: string;
  businessPartnerFullName: string;
  businessPartnerGrouping: string;
  organizationBpName1: string;
  organizationBpName2: string;
  businessPartnerIsBlocked: boolean;
  creationDate: string;
}

interface SAPSalesOrderHeader {
  salesOrder: string;
  salesOrderType: string;
  salesOrganization: string;
  distributionChannel: string;
  organizationDivision: string;
  soldToParty: string;
  creationDate: string;
  totalNetAmount: string;
  transactionCurrency: string;
  requestedDeliveryDate: string;
  overallDeliveryStatus: string;
}

interface SAPSalesOrderItem {
  salesOrder: string;
  salesOrderItem: string;
  material: string;
  requestedQuantity: string;
  requestedQuantityUnit: string;
  netAmount: string;
  materialGroup: string;
  productionPlant: string;
  storageLocation: string;
}

interface SAPProduct {
  product: string;
  productType: string;
  productOldId: string;
  grossWeight: string;
  weightUnit: string;
  netWeight: string;
  productGroup: string;
  baseUnit: string;
  division: string;
}

interface SAPBillingDocumentHeader {
  billingDocument: string;
  billingDocumentType: string;
  creationDate: string;
  billingDocumentDate: string;
  totalNetAmount: string;
  transactionCurrency: string;
  soldToParty: string;
  companyCode: string;
  fiscalYear: string;
  accountingDocument: string;
  billingDocumentIsCancelled: boolean;
}

interface SAPBillingDocumentItem {
  billingDocument: string;
  billingDocumentItem: string;
  salesOrder: string;
  salesOrderItem: string;
  material: string;
  billedQuantity: string;
  netAmount: string;
  transactionCurrency: string;
  referenceSdDocument: string;
  referenceSdDocumentItem: string;
}

interface SAPOutboundDeliveryHeader {
  deliveryDocument: string;
  creationDate: string;
  actualGoodsMovementDate: string;
  totalDeliveryQuantity: string;
  deliveryQuantityUnit: string;
  shippingPoint: string;
  shippingPointName: string;
  shipToParty: string;
}

interface SAPOutboundDeliveryItem {
  deliveryDocument: string;
  deliveryDocumentItem: string;
  salesOrder: string;
  salesOrderItem: string;
  material: string;
  actualDeliveredQuantityInBaseUnit: string;
  baseUnit: string;
  referenceSdDocument: string;
  referenceSdDocumentItem: string;
}

interface SAPPayment {
  companyCode: string;
  fiscalYear: string;
  accountingDocument: string;
  clearingAccountingDocument: string;
  amountInTransactionCurrency: string;
  transactionCurrency: string;
  customer: string;
  postingDate: string;
  documentDate: string;
  clearingDate: string;
}

// Robust root directory resolution
const BACKEND_ROOT = path.join(__dirname, '..', '..');
const DATA_DIR = path.join(BACKEND_ROOT, 'sap-o2c-data');

/**
 * Helper to find the first .jsonl file in a directory
 * This avoids brittle hardcoded filenames with timestamps
 */
function findJsonlFile(directory: string): string | null {
  const fullDirPath = path.join(DATA_DIR, directory);
  if (!fs.existsSync(fullDirPath)) {
    console.warn(`Directory not found: ${fullDirPath}`);
    return null;
  }
  
  const files = fs.readdirSync(fullDirPath);
  const jsonlFile = files.find(f => f.endsWith('.jsonl'));
  
  if (!jsonlFile) {
    console.warn(`No .jsonl file found in: ${fullDirPath}`);
    return null;
  }
  
  return path.join(fullDirPath, jsonlFile);
}

function readJsonlFile<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  
  return lines
    .filter(line => line.trim())
    .map(line => {
      try {
        return JSON.parse(line) as T;
      } catch (error) {
        console.warn(`Failed to parse line: ${line}`);
        return null;
      }
    })
    .filter(item => item !== null) as T[];
}

export function loadSAPData() {
  console.log('📊 Loading SAP O2C dataset...');
  
  // Load Business Partners (Customers)
  const bpFile = findJsonlFile('business_partners');
  const businessPartners = bpFile ? readJsonlFile<SAPBusinessPartner>(bpFile) : [];
  
  // Load Sales Orders
  const soHeaderFile = findJsonlFile('sales_order_headers');
  const salesOrderHeaders = soHeaderFile ? readJsonlFile<SAPSalesOrderHeader>(soHeaderFile) : [];
  
  const soItemFile = findJsonlFile('sales_order_items');
  const salesOrderItems = soItemFile ? readJsonlFile<SAPSalesOrderItem>(soItemFile) : [];
  
  // Load Products
  const productFile = findJsonlFile('products');
  const products = productFile ? readJsonlFile<SAPProduct>(productFile) : [];
  
  // Load Billing Documents (Invoices)
  const billingHeaderFile = findJsonlFile('billing_document_headers');
  const billingHeaders = billingHeaderFile ? readJsonlFile<SAPBillingDocumentHeader>(billingHeaderFile) : [];
  
  const billingItemFile = findJsonlFile('billing_document_items');
  const billingItems = billingItemFile ? readJsonlFile<SAPBillingDocumentItem>(billingItemFile) : [];
  
  // Load Deliveries
  const deliveryHeaderFile = findJsonlFile('outbound_delivery_headers');
  const deliveryHeaders = deliveryHeaderFile ? readJsonlFile<SAPOutboundDeliveryHeader>(deliveryHeaderFile) : [];
  
  const deliveryItemFile = findJsonlFile('outbound_delivery_items');
  const deliveryItems = deliveryItemFile ? readJsonlFile<SAPOutboundDeliveryItem>(deliveryItemFile) : [];
  
  // Load Payments
  const paymentFile = findJsonlFile('payments_accounts_receivable');
  const payments = paymentFile ? readJsonlFile<SAPPayment>(paymentFile) : [];
  
  // Transform to our schema
  const customers: Customer[] = businessPartners.map((bp, index) => ({
    id: bp.customer,
    name: bp.businessPartnerFullName,
    email: `customer${bp.customer}@sap-o2c.com`,
    phone: `+1-555-${String(index).padStart(4, '0')}`,
    segment: bp.businessPartnerGrouping === 'Y101' ? 'Enterprise' : 'SMB',
    region: 'Global',
    created_at: bp.creationDate.split('T')[0]
  }));
  
  const addresses: Address[] = businessPartners.map((bp, index) => ({
    id: `ADDR${index + 1}`,
    street: `${index + 1} SAP Street`,
    city: 'SAP City',
    state: 'Technology State',
    country: 'Global',
    postal_code: `${String(index + 1).padStart(5, '0')}`,
    type: 'Shipping'
  }));
  
  const transformedProducts: Product[] = products.map((p, index) => ({
    id: p.product,
    name: p.productOldId || `Product ${p.product}`,
    sku: p.product,
    category: p.productGroup,
    unit_price: parseFloat(p.grossWeight) || 100.0, // Using weight as placeholder price
    uom: p.baseUnit,
    weight_kg: parseFloat(p.netWeight) || 1.0
  }));
  
  const orders: Order[] = salesOrderHeaders.map(so => ({
    id: so.salesOrder,
    order_number: `SO-${so.salesOrder}`,
    customer_id: so.soldToParty,
    status: so.overallDeliveryStatus === 'C' ? 'Delivered' : 'Open',
    priority: 'Medium',
    order_date: so.creationDate.split('T')[0],
    requested_delivery_date: so.requestedDeliveryDate.split('T')[0],
    shipping_address_id: addresses[0]?.id || 'ADDR1',
    total_amount: parseFloat(so.totalNetAmount) || 0,
    currency: so.transactionCurrency,
    sales_org: so.salesOrganization,
    distribution_channel: so.distributionChannel
  }));
  
  const orderItems: OrderItem[] = salesOrderItems.map((item, index) => ({
    id: `OI${index + 1}`,
    order_id: item.salesOrder,
    product_id: item.material,
    quantity: parseInt(item.requestedQuantity) || 1,
    unit_price: parseFloat(item.netAmount) / parseInt(item.requestedQuantity) || 0,
    discount_pct: 0,
    net_amount: parseFloat(item.netAmount) || 0,
    line_number: parseInt(item.salesOrderItem) || 1
  }));
  
  const invoices: Invoice[] = billingHeaders.map(bh => {
    const billingItem = billingItems.find(bi => bi.billingDocument === bh.billingDocument);
    const orderId = billingItem?.referenceSdDocument || '';
    // Temporarily skip foreign key check to see what we get
    return {
      id: bh.billingDocument,
      invoice_number: `INV-${bh.billingDocument}`,
      order_id: orderId, // Keep the reference even if it doesn't match
      status: (bh.billingDocumentIsCancelled ? 'Cancelled' : 'Issued') as "Cancelled" | "Issued" | "Draft" | "Partial" | "Paid" | "Overdue",
      issue_date: bh.billingDocumentDate.split('T')[0],
      due_date: new Date(bh.billingDocumentDate).getTime() + 30 * 24 * 60 * 60 * 1000 > 0 
        ? new Date(new Date(bh.billingDocumentDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : bh.billingDocumentDate.split('T')[0],
      total_amount: parseFloat(bh.totalNetAmount) || 0,
      tax_amount: parseFloat(bh.totalNetAmount) * 0.1 || 0,
      currency: bh.transactionCurrency,
      billing_address_id: addresses[0]?.id || 'ADDR1'
    };
  }); // Remove filter for now to see all data
  
  const deliveries: Delivery[] = deliveryHeaders.map(dh => {
    const deliveryItem = deliveryItems.find(di => di.deliveryDocument === dh.deliveryDocument);
    const orderId = deliveryItem?.referenceSdDocument || '';
    // Only create delivery if we have a valid order
    if (!orderId || !orders.find(o => o.id === orderId)) {
      return null;
    }
    return {
      id: dh.deliveryDocument,
      delivery_number: `DN-${dh.deliveryDocument}`,
      order_id: orderId,
      address_id: addresses[0]?.id || 'ADDR1',
      status: (dh.actualGoodsMovementDate ? 'Delivered' : 'Pending') as 'Pending' | 'In Transit' | 'Delivered' | 'Failed' | 'Returned',
      carrier: 'SAP Logistics',
      tracking_number: `TRACK${dh.deliveryDocument}`,
      shipped_date: dh.creationDate.split('T')[0],
      delivered_date: dh.actualGoodsMovementDate?.split('T')[0] || null,
      estimated_delivery: dh.creationDate.split('T')[0]
    };
  }).filter((d): d is NonNullable<typeof d> => d !== null) as Delivery[];
  
  const transformedPayments: Payment[] = payments.map((p, index) => {
    // Use clearingAccountingDocument to find the corresponding invoice
    const invoiceId = billingHeaders.find(bh => bh.accountingDocument === p.clearingAccountingDocument)?.billingDocument;
    // Temporarily skip foreign key check to see what we get
    return {
      id: `PAY${index + 1}`,
      payment_reference: `PAY-${p.accountingDocument}`,
      invoice_id: invoiceId || 'UNKNOWN', // Keep even if no match
      amount: Math.abs(parseFloat(p.amountInTransactionCurrency)) || 0,
      currency: p.transactionCurrency,
      method: 'Bank Transfer' as 'Bank Transfer' | 'Credit Card' | 'Check' | 'ACH',
      status: 'Cleared' as 'Pending' | 'Cleared' | 'Failed' | 'Reversed',
      payment_date: p.postingDate.split('T')[0],
      cleared_date: p.clearingDate?.split('T')[0] || p.postingDate.split('T')[0]
    };
  }); // Remove filter for now to see all data
  
  console.log(`✅ Loaded SAP dataset:
    - ${customers.length} customers
    - ${addresses.length} addresses  
    - ${transformedProducts.length} products
    - ${orders.length} orders
    - ${orderItems.length} order items
    - ${deliveries.length} deliveries
    - ${invoices.length} invoices
    - ${transformedPayments.length} payments`);
  
  return {
    customers,
    addresses,
    products: transformedProducts,
    orders,
    orderItems,
    deliveries,
    invoices,
    payments: transformedPayments
  };
}
