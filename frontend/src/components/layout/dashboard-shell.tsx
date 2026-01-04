'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/providers/sidebar-provider';

interface DashboardShellProps {
    children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="flex min-h-screen">
            {/* Sidebar - hidden on mobile */}
            <div className={cn(
                "hidden lg:block fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out border-r bg-sidebar",
                isCollapsed ? "w-[72px]" : "w-64"
            )}>
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className={cn(
                "flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0 max-w-full overflow-hidden",
                isCollapsed ? "lg:ml-[72px]" : "lg:ml-64"
            )}>
                <Header />
                <main className="px-6 pb-6 pt-4 flex-1 overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
