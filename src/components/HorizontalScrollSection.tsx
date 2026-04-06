"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const cards = [
  {
    id: 1,
    title: "Discover new Oportunities",
    description: "Browse through hundreds of verified Erasmus+ projects tailored to your interests.",
    image: "/images/Nomads - Luggage Travel.png",
    cta: "Explore Events",
    link: "/events",
  },
  {
    id: 2,
    title: "Learn how to use the app",
    description: "Master the platform in minutes and start your journey with ease.",
    image: "/images/Stuck at Home - To Do List.png",
    cta: "Get Started",
    link: "/profile",
  },
  {
    id: 3,
    title: "Join the community",
    description: "Connect with like-minded young people and experienced organizers across Europe.",
    image: "/images/people.png",
    cta: "Join Now",
    link: "/(auth)/sign-up",
  },
  {
    id: 4,
    title: "Travel the world with Erasmus",
    description: "Pack your bags for a life-changing experience in a new country.",
    image: "/images/airplane_person.png",
    cta: "Start Journey",
    link: "/events",
  },
  {
    id: 5,
    title: "Culture. Food. Experience. Learning",
    description: "Immerse yourself in new cultures while gaining valuable skills for your future.",
    image: "/images/Wavy Buddies.png",
    cta: "Learn More",
    link: "/organizations",
  },
];

const HorizontalScrollSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Ignore pure horizontal scrolls to allow trackpad sideways swiping natively
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const isScrollingLeft = e.deltaY < 0;
      const isScrollingRight = e.deltaY > 0;

      const canScrollLeft = container.scrollLeft > 0;
      // Use Math.ceil and subtract a tiny buffer to avoid rounding issues
      const canScrollRight = Math.ceil(container.scrollLeft + container.clientWidth) < container.scrollWidth - 1;

      // Hijack the vertical scroll if we have horizontal room in that direction
      if ((isScrollingLeft && canScrollLeft) || (isScrollingRight && canScrollRight)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <section className="bg-[#003399] py-10">
      <div 
        ref={containerRef} 
        className="flex flex-nowrap items-center gap-12 px-[10vw] overflow-x-auto scrollbar-hide"
      >
        {cards.map((card) => (
          <div
            key={card.id}
            className="group relative h-[80vh] w-[80vw] md:w-[80vw] shrink-0 overflow-hidden rounded-[3rem] bg-blue-900/40 backdrop-blur-md border border-white/20 flex flex-col md:flex-row items-center justify-between p-12 md:p-20 shadow-2xl transition-all duration-300 hover:border-white/40"
          >
            {/* Content */}
            <div className="flex-1 z-10 text-white space-y-8">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-5xl md:text-8xl font-black tracking-tighter leading-none"
              >
                {card.title}
              </motion.h2>
              <p className="text-xl md:text-2xl text-blue-100 max-w-xl font-light">
                {card.description}
              </p>
              <Link 
                href={card.link}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#003399] rounded-full font-bold text-lg hover:bg-blue-50 transition-all group-hover:scale-105 shadow-xl"
              >
                {card.cta} <ArrowRight className="w-6 h-6" />
              </Link>
            </div>

            {/* Image side */}
            <div className="flex-1 relative w-full h-[300px] md:h-full flex items-center justify-center">
              <div className="relative w-full h-full">
                 <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            </div>

            {/* Decorative background element */}
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default HorizontalScrollSection;
