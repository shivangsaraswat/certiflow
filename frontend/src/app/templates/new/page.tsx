/**
 * New Template Upload Page
 */

import { TemplateUploadForm } from '@/components/templates/template-form';

export default function NewTemplatePage() {
    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Upload New Template</h1>
                <p className="text-muted-foreground">
                    Upload a certificate template to start generating certificates
                </p>
            </div>

            <TemplateUploadForm />
        </div>
    );
}
