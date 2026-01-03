'use client';

/**
 * New Template Upload Page
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TemplateUploadForm } from '@/components/templates/template-form';

function NewTemplateContent() {
    const searchParams = useSearchParams();
    const returnTo = searchParams.get('returnTo') || undefined;

    return <TemplateUploadForm returnTo={returnTo} />;
}

export default function NewTemplatePage() {
    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Upload New Template</h1>
                <p className="text-muted-foreground">
                    Upload a certificate template to start generating certificates
                </p>
            </div>

            <Suspense fallback={<div>Loading form...</div>}>
                <NewTemplateContent />
            </Suspense>
        </div>
    );
}
