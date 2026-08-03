
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  Bell,
  FileText,
  ShieldCheck,
  LogOut,
  User,
  FileCog,
  BadgeAlert
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';
import type { LoanProvider } from '@/lib/types';
import { cn } from '@/lib/utils';
import { allMenuItems } from '@/lib/menu-items';
interface ProtectedLayoutProps {
  children: React.ReactNode;
  providers: LoanProvider[];
}

export function ProtectedLayout({ children, providers }: ProtectedLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout, isLoading } = useAuth();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentMenuItem = React.useMemo(() => {
    let best: (typeof allMenuItems)[number] | undefined;
    for (const item of allMenuItems) {
      if (pathname.startsWith(item.path) && (!best || item.path.length > best.path.length)) {
        best = item;
      }
    }
    return best;
  }, [pathname]);

  React.useEffect(() => {
    if (!isLoading && !currentUser && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [currentUser, isLoading, pathname, router]);

  const getInitials = (name: string = '') =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('');

  const menuItems = React.useMemo(() => {
    if (!currentUser || !currentUser.permissions) return [];
    
    return allMenuItems.filter((item) => {
        const moduleName = item.permissionKey || item.label.toLowerCase().replace(/\s+/g, '-');
        // Fallback for roles that might not have all permission keys yet
        if (!currentUser.permissions[moduleName]?.read) return false;

        // Branch-scoped users should not see the Districts page
        if (currentUser.branchId && item.path === '/admin/districts') return false;

        return true;
    });

  }, [currentUser]);

  // Check whether the current route is allowed for the user. If they don't
  // have read permission for the current module, we'll redirect to the
  // forbidden page to prevent client-side navigation to restricted pages.
  const isCurrentRouteAllowed = React.useMemo(() => {
    if (!currentUser || !currentUser.permissions) return false;
    const current = currentMenuItem;
    if (!current) return true; // allow non-admin menu routes (handled elsewhere)
    const moduleName = current.permissionKey || current.label.toLowerCase().replace(/\s+/g, '-');
    return !!currentUser.permissions[moduleName]?.read;
  }, [currentUser, currentMenuItem]);

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  if (pathname === '/admin/login' || pathname?.startsWith('/admin/change-password')) {
    return <>{children}</>;
  }

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading user data...</p>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <div className="bg-muted/40 min-h-screen w-full flex">
        <Sidebar className="border-r border-white/10 shadow-md">
          <SidebarHeader className="border-b border-white/10 px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm overflow-hidden p-1">
                <Image 
                  src="/logo.png" 
                  alt="Logo" 
                  width={32} 
                  height={32} 
                  className="object-contain"
                />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-base font-bold text-white tracking-tight leading-tight">IFB Admin</span>
                <span className="text-xs text-white/70">halal gebeya portal</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3 py-4">
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isParentActive = pathname.startsWith(item.path) && (item.path !== '/admin' || pathname === '/admin');

                if (hasChildren) {
                  return (
                    <Collapsible key={item.label} defaultOpen={isParentActive} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={isParentActive}
                            tooltip={{ children: item.label }}
                          >
                            <item.icon />
                            <span>{item.label}</span>
                            <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children!.map((child) => (
                              <SidebarMenuSubItem key={child.label}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={
                                    child.path === '/admin/merchants'
                                      ? pathname === '/admin/merchants' || pathname.startsWith('/admin/merchants/items')
                                      : pathname.startsWith(child.path)
                                  }
                                >
                                  <Link href={child.path}>
                                    <child.icon className="h-4 w-4" />
                                    <span>{child.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.label}>
                    <Link href={item.path}>
                      <SidebarMenuButton
                        isActive={pathname.startsWith(item.path) && (item.path !== '/admin' || pathname === '/admin')}
                        tooltip={{
                          children: item.label,
                        }}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 justify-end">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
            {mounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="overflow-hidden rounded-full"
                  >
                    <Avatar>
                      <AvatarImage
                        src={`/avatars/shadcn.png`}
                        alt={currentUser?.fullName || ''}
                      />
                      <AvatarFallback>
                        {getInitials(currentUser?.fullName || '')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{currentUser?.fullName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="focus:bg-sidebar-muted focus:text-sidebar-primary">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>
          <main className="flex-1 overflow-x-auto">
            {!isCurrentRouteAllowed ? (
              <div className="p-8">
                <h1 className="text-2xl font-semibold">Unauthorized</h1>
                <p className="text-sm text-muted-foreground mb-4">
                  You do not have permission to view this page.
                </p>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
