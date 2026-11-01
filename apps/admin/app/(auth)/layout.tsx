"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { authClient } from "../../lib/auth-client";
import { Providers } from "../providers";
import { LayoutDashboard, Ticket, Users, UserRound, Settings, LogOut, Building2, Image, Wallet, ShoppingCart, type LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@repo/ui/sidebar";

type NavGroup = {
  label: string | null;
  items: { label: string; href: string; icon: LucideIcon }[];
  pinned?: boolean;
};

const navGroups: NavGroup[] = [
  { label: null, items: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ] },
  { label: "Directory", items: [
    { label: "Organizations", href: "/orgs", icon: Building2 },
    { label: "Users", href: "/users", icon: UserRound },
  ] },
  { label: "Activity", items: [
    { label: "Events", href: "/events", icon: Ticket },
    { label: "Orders", href: "/orders", icon: ShoppingCart },
  ] },
  { label: "Finance", items: [
    { label: "Payouts", href: "/payouts", icon: Wallet },
  ] },
  { label: "Content", items: [
    { label: "Banners", href: "/banners", icon: Image },
  ] },
  { label: "System", pinned: true, items: [
    { label: "Team", href: "/team", icon: Users },
    { label: "Settings", href: "/settings", icon: Settings },
  ] },
];

function SidebarUser() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">{session?.user.name}</span>
        <span className="truncate text-xs text-muted-foreground">{session?.user.email}</span>
      </div>
      <button
        onClick={handleLogout}
        title="Log out"
        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
      >
        <LogOut className="size-3.5" />
      </button>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-12 flex-row items-center justify-between gap-2 px-4 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-1.5" prefetch={false}>
            <img src="/logo.png" alt="Hectix" className="h-5 w-auto shrink-0 group-data-[collapsible=icon]:hidden" />
            <img src="/logo-mark.png" alt="Hectix" className="hidden size-7 shrink-0 object-contain group-data-[collapsible=icon]:block" />
          </Link>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </SidebarHeader>

        <SidebarContent>
          {navGroups.map((group, gi) => (
            <SidebarGroup key={group.label ?? `group-${gi}`} className={group.pinned ? "mt-auto" : undefined}>
              {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild tooltip={item.label} isActive={isActive(item.href)}>
                        <Link href={item.href} prefetch={false}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="p-3">
          <SidebarUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0">
        <div className="flex-1 overflow-y-auto p-6">
          <Providers>{children}</Providers>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
