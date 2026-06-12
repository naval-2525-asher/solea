import { useState } from "react";
import { LayoutDashboard, ShoppingCart, Users, Package, LogOut, Star, Layout, Camera, Boxes, Settings, ChevronDown } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();

  const isProductsActive = pathname === "/admin/products";
  const isInventoryActive = pathname === "/admin/inventory";

  const [productsOpen, setProductsOpen] = useState(isProductsActive);
  const [inventoryOpen, setInventoryOpen] = useState(isInventoryActive);

  const topItems = [
    { title: "Overview",   url: "/admin",           icon: LayoutDashboard, end: true },
    { title: "Orders",     url: "/admin/orders",    icon: ShoppingCart },
    { title: "Customers",  url: "/admin/customers", icon: Users },
  ];

  const bottomItems = [
    { title: "Reviews",    url: "/admin/reviews",    icon: Star },
    { title: "Spotted",    url: "/admin/spotted",    icon: Camera },
    { title: "Storefront", url: "/admin/storefront", icon: Layout },
    { title: "Settings",   url: "/admin/settings",   icon: Settings },
  ];

  const linkClass = "font-serif text-sm text-foreground/70 hover:bg-secondary/50 rounded-lg px-3 py-2 flex items-center gap-2 w-full";
  const activeLinkClass = "bg-secondary text-foreground font-bold";
  const subLinkClass = "font-serif text-xs text-foreground/60 hover:bg-secondary/40 rounded-lg px-3 py-1.5 flex items-center gap-2 w-full transition-colors";
  const activeSubLinkClass = "bg-secondary/70 text-foreground font-bold";

  const isSubActive = (section: string) => pathname.includes(section === "products" ? "/admin/products" : "/admin/inventory") && hash === `#${section}`;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-card pt-4">

        {/* Header */}
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

              {/* Top nav items */}
              {topItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className={linkClass}
                      activeClassName={activeLinkClass}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* ── Products dropdown ── */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={() => {
                      if (collapsed) { navigate("/admin/products"); return; }
                      setProductsOpen((o) => !o);
                      if (!isProductsActive) navigate("/admin/products");
                    }}
                    className={`${linkClass} justify-between ${isProductsActive ? activeLinkClass : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      <Package className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>Products</span>}
                    </span>
                    {!collapsed && (
                      <ChevronDown
                        className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200"
                        style={{ transform: productsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      />
                    )}
                  </button>
                </SidebarMenuButton>

                {/* Sub-items */}
                {!collapsed && productsOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
                    <button
                      onClick={() => navigate("/admin/products#tees-tanks")}
                      className={`${subLinkClass} ${hash === "#tees-tanks" && isProductsActive ? activeSubLinkClass : ""}`}
                    >
                      👕 Tees &amp; Tanks
                    </button>
                    <button
                      onClick={() => navigate("/admin/products#accessories")}
                      className={`${subLinkClass} ${hash === "#accessories" && isProductsActive ? activeSubLinkClass : ""}`}
                    >
                      ✨ Accessories
                    </button>
                  </div>
                )}
              </SidebarMenuItem>

              {/* ── Inventory dropdown ── */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={() => {
                      if (collapsed) { navigate("/admin/inventory"); return; }
                      setInventoryOpen((o) => !o);
                      if (!isInventoryActive) navigate("/admin/inventory");
                    }}
                    className={`${linkClass} justify-between ${isInventoryActive ? activeLinkClass : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      <Boxes className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>Inventory</span>}
                    </span>
                    {!collapsed && (
                      <ChevronDown
                        className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200"
                        style={{ transform: inventoryOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      />
                    )}
                  </button>
                </SidebarMenuButton>

                {!collapsed && inventoryOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
                    <button
                      onClick={() => navigate("/admin/inventory#tees-tanks")}
                      className={`${subLinkClass} ${hash === "#tees-tanks" && isInventoryActive ? activeSubLinkClass : ""}`}
                    >
                      👕🎽 Tees &amp; Tanks
                    </button>
                    <button
                      onClick={() => navigate("/admin/inventory#accessories")}
                      className={`${subLinkClass} ${hash === "#accessories" && isInventoryActive ? activeSubLinkClass : ""}`}
                    >
                      ✨ Accessories
                    </button>
                  </div>
                )}
              </SidebarMenuItem>

              {/* Bottom nav items */}
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={linkClass}
                      activeClassName={activeLinkClass}
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

        {/* Back to store */}
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