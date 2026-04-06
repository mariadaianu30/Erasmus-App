"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

export default function GlobalYellowLine({ zIndex = 0 }: { zIndex?: number }) {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll();

    // Re-apply a smooth spring but with a very soft latency
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Shift the line 15% ahead at 0 scroll, and finish drawing by 85% scroll
    const pathLength = useTransform(smoothProgress, [0, 0.85], [0.30, 1]);

    return (
        <div ref={containerRef} className="absolute inset-x-0 top-0 h-full w-full pointer-events-none overflow-hidden" style={{ zIndex }}>
            <svg
                className="w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 100 8500"
            >
                <motion.path
                    d="M 0 0 
             C 10 700, 90 1000, 50 1700
             S 10 3000, 50 4200
             S 90 5500, 50 6800
             S 10 7800, 100 8500"
                    fill="none"
                    stroke="#EAB308"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="drop-shadow-xl opacity-80"
                    style={{ pathLength }}
                />

                <motion.path
                    d="M 0 0 
             C 10 700, 90 1000, 50 1700
             S 10 3000, 50 4200
             S 90 5500, 50 6800
             S 10 7800, 100 8500"
                    fill="none"
                    stroke="#FEF08A"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="opacity-50"
                    style={{ pathLength }}
                />
            </svg>
        </div>
    );
}
