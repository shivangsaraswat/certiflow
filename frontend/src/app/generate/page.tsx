import { Suspense } from 'react';
import { SingleCertificateForm } from '@/components/generate/single-form';
import { LoadingPage } from '@/components/shared/loading-spinner';

/**
 * Single Certificate Generation Page
 */
export default function GeneratePage() {
    return (
        <div className="max-w-5xl mx-auto py-6">
            <Suspense fallback={<LoadingPage message="Loading..." />}>
                <SingleCertificateForm />
            </Suspense>
        </div>
    );
}
