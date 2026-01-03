import Link from 'next/link';
import { FileImage, FileOutput, Files, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to CertifGen</h1>
        <p className="text-muted-foreground">
          Generate professional certificates with ease. Upload templates, customize attributes, and generate high-quality PDFs.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Generate Certificate */}
        <Card className="group relative overflow-hidden border-2 transition-all hover:border-primary hover:shadow-lg">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <FileOutput className="h-6 w-6" />
            </div>
            <CardTitle>Generate Certificate</CardTitle>
            <CardDescription>
              Create a single certificate with custom details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/generate">
              <Button className="group/btn w-full">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Bulk Generate */}
        <Card className="group relative overflow-hidden border-2 transition-all hover:border-primary hover:shadow-lg">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white">
              <Files className="h-6 w-6" />
            </div>
            <CardTitle>Bulk Generate</CardTitle>
            <CardDescription>
              Upload a CSV and generate certificates in batch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/generate/bulk">
              <Button variant="outline" className="group/btn w-full">
                Upload CSV
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Manage Templates */}
        <Card className="group relative overflow-hidden border-2 transition-all hover:border-primary hover:shadow-lg">
          <CardHeader>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-green-500 transition-colors group-hover:bg-green-500 group-hover:text-white">
              <FileImage className="h-6 w-6" />
            </div>
            <CardTitle>Manage Templates</CardTitle>
            <CardDescription>
              Upload and configure certificate templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/templates">
              <Button variant="outline" className="group/btn w-full">
                View Templates
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-semibold">Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'High Quality', desc: '300 DPI PDF output' },
            { title: 'Customizable', desc: 'Flexible attribute positioning' },
            { title: 'Bulk Processing', desc: 'Generate thousands at once' },
            { title: 'Easy to Use', desc: 'Simple, intuitive interface' },
          ].map((feature, i) => (
            <Card key={i} className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
