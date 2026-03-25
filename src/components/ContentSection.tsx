"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import DecorativeLine from "./DecorativeLine";

interface ContentSectionProps {
    title: string;
    description: string;
    imageSrc: string;
    alignment: "left" | "right";
    index: number;
}

export default function ContentSection({
    title,
    description,
    imageSrc,
    alignment,
    index,
}: ContentSectionProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]); // Parallax effect

    return (
        <section
            ref={containerRef}
            className={`relative min-h-screen flex items-center py-20 overflow-hidden ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
        >
            <div className="container mx-auto max-w-7xl px-4 md:px-8 relative z-10">
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${alignment === "right" ? "" : "direction-rtl" // Use flex-row-reverse logic via grid
                    }`}>

                    {/* Text Column */}
                    <div className={`${alignment === "right" ? "order-1" : "lg:order-2"}`}>
                        <motion.div
                            initial={{ opacity: 0, x: alignment === "right" ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-20%" }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">{title}</h2>
                            <div className="w-20 h-1 bg-accent mb-8 rounded-full" />
                            <p className="text-lg text-gray-600 leading-relaxed font-light">
                                {description}
                            </p>
                            <div className="mt-8">
                                <a href="#" className="text-accent font-medium hover:text-accent-hover inline-flex items-center group transition-colors">
                                    Află mai multe
                                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </a>
                            </div>
                        </motion.div>
                    </div>

                    {/* Image Column */}
                    <div className={`${alignment === "right" ? "order-2" : "lg:order-1"} flex justify-center`}>
                        <motion.div
                            style={{ y }}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-20%" }}
                            transition={{ duration: 0.8 }}
                            className="relative w-full max-w-lg aspect-[4/5]"
                        >
                            <div className="absolute inset-0 bg-accent/5 rounded-3xl transform rotate-3 scale-105 z-0" />
                            <Image
                                src={imageSrc}
                                alt={title}
                                fill
                                className="object-contain z-10 relative drop-shadow-xl hover:scale-105 transition-transform duration-700 ease-out"
                            />
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Decorative Connecting Lines */}
            <DecorativeLine
                d={alignment === "right"
                    ? "M 0 50 C 30 20, 70 80, 100 50"
                    : "M 0 50 C 30 80, 70 20, 100 50"}
                className={`absolute top-0 bottom-0 ${alignment === "right" ? "right-0" : "left-0"} w-80 opacity-10`}
                color="#3B8BEB"
                strokeWidth={1}
            />
        </section>
    );
}
