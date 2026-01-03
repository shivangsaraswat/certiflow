'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2, Cloud, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

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
    // We'll use a ref to track if content has changed to debounce saves
    const contentRef = useRef<any>(null);

    useEffect(() => {
        if (id && userId) {
            loadSheet(id);
        }
    }, [id, userId]);

    const loadSheet = async (sheetId: string) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${baseUrl}/api/spreadsheets/${sheetId}`, {
                headers: { 'x-user-id': userId || '' }
            });
            const data = await res.json();

            if (data.success) {
                // Normalize content to ensure celldata format for FortuneSheet initialization
                // This handles the case where saved data is in 2D `data` format from onChange
                const content = normalizeSheetData(data.data.content);

                console.log('[Spreadsheet Load] Normalized content:',
                    content.map((s: any) => ({
                        name: s.name,
                        celldataLength: s.celldata?.length || 0,
                        hasData: !!s.data
                    }))
                );

                setSheet({
                    ...data.data,
                    content
                });
                // Initialize ref with loaded content
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
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            // Get latest content from ref
            const dataToSave = contentRef.current;

            if (!dataToSave) {
                console.warn("No content to save");
                setIsSaving(false);
                return;
            }

            console.log("Saving spreadsheet content:", JSON.stringify(dataToSave).substring(0, 200) + "...");

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

                // If we have a return URL, redirect after save
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
    };

    const handleChange = useCallback((data: any) => {
        // Update ref with new data on every change
        contentRef.current = data;
        // Optional: Trigger auto-save debounce here if needed
    }, []);

    // Manual save button handler
    const onManualSave = () => {
        handleSave();
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!sheet) return null;

    return (
        <div className="flex h-screen flex-col bg-background">
            {/* Header */}
            <header className="flex h-14 items-center justify-between border-b px-4 bg-card z-50">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/data-vault')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex flex-col">
                        <input
                            className="bg-transparent text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary/20 rounded px-1"
                            defaultValue={sheet.name}
                            onBlur={(e) => {
                                if (e.target.value !== sheet.name) {
                                    // Update name
                                    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                                    fetch(`${baseUrl}/api/spreadsheets/${id}`, {
                                        method: 'PUT',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'x-user-id': userId || ''
                                        },
                                        body: JSON.stringify({ name: e.target.value }),
                                    });
                                }
                            }}
                        />
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Cloud className="h-3 w-3" />
                                    {lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Unsaved'}
                                </>
                            )}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={onManualSave} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                    </Button>
                </div>
            </header>

            {/* Editor Container */}
            <div className="flex-1 overflow-hidden relative">
                {sheet?.content ? (
                    <Workbook
                        key={`workbook-${sheet?.updatedAt || 'initial'}`}
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
