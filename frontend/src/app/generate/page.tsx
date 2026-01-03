import { Suspense } from 'react';
import { SingleCertificateForm } from '@/components/generate/single-form';
import { LoadingPage } from '@/components/shared/loading-spinner';

/**
 * Single Certificate Generation Page
 */
export default function GeneratePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Generate Certificate</h1>
                <p className="text-muted-foreground">
                    Create a single certificate with custom details
                </p>
            </div>

            <Suspense fallback={<LoadingPage message="Loading..." />}>
                <SingleCertificateForm />
            </Suspense>
        </div>
    );
}
