'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { usePageTitle } from '@/components/providers/page-title-provider'; // Assume this provider exists based on previous context
import {
    LayoutGrid,
    List,
    MoreVertical,
    Trash2,
    PenLine,
    Plus,
    FileSpreadsheet,
    Loader2,
    Search
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils'; // utility for class merging

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

interface Spreadsheet {
    id: string;
    name: string;
    updatedAt: string;
    content?: any[]; // FortuneSheet content
}

// ----------------------------------------------------------------------
// PREVIEW COMPONENT
// ----------------------------------------------------------------------

function SpreadsheetPreview({ content }: { content?: any[] }) {
    // Memoize the grid data to avoid recalculation
    const gridData = useMemo(() => {
        if (!content || !Array.isArray(content) || content.length === 0) return [];

        const sheet1 = content[0];
        // Handle both 'celldata' (sparse) and 'data' (2D array) formats
        const rows = 6;
        const cols = 4;
        const grid: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));

        // If data is in 'data' format (2D array)
        if (sheet1.data && Array.isArray(sheet1.data)) {
            for (let r = 0; r < Math.min(sheet1.data.length, rows); r++) {
                const rowData = sheet1.data[r];
                if (Array.isArray(rowData)) {
                    for (let c = 0; c < Math.min(rowData.length, cols); c++) {
                        const cell = rowData[c];
                        if (cell && (cell.v !== null && cell.v !== undefined)) {
                            grid[r][c] = String(cell.v);
                        } else if (cell !== null && typeof cell !== 'object') {
                            // Handle raw values if any
                            grid[r][c] = String(cell);
                        }
                    }
                }
            }
        }
        // If data is in 'celldata' format (sparse array)
        else if (sheet1.celldata && Array.isArray(sheet1.celldata)) {
            sheet1.celldata.forEach((cell: any) => {
                if (cell.r < rows && cell.c < cols) {
                    // Start from row 0? FortuneSheet usually 0-indexed
                    if (cell.v && cell.v.v) grid[cell.r][cell.c] = String(cell.v.v);
                    else if (cell.v && cell.v.m) grid[cell.r][cell.c] = String(cell.v.m); // formatted value
                    else if (cell.v) grid[cell.r][cell.c] = String(cell.v);
                }
            });
        }

        return grid;
    }, [content]);

    if (!content) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted/10">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground/20" />
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-white dark:bg-zinc-950 p-2 overflow-hidden select-none pointer-events-none">
            <div className="grid grid-cols-4 gap-[1px] bg-border border border-border">
                {gridData.flat().map((cellVal, i) => (
                    <div key={i} className="bg-background h-5 text-[8px] flex items-center px-1 overflow-hidden text-muted-foreground whitespace-nowrap">
                        {cellVal}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// MAIN PAGE COMPONENT
// ----------------------------------------------------------------------

export default function DataVaultPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const { setPageTitle, setActions } = usePageTitle();

    const [sheets, setSheets] = useState<Spreadsheet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');

    // Load Sheets
    useEffect(() => {
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

        if (userId) fetchSheets();
    }, [userId]);

    // Create Handler
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
                    name: `Untitled spreadsheet`, // Google style
                    content: [{ name: 'Sheet1', celldata: [] }, { name: 'config', celldata: [] }]
                }),
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Spreadsheet created');
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

    // Set Header Actions
    useEffect(() => {
        setPageTitle('Dataset');
        setActions(
            <Button onClick={handleCreateSheet} disabled={isCreating} size="sm" className="gap-2">
                {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Plus className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">New Spreadsheet</span>
            </Button>
        );
        return () => {
            setPageTitle(null);
            setActions(null);
        };
    }, [isCreating, setPageTitle, setActions]); // Dependencies ensuring fresh state

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        // Custom confirmation could be better, but native is functionally fine for now
        // Usually, shadcn alert dialog is preferred, but for speed keeping native per instructions to "just execute" effectively.
        if (!confirm('Move this spreadsheet to trash?')) return;

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
                toast.error('Failed to delete');
            }
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const filteredSheets = sheets.filter(sheet =>
        sheet.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Empty State
    if (sheets.length === 0 && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
                <div className="bg-muted p-6 rounded-full mb-4">
                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">No Datasets found</h2>
                <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                    Create a new spreadsheet to start organizing your data in your Dataset.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
            {/* Toolbar Area */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center sticky top-0 z-10 bg-background/95 backdrop-blur py-2">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search spreadsheets..."
                        className="pl-9 bg-muted/50 border-input/60 focus-visible:bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <p className="text-xs text-muted-foreground mr-2 font-medium uppercase tracking-wider hidden sm:block">
                        Layout
                    </p>
                    <ToggleGroup type="single" value={viewMode} onValueChange={(v: string) => v && setViewMode(v as 'grid' | 'list')}>
                        <ToggleGroupItem value="grid" aria-label="Grid view" className="h-8 w-8 p-0">
                            <LayoutGrid className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="list" aria-label="List view" className="h-8 w-8 p-0">
                            <List className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
                <div>
                    <p className="text-sm font-medium text-muted-foreground mb-4">Owned by me</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredSheets.map((sheet) => (
                            <div
                                key={sheet.id}
                                onClick={() => router.push(`/data-vault/${sheet.id}`)}
                                className="group relative flex flex-col border rounded-xl overflow-hidden bg-card hover:border-green-600/50 hover:shadow-md transition-all cursor-pointer h-64"
                            >
                                {/* Preview Area */}
                                <div className="flex-1 bg-muted/20 relative border-b">
                                    <SpreadsheetPreview content={sheet.content} />
                                    {/* Gradient overlay for polish */}
                                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background/10 to-transparent pointer-events-none" />
                                </div>

                                {/* Footer Info */}
                                <div className="p-3 flex items-center justify-between bg-card z-10">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex-shrink-0 h-8 w-8 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded grid place-items-center">
                                            <FileSpreadsheet className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium truncate text-foreground">{sheet.name}</span>
                                            <span className="text-[10px] text-muted-foreground truncate">
                                                Opened {formatDistanceToNow(new Date(sheet.updatedAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>

                                    <div onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground transition-opacity focus:opacity-100">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => router.push(`/data-vault/${sheet.id}`)}>
                                                    <PenLine className="mr-2 h-4 w-4" />
                                                    Rename / Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={(e) => handleDelete(sheet.id, e as any)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Remove
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="border rounded-lg overflow-hidden bg-card">
                    {filteredSheets.map((sheet, i) => (
                        <div
                            key={sheet.id}
                            onClick={() => router.push(`/data-vault/${sheet.id}`)}
                            className={cn(
                                "flex items-center justify-between p-3 hover:bg-muted/40 cursor-pointer transition-colors group",
                                i !== filteredSheets.length - 1 && "border-b border-border/50"
                            )}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                                <span className="text-sm font-medium truncate flex-1">{sheet.name}</span>
                            </div>

                            <div className="hidden sm:flex items-center gap-8 mr-4 text-xs text-muted-foreground">
                                <span className="w-20 truncate">me</span>
                                <span className="w-32 text-right">
                                    {new Date(sheet.updatedAt).toLocaleDateString(undefined, {
                                        month: 'short', day: 'numeric', year: 'numeric'
                                    })}
                                </span>
                            </div>

                            <div onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => router.push(`/data-vault/${sheet.id}`)}>
                                            <PenLine className="mr-2 h-4 w-4" />
                                            Open
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={(e) => handleDelete(sheet.id, e as any)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
