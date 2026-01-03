'use client';

/**
 * Template Editor Page
 * Visual editor for placing attributes on PDF templates
 */

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/shared/loading-spinner';
import { getTemplate } from '@/lib/api';
import { useSession } from 'next-auth/react';

const TemplateEditor = dynamic(
    () => import('@/components/editor/template-editor').then((mod) => mod.TemplateEditor),
    { ssr: false, loading: () => <LoadingPage message="Loading editor..." /> }
);
import type { Template } from '@/types';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function TemplateEditorPage({ params }: PageProps) {
    const { id } = use(params);
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [template, setTemplate] = useState<Template | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadTemplate() {
            if (!userId) return;
            try {
                const res = await getTemplate(id, userId);
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

        if (userId) {
            loadTemplate();
        }
    }, [id, userId]);

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
