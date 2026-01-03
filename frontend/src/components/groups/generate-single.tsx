'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getTemplate, generateSingleInGroup } from '@/lib/api';
import type { Group, Template, DynamicAttribute } from '@/types';

interface Props {
    group: Group;
    onGenerated?: () => void;
}

export function GroupGenerateSingle({ group, onGenerated }: Props) {
    const [template, setTemplate] = useState<Template | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [recipientEmail, setRecipientEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        const loadTemplate = async () => {
            setLoading(true);
            const res = await getTemplate(group.templateId);
            if (res.success && res.data) {
                setTemplate(res.data);
                // Initialize form data
                const initial: Record<string, string> = {};
                res.data.attributes.forEach((attr: DynamicAttribute) => {
                    initial[attr.id] = '';
                });
                setFormData(initial);
            }
            setLoading(false);
        };
        loadTemplate();
    }, [group.templateId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!template) return;

        setGenerating(true);
        setResult(null);

        const res = await generateSingleInGroup(group.id, {
            data: formData,
            recipientName: formData[template.attributes[0]?.id] || 'Unknown',
            recipientEmail: recipientEmail || undefined,
        });

        if (res.success && res.data) {
            setResult({ success: true, message: `Certificate ${res.data.certificateId} generated!` });
            // Reset form
            const initial: Record<string, string> = {};
            template.attributes.forEach((attr: DynamicAttribute) => {
                initial[attr.id] = '';
            });
            setFormData(initial);
            setRecipientEmail('');
            onGenerated?.();
        } else {
            setResult({ success: false, message: res.error?.message || 'Failed to generate certificate' });
        }

        setGenerating(false);
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </CardContent>
            </Card>
        );
    }

    if (!template) {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    Template not found
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Generate Single Certificate</CardTitle>
                <CardDescription>
                    Fill in the details to generate a certificate
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {template.attributes.map((attr) => (
                        <div key={attr.id} className="space-y-2">
                            <Label htmlFor={attr.id}>
                                {attr.name}
                                {attr.required && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            <Input
                                id={attr.id}
                                value={formData[attr.id] || ''}
                                onChange={(e) => setFormData({ ...formData, [attr.id]: e.target.value })}
                                placeholder={attr.placeholder || `Enter ${attr.name}`}
                                required={attr.required}
                            />
                        </div>
                    ))}

                    <div className="space-y-2">
                        <Label htmlFor="email">
                            Recipient Email
                            <span className="text-muted-foreground ml-1">(for Certificate ID)</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            placeholder="e.g., 24f3001856@ds.study.iitm.ac.in"
                        />
                        <p className="text-xs text-muted-foreground">
                            Last 4 digits before @ will be used in Certificate ID
                        </p>
                    </div>

                    {result && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg ${result.success
                                ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                            {result.success ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <AlertCircle className="h-4 w-4" />
                            )}
                            {result.message}
                        </div>
                    )}

                    <Button type="submit" disabled={generating} className="w-full">
                        {generating ? 'Generating...' : 'Generate Certificate'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
