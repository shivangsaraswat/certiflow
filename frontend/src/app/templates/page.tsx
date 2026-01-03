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
import type { Template } from '@/types';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTemplates = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await getTemplates();
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
    }, []);

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;

        try {
            const res = await deleteTemplate(id);
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Templates</h1>
                    <p className="text-muted-foreground">
                        Manage your certificate templates
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={loadTemplates}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Link href="/templates/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Upload Template
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                    {error}
                </div>
            )}

            {/* Templates Grid */}
            {templates.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
                    <p className="mb-4 text-muted-foreground">No templates yet</p>
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
