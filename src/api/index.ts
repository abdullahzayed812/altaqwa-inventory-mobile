import client from './client';
import {
  Customer, Supplier, Product, Driver, Order, OrderStatus,
  Payment, PaymentMethod, Purchase, SupplierPayment, SupplierLedger,
  DriverLedger, DashboardStats, ReportData,
} from '../types';

// ─── Customers ────────────────────────────────────────────────────────────────

export const getCustomers = () =>
  client.get<Customer[]>('/customers').then(r => r.data);

export const getCustomerById = (id: number) =>
  client.get<Customer>(`/customers/${id}`).then(r => r.data);

export const createCustomer = (data: { name: string; phone?: string; address?: string; initialDebt?: number }) =>
  client.post<Customer>('/customers', data).then(r => r.data);

export const updateCustomer = (id: number, data: { name?: string; phone?: string | null; address?: string | null }) =>
  client.put<Customer>(`/customers/${id}`, data).then(r => r.data);

export const deleteCustomer = (id: number) =>
  client.delete(`/customers/${id}`);

// ─── Products ─────────────────────────────────────────────────────────────────

export const getProducts = () =>
  client.get<Product[]>('/products').then(r => r.data);

export const createProduct = (data: { name: string; price: number; stock: number }) =>
  client.post<Product>('/products', data).then(r => r.data);

export const updateProduct = (id: number, data: { name?: string; price?: number; stock?: number; imagePath?: string }) =>
  client.put<Product>(`/products/${id}`, data).then(r => r.data);

export const updateStock = (id: number, quantity: number) =>
  client.patch<Product>(`/products/${id}/stock`, { quantity }).then(r => r.data);

// ─── Orders ───────────────────────────────────────────────────────────────────

export const getOrders = () =>
  client.get<Order[]>('/orders').then(r => r.data);

export const createOrder = (data: {
  customerType?: 'DRIVER' | 'COMPANY';
  customerId?: number | null;
  driverId?: number | null;
  totalAmount: number;
  totalDelivery?: number;
  items: { productId: number; quantity: number; price: number; deliveryFeePerTon?: number; totalDelivery?: number }[];
}) => client.post<Order>('/orders', data).then(r => r.data);

export const updateOrderStatus = (id: number, status: OrderStatus) =>
  client.patch<Order>(`/orders/${id}/status`, { status }).then(r => r.data);

export const assignDriver = (orderId: number, driverId: number) =>
  client.patch<Order>(`/orders/${orderId}/assign-driver`, { driverId }).then(r => r.data);

// ─── Payments ─────────────────────────────────────────────────────────────────

export const getPayments = () =>
  client.get<Payment[]>('/payments').then(r => r.data);

export const getCustomerPayments = (customerId: number, filters: { startDate?: string; endDate?: string; keyword?: string } = {}) =>
  client.get<Payment[]>(`/customers/${customerId}/payments`, { params: filters }).then(r => r.data);

export const getCustomerOrders = (customerId: number, filters: { startDate?: string; endDate?: string; keyword?: string } = {}) =>
  client.get<Order[]>(`/customers/${customerId}/orders`, { params: filters }).then(r => r.data);

export const createPayment = (data: {
  customerId: number;
  amount: number;
  method: PaymentMethod;
  senderName?: string;
  notes?: string;
}) => client.post<Payment>('/payments', data).then(r => r.data);

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const getSuppliers = () =>
  client.get<Supplier[]>('/suppliers').then(r => r.data);

export const getSupplierById = (id: number) =>
  client.get<Supplier>(`/suppliers/${id}`).then(r => r.data);

export const createSupplier = (data: { name: string; phone?: string; address?: string; initialBalance?: number }) =>
  client.post<Supplier>('/suppliers', data).then(r => r.data);

export const updateSupplier = (id: number, data: { name?: string; phone?: string | null; address?: string | null }) =>
  client.put<Supplier>(`/suppliers/${id}`, data).then(r => r.data);

export const deleteSupplier = (id: number) =>
  client.delete(`/suppliers/${id}`);

export const createPurchase = (data: {
  supplierId: number;
  items: { productId: number; quantity: number; price: number }[];
}) => client.post<Purchase>('/purchases', data).then(r => r.data);

export const getPurchaseById = (id: number) =>
  client.get<Purchase>(`/purchases/${id}`).then(r => r.data);

export const addSupplierPayment = (supplierId: number, data: { amount: number; method: PaymentMethod; senderName?: string; note?: string }) =>
  client.post<SupplierPayment>(`/suppliers/${supplierId}/payments`, data).then(r => r.data);

export const getSupplierLedger = (supplierId: number, filters: { type?: string; startDate?: string; endDate?: string } = {}) =>
  client.get<SupplierLedger[]>(`/suppliers/${supplierId}/ledger`, { params: filters }).then(r => r.data);

export const getAllSupplierPayments = () =>
  client.get<SupplierPayment[]>('/suppliers/payments/all').then(r => r.data);

export const getAllPurchases = () =>
  client.get<Purchase[]>('/suppliers/purchases/all').then(r => r.data);

// ─── Drivers ──────────────────────────────────────────────────────────────────

export const getDrivers = () =>
  client.get<Driver[]>('/drivers').then(r => r.data);

export const getDriverById = (id: number) =>
  client.get<Driver>(`/drivers/${id}`).then(r => r.data);

export const createDriver = (data: { name: string; phone?: string; vehiclePlate?: string; initialBalance?: number }) =>
  client.post<Driver>('/drivers', data).then(r => r.data);

export const updateDriver = (id: number, data: { name?: string; phone?: string | null; vehiclePlate?: string | null; vehicleDetails?: string | null }) =>
  client.put<Driver>(`/drivers/${id}`, data).then(r => r.data);

export const deleteDriver = (id: number) =>
  client.delete(`/drivers/${id}`);

export const updateDriverAvailability = (id: number, isAvailable: boolean) =>
  client.patch<Driver>(`/drivers/${id}/availability`, { isAvailable }).then(r => r.data);

export const addDriverPayment = (driverId: number, data: { amount: number; notes?: string }) =>
  client.post(`/drivers/${driverId}/payments`, data).then(r => r.data);

export const addDriverDebt = (driverId: number, data: { amount: number; notes?: string }) =>
  client.post(`/drivers/${driverId}/debt`, data).then(r => r.data);

export const getDriverLedger = (driverId: number) =>
  client.get<DriverLedger[]>(`/drivers/${driverId}/ledger`).then(r => r.data);

// ─── Dashboard & Reports ──────────────────────────────────────────────────────

export const getDashboardStats = () =>
  client.get<DashboardStats>('/dashboard/stats').then(r => r.data);

export const getReportData = () =>
  client.get<ReportData>('/reports').then(r => r.data);
