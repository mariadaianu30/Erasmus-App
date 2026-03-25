import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import styles from "./IntroSplash.module.css";

export default function IntroSplash() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Display for 2.5 seconds then fade out
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="splash"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-white"
                >
                    <div className={styles.logoWrap}>
                        <svg className={styles.logoIcon} viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
                            <ellipse cx="70" cy="70" rx="60" ry="60" fill="#003399" />
                            <ellipse cx="52" cy="44" rx="16" ry="9" fill="#fff" fillOpacity=".08" />
                            <circle cx="70" cy="68" r="27" fill="#FFCC00" />
                            <g className={styles.globeLines} fill="none" stroke="#003399" strokeWidth="1.8">
                                <ellipse cx="70" cy="68" rx="27" ry="10" />
                                <ellipse cx="70" cy="68" rx="27" ry="19" />
                                <line x1="70" y1="41" x2="70" y2="95" />
                                <circle cx="70" cy="68" r="27" />
                            </g>
                            <text className={styles.star1} x="70" y="26" textAnchor="middle" fontSize="9" fill="#FFCC00">★</text>
                            <text className={styles.star2} x="99" y="39" textAnchor="middle" fontSize="8" fill="#FFCC00">★</text>
                            <text className={styles.star3} x="109" y="68" textAnchor="middle" fontSize="8" fill="#FFCC00">★</text>
                            <text className={styles.star4} x="41" y="26" textAnchor="middle" fontSize="8" fill="#FFCC00">★</text>
                            <text className={styles.star5} x="31" y="54" textAnchor="middle" fontSize="7" fill="#FFCC00">★</text>
                            <text className={styles.star6} x="103" y="100" textAnchor="middle" fontSize="7" fill="#FFCC00">★</text>
                            <g className={styles.arrowGroup}>
                                <path fill="#003399" d="M81,57 L90,57 L85.5,52.5 Z" />
                                <path fill="none" stroke="#003399" strokeWidth="2.4" strokeLinecap="round" d="M61,57 Q74,50 87,56" />
                                <path fill="#003399" d="M59,79 L50,79 L54.5,83.5 Z" />
                                <path fill="none" stroke="#003399" strokeWidth="2.4" strokeLinecap="round" d="M79,79 Q66,86 53,80" />
                            </g>
                            <g className={styles.b1}><circle cx="21" cy="92" r="10" fill="#FFCC00" /><circle cx="18" cy="92" r="2" fill="#003399" /><circle cx="24" cy="92" r="2" fill="#003399" /></g>
                            <g className={styles.b2}><circle cx="119" cy="46" r="8" fill="#FFCC00" /><circle cx="117" cy="46" r="1.7" fill="#003399" /><circle cx="121" cy="46" r="1.7" fill="#003399" /></g>
                            <g className={styles.b3}><circle cx="25" cy="50" r="7" fill="#FFCC00" opacity=".85" /><circle cx="25" cy="50" r="1.5" fill="#003399" /></g>
                        </svg>
                        <div className={styles.logoText}>
                            <span className={styles.tMain}>erasmus</span>
                            <span className={styles.tPlus}>+</span>
                            <span className={styles.tSub}>connect</span>
                        </div>
                        <div className={styles.tagline}>Connect · Learn · Grow</div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
