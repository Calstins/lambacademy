'use client';

import { ReactNode, useState } from 'react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 bg-primary shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex flex-col items-center justify-center h-20 bg-primary-900 px-4">
          <Link
            href="https://lambacademy.ng"
            target="_blank"
            className="text-center"
          >
            <h1 className="text-white text-xl font-bold">LambAcademy</h1>
            <p className="text-white/80 text-xs">Student Portal</p>
          </Link>
        </div>
        <nav className="mt-8">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center px-6 py-3 text-white hover:bg-primary-800 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer with website link */}
        <div className="absolute bottom-4 left-0 right-0 px-6">
          <Link
            href="https://lambacademy.ng"
            target="_blank"
            className="flex items-center text-white/60 hover:text-white text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Visit Website
          </Link>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  LambAcademy Learning Portal
                </h2>
                <p className="text-sm text-gray-500">
                  Transform Your Future Through Learning
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white">
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
                      <p className="text-sm font-medium leading-none">
                        {session?.user?.name
                          ? session.user.name
                          : session?.user?.email}
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
