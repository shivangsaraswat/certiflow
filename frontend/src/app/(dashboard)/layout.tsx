import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { PageTitleProvider } from "@/components/providers/page-title-provider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PageTitleProvider>
            <div className="flex min-h-screen">
                {/* Sidebar - hidden on mobile */}
                <div className="hidden lg:block">
                    <Sidebar />
                </div>

                {/* Main Content */}
                <div className="flex-1 lg:ml-64">
                    <Header />
                    <main className="p-6">
                        {children}
                    </main>
                </div>
            </div>
        </PageTitleProvider>
    );
}
