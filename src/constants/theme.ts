export const COLORS = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  primaryDark: '#1B5E20',
  background: '#F5F5F5',
  card: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  danger: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
  info: '#2196F3',
  debtRed: '#D32F2F',
  balanceBlue: '#1565C0',
};

export const CURRENCY = 'ج.م';

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  ASSIGNED: 'قيد التوصيل',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغي',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: '#FF9800',
  ASSIGNED: '#2196F3',
  DELIVERED: '#4CAF50',
  CANCELLED: '#9E9E9E',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'نقدي',
  BANK: 'تحويل بنكي',
};

export const LEDGER_TYPE_LABELS: Record<string, string> = {
  PURCHASE: 'مشتريات',
  PAYMENT: 'دفعة',
};
