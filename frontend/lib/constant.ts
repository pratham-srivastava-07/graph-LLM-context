import { NodeType, EdgeType } from './types';

export const NODE_COLORS: Record<NodeType, string> = {
    Customer: '#60A5FA', // blue
    Order: '#34D399', // emerald
    OrderItem: '#6EE7B7', // light emerald
    Product: '#FBBF24', // amber
    Delivery: '#F472B6', // pink
    Invoice: '#A78BFA', // violet
    Payment: '#4ADE80', // green
    Address: '#94A3B8', // slate
};

export const NODE_SIZES: Record<NodeType, number> = {
    Customer: 10,
    Order: 9,
    Product: 8,
    Delivery: 7,
    Invoice: 7,
    Payment: 6,
    OrderItem: 5,
    Address: 4,
};

export const EDGE_COLORS: Record<EdgeType, string> = {
    PLACED_BY: '#60A5FA',
    HAS_ITEM: '#34D399',
    CONTAINS: '#FBBF24',
    SHIPS_TO: '#94A3B8',
    FULFILLS: '#F472B6',
    BILLED_FOR: '#A78BFA',
    SETTLED_BY: '#4ADE80',
    LIVES_AT: '#94A3B8',
    DELIVERED_TO: '#F9A8D4',
};

export const NODE_ICONS: Record<NodeType, string> = {
    Customer: '👤',
    Order: '📦',
    OrderItem: '🔹',
    Product: '🏷️',
    Delivery: '🚚',
    Invoice: '📄',
    Payment: '💳',
    Address: '📍',
};

export const STATUS_COLORS: Record<string, string> = {
    // Order
    Open: '#60A5FA',
    Confirmed: '#34D399',
    Shipped: '#FBBF24',
    Delivered: '#4ADE80',
    Cancelled: '#F87171',
    // Delivery
    Pending: '#FCD34D',
    'In Transit': '#60A5FA',
    Failed: '#F87171',
    Returned: '#FB923C',
    // Invoice
    Draft: '#94A3B8',
    Issued: '#60A5FA',
    Partial: '#FBBF24',
    Paid: '#4ADE80',
    Overdue: '#F87171',
    // Payment
    Cleared: '#4ADE80',
    Reversed: '#F87171',
};