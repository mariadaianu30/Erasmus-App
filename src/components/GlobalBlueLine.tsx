"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

interface GlobalBlueLineProps {
    startSide?: 'left' | 'right';
    initialProgress?: number;
    variant?: 'elegant' | 'curvy';
}

export default function GlobalBlueLine({ 
    startSide = 'right', 
    initialProgress = 0,
    variant = 'elegant' 
}: GlobalBlueLineProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll();

    // Mapping scroll progress from initialProgress (default 0 for Home, 0.27 for Orgs/Events)
    const baseLength = useTransform(scrollYProgress, [0, 1], [initialProgress, 1]);

    const pathLength = useSpring(baseLength, {
        stiffness: 150,
        damping: 30,
        restDelta: 0.001
    });

    // Redesigned Paths for two variants
    const paths = {
        elegant: {
            right: "M 95 0 C 85 200, 70 400, 50 650 S 5 1500, 50 3000 S 95 4500, 50 6000 S 5 7500, 50 8500",
            left: "M 5 0 C 15 200, 30 400, 50 650 S 95 1500, 50 3000 S 5 4500, 50 6000 S 95 7500, 50 8500",
        },
        curvy: {
            right: "M 95 0 C 80 150, 40 300, 60 500 S 95 800, 40 1200 S 5 1600, 60 2100 S 95 2600, 30 3200 S 5 3800, 70 4500 S 95 5200, 20 6000 S 10 6800, 85 7600 S 35 8200, 50 8500",
            left: "M 5 0 C 20 150, 60 300, 40 500 S 5 800, 60 1200 S 95 1600, 40 2100 S 5 2600, 70 3200 S 95 3800, 30 4500 S 5 5200, 80 6000 S 90 6800, 15 7600 S 65 8200, 50 8500",
        }
    };

    const activeD = paths[variant][startSide];

    return (
        <div ref={containerRef} className="absolute inset-x-0 top-0 h-full w-full pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
            <svg
                className="w-full h-full"
                preserveAspectRatio="none"
                viewBox="0 0 100 8500"
            >
                <motion.path
                    d={activeD}
                    fill="none"
                    stroke="#003399"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="drop-shadow-xl opacity-80"
                    initial={{ pathLength: initialProgress }}
                    style={{ pathLength }}
                />

                <motion.path
                    d={activeD}
                    fill="none"
                    stroke="#60A5FA"
                    strokeWidth="1"
                    strokeLinecap="round"
                    className="opacity-50"
                    initial={{ pathLength: initialProgress }}
                    style={{ pathLength }}
                />
            </svg>
        </div>
    );
}
