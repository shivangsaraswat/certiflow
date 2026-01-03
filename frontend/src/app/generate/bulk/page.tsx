import { BulkUploadForm } from '@/components/generate/bulk-upload';

/**
 * Bulk Certificate Generation Page
 */
export default function BulkGeneratePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Bulk Generate Certificates</h1>
                <p className="text-muted-foreground">
                    Upload a CSV file to generate certificates in batch
                </p>
            </div>

            <BulkUploadForm />
        </div>
    );
}
