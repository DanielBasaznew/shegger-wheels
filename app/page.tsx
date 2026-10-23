import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { VehicleCard } from '@/components/cars/VehicleCard';
import { HomeSearchWidget } from '@/components/home/HomeSearchWidget';
import { SEED_CARS } from '@/lib/seeds';

export default function Home() {
  // Take approved cars for the featured section
  const featuredCars = SEED_CARS.filter((c) => c.status === 'approved').slice(0, 4);

  const hubs = [
    { name: 'Bole International', desc: 'Medhanialem • Atlas • Airport', count: '32 cars', icon: '✈️', query: 'Bole' },
    { name: 'Kazanchis Diplomatic', desc: 'UNECA • Hilton • Intercontinental', count: '18 cars', icon: '🏛️', query: 'Kazanchis' },
    { name: 'Sarbet & Old Airport', desc: 'Vatican • Bisrate Gabriel • Golf', count: '14 cars', icon: '🏡', query: 'Old Airport' },
    { name: 'Bole Bulbula', desc: 'Cargo • Ring Road Junction', count: '9 cars', icon: '🛣️', query: 'Bole' },
    { name: 'CMC & Ayat', desc: 'Summit • Real Estate Hubs', count: '11 cars', icon: '🏢', query: 'CMC' },
  ];

  const steps = [
    {
      num: '01',
      icon: '🔍',
      title: 'Discover & Select',
      desc: 'Browse verified local listings in your neighborhood with genuine photos, detailed condition reports, and upfront daily ETB rates. No surprise surcharges.',
    },
    {
      num: '02',
      icon: '📱',
      title: 'Book in 60 Seconds',
      desc: 'Select your dates, review full insurance protection, and confirm through secure simulated TeleBirr escrow. Funds are held safely until handoff completion.',
    },
    {
      num: '03',
      icon: '🔑',
      title: 'Key Handover & Drive',
      desc: 'Meet your verified host in Bole or Kazanchis, complete a rapid 4-point mobile photo check-in, and cruise with 24/7 dedicated Shegger roadside support.',
    },
  ];

  return (
    <div className="flex flex-col w-full pb-16 sm:pb-24">
      {/* 1. Top Subtle Notice Capsule */}
      <section className="w-full pt-4 sm:pt-6">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#EBE8E1]/80 backdrop-blur-sm rounded-full py-2 px-4 sm:px-6 border border-[#66717D]/12 text-xs">
            <div className="flex items-center gap-2 text-[#111820]">
              <span className="w-2 h-2 rounded-full bg-[#536600] animate-pulse shrink-0" />
              <span className="font-specs-tabular">
                New in Shegger: TeleBirr Escrow direct verification active across 6 metropolitan hubs
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline font-specs-tabular text-[#66717D]">
                Live Fleet Availability: 84 Cars
              </span>
              <Link
                href="/cars"
                className="inline-flex items-center gap-1 font-label-caps text-[10px] text-[#536600] uppercase hover:underline font-bold"
              >
                Browse Live Fleet
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Hero Section */}
      <section className="w-full pt-8 sm:pt-14 pb-12 sm:pb-16">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start gap-5">
              <Badge variant="neutral" dot>
                Verified Addis Ababa Car Sharing
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#111820] tracking-tight leading-[1.12]">
                Effortless car rental for{' '}
                <span className="text-[#536600] underline decoration-[#D5F36A] decoration-wavy underline-offset-8">
                  modern Addis Ababa
                </span>
                .
              </h1>

              <p className="text-base sm:text-lg text-[#44474B] leading-relaxed max-w-xl">
                Unlock vetted local vehicles from trusted hosts across Bole, Kazanchis, Old Airport, and beyond. Instant booking, transparent ETB pricing, and seamless simulated TeleBirr escrow.
              </p>

              {/* Trust Badges Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full pt-4">
                <div className="bg-white p-3.5 rounded-xl border border-[#66717D]/12 shadow-xs">
                  <span className="text-xl sm:text-2xl font-bold text-[#111820] block">350+</span>
                  <span className="font-label-caps text-[9px] text-[#66717D] uppercase">Vetted Vehicles</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#66717D]/12 shadow-xs">
                  <span className="text-xl sm:text-2xl font-bold text-[#111820] block">4.96 ★</span>
                  <span className="font-label-caps text-[9px] text-[#66717D] uppercase">Avg Host Rating</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#66717D]/12 shadow-xs">
                  <span className="text-xl sm:text-2xl font-bold text-[#111820] block">0 ETB</span>
                  <span className="font-label-caps text-[9px] text-[#66717D] uppercase">Hidden Deposit Fee</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#66717D]/12 shadow-xs">
                  <span className="text-xl sm:text-2xl font-bold text-[#536600] block">Instant</span>
                  <span className="font-label-caps text-[9px] text-[#66717D] uppercase">TeleBirr Escrow</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Articulation */}
            <div className="lg:col-span-5 relative">
              <div className="relative w-full h-[420px] sm:h-[480px] rounded-3xl overflow-hidden shadow-2xl bg-[#111820]">
                <Image
                  src="https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80"
                  alt="Modern SUV in Addis Ababa"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111820]/90 via-transparent to-transparent" />

                {/* Floating Status Capsule */}
                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-white/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#CEEC64] flex items-center justify-center text-[#171E00] font-bold">
                      🚗
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#111820]">Available in Bole Medhanialem</span>
                      <span className="text-xs text-[#66717D]">Toyota Land Cruiser TXL • Ready in 15m</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-specs-tabular text-sm font-bold text-[#111820] block">
                      9,500 ETB
                    </span>
                    <span className="font-label-caps text-[9px] text-[#536600] font-bold uppercase">
                      Escrow Locked
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative Asymmetrical Floating Accent Card */}
              <div className="hidden sm:flex absolute -top-4 -right-4 p-3 bg-[#D1EF67] text-[#171E00] font-semibold text-xs rounded-2xl shadow-md items-center gap-2 border border-[#B6D24D]">
                <span>🛡️ Full Comprehensive Coverage Included</span>
              </div>
            </div>
          </div>

          {/* Integrated Quick Reserve Dispatch Search Widget */}
          <div className="mt-10 sm:mt-14">
            <HomeSearchWidget />
          </div>
        </Container>
      </section>

      {/* 3. Handpicked Fleet Section */}
      <section className="w-full py-12 sm:py-16 bg-[#F6F3EC]/60 border-t border-[#66717D]/12">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="font-label-caps text-[10px] text-[#536600] uppercase font-bold tracking-wider block mb-1">
                Available Today in Addis
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111820] tracking-tight">
                Handpicked for urban commutes & countryside getaways
              </h2>
            </div>
            <Link
              href="/cars"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#111820] hover:text-[#536600] transition-colors"
            >
              <span>View all 84 cars</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCars.map((car, idx) => (
              <VehicleCard
                key={car.id}
                car={car}
                tag={idx === 0 ? 'TOP RATED' : idx === 1 ? 'EXECUTIVE CHOICE' : idx === 2 ? 'ECONOMY' : 'INSTANT BOOK'}
                rating={idx === 0 ? 4.98 : idx === 1 ? 4.93 : idx === 2 ? 4.88 : 4.96}
                tripsCount={idx === 0 ? 38 : idx === 1 ? 31 : idx === 2 ? 45 : 19}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* 4. Verified Neighborhood Hubs Section */}
      <section className="w-full py-12 sm:py-16">
        <Container>
          <span className="font-label-caps text-[10px] text-[#66717D] uppercase font-bold tracking-wider block mb-1">
            Local Addis Presence
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111820] tracking-tight mb-8">
            Explore by verified neighborhood hubs
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {hubs.map((hub) => (
              <Link
                key={hub.name}
                href={`/cars?neighbourhood=${encodeURIComponent(hub.query)}`}
                className="group flex flex-col justify-between p-5 rounded-2xl bg-white border border-[#66717D]/15 shadow-xs hover:border-[#111820]/40 hover:shadow-md transition-all duration-200"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#F1EEE7] flex items-center justify-center text-lg mb-3 group-hover:scale-105 transition-transform">
                    {hub.icon}
                  </div>
                  <h3 className="font-bold text-sm text-[#111820] group-hover:text-[#536600] transition-colors">
                    {hub.name}
                  </h3>
                  <p className="text-xs text-[#66717D] mt-1 line-clamp-1">
                    {hub.desc}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#66717D]/10">
                  <span className="font-specs-tabular text-xs font-semibold text-[#111820]">
                    {hub.count}
                  </span>
                  <span className="text-xs font-bold text-[#66717D] group-hover:text-[#111820] group-hover:translate-x-1 transition-all">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="w-full py-16 sm:py-24 bg-[#F1EEE7]/50 border-t border-[#66717D]/12">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-[#EBE8E1] text-[#111820] font-label-caps text-[10px] mb-3">
              Simple, Transparent & Secure
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111820] tracking-tight">
              How Shegger Wheels Works
            </h2>
            <p className="mt-3 text-base text-[#44474B]">
              Skip traditional rental bureaucracies. Experience peer-to-peer automotive mobility built specifically for Ethiopian roadways and verified payments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step) => (
              <div
                key={step.num}
                className="bg-white rounded-3xl p-7 border border-[#66717D]/15 shadow-sm flex flex-col justify-between hover:border-[#111820]/30 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-4xl font-extrabold text-[#111820]/20 font-specs-tabular">
                      {step.num}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-[#D5F36A]/30 text-[#111820] flex items-center justify-center text-xl font-bold">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#111820] tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-sm text-[#44474B] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 6. Host Partnership Program Section */}
      <section className="w-full py-12 sm:py-16">
        <Container>
          <div className="rounded-3xl bg-[#111820] text-white p-6 sm:p-10 lg:p-12 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column */}
              <div className="lg:col-span-7 flex flex-col items-start gap-4">
                <Badge variant="citron">Host Partnership Program</Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  Turn your parked car into{' '}
                  <span className="text-[#D5F36A]">monthly revenue</span>.
                </h2>
                <p className="text-sm sm:text-base text-[#DCDAD3] leading-relaxed max-w-xl">
                  Active hosts in Bole and Sarbet earn on average up to <strong className="text-white">85,000 ETB / month</strong> sharing their vehicle while working or traveling abroad. We handle identity vetting, GPS telematics, and automated escrow payouts.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button href="/signin?role=owner" variant="primary" size="md">
                    List Your Vehicle Today →
                  </Button>
                  <Button href="/#how-it-works" variant="outline" size="md" className="bg-transparent text-white border-white/20 hover:bg-white/10">
                    Calculate Potential Earnings
                  </Button>
                </div>
              </div>

              {/* Right Column: Earnings Benchmark Simulation */}
              <div className="lg:col-span-5 bg-white/5 rounded-2xl p-6 backdrop-blur-md border border-white/10 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-sm font-bold text-white">Addis Host Monthly Benchmark</span>
                  <span className="font-label-caps text-[9px] text-[#D5F36A] uppercase font-bold">Real Payouts</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-[#C0C7D2]">Toyota RAV4 / Tucson (14 days)</span>
                    <span className="font-specs-tabular font-bold text-white">~64,000 ETB</span>
                  </div>
                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#D5F36A] h-full rounded-full w-[75%]" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-[#C0C7D2]">Prado / Patrol (10 days)</span>
                    <span className="font-specs-tabular font-bold text-white">~88,000 ETB</span>
                  </div>
                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#D5F36A] h-full rounded-full w-[95%]" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-[#C0C7D2]">Suzuki Dzire / Vitz (18 days)</span>
                    <span className="font-specs-tabular font-bold text-white">~39,600 ETB</span>
                  </div>
                  <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#D5F36A] h-full rounded-full w-[45%]" />
                  </div>
                </div>

                <div className="mt-2 p-3 rounded-xl bg-white/5 flex items-center gap-2 text-xs text-[#DCDAD3]">
                  <span>🛡️</span>
                  <span>Comprehensive insurance and host damage protection backed automatically.</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 7. Trust & Verification Strip */}
      <section className="w-full pt-4">
        <Container>
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#66717D]/15 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#CEEC64] text-[#171E00] flex items-center justify-center text-xl shrink-0 font-bold">
                🛟
              </div>
              <div className="flex flex-col">
                <h4 className="text-sm font-bold text-[#111820]">24/7 Roadside Assistance</h4>
                <p className="text-xs text-[#66717D] mt-0.5">Live dispatch team stationed across ring roads and expressway links.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EBE8E1] text-[#111820] flex items-center justify-center text-xl shrink-0 font-bold">
                🛡️
              </div>
              <div className="flex flex-col">
                <h4 className="text-sm font-bold text-[#111820]">Identity & License Vetted</h4>
                <p className="text-xs text-[#66717D] mt-0.5">Direct integration with Addis Ababa Transport Bureau registry.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EBE8E1] text-[#111820] flex items-center justify-center text-xl shrink-0 font-bold">
                🔒
              </div>
              <div className="flex flex-col">
                <h4 className="text-sm font-bold text-[#111820]">TeleBirr Secure Escrow</h4>
                <p className="text-xs text-[#66717D] mt-0.5">Renter payments protected until verified car key transfer.</p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
