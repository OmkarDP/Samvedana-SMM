/**
 * Admin sidebar navigation component
 * Provides navigation between different admin sections
 */

import { useLocation, NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  PlusCircle, 
  History, 
  User, 
  Shield,
  BarChart3 // still used for Dashboard icon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Removed analytics entry
const navigationItems = [
  {
    title: 'Create Event',
    url: '/event/create',
    icon: PlusCircle,
    description: 'Create new social media events'
  },
  {
    title: 'Event History',
    url: '/history',
    icon: History,
    description: 'View published events and drafts'
  },
  {
    title: 'Account',
    url: '/account',
    icon: User,
    description: 'Manage account settings'
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { user } = useAuth();
  
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"}>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-4">
          <div className="bg-gradient-primary p-2 rounded-lg">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-semibold text-sidebar-foreground">Samvedana</h2>
              <p className="text-xs text-sidebar-foreground/70">Foundation Admin</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      }`
                    }
                  >
                    <BarChart3 className="w-4 h-4" />
                    {!isCollapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* All remaining items except analytics */}
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User info */}
        {user && !isCollapsed && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <div className="px-3 py-2 bg-sidebar-accent rounded-md">
                <p className="text-sm font-medium text-sidebar-accent-foreground">
                  {user.name}
                </p>
                <p className="text-xs text-sidebar-accent-foreground/70">
                  {user.role}
                </p>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
