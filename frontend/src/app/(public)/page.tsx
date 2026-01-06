import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { LogoTicker } from '@/components/landing/logo-ticker';
import { FeatureShowcase } from '@/components/landing/feature-showcase';
import { TemplatesGallery } from '@/components/landing/templates-gallery';
import { Integrations } from '@/components/landing/integrations';
import { Testimonials } from '@/components/landing/testimonials';
import { CTA } from '@/components/landing/cta-section';
import { Footer } from '@/components/landing/footer';

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20">
            <Navbar />
            <main className="flex-1">
                <Hero />
                <LogoTicker />
                <FeatureShowcase />
                <TemplatesGallery />
                <Integrations />
                <Testimonials />
                <CTA />
            </main>
            <Footer />
        </div>
    );
}
