'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Plus,
    Database,
    MoreHorizontal,
    Trash2,
    PenLine,
    FileSpreadsheet,
    Loader2
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

// Type definition
interface Spreadsheet {
    id: string;
    name: string;
    updatedAt: string;
}

import { useSession } from 'next-auth/react';

export default function DataVaultPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [sheets, setSheets] = useState<Spreadsheet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (userId) fetchSheets();
    }, [userId]);

    const fetchSheets = async () => {
        if (!userId) return;
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${baseUrl}/api/spreadsheets`, {
                headers: { 'x-user-id': userId }
            });
            const data = await res.json();
            if (data.success) {
                setSheets(data.data);
            }
        } catch (error) {
            console.error('Failed to load sheets:', error);
            toast.error('Failed to load spreadsheets');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSheet = async () => {
        setIsCreating(true);
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${baseUrl}/api/spreadsheets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId || ''
                },
                body: JSON.stringify({
                    name: `Untitled Spreadsheet ${sheets.length + 1}`,
                    // Provide empty default content
                    content: [{ name: 'Sheet1', celldata: [] }, { name: 'config', celldata: [] }]
                }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Spreadsheet created');
                // Navigate to the new sheet
                router.push(`/data-vault/${data.data.id}`);
            } else {
                toast.error('Failed to create spreadsheet');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to create spreadsheet');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this spreadsheet? This cannot be undone.')) return;

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${baseUrl}/api/spreadsheets/${id}`, {
                method: 'DELETE',
                headers: { 'x-user-id': userId || '' }
            });

            if (res.ok) {
                setSheets(prev => prev.filter(s => s.id !== id));
                toast.success('Spreadsheet deleted');
            } else {
                toast.error('Failed to delete spreadsheet');
            }
        } catch (error) {
            toast.error('Failed to delete spreadsheet');
        }
    };

    return (
        <div className="flex flex-1 flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Vault</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your data sheets for bulk generation
                    </p>
                </div>
                <Button onClick={handleCreateSheet} disabled={isCreating} className="shadow-lg">
                    {isCreating ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <Plus className="mr-2 h-4 w-4" />
                            New Spreadsheet
                        </>
                    )}
                </Button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : sheets.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
                    <div className="rounded-full bg-muted/50 p-4 mb-4">
                        <Database className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No spreadsheets yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                        Create a spreadsheet to manage recipient data, or use it as a data source for bulk generation.
                    </p>
                    <Button onClick={handleCreateSheet} variant="outline">
                        Create your first sheet
                    </Button>
                </Card>
            ) : (
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="w-[400px]">Name</TableHead>
                                <TableHead>Last Modified</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sheets.map((sheet) => (
                                <TableRow
                                    key={sheet.id}
                                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                                    onClick={() => router.push(`/data-vault/${sheet.id}`)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                                <FileSpreadsheet className="h-5 w-5" />
                                            </div>
                                            <span className="font-medium">{sheet.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDistanceToNow(new Date(sheet.updatedAt), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => router.push(`/data-vault/${sheet.id}`)}>
                                                        <PenLine className="mr-2 h-4 w-4" />
                                                        Open Editor
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={(e) => handleDelete(sheet.id, e as any)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
