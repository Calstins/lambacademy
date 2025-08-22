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
  Home,
  Award,
  User,
  Menu,
  X,
  ShoppingCart,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

interface StudentLayoutProps {
  children: ReactNode;
}

const sidebarItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: BookOpen, label: 'My Courses', href: '/dashboard/courses' },
  { icon: ShoppingCart, label: 'Browse Courses', href: '/dashboard/browse' },
  { icon: Award, label: 'Certificates', href: '/dashboard/certificates' },
  { icon: User, label: 'Profile', href: '/dashboard/profile' },
];

export function StudentLayout({ children }: StudentLayoutProps) {
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
    <div className="flex flex-col h-screen bg-gray-50">
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
                LambAcademy Learning Portal
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                Transform Your Future Through Learning
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
                      {session?.user?.name?.charAt(0).toUpperCase() ||
                        session?.user?.email?.charAt(0).toUpperCase() ||
                        'S'}
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
                      Student
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
                  <p className="text-white/80 text-xs">Student Portal</p>
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
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
