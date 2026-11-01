"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { authClient } from "../../lib/auth-client";
import { LayoutDashboard, Ticket, ShoppingCart, Wallet, Users, Settings, LogOut, ChevronsUpDown, Plus, MessageCircle, Loader2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@repo/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/events", icon: Ticket },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Finance", href: "/finance", icon: Wallet },
  { label: "Team", href: "/team", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function Avatar({ name, image }: { name?: string | null; image?: string | null }) {
  if (image) {
    return <img src={image} alt={name ?? ""} className="size-7 rounded-full object-cover" />;
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
      {initials(name)}
    </span>
  );
}

function OrgSwitcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: activeOrg, isPending: activeOrgPending } = authClient.useActiveOrganization();
  const { data: orgs, isPending: orgsPending } = authClient.useListOrganizations();

  async function handleSetActive(organizationId: string) {
    await authClient.organization.setActive({ organizationId });
    await queryClient.invalidateQueries();
  }

  const isLoading = orgsPending || activeOrgPending || orgs === undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" className="w-full data-[state=open]:bg-sidebar-accent">
          {activeOrg?.logo ? (
            <img src={activeOrg.logo} alt={activeOrg.name ?? ""} className="size-8 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
              {isLoading ? "…" : (activeOrg?.name?.[0]?.toUpperCase() ?? "?")}
            </div>
          )}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">
              {isLoading ? "Loading..." : (activeOrg?.name ?? "Select organization")}
            </span>
            <span className="truncate text-xs text-muted-foreground">Organization</span>
          </div>
          <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start" side="bottom" sideOffset={4}>
        {isLoading ? (
          <DropdownMenuItem disabled className="text-muted-foreground">Loading...</DropdownMenuItem>
        ) : (
          orgs?.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onSelect={() => handleSetActive(org.id)}
              className="gap-3 py-2"
            >
              {org.logo ? (
                <img src={org.logo} alt={org.name} className="size-7 shrink-0 rounded-md object-cover" />
              ) : (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                  {org.name[0]?.toUpperCase()}
                </div>
              )}
              <span className="truncate">{org.name}</span>
              {activeOrg?.id === org.id && (
                <span className="ml-auto text-xs text-muted-foreground">Active</span>
              )}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/create-org")} className="gap-3 py-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-dashed">
            <Plus className="size-3.5" />
          </div>
          <span>New organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarUser() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/");
  }

  return (
    <div className="flex items-center gap-2 px-1">
      <Avatar name={session?.user.name} image={session?.user.image} />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium">{session?.user.name}</span>
        <span className="truncate text-xs text-muted-foreground">{session?.user.email}</span>
      </div>
      <button
        onClick={handleLogout}
        title="Log out"
        className="ml-auto shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
      >
        <LogOut className="size-3.5" />
      </button>
    </div>
  );
}

const WHATSAPP_NUMBER = "1234567890";

type OrgStatus = { status: string; statusNote: string | null; allowResubmit: boolean } | null;

const BANNER_CONFIG: Record<string, {
  colors: string;
  dot: string;
  text: string;
  action: string;
  label: string;
  href: (waLink: string) => string;
  external?: boolean;
}> = {
  pending: {
    colors: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    text: "text-amber-800",
    action: "bg-amber-500 hover:bg-amber-600",
    label: "Verify now",
    href: () => "/verify",
  },
  review: {
    colors: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
    text: "text-blue-800",
    action: "bg-blue-500 hover:bg-blue-600",
    label: "Chat on WhatsApp",
    href: (waLink) => waLink,
    external: true,
  },
  rejected: {
    colors: "bg-red-50 border-red-200",
    dot: "bg-red-500",
    text: "text-red-800",
    action: "bg-red-500 hover:bg-red-600",
    label: "Contact us",
    href: (waLink) => waLink,
    external: true,
  },
  suspended: {
    colors: "bg-orange-50 border-orange-200",
    dot: "bg-orange-500",
    text: "text-orange-800",
    action: "bg-orange-500 hover:bg-orange-600",
    label: "Contact us",
    href: (waLink) => waLink,
    external: true,
  },
};

const BANNER_MESSAGE: Record<string, string> = {
  pending: "Complete your verification to activate your organization.",
  review: "Your verification is under review.",
  rejected: "Your verification was rejected.",
  suspended: "Your organization has been suspended.",
};

function InactiveBanner() {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const queryClient = useQueryClient();

  const { data: orgStatus } = useQuery<OrgStatus>({
    queryKey: ["org-status", activeOrg?.id],
    queryFn: () => fetch("/api/org/status").then((r) => r.json()),
    enabled: !!activeOrg?.id,
    staleTime: 0,
  });

  useEffect(() => {
    const handler = () => queryClient.invalidateQueries({ queryKey: ["org-status"] });
    window.addEventListener("org-verified", handler);
    return () => window.removeEventListener("org-verified", handler);
  }, [queryClient]);

  if (!orgStatus || orgStatus.status === "active") return null;

  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi, I'd like to activate my organization: ${activeOrg?.name}`;

  if (orgStatus.status === "rejected") {
    return (
      <div className="flex items-center justify-between gap-4 bg-red-50 border-b border-red-200 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="size-2 rounded-full bg-red-500 shrink-0" />
          <p className="text-sm font-medium text-red-800">
            Your verification was rejected.
            {orgStatus.statusNote && <span className="font-normal"> {orgStatus.statusNote}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {orgStatus.allowResubmit && (
            <Link href="/verify" className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition-colors">
              Fix and resubmit
            </Link>
          )}
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors">
            <MessageCircle className="size-3.5" /> Contact us
          </a>
        </div>
      </div>
    );
  }

  const config = BANNER_CONFIG[orgStatus.status];
  if (!config) return null;

  const message = BANNER_MESSAGE[orgStatus.status];

  return (
    <div className={`flex items-center justify-between gap-4 ${config.colors} border-b px-6 py-3`}>
      <div className="flex items-center gap-3">
        <div className={`size-2 rounded-full ${config.dot} shrink-0`} />
        <p className={`text-sm font-medium ${config.text}`}>
          {message}
          {orgStatus.statusNote && <span className="font-normal"> {orgStatus.statusNote}</span>}
        </p>
      </div>
      <a
        href={config.href(waLink)}
        {...(config.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={`flex shrink-0 items-center gap-2 rounded-lg ${config.action} px-3 py-1.5 text-xs font-medium text-white transition-colors`}
      >
        {(orgStatus.status === "review") && <MessageCircle className="size-3.5" />}
        {config.label}
      </a>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  const router = useRouter();
  const { data: orgs, isPending } = authClient.useListOrganizations();

  useEffect(() => {
    if (!isPending && orgs && orgs.length === 0) {
      router.replace("/create-org");
    }
  }, [isPending, orgs, router]);

  if (isPending || !orgs) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orgs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-2 py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <OrgSwitcher />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      isActive={isActive(item.href)}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="py-2">
          <SidebarUser />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <InactiveBanner />
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </SidebarInset>
      <Toaster richColors position="top-center" />
    </SidebarProvider>
  );
}
