'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, FolderKanban, Trash2, Settings2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getGroups, createGroup, deleteGroup } from '@/lib/api';
import type { Group } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePageTitle } from '@/components/providers/page-title-provider';

export default function GroupsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Form data
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');

    const loadGroups = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        const result = await getGroups(userId);
        if (result.success && result.data) {
            setGroups(result.data);
        }
        setLoading(false);
    }, [userId]);

    const openDialog = useCallback(() => {
        setGroupName('');
        setGroupDescription('');
        setIsDialogOpen(true);
    }, []);

    const closeDialog = useCallback(() => {
        setIsDialogOpen(false);
    }, []);

    const handleCreateGroup = useCallback(async () => {
        if (!groupName.trim()) return;

        setIsCreating(true);
        const result = await createGroup({
            name: groupName.trim(),
            description: groupDescription.trim() || undefined,
        }, userId);

        if (result.success && result.data) {
            // Redirect to group settings page immediately
            router.push(`/groups/${result.data.id}/settings`);
        }
        setIsCreating(false);
    }, [groupName, groupDescription, userId, router]);

    const handleDeleteGroup = useCallback(async (id: string) => {
        if (!confirm('Are you sure you want to delete this group?')) return;
        const result = await deleteGroup(id, userId);
        if (result.success) {
            setGroups((prev) => prev.filter((g) => g.id !== id));
        }
    }, [userId]);

    useEffect(() => {
        if (userId) loadGroups();
    }, [loadGroups, userId]);

    const { setActions } = usePageTitle();

    useEffect(() => {
        setActions(
            <Button onClick={openDialog}>
                <Plus className="mr-2 h-4 w-4" />
                New Group
            </Button>
        );
        return () => setActions(null);
    }, [openDialog, setActions]);

    return (
        <div className="space-y-6">
            <div className="h-4" />

            {/* Groups Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : groups.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No groups yet</h3>
                        <p className="text-muted-foreground mt-1 mb-4">Create your first group to start generating certificates.</p>
                        <Button onClick={openDialog}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Group
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                        <Link key={group.id} href={`/groups/${group.id}`}>
                            <Card className="cursor-pointer hover:shadow-md transition-shadow group relative">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{group.name}</CardTitle>
                                            {group.description && (
                                                <CardDescription className="mt-1 line-clamp-2">{group.description}</CardDescription>
                                            )}
                                        </div>
                                        {(group as any).isOwner !== false && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteGroup(group.id);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {(group as any).sharedBy && (
                                            <Badge variant="secondary" className="text-xs gap-1">
                                                <Share2 className="h-3 w-3" />
                                                Shared by {(group as any).sharedBy}
                                            </Badge>
                                        )}
                                        {group.template ? (
                                            <Badge variant="secondary" className="text-xs">
                                                {group.template.code}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                                <Settings2 className="h-3 w-3 mr-1" />
                                                Needs Setup
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                            {group.certificateCount || 0} certificates
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Group Dialog - Simplified */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New Group</DialogTitle>
                        <DialogDescription>
                            Create a group to organize your certificates. You can configure the template and data source in the next step.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Group Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Workshop 2026"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Optional description..."
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                        <Button
                            onClick={handleCreateGroup}
                            disabled={!groupName.trim() || isCreating}
                        >
                            {isCreating ? 'Creating...' : 'Create & Configure'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
