"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import { useRef } from "react";

export default function GlobalBlueLine() {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll();

    const pathLength = useSpring(scrollYProgress, {
        stiffness: 150,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div ref={containerRef} className="absolute inset-x-0 top-0 h-full w-full pointer-events-none overflow-hidden" style={{ zIndex: 9 }}>
            {/* 
         The SVG uses pathLength to animate the drawing of the line matching scroll progress.
         PreserveAspectRatio none stretches it to fit the long page.
      */}
            <svg
                className="w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 100 8500"
            >
                <motion.path
                    d="M 20 0 
             C 60 100, 80 200, 50 350
             S 20 600, 60 800
             S 80 1050, 40 1300
             S 10 1600, 90 1800
             C 140 2000, 130 2100, 80 2150 
             S -40 2500, 20 2800
             S 80 3200, 40 3600
             S 20 3800, 60 4000
             S 100 4500, 50 5000
             S 0 5500, 50 6000
             S 100 6500, 20 7000
             S 60 7250, 40 7500
             S 20 8000, 60 8500"
                    fill="none"
                    stroke="#003399"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="drop-shadow-xl opacity-80"
                    initial={{ pathLength: 0 }}
                    style={{ pathLength }}
                />

                <motion.path
                    d="M 20 0 
             C 60 100, 80 200, 50 350
             S 20 600, 60 800
             S 80 1050, 40 1300
             S 10 1600, 90 1800
             C 140 2000, 130 2100, 80 2150 
             S -40 2500, 20 2800
             S 80 3200, 40 3600
             S 20 3800, 60 4000
             S 100 4500, 50 5000
             S 0 5500, 50 6000
             S 100 6500, 20 7000
             S 60 7250, 40 7500
             S 20 8000, 60 8500"
                    fill="none"
                    stroke="#60A5FA"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="opacity-50"
                    initial={{ pathLength: 0 }}
                    style={{ pathLength }}
                />
            </svg>
        </div>
    );
}
