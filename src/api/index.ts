import client from './client';
import {
  Customer, Supplier, Product, Driver, Order, OrderStatus,
  Payment, PaymentMethod, Purchase, SupplierPayment, SupplierLedger,
  DashboardStats, ReportData,
} from '../types';

// ─── Customers ────────────────────────────────────────────────────────────────

export const getCustomers = () =>
  client.get<Customer[]>('/customers').then(r => r.data);

export const createCustomer = (data: { name: string; phone?: string; address?: string }) =>
  client.post<Customer>('/customers', data).then(r => r.data);

// ─── Products ─────────────────────────────────────────────────────────────────

export const getProducts = () =>
  client.get<Product[]>('/products').then(r => r.data);

export const createProduct = (data: { name: string; price: number; stock: number }) =>
  client.post<Product>('/products', data).then(r => r.data);

export const updateStock = (id: number, quantity: number) =>
  client.patch<Product>(`/products/${id}/stock`, { quantity }).then(r => r.data);

// ─── Orders ───────────────────────────────────────────────────────────────────

export const getOrders = () =>
  client.get<Order[]>('/orders').then(r => r.data);

export const createOrder = (data: {
  customerId: number;
  totalAmount: number;
  items: { productId: number; quantity: number; price: number }[];
}) => client.post<Order>('/orders', data).then(r => r.data);

export const updateOrderStatus = (id: number, status: OrderStatus) =>
  client.patch<Order>(`/orders/${id}/status`, { status }).then(r => r.data);

export const assignDriver = (orderId: number, driverId: number) =>
  client.patch<Order>(`/orders/${orderId}/assign-driver`, { driverId }).then(r => r.data);

// ─── Payments ─────────────────────────────────────────────────────────────────

export const getPayments = () =>
  client.get<Payment[]>('/payments').then(r => r.data);

export const createPayment = (data: {
  customerId: number;
  amount: number;
  method: PaymentMethod;
  notes?: string;
}) => client.post<Payment>('/payments', data).then(r => r.data);

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const getSuppliers = () =>
  client.get<Supplier[]>('/suppliers').then(r => r.data);

export const getSupplierById = (id: number) =>
  client.get<Supplier>(`/suppliers/${id}`).then(r => r.data);

export const createSupplier = (data: { name: string; phone?: string; address?: string }) =>
  client.post<Supplier>('/suppliers', data).then(r => r.data);

export const createPurchase = (data: {
  supplierId: number;
  items: { productId: number; quantity: number; price: number }[];
}) => client.post<Purchase>('/purchases', data).then(r => r.data);

export const addSupplierPayment = (supplierId: number, data: { amount: number; note?: string }) =>
  client.post<SupplierPayment>(`/suppliers/${supplierId}/payments`, data).then(r => r.data);

export const getSupplierLedger = (supplierId: number) =>
  client.get<SupplierLedger[]>(`/suppliers/${supplierId}/ledger`).then(r => r.data);

export const getAllSupplierPayments = () =>
  client.get<SupplierPayment[]>('/suppliers/payments/all').then(r => r.data);

export const getAllPurchases = () =>
  client.get<Purchase[]>('/suppliers/purchases/all').then(r => r.data);

// ─── Drivers ──────────────────────────────────────────────────────────────────

export const getDrivers = () =>
  client.get<Driver[]>('/drivers').then(r => r.data);

export const createDriver = (data: { name: string; phone?: string; vehiclePlate?: string }) =>
  client.post<Driver>('/drivers', data).then(r => r.data);

export const updateDriverAvailability = (id: number, isAvailable: boolean) =>
  client.patch<Driver>(`/drivers/${id}/availability`, { isAvailable }).then(r => r.data);

// ─── Dashboard & Reports ──────────────────────────────────────────────────────

export const getDashboardStats = () =>
  client.get<DashboardStats>('/dashboard/stats').then(r => r.data);

export const getReportData = () =>
  client.get<ReportData>('/reports').then(r => r.data);
