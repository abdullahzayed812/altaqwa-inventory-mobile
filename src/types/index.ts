export enum OrderStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum CustomerType {
  CUSTOMER = 'customer',
  DRIVER = 'driver',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK',
}

export enum SupplierLedgerType {
  PURCHASE = 'PURCHASE',
  PAYMENT = 'PAYMENT',
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  type: CustomerType;
  vehiclePlate: string | null;
  vehicleDetails: string | null;
  isAvailable: boolean;
  totalDebt: number;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  totalBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  price: number | null;
  stock: number | null;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product?: Product;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number | null;
  customer?: Customer;
  totalAmount: number;
  naulonUncollected: number;
  status: OrderStatus;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  productId: number;
  product?: Product;
  quantity: number;
  price: number;
}

export interface Purchase {
  id: number;
  supplierId: number;
  supplier?: Supplier;
  totalAmount: number;
  items?: PurchaseItem[];
  createdAt: string;
}

export interface Payment {
  id: number;
  customerId: number;
  customer?: Customer;
  amount: number;
  method: PaymentMethod;
  senderName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface SupplierPayment {
  id: number;
  supplierId: number;
  supplier?: Supplier;
  amount: number;
  method: PaymentMethod;
  senderName: string | null;
  note: string | null;
  createdAt: string;
}

export interface SupplierLedger {
  id: number;
  supplierId: number;
  type: SupplierLedgerType;
  amount: number;
  referenceId: number | null;
  createdAt: string;
}

export interface DashboardStats {
  totalSales: number;
  totalPayments: number;
  totalDebt: number;
  totalPurchases: number;
  totalCompanyPayments: number;
  lowStockCount: number;
  topProducts: Product[];
  monthlySales: any[];
}

export interface ReportData {
  recentSales: { date: string; total: number; customer: string }[];
  customerBalances: { id: number; name: string; phone: string | null; totalDebt: number }[];
}
