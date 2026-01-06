'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Layout,
  Users,
  PenTool,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';
import { getDashboardStats } from '@/lib/api';
import type { DashboardStats } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (session?.user?.id) {
        const result = await getDashboardStats(session.user.id);
        if (result.success && result.data) {
          setStats(result.data);
        }
        setLoading(false);
      }
    }
    loadStats();
  }, [session?.user?.id]);

  const userName = session?.user?.name?.split(' ')[0] || 'User';

  return (
    <div className="space-y-8 font-inter">

      {/* Hero Section */}
      <div className="rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20">
                New
              </Badge>
              <span className="text-sm font-medium text-muted-foreground">Included in your plan</span>
            </div>
            <h1 className="text-3xl font-serif font-medium tracking-tight text-foreground sm:text-4xl">
              Meet <span className="italic">Automations</span>: CertifGen&apos;s way to put your credentialing on autopilot
            </h1>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-sm" />
                Connect CertifGen to your favorite tools to automate issuance
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-sm" />
                Save hundreds of hours by turning manual credentialing into fully automated process
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-sm" />
                No code, no complexity, and no additional fees
              </li>
            </ul>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/generate/bulk">
                <Button size="lg" className="h-10 px-6 font-medium shadow-sm transition-all hover:shadow-md">
                  Create Automation
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="gap-2 h-10 px-6 font-medium bg-background/50 hover:bg-background/80">
                <PenTool className="h-4 w-4" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="hidden flex-1 justify-end md:flex">
            <div className="relative w-full max-w-[400px] overflow-hidden rounded-xl">
              <video
                src="https://res.cloudinary.com/certifier/video/upload/v1738860141/Certifier_certificates_en_homepage_gjghdp.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Certificates"
          value={stats?.certificates}
          icon={FileText}
          loading={loading}
          color="text-blue-600 dark:text-blue-400"
          bg="bg-blue-50 dark:bg-blue-900/10"
        />
        <StatsCard
          title="Active Templates"
          value={stats?.templates}
          icon={Layout}
          loading={loading}
          color="text-purple-600 dark:text-purple-400"
          bg="bg-purple-50 dark:bg-purple-900/10"
        />
        <StatsCard
          title="Groups"
          value={stats?.groups}
          icon={Users}
          loading={loading}
          color="text-emerald-600 dark:text-emerald-400"
          bg="bg-emerald-50 dark:bg-emerald-900/10"
        />
        <StatsCard
          title="Signatures"
          value={stats?.signatures}
          icon={PenTool}
          loading={loading}
          color="text-amber-600 dark:text-amber-400"
          bg="bg-amber-50 dark:bg-amber-900/10"
        />
      </div>

      {/* Recent Activity / Empty State */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 md:col-span-5 shadow-sm border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between py-2 border-b last:border-0 border-border/40">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{cert.recipientName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(cert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {cert.generationMode}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p>No recent activity</p>
                <p className="text-xs mt-1">Generate your first certificate to see it here.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3 md:col-span-2 shadow-sm border-0 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/templates" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3 bg-background/50 hover:bg-background/80 border-primary/20 hover:border-primary/50 transition-all group">
                <Layout className="mr-3 h-4 w-4 text-primary" />
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">Browse Templates</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Explore new designs</span>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
              </Button>
            </Link>
            <Link href="/groups" className="block">
              <Button variant="outline" className="w-full justify-start h-auto py-3 bg-background/50 hover:bg-background/80 border-primary/20 hover:border-primary/50 transition-all group">
                <Users className="mr-3 h-4 w-4 text-primary" />
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">Manage Groups</span>
                  <span className="text-xs text-muted-foreground mt-0.5">Organize recipients</span>
                </div>
                <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, loading, color, bg }: any) {
  return (
    <Card className="shadow-sm border-0 bg-card hover:bg-card/80 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${bg} ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active records
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

