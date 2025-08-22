'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BookOpen,
  Users,
  Settings,
  Menu,
  X,
  Home,
  Award,
  BarChart3,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface AdminLayoutProps {
  children: ReactNode;
}

const sidebarItems = [
  { icon: Home, label: 'Dashboard', href: '/admin' },
  { icon: BookOpen, label: 'Courses', href: '/admin/courses' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Award, label: 'Certificates', href: '/admin/certificates' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  // Handle screen resize
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      // Auto-collapse on smaller screens
      if (mobile && window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Fixed Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0 z-30">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center min-w-0 flex-1">
            {/* Sidebar Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              className="mr-3 p-2"
              onClick={toggleSidebar}
              aria-label={
                sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
              }
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </Button>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                LambAcademy Admin Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                Learning Management System
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-white text-sm">
                      {session?.user?.name
                        ? session.user.name
                            .split(' ')
                            .map((n) => n.charAt(0).toUpperCase())
                            .join('')
                            .slice(0, 2)
                        : session?.user?.email?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none truncate">
                      {session?.user?.name || session?.user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Administrator
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Container - Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } bg-primary shadow-lg flex-shrink-0 transition-all duration-300 ease-in-out`}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-center h-16 bg-primary-900 px-4 flex-shrink-0">
              {sidebarCollapsed ? (
                <div className="text-center">
                  <h1 className="text-white text-lg font-bold">LA</h1>
                </div>
              ) : (
                <Link
                  href="https://lambacademy.ng"
                  target="_blank"
                  className="text-center"
                >
                  <h1 className="text-white text-xl font-bold">LambAcademy</h1>
                  <p className="text-white/80 text-xs">Admin Portal</p>
                </Link>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 mt-4 overflow-y-auto">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center ${
                      sidebarCollapsed ? 'px-4 justify-center' : 'px-6'
                    } py-3 text-white hover:bg-primary-800 transition-colors duration-200 group relative`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="ml-3 truncate">{item.label}</span>
                    )}

                    {/* Tooltip for collapsed state */}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div
              className={`flex-shrink-0 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}
            >
              {sidebarCollapsed ? (
                <div className="flex justify-center">
                  <Link
                    href="https://lambacademy.ng"
                    target="_blank"
                    className="text-white/60 hover:text-white transition-colors duration-200 group relative"
                    title="Visit Website"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      Visit Website
                    </div>
                  </Link>
                </div>
              ) : (
                <Link
                  href="https://lambacademy.ng"
                  target="_blank"
                  className="flex items-center text-white/60 hover:text-white text-sm transition-colors duration-200"
                >
                  <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span>Visit Website</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
