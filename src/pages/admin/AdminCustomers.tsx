import { mockCustomers } from "@/lib/mockAdminData";

export default function AdminCustomers() {
  const sorted = [...mockCustomers].sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-black text-foreground">Customers</h1>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full font-serif text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-4 text-muted-foreground font-medium">Name</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Email</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Phone</th>
                <th className="text-left p-4 text-muted-foreground font-medium">City</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Orders</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Total Spent</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/20">
                  <td className="p-4 font-bold text-foreground">{c.name}</td>
                  <td className="p-4 text-foreground/80">{c.email}</td>
                  <td className="p-4 text-muted-foreground">{c.phone}</td>
                  <td className="p-4 text-muted-foreground">{c.city}</td>
                  <td className="p-4 text-foreground font-bold">{c.totalOrders}</td>
                  <td className="p-4 text-foreground font-bold">PKR {c.totalSpent.toLocaleString()}</td>
                  <td className="p-4 text-muted-foreground">{c.lastOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
