import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import AdminLogin from "@/pages/admin/AdminLogin";

export default function AdminLayout() {
  const [loggedIn, setLoggedIn] = useState(
    () => sessionStorage.getItem("admin_logged_in") === "true"
  );

  if (!loggedIn) {
    return <AdminLogin onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-card shrink-0">
            <SidebarTrigger className="mr-4" />
            <span className="font-serif text-sm text-muted-foreground">
              Welcome, <span className="font-bold text-foreground">Bela Sultan</span>
            </span>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
