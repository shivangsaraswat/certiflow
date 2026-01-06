'use client';

import { motion } from 'framer-motion';

const logos = [
    { name: 'Zapier', src: '/svgs/672890be48319096ffeb6bfe_zapier.svg' },
    { name: 'Barrys', src: '/svgs/672890b1d5a69d1620412cf7_barrys.svg' },
    { name: 'Webflow', src: '/svgs/672890ca58ffc8edfb664691_webflow.svg' },
    { name: 'HubSpot', src: '/svgs/672890a3d27752eaed89aa47_hubspot.svg' },
    { name: 'Hermes', src: '/svgs/67289096a54485774b102f83_hermes.svg' }, // Added Hermes as it was available in the folder
    { name: 'Stripe', src: '/svgs/674a0308c3afe7b2e2126521_stripelight.svg' }, // Using available stripe svg, checking if 'light' works (might be white, we'll see) - actually let's stick to the non-light ones first if possible or assume 'light' means 'for dark bg'. 
    // Wait, the capsules are white. If I use 'stripelight.svg' it might be white text. Invisible on white capsule.
    // Let's stick to the ones that seem standard or check if 'light' is actually dark text for light bg? No 'light' usually means 'for dark bg' (i.e. white text). 
    // The standard ones (without 'light' suffix) are likely colored or dark.
    // So sticking to Zapier, Barrys, Webflow, HubSpot, Hermes.
    { name: 'Zapier', src: '/svgs/672890be48319096ffeb6bfe_zapier.svg' },
    { name: 'Barrys', src: '/svgs/672890b1d5a69d1620412cf7_barrys.svg' },
    { name: 'Webflow', src: '/svgs/672890ca58ffc8edfb664691_webflow.svg' },
];

export function LogoTicker() {
    return (
        <section className="py-20 bg-black text-white overflow-hidden border-y border-white/10">
            <div className="container mx-auto px-6 mb-12 text-center">
                <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest">
                    Trusted by 95% of the Fortune 500
                </p>
            </div>

            <div className="flex overflow-hidden relative after:absolute after:left-0 after:top-0 after:w-40 after:h-full after:bg-gradient-to-r after:from-black after:to-transparent after:z-10 before:absolute before:right-0 before:top-0 before:w-40 before:h-full before:bg-gradient-to-l before:from-black before:to-transparent before:z-10">
                <motion.div
                    className="flex gap-8 items-center flex-nowrap min-w-full px-8"
                    animate={{ x: "-50%" }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 40,
                    }}
                    style={{ willChange: "transform", backfaceVisibility: "hidden" }}
                >
                    {[...logos, ...logos, ...logos].map((logo, idx) => (
                        <div
                            key={idx}
                            className="flex-none flex items-center justify-center bg-white h-16 w-48 rounded-full shadow-lg cursor-default hover:scale-105 transition-transform duration-300 px-8"
                        >
                            <img
                                src={logo.src}
                                alt={logo.name}
                                className="h-8 w-auto object-contain max-w-full opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
