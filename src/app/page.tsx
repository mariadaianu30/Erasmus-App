"use client";

import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import GlobalBlueLine from "@/components/GlobalBlueLine";
import ScatteredSection from "@/components/ScatteredSection";
import IntroSplash from "@/components/IntroSplash";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const whyChooseRef = useRef(null);
  const [whyChooseInView, setWhyChooseInView] = useState(false);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loadingOps, setLoadingOps] = useState(true);
  const [organizationsList, setOrganizationsList] = useState<any[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [trustStats, setTrustStats] = useState({
    verifiedOrgs: 0,
    youthHelped: 0,
    countries: 0
  });
  const [activeTab, setActiveTab] = useState<'young-people' | 'organizations'>('young-people');

  // Helper for slug (same as in organizations/page.tsx)
  const slugifyOrganizationName = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('is_published', true)
          // Order by creation or start date
          .order('created_at', { ascending: false })
          .limit(3);

        if (data) {
          setOpportunities(data);
        }
      } catch (e) {
        console.error("Error fetching opportunities", e);
      } finally {
        setLoadingOps(false);
      }
    };

    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('organization_view')
          .select('*')
          .eq('is_verified', true) // Only fetch verified organizations
          .limit(2);

        if (data) {
          setOrganizationsList(data);
        }
      } catch (e) {
        console.error("Error fetching organizations", e);
      } finally {
        setLoadingOrgs(false);
      }
    };

    const fetchTrustStats = async () => {
      try {
        // Verified Organizations
        const { count: orgsCount } = await supabase
          .from('organization_view')
          .select('*', { count: 'exact', head: true })
          .eq('is_verified', true);

        // Youth Helped (Accepted Applications)
        const { count: youthCount } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'accepted');

        // Countries Covered (Unique countries in events)
        const { data: eventsData } = await supabase
          .from('events')
          .select('country')
          .eq('is_published', true);

        const uniqueCountries = new Set(eventsData?.map(e => e.country).filter(Boolean)).size;

        setTrustStats({
          verifiedOrgs: orgsCount || 0,
          youthHelped: youthCount || 0,
          countries: uniqueCountries || 0
        });
      } catch (e) {
        console.error("Error fetching trust stats", e);
      }
    };

    fetchOpportunities();
    fetchOrganizations();
    fetchTrustStats();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWhyChooseInView(true);
        }
      },
      { threshold: 0.1 }
    );
    if (whyChooseRef.current) {
      observer.observe(whyChooseRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Simplified stats for demo
  const stats = {
    upcomingEvents: 12,
    totalParticipants: 1250,
    totalOrganizations: 45,
    acceptedApplications: 890,
  };

  const creators = [
    {
      name: "Andrei",
      role: "Volunteer",
      description: "Passionate about connecting people through events.",
      gradient: "from-blue-400 to-blue-600"
    },
    {
      name: "Maria",
      role: "Organizer",
      description: "Creating meaningful experiences for everyone.",
      gradient: "from-green-400 to-green-600"
    },
    {
      name: "Elena",
      role: "Participant",
      description: "Found my path through Erasmus+ projects.",
      gradient: "from-purple-400 to-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <IntroSplash />
      {/* NEW HERO SECTION */}
      <section className="h-screen w-full bg-[#003399] flex flex-col items-center justify-start pt-32 text-white relative z-10 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4">
            ERASMUS+ CONNECT
          </h1>
          <p className="text-sm md:text-base font-light tracking-widest uppercase opacity-80">
            developed by scout society
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-6 relative z-10 px-4"
        >
          <Image
            src="/images/home_page.png"
            alt="Erasmus+ Connect"
            width={1000}
            height={600}
            className="object-contain max-h-[50vh] w-auto drop-shadow-2xl"
            priority
          />
        </motion.div>
      </section>

      {/* CONTENT STARTING BELOW HERO */}
      <div className="relative">
        <GlobalBlueLine />

        {/* SECTION 1.5: WHO WE ARE */}
        <div className="relative z-20 py-24 w-full flex justify-center items-center">

          <div className="relative w-[75%] max-w-[80rem] transform scale-95 origin-top">
            {/* Decorative Images - Positioned ON TOP of the card */}

            <div className="absolute top-[80%] -right-20 md:-right-32 -translate-y-1/2 w-56 md:w-80 z-30 animate-float-delayed">
              <Image src="/images/Cool Kids - Brainstorming.png" alt="Brainstorming" width={400} height={400} className="w-full h-auto drop-shadow-2xl" />
            </div>

            <div className="w-full bg-[#003399]/90 backdrop-blur-sm rounded-[3rem] p-8 md:p-14 shadow-2xl relative overflow-hidden z-20">
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none" />

              <div className="text-center relative z-10">
                <h2 className="text-sm md:text-base font-bold text-blue-300 uppercase tracking-[0.2em] mb-6">
                  WHO WE ARE
                </h2>

                <h3 className="text-2xl md:text-4xl font-bold text-white mb-8 leading-tight max-w-5xl mx-auto">
                  Erasmus+ Connect is a platform built for <span className="text-blue-200">young people</span> who want to explore Europe and for the <span className="text-blue-200">organisations</span> that make it possible.
                </h3>

                <div className="space-y-6 text-lg md:text-xl text-blue-50/90 leading-relaxed max-w-4xl mx-auto font-light">
                  <p>
                    We help young people <span className="font-semibold text-white">discover meaningful opportunities</span> across Europe — and find trusted organisations to guide them along the way. We help youth organisations grow their visibility, connect with reliable partners, and get verified so young people can trust them.
                  </p>
                  <div className="pt-6">
                    <p className="font-bold text-xl md:text-2xl text-white tracking-widest border-t border-white/20 pt-6 inline-block px-12">
                      SIMPLE. TRANSPARENT. EUROPEAN.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1.8: MEET US */}
        <div className="relative z-20 pb-24 w-full">
          <div className="max-w-7xl mx-auto px-4 transform scale-95 origin-top">
            <div className="flex justify-center mb-16">
              <div className="relative py-4 px-12 md:px-24 w-full max-w-lg flex justify-center items-center">
                {/* Background Box */}
                <div className="absolute inset-0 bg-white rounded-full shadow-lg border border-blue-100/50" />

                {/* Text */}
                <h2 className="relative z-10 text-4xl md:text-5xl font-black text-[#003399] text-center tracking-tight">
                  MEET US
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Card 1: Andrei */}
              <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-blue-50 flex flex-col items-center text-center">
                <div className="aspect-square relative mb-6 rounded-2xl overflow-hidden shadow-md w-full">
                  <Image
                    src="/images/andrei.jpeg"
                    alt="Andrei Cristea"
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-2xl font-bold text-[#003399] mb-2">Andrei Cristea</h3>
                <p className="text-blue-600 font-medium tracking-wide uppercase text-sm mb-4">Technical Lead & Backend Developer</p>
                <div className="w-12 h-1 bg-blue-100 rounded-full mb-6"></div>
                <a
                  href="https://www.linkedin.com/in/andrei1cristea/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2 bg-[#003399]/80 text-white font-bold rounded-full hover:bg-[#003399] transition-all text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  More about me
                </a>
              </div>

              {/* Card 2: Ciprian */}
              <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-blue-50 flex flex-col items-center text-center">
                <div className="aspect-square relative mb-6 rounded-2xl overflow-hidden shadow-md w-full">
                  <Image
                    src="/images/ciprian.jpg"
                    alt="Ciprian Sfîrlogea"
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <h3 className="text-2xl font-bold text-[#003399] mb-2">Ciprian Sfîrlogea</h3>
                <p className="text-blue-600 font-medium tracking-wide uppercase text-sm mb-4">Scout Society Founder</p>
                <div className="w-12 h-1 bg-blue-100 rounded-full mb-6"></div>
                <a
                  href="https://www.linkedin.com/in/ciprian-sfirlogea-45688310/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2 bg-[#003399]/80 text-white font-bold rounded-full hover:bg-[#003399] transition-all text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  More about me
                </a>
              </div>

              {/* Card 3: Maria */}
              <div className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-blue-50 flex flex-col items-center text-center">
                <div className="aspect-square relative mb-6 rounded-2xl overflow-hidden shadow-md w-full">
                  <Image
                    src="/images/maria.jpeg"
                    alt="Maria Dăianu"
                    fill
                    className="object-cover object-[50%_25%]"
                  />
                </div>
                <h3 className="text-2xl font-bold text-[#003399] mb-2">Maria Dăianu</h3>
                <p className="text-blue-600 font-medium tracking-wide uppercase text-sm mb-4">Marketing Lead & Frontend Developer</p>
                <div className="w-12 h-1 bg-blue-100 rounded-full mb-6"></div>
                <a
                  href="https://www.linkedin.com/in/maria-daianu-150640331/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2 bg-[#003399]/80 text-white font-bold rounded-full hover:bg-[#003399] transition-all text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  More about me
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1.9: FOR YOUNG PEOPLE */}
        <div className="relative z-20 py-24 w-full">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-12 md:gap-24 transform scale-95 origin-top">
            {/* Left Column: Text */}
            <div className="flex-1 text-left relative z-10 md:pl-8 lg:pl-16">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 md:p-10 shadow-sm border border-blue-50/50">
                <h2 className="text-3xl md:text-5xl font-black text-[#003399] mb-6 tracking-tight leading-tight">
                  For Young People
                </h2>
                <p className="text-lg md:text-xl text-blue-900/80 mb-6 leading-relaxed font-light">
                  <span className="font-semibold text-blue-600">Discover verified European opportunities</span> tailored to you. Browse trusted Erasmus+ projects, apply directly through our platform, and get personalised recommendations based on your interests and goals.
                </p>
                <p className="text-lg md:text-xl text-blue-900/80 mb-8 leading-relaxed font-light">
                  Whether you're looking for volunteering, training, or youth exchanges — we help you find the right experience and the right organisation to make it happen.
                </p>
                <p className="text-xl md:text-2xl font-bold text-[#003399] tracking-wide border-l-4 border-yellow-400 pl-6 py-2">
                  Safe. Simple. Made for you.
                </p>
              </div>
            </div>

            {/* Right Column: Images */}
            <div className="flex-1 relative w-full min-h-[400px] flex justify-center items-center md:pr-8 lg:pr-16">
              {/* Main Image (Center) */}
              <Image
                src="/images/Cool Kids - On Wheels.png"
                alt="Young People on Wheels"
                width={300}
                height={300}
                className="relative z-20 w-48 md:w-64 h-auto drop-shadow-2xl object-contain animate-float-slow"
              />

              {/* Boy Skate (Top Right) */}
              <div className="absolute top-0 right-4 md:right-12 z-10 animate-float-delayed">
                <Image
                  src="/images/boy_skate.png"
                  alt="Skater"
                  width={200}
                  height={200}
                  className="w-32 md:w-40 h-auto drop-shadow-xl object-contain rotate-12"
                />
              </div>

              {/* Nomad Map (Bottom Left) */}
              <div className="absolute bottom-4 left-4 md:left-12 z-0 animate-float-slower">
                <Image
                  src="/images/nomad_map.png"
                  alt="Map"
                  width={200}
                  height={200}
                  className="w-32 md:w-40 h-auto drop-shadow-lg object-contain -rotate-12 opacity-90"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1.10: FOR ORGANISATIONS */}
        <div className="relative z-20 py-24 w-full">
          <div className="max-w-7xl mx-auto px-4 flex flex-col-reverse md:flex-row items-center gap-12 md:gap-24 transform scale-95 origin-top">
            {/* Left Column: Images */}
            <div className="flex-1 relative w-full min-h-[400px] flex justify-center items-center md:pl-8 lg:pl-16">
              {/* Main Image */}
              <Image
                src="/images/Stuck at Home - To Do List.png"
                alt="Organisations Planning"
                width={300}
                height={300}
                className="relative z-20 w-48 md:w-64 h-auto drop-shadow-2xl object-contain animate-float-delayed"
              />

              {/* Stats and Graphs */}
              <div className="absolute -bottom-4 right-12 md:bottom-0 md:-right-8 z-30 animate-float-slower">
                <Image
                  src="/images/Stuck at Home - Stats and Graphs.png"
                  alt="Stats and Graphs"
                  width={200}
                  height={200}
                  className="w-32 md:w-40 h-auto drop-shadow-xl object-contain -rotate-6"
                />
              </div>

              {/* Boy Stand */}
              <div className="absolute top-0 left-4 md:left-0 z-30 animate-float-delayed">
                <Image
                  src="/images/boy_stand.png"
                  alt="Boy Standing"
                  width={200}
                  height={200}
                  className="w-24 md:w-32 h-auto drop-shadow-xl object-contain rotate-6"
                />
              </div>
            </div>

            {/* Right Column: Text */}
            <div className="flex-1 text-right relative z-10 md:pr-8 lg:pr-16">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 md:p-10 shadow-sm border border-blue-50/50">
                <h2 className="text-3xl md:text-5xl font-black text-[#003399] mb-6 tracking-tight leading-tight">
                  For Organisations
                </h2>
                <p className="text-lg md:text-xl text-blue-900/80 mb-6 leading-relaxed font-light">
                  <span className="font-semibold text-blue-600">Get verified, get visible, get connected.</span> Post your projects, reach motivated young people across Europe, and choose participants who match your vision. Connect with trusted partner organisations to co-create new projects and grow your impact.
                </p>
                <p className="text-lg md:text-xl text-blue-900/80 mb-8 leading-relaxed font-light">
                  We help you build the network and visibility you need to make your work go further.
                </p>
                <p className="text-xl md:text-2xl font-bold text-[#003399] tracking-wide border-r-4 border-yellow-400 pr-6 py-2">
                  Trusted. Collaborative. Built for growth.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1.20: FEATURED OPPORTUNITIES */}
        <div className="relative z-20 py-24 w-full bg-gradient-to-b from-transparent to-blue-50/30">
          <div className="max-w-7xl mx-auto px-4 transform scale-95 origin-top">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-[#003399] tracking-tight mb-4">
                Featured Opportunities
              </h2>
              <p className="text-xl text-blue-900/60 max-w-2xl mx-auto font-light">
                Discover life-changing experiences across Europe.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {loadingOps ? (
                // Loading Skeleton
                [1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-3xl h-96 animate-pulse border border-blue-50 shadow-sm">
                    <div className="h-48 bg-blue-50/50 w-full"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-4 bg-blue-50 rounded w-1/3"></div>
                      <div className="h-8 bg-blue-100 rounded w-3/4"></div>
                      <div className="h-4 bg-blue-50 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : opportunities.length > 0 ? (
                opportunities.map((opp) => (
                  <div key={opp.id} className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-blue-100 flex flex-col h-full">
                    <div className="relative h-48 w-full overflow-hidden shrink-0">
                      <Image
                        src={opp.photo_url || "/images/boy_sport.png"}
                        alt={opp.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {opp.is_active && (
                        <div className="absolute top-4 right-4 bg-yellow-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                          OPEN
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="text-sm text-blue-500 font-semibold mb-2 uppercase tracking-wider">
                        {opp.event_type || 'Erasmus+ Project'}
                      </div>
                      <h3 className="text-xl font-bold text-[#003399] mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                        {opp.title}
                      </h3>
                      <div className="flex items-center text-gray-500 text-sm mb-4 mt-auto gap-4">
                        <span className="flex items-center"><span className="mr-2">📅</span> {new Date(opp.start_date || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        <span className="flex items-center truncate"><span className="mr-2">📍</span> {opp.city || opp.location || 'Europe'}</span>
                      </div>
                      <Link href={`/events/${opp.id}`} className="inline-flex items-center text-blue-600 font-bold hover:gap-2 transition-all mt-2">
                        View Details <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16 bg-blue-50/30 rounded-3xl border border-blue-50">
                  <p className="text-blue-900/60 text-lg">No active opportunities found at the moment.</p>
                  <p className="text-sm text-blue-900/40 mt-2">Check back soon for new projects!</p>
                </div>
              )}
            </div>

            <div className="text-center">
              <Link href="/events" className="inline-block bg-[#003399] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-800 transition-all hover:scale-105 shadow-xl hover:shadow-2xl">
                Discover More Opportunities
              </Link>
            </div>
          </div>
        </div>

        {/* SECTION 1.30: VERIFIED ORGANISATIONS */}
        <div className="relative z-20 py-24 w-full">
          <div className="max-w-7xl mx-auto px-4 transform scale-95 origin-top">
            <div className="flex flex-col items-center text-center mb-12 gap-6">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-[#003399] tracking-tight mb-4">
                  Trusted Organizations
                </h2>
                <p className="text-xl text-blue-900/60 font-light max-w-xl mx-auto">
                  Connect with verified organizations that are making a real impact.
                </p>
              </div>
              <Link href="/organizations" className="hidden md:inline-flex items-center text-blue-600 font-bold hover:gap-2 transition-all">
                View All Organizations <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {loadingOrgs ? (
                // Skeleton
                [1, 2].map((i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-center gap-6 bg-white p-8 rounded-3xl shadow-lg border border-blue-50 animate-pulse">
                    <div className="w-24 h-24 bg-blue-50 rounded-full shrink-0"></div>
                    <div className="flex-1 space-y-4 w-full">
                      <div className="h-6 bg-blue-100 rounded w-1/2"></div>
                      <div className="h-4 bg-blue-50 rounded w-full"></div>
                      <div className="h-4 bg-blue-50 rounded w-2/3"></div>
                    </div>
                  </div>
                ))
              ) : organizationsList.length > 0 ? (
                organizationsList.map((org, idx) => (
                  <div key={org.id} className="flex flex-col sm:flex-row items-center gap-6 bg-white p-8 rounded-3xl shadow-lg border border-blue-50 hover:border-blue-200 transition-all">
                    <div className="w-24 h-24 relative shrink-0 overflow-hidden rounded-full border border-blue-50 bg-white p-2">
                      <Image
                        src={org.logo_url || (idx % 2 === 0 ? "/images/nomad_passport.png" : "/images/nomad_backpack.png")}
                        alt={org.organization_name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="text-center sm:text-left flex-1 min-w-0">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 flex-wrap">
                        <h3 className="text-2xl font-bold text-gray-900 truncate max-w-full">{org.organization_name}</h3>
                        {org.is_verified && (
                          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">Verified</span>
                        )}
                      </div>
                      <p className="text-gray-500 mb-4 line-clamp-2">
                        {org.bio || "Empowering youth through European opportunities."}
                      </p>
                      <Link href={`/organizations/${org.id ?? slugifyOrganizationName(org.organization_name)}`} className="text-blue-600 font-bold text-sm hover:underline">View Profile</Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 bg-blue-50/30 rounded-3xl">
                  <p className="text-blue-900/60">No verified organizations found.</p>
                </div>
              )}
            </div>

            <div className="text-center md:hidden">
              <Link href="/organizations" className="inline-block bg-white text-[#003399] border-2 border-[#003399] px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition-all">
                View All Organizations
              </Link>
            </div>
          </div>
        </div>

        {/* SECTION 1.35: TRUST INDICATORS */}
        <div className="relative z-20 py-24 bg-blue-900 w-full text-white overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400 blur-3xl"></div>
            <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full bg-blue-300 blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 relative z-10 transform scale-95 origin-top">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
                Built on Trust & Transparency
              </h2>
              <p className="text-blue-100 text-lg max-w-2xl mx-auto font-light">
                We prioritize safety and quality. Our platform connects you only with verified partners and official Erasmus+ opportunities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {/* Stat 1 */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center hover:bg-white/20 transition-all">
                <div className="text-5xl font-black text-blue-200 mb-2">
                  {trustStats.verifiedOrgs}+
                </div>
                <div className="text-blue-100 font-medium">Verified Organizations</div>
              </div>

              {/* Stat 2 */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center hover:bg-white/20 transition-all">
                <div className="text-5xl font-black text-blue-200 mb-2">
                  {trustStats.youthHelped}+
                </div>
                <div className="text-blue-100 font-medium">Young People Helped</div>
              </div>

              {/* Stat 3 */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center hover:bg-white/20 transition-all">
                <div className="text-5xl font-black text-blue-200 mb-2">
                  {trustStats.countries}
                </div>
                <div className="text-blue-100 font-medium">Countries Covered</div>
              </div>

              {/* Stat 4 - Badges / Safety */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center hover:bg-white/20 transition-all flex flex-col justify-center items-center">
                <div className="flex -space-x-4 mb-3 justify-center">
                  <div className="w-12 h-12 rounded-full bg-green-500 border-2 border-blue-900 flex items-center justify-center text-white" title="Verified Partner">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500 border-2 border-blue-900 flex items-center justify-center text-white" title="Erasmus+ Accredited">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-yellow-500 border-2 border-blue-900 flex items-center justify-center text-white" title="High Safety Standards">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </div>
                </div>
                <div className="text-blue-100 font-medium">Safety & Quality Badges</div>
              </div>
            </div>
          </div>
        </div>


        {/* SECTION 1.40: HOW IT WORKS */}
        <div className="py-24 relative bg-transparent">
          <div className="absolute inset-0 bg-gray-50 z-0"></div>
          <div className="max-w-7xl mx-auto px-4 relative z-10 transform scale-95 origin-top">
            <div className="text-center mb-16 relative z-10">
              <h2 className="text-4xl md:text-5xl font-black text-[#003399] tracking-tight mb-6">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Your journey to European opportunities starts here. Simple, transparent, and built for you.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-16 relative z-10">
              <div className="bg-white p-1.5 rounded-full shadow-sm border border-gray-200 inline-flex">
                <button
                  onClick={() => setActiveTab('young-people')}
                  className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'young-people'
                    ? 'bg-[#003399] text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  For Young People
                </button>
                <button
                  onClick={() => setActiveTab('organizations')}
                  className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'organizations'
                    ? 'bg-[#003399] text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  For Organizations
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto relative z-10">
              {activeTab === 'young-people' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 h-full relative z-10">
                      <div className="w-12 h-12 bg-blue-100 text-[#003399] rounded-xl flex items-center justify-center font-bold text-xl mb-4">1</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Create Your Profile</h3>
                      <p className="text-gray-600 text-sm">Sign up and tell us about yourself: your interests, skills, and what kind of European experience you're looking for.</p>
                    </div>
                    {/* Connector Line (Desktop) */}
                    <div className="hidden lg:block absolute top-10 left-full w-12 h-8 text-blue-200 -ml-2 z-0">
                      <svg viewBox="0 0 100 40" className="w-full h-full" fill="none" preserveAspectRatio="none">
                        <path d="M0,20 C30,20 70,-10 100,20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 6" />
                      </svg>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 h-full relative z-10">
                      <div className="w-12 h-12 bg-blue-100 text-[#003399] rounded-xl flex items-center justify-center font-bold text-xl mb-4">2</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Explore & Get Recommendations</h3>
                      <p className="text-gray-600 text-sm">Browse verified projects or let us suggest opportunities that match your profile.</p>
                    </div>
                    <div className="hidden lg:block absolute top-10 left-full w-12 h-8 text-blue-200 -ml-2 z-0">
                      <svg viewBox="0 0 100 40" className="w-full h-full" fill="none" preserveAspectRatio="none">
                        <path d="M0,20 C30,20 70,50 100,20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 6" />
                      </svg>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 h-full relative z-10">
                      <div className="w-12 h-12 bg-blue-100 text-[#003399] rounded-xl flex items-center justify-center font-bold text-xl mb-4">3</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Apply Directly</h3>
                      <p className="text-gray-600 text-sm">Submit your application through the platform in just a few clicks.</p>
                    </div>
                    <div className="hidden lg:block absolute top-10 left-full w-12 h-8 text-blue-200 -ml-2 z-0">
                      <svg viewBox="0 0 100 40" className="w-full h-full" fill="none" preserveAspectRatio="none">
                        <path d="M0,20 C30,20 70,-10 100,20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 6" />
                      </svg>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative">
                    <div className="bg-[#003399] p-6 rounded-2xl shadow-lg border border-blue-900 h-full relative z-10 text-white transform scale-105">
                      <div className="w-12 h-12 bg-white text-[#003399] rounded-xl flex items-center justify-center font-bold text-xl mb-4">4</div>
                      <h3 className="text-lg font-bold text-white mb-2">Start Your Journey</h3>
                      <p className="text-blue-100 text-sm">Get accepted and prepare for your European adventure.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 h-full relative z-10">
                      <div className="w-12 h-12 bg-yellow-100 text-yellow-700 rounded-xl flex items-center justify-center font-bold text-xl mb-4">1</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Create Your Account</h3>
                      <p className="text-gray-600 text-sm">Sign up and apply for your Verified Badge to build trust with young participants.</p>
                    </div>
                    <div className="hidden lg:block absolute top-10 left-full w-12 h-8 text-yellow-300 -ml-2 z-0">
                      <svg viewBox="0 0 100 40" className="w-full h-full" fill="none" preserveAspectRatio="none">
                        <path d="M0,20 C30,20 70,-10 100,20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 6" />
                      </svg>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 h-full relative z-10">
                      <div className="w-12 h-12 bg-yellow-100 text-yellow-700 rounded-xl flex items-center justify-center font-bold text-xl mb-4">2</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Post Your Projects</h3>
                      <p className="text-gray-600 text-sm">Upload your opportunities with full info packs so applicants know exactly what to expect.</p>
                    </div>
                    <div className="hidden lg:block absolute top-10 left-full w-12 h-8 text-yellow-300 -ml-2 z-0">
                      <svg viewBox="0 0 100 40" className="w-full h-full" fill="none" preserveAspectRatio="none">
                        <path d="M0,20 C30,20 70,50 100,20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 6" />
                      </svg>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 h-full relative z-10">
                      <div className="w-12 h-12 bg-yellow-100 text-yellow-700 rounded-xl flex items-center justify-center font-bold text-xl mb-4">3</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Review & Accept</h3>
                      <p className="text-gray-600 text-sm">Browse applications and select the participants who fit your project.</p>
                    </div>
                    <div className="hidden lg:block absolute top-10 left-full w-12 h-8 text-yellow-300 -ml-2 z-0">
                      <svg viewBox="0 0 100 40" className="w-full h-full" fill="none" preserveAspectRatio="none">
                        <path d="M0,20 C30,20 70,-10 100,20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 6" />
                      </svg>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative">
                    <div className="bg-yellow-500 p-6 rounded-2xl shadow-lg border border-yellow-600 h-full relative z-10 text-white transform scale-105">
                      <div className="w-12 h-12 bg-white text-yellow-700 rounded-xl flex items-center justify-center font-bold text-xl mb-4">4</div>
                      <h3 className="text-lg font-bold text-white mb-2">Connect & Collaborate</h3>
                      <p className="text-yellow-50 text-sm">Find partner organisations to co-create new projects and expand your reach.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* SECTION 4: CTA - Recovered "Ready to Connect?" Section */}
        <ScatteredSection
          reverse
          images={[
            "car_luggage.png",
            "Cool Kids - On Wheels.png",
            "nomad_passport.png",
            "red_plane.png"
          ]}
        >
          <div className="text-center md:text-left">
            <h2 className="text-5xl md:text-6xl font-black text-[#003399] mb-6 tracking-tight">
              Ready to Connect?
            </h2>
            <p className="text-xl mb-12 max-w-2xl font-medium text-gray-600">
              Join the Erasmus+ Connect community and start building meaningful connections across Europe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-3 bg-yellow-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-600 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
              >
                Join Now
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </ScatteredSection>
      </div>
    </div>

  );
}
