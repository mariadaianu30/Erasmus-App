"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";

interface ScatteredSectionProps {
    children: ReactNode;
    images?: string[];
    imagePositions?: any[];
    reverse?: boolean;
}

export default function ScatteredSection({ children, images = [], reverse = false }: ScatteredSectionProps) {
    const [items, setItems] = useState<any[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        const uniqueImages = images.filter((img, i) => i === 0 || img !== images[i - 1]);

        const generatedItems: any[] = [];
        const usedPositions: { top: number, bottom: number }[] = [];

        uniqueImages.forEach((src, idx) => {
            const lowerSrc = src.toLowerCase();
            const isBus = lowerSrc.includes('bus') || lowerSrc.includes('image_3_17680364');
            const isPlane = lowerSrc.includes('image_3_1768038135102') || lowerSrc.includes('red_plane');

            let attempts = 0;
            let top = 0;
            let valid = false;

            while (!valid && attempts < 50) {
                top = Math.random() * 80;
                // Increased spacing to 20% to prevent overlaps
                const conflict = usedPositions.some(p => Math.abs(p.top - top) < 20);
                if (!conflict) valid = true;
                attempts++;
            }
            usedPositions.push({ top, bottom: top + 20 });

            generatedItems.push({
                src,
                isBus,
                isPlane,
                top: `${top}%`,
                side: (idx % 2 === 0) !== reverse ? 'left' : 'right',
                offset: `${Math.random() * 10 + 2}%`,
                scale: Math.random() * 0.3 + 0.8
            });
        });

        setItems(generatedItems);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!mounted) {
        return (
            <section className="relative min-h-[80vh] py-20 flex items-center overflow-hidden">
                <div className="container mx-auto px-4 md:px-8 relative z-10">
                    <div className="flex-1 w-full prose prose-lg max-w-none opacity-0">
                        {children}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="relative min-h-[80vh] py-20 flex items-center overflow-hidden">
            <div className="container mx-auto px-4 md:px-8 relative z-20">
                <div className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12`}>
                    <div className="flex-1 w-full lg:w-1/2 prose prose-lg max-w-none">
                        {children}
                    </div>
                    <div className="flex-1 w-full lg:w-1/2 min-h-[300px]" />
                </div>
            </div>

            {items.map((item, idx) => {
                // Plane Animation: Fly across entire page
                if (item.isPlane) {
                    return (
                        <motion.div
                            key={idx}
                            className="absolute z-30 pointer-events-none"
                            style={{
                                top: item.top,
                                width: '150px',
                                left: '-200px' // Start position off-screen
                            }}
                            // Force animation immediately on mount
                            animate={{
                                x: 'calc(100vw + 500px)',
                                y: [0, -100, 60, -200],
                                rotate: [0, -5, 10, -5]
                            }}
                            transition={{
                                duration: 15, // Slower, majestic flight
                                ease: "linear",
                                delay: 1, // Short delay before takeoff
                                repeat: Infinity,
                                repeatDelay: 3
                            }}
                        >
                            <Image
                                src={`/images/${item.src}`}
                                alt="Paper Plane"
                                width={300}
                                height={300}
                                className="w-full h-auto object-contain drop-shadow-2xl"
                            />
                        </motion.div>
                    )
                }

                if (item.isBus) {
                    return (
                        <motion.div
                            key={idx}
                            className="absolute z-10 pointer-events-none"
                            style={{
                                top: 'auto', bottom: '10%',
                                width: '280px',
                                right: reverse ? 'auto' : '-300px',
                                left: reverse ? '-300px' : 'auto'
                            }}
                            whileInView={{
                                x: reverse ? '120vw' : '-120vw'
                            }}
                            viewport={{ once: true }}
                            transition={{ duration: 4, ease: "easeInOut" }}
                        >
                            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.2 }}>
                                <Image
                                    src={`/images/${item.src}`}
                                    alt="Bus"
                                    width={400}
                                    height={400}
                                    className="w-full h-auto object-contain drop-shadow-xl"
                                />
                            </motion.div>
                        </motion.div>
                    )
                }

                // Standard Floating Character/Item
                return (
                    <motion.div
                        key={idx}
                        className="absolute z-10 pointer-events-none"
                        style={{
                            top: item.top,
                            [item.side]: item.offset,
                            width: '180px'
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: item.scale }}
                        viewport={{ once: true, margin: "-10%" }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                    >
                        <motion.div
                            animate={{
                                y: [-15, 15, -15],
                                rotate: [-5, 5, -5]
                            }}
                            transition={{
                                duration: 5 + Math.random() * 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: Math.random() * 2
                            }}
                        >
                            <Image
                                src={`/images/${item.src}`}
                                alt="Decorative Element"
                                width={300}
                                height={300}
                                className="w-full h-auto object-contain drop-shadow-lg"
                            />
                        </motion.div>
                    </motion.div>
                );
            })}
        </section>
    );
}
