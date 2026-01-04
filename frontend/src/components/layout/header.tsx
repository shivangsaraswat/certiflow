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
import { usePageTitle } from '@/components/providers/page-title-provider';

export function Header() {
    const pathname = usePathname();

    const { title, actions, backButton } = usePageTitle();

    // Generate breadcrumb from pathname
    const getBreadcrumb = () => {
        const segments = pathname.split('/').filter(Boolean);
        const root = segments[0];

        if (title) {
            let prefix = 'Dashboard';
            if (root === 'groups') prefix = 'Groups';
            else if (root === 'data-vault') prefix = 'Data vault';
            else if (root === 'templates') prefix = 'Templates';
            else if (root === 'signatures') prefix = 'Signatures';
            else if (root === 'admin') prefix = 'Admin';

            return (
                <div className="flex items-center truncate">
                    <span className="hidden md:inline mr-2 text-foreground font-medium">{prefix}</span>
                    <span className="hidden md:inline mr-2 text-muted-foreground">/</span>
                    <span className="truncate">{title}</span>
                </div>
            );
        }

        if (segments.length === 0) return 'Dashboard';

        return segments.map((segment, index) => {
            // Check if segment looks like a UUID or ID (long alphanumeric)
            if (segment.length > 20 && /\d/.test(segment)) {
                // If previous segment was 'templates', return 'Editor'
                if (segments[index - 1] === 'templates') return 'Editor';
                return 'Item';
            }
            return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        }).join(' / ');
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

            {/* Title & Back Button */}
            <div className="flex items-center gap-1 min-w-0 flex-1 lg:flex-none mr-2">
                {backButton && (
                    <div className="flex-shrink-0">
                        {backButton}
                    </div>
                )}
                <h1 className="text-base sm:text-lg font-semibold truncate">{getBreadcrumb()}</h1>
            </div>

            {/* Spacer */}
            <div className="hidden lg:block flex-1" />

            {/* Actions */}
            {actions && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    {actions}
                </div>
            )}
        </header>
    );
}
