import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text, View, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";

import DashboardScreen from "../screens/Dashboard";
import CustomersScreen from "../screens/Customers";
import CustomerDetailsScreen from "../screens/Customers/CustomerDetails";
import AddCustomerScreen from "../screens/Customers/AddCustomer";
import SuppliersScreen from "../screens/Suppliers";
import SupplierDetailsScreen from "../screens/Suppliers/SupplierDetails";
import AddSupplierScreen from "../screens/Suppliers/AddSupplier";
import SupplierAddPurchaseScreen from "../screens/Suppliers/AddPurchase";
import OrdersScreen from "../screens/Orders";
import CreateOrderScreen from "../screens/Orders/CreateOrder";
import MoreScreen from "../screens/More";
import ProductsScreen from "../screens/Products";
import PurchasesScreen from "../screens/Purchases";
import AddPurchaseScreen from "../screens/Purchases/AddPurchase";
import PaymentsScreen from "../screens/Payments";
import AddPaymentScreen from "../screens/Payments/AddPayment";
import DriversScreen from "../screens/Drivers";
import ReportsScreen from "../screens/Reports";
import IPConfigScreen from "../screens/Landing/IPConfigScreen";
import SplashScreen from "../screens/Landing/SplashScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={tabStyles.item}>
      <View style={[tabStyles.pill, focused && tabStyles.pillActive]}>
        <Text style={[tabStyles.emoji, focused && tabStyles.emojiActive]}>{emoji}</Text>
      </View>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{label}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  item: { alignItems: "center", justifyContent: "center", width: 64 },
  pill: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: "transparent",
  },
  pillActive: { backgroundColor: COLORS.primary + "22" },
  emoji: { fontSize: 25, opacity: 0.45 },
  emojiActive: { fontSize: 22, opacity: 1 },
  label: { fontSize: 14, marginTop: 2, color: COLORS.textSecondary, fontWeight: "400" },
  labelActive: { color: COLORS.primary, fontWeight: "700" },
});

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} options={{ title: "الرئيسية" }} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="OrdersList" component={OrdersScreen} options={{ title: "الطلبات" }} />
      <Stack.Screen name="CreateOrder" component={CreateOrderScreen} options={{ title: "طلب جديد" }} />
    </Stack.Navigator>
  );
}

function CustomersStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="CustomersList" component={CustomersScreen} options={{ title: "العملاء" }} />
      <Stack.Screen name="CustomerDetails" component={CustomerDetailsScreen} options={{ title: "تفاصيل العميل" }} />
      <Stack.Screen name="AddCustomer" component={AddCustomerScreen} options={{ title: "عميل جديد" }} />
      <Stack.Screen name="AddPayment" component={AddPaymentScreen} options={{ title: "إضافة دفعة" }} />
    </Stack.Navigator>
  );
}

function SuppliersStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="SuppliersList" component={SuppliersScreen} options={{ title: "الموردون" }} />
      <Stack.Screen name="SupplierDetails" component={SupplierDetailsScreen} options={{ title: "تفاصيل المورد" }} />
      <Stack.Screen name="AddSupplier" component={AddSupplierScreen} options={{ title: "مورد جديد" }} />
      <Stack.Screen name="AddPurchase" component={SupplierAddPurchaseScreen} options={{ title: "فاتورة شراء" }} />
    </Stack.Navigator>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={stackOptions}>
      <Stack.Screen name="MoreMain" component={MoreScreen} options={{ title: "المزيد" }} />
      <Stack.Screen name="Products" component={ProductsScreen} options={{ title: "المنتجات" }} />
      <Stack.Screen name="Purchases" component={PurchasesScreen} options={{ title: "المشتريات" }} />
      <Stack.Screen name="Payments" component={PaymentsScreen} options={{ title: "المدفوعات" }} />
      <Stack.Screen name="AddPayment" component={AddPaymentScreen} options={{ title: "إضافة دفعة" }} />
      <Stack.Screen name="Drivers" component={DriversScreen} options={{ title: "السائقون" }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ title: "التقارير" }} />
    </Stack.Navigator>
  );
}

const stackOptions = {
  headerStyle: { backgroundColor: COLORS.primary },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "bold" as const },
  headerTitleAlign: "center" as const,
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 68,
          backgroundColor: "#ffffff",
          borderTopWidth: 0,
          elevation: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.09,
          shadowRadius: 16,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="الرئيسية" focused={focused} /> }}
      />
      <Tab.Screen name="Orders" component={OrdersStack} options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="الطلبات" focused={focused} /> }} />
      <Tab.Screen
        name="Customers"
        component={CustomersStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="العملاء" focused={focused} /> }}
      />
      <Tab.Screen
        name="Suppliers"
        component={SuppliersStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏭" label="الموردون" focused={focused} /> }}
      />
      <Tab.Screen name="More" component={MoreStack} options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="☰" label="المزيد" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <RootStack.Screen name="Splash" component={SplashScreen} />
      <RootStack.Screen name="IPConfig" component={IPConfigScreen} />
      <RootStack.Screen name="MainApp" component={MainTabs} />
    </RootStack.Navigator>
  );
}
