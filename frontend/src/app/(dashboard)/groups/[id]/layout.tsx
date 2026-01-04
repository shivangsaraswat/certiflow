'use client';

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Settings, Mail, ChevronDown, User, Users } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePageTitle } from '@/components/providers/page-title-provider';
import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import { getGroup } from '@/lib/api';
import { useSession } from 'next-auth/react';
import type { Group } from '@/types';

// Context to share group data and dialog control with child pages
interface GroupContextType {
    group: Group | null;
    refreshGroup: () => void;
    openSingleDialog: () => void;
    openBulkDialog: () => void;
    isSingleDialogOpen: boolean;
    setIsSingleDialogOpen: (open: boolean) => void;
    isBulkDialogOpen: boolean;
    setIsBulkDialogOpen: (open: boolean) => void;
}

const GroupContext = createContext<GroupContextType | null>(null);

export function useGroupContext() {
    const context = useContext(GroupContext);
    if (!context) {
        throw new Error('useGroupContext must be used within a GroupLayout');
    }
    return context;
}

export default function GroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const groupId = params.id as string;
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const [group, setGroup] = useState<Group | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { setPageTitle, setBackButton, setActions } = usePageTitle();

    // Dialog state - shared with child pages
    const [isSingleDialogOpen, setIsSingleDialogOpen] = useState(false);
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);

    const loadGroup = useCallback(async () => {
        if (!userId || !groupId) return;
        const result = await getGroup(groupId, userId);
        if (result.success && result.data) {
            setGroup(result.data);
        }
    }, [userId, groupId]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadGroup();
        setIsRefreshing(false);
    }, [loadGroup]);

    useEffect(() => {
        loadGroup();
    }, [loadGroup]);

    // Determine current page for highlighting
    const isSettingsPage = pathname.includes('/settings');
    const isMailPage = pathname.includes('/mail');
    const isMainPage = !isSettingsPage && !isMailPage;

    // Set page title and actions from layout
    useEffect(() => {
        if (group) {
            let pageTitle = group.name;
            if (isSettingsPage) pageTitle = `${group.name} / Settings`;
            if (isMailPage) pageTitle = `${group.name} / Mail Center`;

            setPageTitle(pageTitle);

            const backPath = isMainPage ? '/groups' : `/groups/${groupId}`;
            setBackButton(
                <Button variant="ghost" size="icon" asChild>
                    <Link href={backPath}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
            );
            setActions(
                <div className="flex items-center gap-2">
                    {/* Refresh Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>

                    {/* Settings Button */}
                    <Button
                        variant={isSettingsPage ? "secondary" : "outline"}
                        size="icon"
                        asChild
                    >
                        <Link href={`/groups/${groupId}/settings`}>
                            <Settings className="h-4 w-4" />
                        </Link>
                    </Button>

                    {/* Mail Button */}
                    <Button
                        variant={isMailPage ? "secondary" : "outline"}
                        size="icon"
                        asChild
                    >
                        <Link href={`/groups/${groupId}/mail`}>
                            <Mail className="h-4 w-4" />
                        </Link>
                    </Button>

                    {/* Generate Button - only show if template is configured */}
                    {group.templateId && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button>
                                    Generate
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem
                                    onClick={() => setIsSingleDialogOpen(true)}
                                    className="cursor-pointer"
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    Single Certificate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setIsBulkDialogOpen(true)}
                                    className="cursor-pointer"
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    Bulk from Data Vault
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            );
        }

        return () => {
            setPageTitle(null);
            setBackButton(null);
            setActions(null);
        };
    }, [group, groupId, isSettingsPage, isMailPage, isRefreshing, setPageTitle, setBackButton, setActions, handleRefresh]);

    const contextValue: GroupContextType = {
        group,
        refreshGroup: handleRefresh,
        openSingleDialog: () => setIsSingleDialogOpen(true),
        openBulkDialog: () => setIsBulkDialogOpen(true),
        isSingleDialogOpen,
        setIsSingleDialogOpen,
        isBulkDialogOpen,
        setIsBulkDialogOpen,
    };

    return (
        <GroupContext.Provider value={contextValue}>
            {children}
        </GroupContext.Provider>
    );
}
