"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import DecorativeLine from "./DecorativeLine";

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden px-4 md:px-8 pt-20">
            {/* Background/Ambient Elements */}
            <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-accent-light to-decorative-blue-thin opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
            </div>

            <div className="container mx-auto max-w-7xl relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Text Content */}
                <div className="order-2 lg:order-1 text-center lg:text-left">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                        className="text-6xl md:text-8xl font-bold tracking-tight text-foreground uppercase"
                    >
                        Heritage
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="mt-4"
                    >
                        <span className="text-xl md:text-2xl font-light text-accent tracking-[0.2em] uppercase">
                            Descoperă Colecția
                        </span>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="mt-8 text-lg text-gray-600 max-w-lg mx-auto lg:mx-0 leading-relaxed"
                    >
                        O incursiune vizuală în lumea Erasmus+. Descoperă poveștile, oamenii și momentele care definesc experiența noastră.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                    >
                        <a href="#" className="inline-flex items-center justify-center px-8 py-3 pointer-events-auto border border-transparent text-base font-medium rounded-full text-white bg-accent hover:bg-accent-hover transition-colors duration-300 shadow-lg hover:shadow-xl">
                            Începe acum
                        </a>
                        <a href="#" className="inline-flex items-center justify-center px-8 py-3 pointer-events-auto border border-gray-200 text-base font-medium rounded-full text-gray-900 bg-white hover:bg-gray-50 transition-colors duration-300">
                            Află mai multe
                        </a>
                    </motion.div>
                </div>

                {/* Hero Image */}
                <div className="order-1 lg:order-2 relative flex justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="relative w-full max-w-md aspect-[4/5] md:aspect-square"
                    >
                        {/* Replace with actual image path from public/images */}
                        <Image
                            src="/images/uploaded_image_0_1768036476184.png"
                            alt="Erasmus Hero"
                            fill
                            className="object-contain"
                            priority
                        />
                    </motion.div>
                </div>
            </div>

            {/* Decorative Lines */}
            {/* Starting from left */}
            <DecorativeLine
                d="M 0 50 Q 50 100 100 50"
                className="w-64 h-32 left-0 bottom-20 opacity-20 hidden lg:block"
                color="#2E86DE"
                strokeWidth={2}
            />
        </section>
    );
}
