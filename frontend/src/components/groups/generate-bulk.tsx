'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import type { Group } from '@/types';

interface Props {
    group: Group;
    onGenerated?: () => void;
}

export function GroupGenerateBulk({ group, onGenerated }: Props) {
    const [, setMessage] = useState<{ success: boolean; text: string } | null>(null);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bulk Generate Certificates</CardTitle>
                <CardDescription>
                    Upload a CSV or use Dataset to generate multiple certificates
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                        Bulk generation in groups coming soon!
                    </p>
                    <p className="text-sm text-muted-foreground">
                        For now, use the main Bulk Generate page and it will work with the template assigned to this group.
                    </p>
                    <Button variant="outline" className="mt-4" asChild>
                        <a href="/generate/bulk">Go to Bulk Generate</a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
