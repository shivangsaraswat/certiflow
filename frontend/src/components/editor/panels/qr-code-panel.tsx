'use client';

import { useState } from 'react';
import { QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QRCodePanelProps {
    onAddQRCode: (url: string) => void;
}

export function QRCodePanel({ onAddQRCode }: QRCodePanelProps) {
    const [url, setUrl] = useState('');

    const handleAdd = () => {
        if (!url) return;
        onAddQRCode(url);
        setUrl('');
    };

    return (
        <div className="flex h-full flex-col bg-background p-4 space-y-6">
            <div className="border-b pb-4">
                <h3 className="text-sm font-semibold mb-1">QR Code generator</h3>
                <p className="text-xs text-muted-foreground">Add a URL to create a QR code.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="qr-url" className="text-xs">URL</Label>
                    <Input
                        id="qr-url"
                        placeholder="https://www.example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                </div>
                <Button className="w-full" onClick={handleAdd} disabled={!url}>
                    <QrCode className="mr-2 h-4 w-4" />
                    Add QR Code
                </Button>
            </div>

            <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700">
                <p className="font-semibold mb-1">Tip:</p>
                You can use variables like <code>{'{certificateId}'}</code> in the URL to create dynamic verification links.
            </div>
        </div>
    );
}
