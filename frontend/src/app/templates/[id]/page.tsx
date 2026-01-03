'use client';

/**
 * Template Editor Page
 * Visual editor for placing attributes on PDF templates
 */

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { TemplateEditor } from '@/components/editor/template-editor';
import { getTemplate } from '@/lib/api';
import type { Template } from '@/types';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function TemplateEditorPage({ params }: PageProps) {
    const { id } = use(params);
    const [template, setTemplate] = useState<Template | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadTemplate() {
            try {
                const res = await getTemplate(id);
                if (res.success && res.data) {
                    setTemplate(res.data);
                } else {
                    setError('Template not found');
                }
            } catch {
                setError('Failed to load template');
            } finally {
                setIsLoading(false);
            }
        }

        loadTemplate();
    }, [id]);

    if (isLoading) {
        return <LoadingPage message="Loading template editor..." />;
    }

    if (error || !template) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center">
                <p className="mb-4 text-destructive">{error || 'Template not found'}</p>
                <Link href="/templates">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Templates
                    </Button>
                </Link>
            </div>
        );
    }

    return <TemplateEditor template={template} />;
}
