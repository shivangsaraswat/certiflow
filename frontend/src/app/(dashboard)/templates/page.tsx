'use client';

/**
 * Templates List Page
 * Displays all uploaded templates with management options
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TemplateCard } from '@/components/templates/template-card';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { getTemplates, deleteTemplate } from '@/lib/api';
import { useSession } from 'next-auth/react';
import type { Template } from '@/types';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const loadTemplates = useCallback(async () => {
        if (!userId) return; // Wait for session

        setIsLoading(true);
        setError(null);
        try {
            const res = await getTemplates(userId);
            if (res.success && res.data) {
                setTemplates(res.data);
            } else {
                setError(res.error?.message || 'Failed to load templates');
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            const res = await deleteTemplate(id, userId);
            if (res.success) {
                setTemplates((prev) => prev.filter((t) => t.id !== id));
            } else {
                alert(res.error?.message || 'Failed to delete template');
            }
        } catch {
            alert('Failed to delete template');
        }
    };

    if (isLoading) {
        return <LoadingPage message="Loading templates..." />;
    }

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={loadTemplates} className="h-8">
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Refresh
                </Button>
                <Link href="/templates/new">
                    <Button size="sm" className="h-8">
                        <Plus className="mr-2 h-3 w-3" />
                        Upload Template
                    </Button>
                </Link>
            </div>

            {/* Error Display */}
            {error && (
                <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                    {error}
                </div>
            )}

            {/* Templates Grid */}
            {templates.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30">
                    <p className="mb-4 text-sm text-muted-foreground">No templates yet</p>
                    <Link href="/templates/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Upload Your First Template
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {templates.map((template) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
