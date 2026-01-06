'use client';

import Image from 'next/image';

const features = [
    {
        title: "Send certificates emails in bulk",
        description: "Save time and eliminate errors by sending certificates and badges to all recipients in one go. Ensure automatic and reliable delivery.",
        image: "/banto/bulk-sending-min_ogkb5y.png",
        bgClass: "bg-[#fedfd4]", // Matches bulk image background
        imageClass: "object-contain p-6"
    },
    {
        title: "Mass export PDF certificates",
        description: "Instantly mass-generate and export certificates as PDF documents. No manual work or delays - just seamless downloading.",
        image: "/banto/pdf-min_sxh2ls.png",
        bgClass: "bg-[#e5d9f2]", // Matches pdf image background
        imageClass: "scale-105"
    },
    {
        title: "Generate credential URL lists",
        description: "Issue digital certificates with unique and shareable URLs. Simplify workflow and give recipients instant access to credentials.",
        image: "/banto/credential-min_uiii5d.png",
        bgClass: "bg-[#daf1e7]", // Matches credential image background
        imageClass: "object-cover"
    }
];

const secondaryFeatures = [
    {
        title: "Enterprise-grade security",
        description: "We prioritize security at every level. With ISO 27001 certification, GDPR compliance, AWS cloud hosting, external audits and penetration testing, your data is always protected.",
        image: "/banto/security-min_d2qivm.webp",
        bgClass: "bg-[#e8f2ff]", // Matches security image background
        imageClass: "object-contain"
    },
    {
        title: "Unlimited certificate hosting",
        description: "All issued digital certificates and badges are stored online forever - at no extra cost. Your recipients have login-free access anytime, instantly.",
        image: "/banto/hosting-min_qo3zjg.webp",
        bgClass: "bg-[#fff2e0]", // Matches hosting image background
        imageClass: "object-contain"
    }
];

export function Integrations() {
    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="mb-16 text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight mb-4">
                        Powerful AI certificate generator for any use case
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Generate, issue, send, mass-export, and download certificates in bulk.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {features.map((feature, i) => (
                        <div key={i} className="rounded-2xl bg-white border border-black/20 hover:border-black/30 overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300">
                            <div className={`h-56 relative w-full flex items-center justify-center ${feature.bgClass}`}>
                                <Image
                                    src={feature.image}
                                    alt={feature.title}
                                    fill
                                    className={`${feature.imageClass || ''}`}
                                />
                            </div>
                            <div className="p-8">
                                <h3 className="text-xl font-serif font-semibold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {secondaryFeatures.map((feature, i) => (
                        <div key={i} className="rounded-2xl bg-white border border-black/20 hover:border-black/30 overflow-hidden hover:shadow-lg transition-all duration-300">
                            <div className={`relative h-72 w-full flex items-center justify-center ${feature.bgClass}`}>
                                <Image
                                    src={feature.image}
                                    alt={feature.title}
                                    fill
                                    className={feature.imageClass}
                                />
                            </div>
                            <div className="p-8">
                                <h3 className="text-xl font-serif font-semibold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
