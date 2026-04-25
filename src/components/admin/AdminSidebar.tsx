import { LayoutDashboard, ShoppingCart, Users, Package, LogOut, Star, Layout, Camera } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Customers", url: "/admin/customers", icon: Users },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Reviews", url: "/admin/reviews", icon: Star },
  { title: "Spotted", url: "/admin/spotted", icon: Camera },
  { title: "Storefront", url: "/admin/storefront", icon: Layout },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-card pt-4">
        <div className="px-4 pb-4">
          {!collapsed ? (
            <>
              <h2 className="font-serif text-lg font-black text-foreground tracking-wide">soléa</h2>
              <p className="font-serif text-xs text-muted-foreground mb-4">Admin Dashboard</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="font-serif text-sm font-bold text-primary">BS</span>
                </div>
                <div>
                  <p className="font-serif text-sm font-bold text-foreground leading-tight">Bela Sultan</p>
                  <p className="font-serif text-[10px] uppercase tracking-widest text-muted-foreground">Super Admin</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-center">
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="font-serif text-xs font-bold text-primary">BS</span>
              </div>
            </div>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="font-serif text-xs uppercase tracking-widest text-muted-foreground">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="font-serif text-sm text-foreground/70 hover:bg-secondary/50 rounded-lg px-3 py-2 flex items-center gap-2"
                      activeClassName="bg-secondary text-foreground font-bold"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button
                  onClick={() => navigate("/")}
                  className="font-serif text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 px-3 py-2 w-full"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>Back to Store</span>}
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
