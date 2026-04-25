// Mock data for admin dashboard — will be replaced with real DB data when Lovable Cloud is connected

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  items: { name: string; style: string; size: string; quantity: number; price: number }[];
  total: number;
  status: "pending" | "confirmed" | "in-production" | "shipped" | "delivered";
  date: string;
  city: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
}

export const mockOrders: Order[] = [
  {
    id: "SOL-001", customerName: "Ayesha Khan", email: "ayesha@email.com", phone: "0300-1234567",
    items: [{ name: "Blue Fish", style: "Tee", size: "M", quantity: 1, price: 4000 }],
    total: 4000, status: "delivered", date: "2026-03-01", city: "Karachi",
  },
  {
    id: "SOL-002", customerName: "Sara Ahmed", email: "sara@email.com", phone: "0321-9876543",
    items: [{ name: "Cherry", style: "Tee", size: "S", quantity: 1, price: 4000 }, { name: "Swan", style: "Tank", size: "M", quantity: 1, price: 4500 }],
    total: 8500, status: "in-production", date: "2026-03-05", city: "Lahore",
  },
  {
    id: "SOL-003", customerName: "Fatima Rizvi", email: "fatima@email.com", phone: "0333-5551234",
    items: [{ name: "Evil Eye", style: "Tee", size: "L", quantity: 2, price: 4000 }],
    total: 8000, status: "confirmed", date: "2026-03-07", city: "Islamabad",
  },
  {
    id: "SOL-004", customerName: "Hina Malik", email: "hina@email.com", phone: "0345-6667788",
    items: [{ name: "F1 Ferrari", style: "Tee", size: "XL", quantity: 1, price: 5000 }],
    total: 5000, status: "pending", date: "2026-03-09", city: "Karachi",
  },
  {
    id: "SOL-005", customerName: "Zara Siddiqui", email: "zara@email.com", phone: "0312-1112233",
    items: [{ name: "Flamingo", style: "Tank", size: "S", quantity: 1, price: 4000 }, { name: "Beachy", style: "Tank", size: "S", quantity: 1, price: 4000 }],
    total: 8000, status: "shipped", date: "2026-03-08", city: "Karachi",
  },
  {
    id: "SOL-006", customerName: "Maryam Qureshi", email: "maryam@email.com", phone: "0300-4445566",
    items: [{ name: "Cinnamon Roll", style: "Tee", size: "M", quantity: 1, price: 5000 }],
    total: 5000, status: "delivered", date: "2026-02-25", city: "Lahore",
  },
  {
    id: "SOL-007", customerName: "Nadia Shah", email: "nadia@email.com", phone: "0321-7778899",
    items: [{ name: "Red Lobster", style: "Tee", size: "L", quantity: 1, price: 5000 }, { name: "Seahorse", style: "Tee", size: "L", quantity: 1, price: 4500 }],
    total: 9500, status: "delivered", date: "2026-02-20", city: "Karachi",
  },
  {
    id: "SOL-008", customerName: "Rabia Hussain", email: "rabia@email.com", phone: "0333-2223344",
    items: [{ name: "XOXO", style: "Tank", size: "M", quantity: 1, price: 4000 }],
    total: 4000, status: "in-production", date: "2026-03-10", city: "Faisalabad",
  },
];

export const mockCustomers: Customer[] = [
  { id: "C1", name: "Ayesha Khan", email: "ayesha@email.com", phone: "0300-1234567", city: "Karachi", totalOrders: 3, totalSpent: 14500, lastOrder: "2026-03-01" },
  { id: "C2", name: "Sara Ahmed", email: "sara@email.com", phone: "0321-9876543", city: "Lahore", totalOrders: 2, totalSpent: 12500, lastOrder: "2026-03-05" },
  { id: "C3", name: "Fatima Rizvi", email: "fatima@email.com", phone: "0333-5551234", city: "Islamabad", totalOrders: 1, totalSpent: 8000, lastOrder: "2026-03-07" },
  { id: "C4", name: "Hina Malik", email: "hina@email.com", phone: "0345-6667788", city: "Karachi", totalOrders: 1, totalSpent: 5000, lastOrder: "2026-03-09" },
  { id: "C5", name: "Zara Siddiqui", email: "zara@email.com", phone: "0312-1112233", city: "Karachi", totalOrders: 4, totalSpent: 22000, lastOrder: "2026-03-08" },
  { id: "C6", name: "Maryam Qureshi", email: "maryam@email.com", phone: "0300-4445566", city: "Lahore", totalOrders: 2, totalSpent: 9000, lastOrder: "2026-02-25" },
  { id: "C7", name: "Nadia Shah", email: "nadia@email.com", phone: "0321-7778899", city: "Karachi", totalOrders: 5, totalSpent: 31500, lastOrder: "2026-02-20" },
  { id: "C8", name: "Rabia Hussain", email: "rabia@email.com", phone: "0333-2223344", city: "Faisalabad", totalOrders: 1, totalSpent: 4000, lastOrder: "2026-03-10" },
];

export const revenueData = [
  { month: "Oct", revenue: 25000 },
  { month: "Nov", revenue: 38000 },
  { month: "Dec", revenue: 52000 },
  { month: "Jan", revenue: 41000 },
  { month: "Feb", revenue: 48000 },
  { month: "Mar", revenue: 56000 },
];
