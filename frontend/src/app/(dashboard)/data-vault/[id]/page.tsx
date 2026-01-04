'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, Cloud, CheckCircle2, Pencil } from 'lucide-react';
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
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { usePageTitle } from '@/components/providers/page-title-provider';
import { useSidebar } from '@/components/providers/sidebar-provider';

/**
 * Convert FortuneSheet's internal 2D `data` array format back to sparse `celldata` format.
 * FortuneSheet's onChange returns sheets with `data` (2D array), but initialization 
 * requires `celldata` (sparse array with {r, c, v} objects).
 */
function convertDataToCelldata(data: any[][]): any[] {
    const celldata: any[] = [];
    if (!data || !Array.isArray(data)) return celldata;

    for (let r = 0; r < data.length; r++) {
        const row = data[r];
        if (!row || !Array.isArray(row)) continue;

        for (let c = 0; c < row.length; c++) {
            const cell = row[c];
            // Only include non-null cells
            if (cell !== null && cell !== undefined) {
                celldata.push({ r, c, v: cell });
            }
        }
    }
    return celldata;
}

/**
 * Normalize sheet data for FortuneSheet initialization.
 * Ensures each sheet has `celldata` format (not `data` format).
 */
function normalizeSheetData(sheets: any[]): any[] {
    if (!sheets || !Array.isArray(sheets)) {
        return [{ name: 'Sheet1', celldata: [] }];
    }

    return sheets.map((sheet, index) => {
        // If sheet has `data` (2D array) but no `celldata`, convert it
        if (sheet.data && Array.isArray(sheet.data) && (!sheet.celldata || sheet.celldata.length === 0)) {
            const celldata = convertDataToCelldata(sheet.data);
            // Return sheet with celldata, removing the data property to avoid confusion
            const { data, ...rest } = sheet;
            return {
                ...rest,
                name: sheet.name || `Sheet${index + 1}`,
                celldata,
            };
        }

        // Already has celldata or is empty - return as-is but ensure name exists
        return {
            ...sheet,
            name: sheet.name || `Sheet${index + 1}`,
            celldata: sheet.celldata || [],
        };
    });
}

function SheetEditorContent() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = params?.id as string;
    const { data: session } = useSession();
    const userId = session?.user?.id;

    // Return navigation support for wizard flow
    const returnTo = searchParams.get('returnTo');
    const wizardStep = searchParams.get('wizardStep');

    const [sheet, setSheet] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const contentRef = useRef<any>(null);
    const { setPageTitle, setActions, setBackButton } = usePageTitle();
    const { collapseSidebar } = useSidebar();

    useEffect(() => {
        collapseSidebar();
    }, [collapseSidebar]);

    const loadSheet = useCallback(async (sheetId: string) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${baseUrl}/api/spreadsheets/${sheetId}`, {
                headers: { 'x-user-id': userId || '' }
            });
            const data = await res.json();

            if (data.success) {
                const content = normalizeSheetData(data.data.content);
                setSheet({
                    ...data.data,
                    content
                });
                contentRef.current = content;
                setLastSaved(new Date(data.data.updatedAt));
            } else {
                toast.error('Failed to load spreadsheet');
                router.push('/data-vault');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load spreadsheet');
        } finally {
            setIsLoading(false);
        }
    }, [userId, router]);

    useEffect(() => {
        if (id && userId) {
            loadSheet(id);
        }
    }, [id, userId, loadSheet]);

    const handleSave = useCallback(async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            const dataToSave = contentRef.current;
            if (!dataToSave) {
                setIsSaving(false);
                return;
            }

            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${baseUrl}/api/spreadsheets/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId || ''
                },
                body: JSON.stringify({
                    content: dataToSave
                }),
            });

            if (res.ok) {
                setLastSaved(new Date());
                toast.success('Saved successfully');
                if (returnTo) {
                    const returnUrl = wizardStep ? `${returnTo}?wizardStep=${wizardStep}` : returnTo;
                    router.push(returnUrl);
                }
            } else {
                toast.error('Failed to save changes');
            }
        } catch (error) {
            console.error('Save failed', error);
            toast.error('Save failed');
        } finally {
            setIsSaving(false);
        }
    }, [id, userId, returnTo, router, isSaving, wizardStep]);

    const updateSheetName = useCallback(async (newName: string) => {
        if (!newName.trim() || newName === sheet.name) return;

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${baseUrl}/api/spreadsheets/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId || ''
                },
                body: JSON.stringify({ name: newName }),
            });

            if (res.ok) {
                setSheet((prev: any) => ({ ...prev, name: newName }));
                toast.success('Renamed successfully');
            } else {
                toast.error('Failed to rename spreadsheet');
            }
        } catch (error) {
            console.error('Rename failed', error);
            toast.error('Rename failed');
        }
    }, [id, userId, sheet]);

    const handleChange = useCallback((data: any) => {
        contentRef.current = data;
    }, []);

    useEffect(() => {
        if (sheet) {
            // Editable Title Component
            const EditableTitle = () => {
                const [value, setValue] = useState(sheet.name);

                return (
                    <Input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={() => updateSheetName(value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            }
                        }}
                        className="h-8 md:h-9 px-2 text-base md:text-lg font-semibold bg-transparent border-transparent hover:border-input focus:bg-background focus:border-input transition-colors w-full min-w-[200px]"
                    />
                );
            };

            setPageTitle(<EditableTitle />);

            setBackButton(
                <Button variant="ghost" size="icon" onClick={() => router.push('/data-vault')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            );
            setActions(
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mr-2">
                        {isSaving ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span className="hidden sm:inline">Saving...</span>
                            </>
                        ) : lastSaved ? (
                            <>
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span className="hidden md:inline">{`Saved ${lastSaved.toLocaleTimeString()}`}</span>
                                <span className="hidden sm:inline md:hidden">Saved</span>
                            </>
                        ) : (
                            <>
                                <Cloud className="h-3 w-3" />
                                <span className="hidden sm:inline">Unsaved</span>
                            </>
                        )}
                    </div>

                    <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2 h-8 sm:h-9">
                        <Save className="h-4 w-4" />
                        <span className="hidden sm:inline">Save</span>
                    </Button>
                </div>
            );
        }

        return () => {
            setPageTitle(null);
            setActions(null);
            setBackButton(null);
        };
    }, [sheet, isSaving, lastSaved, handleSave, setPageTitle, setActions, setBackButton, router, updateSheetName]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!sheet) return null;

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col bg-background -mx-6 -mb-6 -mt-4">
            <div className="flex-1 overflow-hidden relative">
                {sheet?.content ? (
                    <Workbook
                        key={`workbook-${id}`}
                        data={sheet.content}
                        onChange={handleChange}
                        showToolbar={true}
                        showSheetTabs={true}
                        row={100}
                        column={26}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <LoadingSpinner />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SheetEditorPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <LoadingSpinner />
            </div>
        }>
            <SheetEditorContent />
        </Suspense>
    );
}
