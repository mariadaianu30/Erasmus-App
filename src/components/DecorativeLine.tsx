"use client";

import { motion } from "framer-motion";

interface DecorativeLineProps {
    className?: string;
    d: string; // SVG path data
    delay?: number;
    duration?: number;
    strokeWidth?: number;
    color?: string;
}

export default function DecorativeLine({
    className = "",
    d,
    delay = 0,
    duration = 1.5,
    strokeWidth = 2,
    color = "#2E86DE",
}: DecorativeLineProps) {
    return (
        <div className={`absolute pointer-events-none overflow-visible ${className}`}>
            <svg
                className="size-full overflow-visible"
                viewBox="0 0 100 100" // Viewbox might need adjustment based on container or removed if using percentage coordinate system in path
                preserveAspectRatio="none"
            >
                <motion.path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{
                        duration: duration,
                        delay: delay,
                        ease: "easeInOut",
                    }}
                />
            </svg>
        </div>
    );
}
