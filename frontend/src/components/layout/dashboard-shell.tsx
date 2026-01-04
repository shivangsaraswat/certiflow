'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
    children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
    // Default to false (expanded) to match server render
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const stored = localStorage.getItem('sidebar-collapsed');
        if (stored === 'true') {
            setIsCollapsed(true);
        }
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    return (
        <div className="flex min-h-screen">
            {/* Sidebar - hidden on mobile */}
            <div className={cn(
                "hidden lg:block fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out border-r bg-sidebar",
                isCollapsed ? "w-[72px]" : "w-64"
            )}>
                <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
            </div>

            {/* Main Content */}
            <div className={cn(
                "flex-1 flex flex-col transition-all duration-300 ease-in-out",
                isCollapsed ? "lg:ml-[72px]" : "lg:ml-64"
            )}>
                <Header />
                <main className="px-6 pb-6 pt-4 flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
