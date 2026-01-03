'use client';

/**
 * Header Component
 * Top navigation bar with breadcrumbs and actions
 */

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './sidebar';

export function Header() {
    const pathname = usePathname();

    // Generate breadcrumb from pathname
    const getBreadcrumb = () => {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length === 0) return 'Dashboard';

        return segments.map(segment =>
            segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
        ).join(' / ');
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
            {/* Mobile menu trigger */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                    <Sidebar />
                </SheetContent>
            </Sheet>

            {/* Breadcrumb */}
            <h1 className="text-lg font-semibold">{getBreadcrumb()}</h1>

            {/* Spacer */}
            <div className="flex-1" />
        </header>
    );
}
