import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HomeSearchWidget } from '@/components/home/HomeSearchWidget';
import { isOptimizableImage } from '@/lib/storage';

export default function Home() {
  const featuredCars = [
    {
      id: 'car_04',
      title: 'Toyota Land Cruiser Prado TXL',
      category: 'SUV • 4x4',
      tag: 'Top Rated',
      tagClass: 'bg-secondary-fixed text-on-secondary-fixed',
      location: 'Bole Atlas',
      rating: '4.96',
      trips: '38 trips',
      specs: ['Automatic', '7 Seats', 'Diesel 3.0L'],
      price: '9,500',
      note: 'Instant booking enabled',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDFnp69kiNhncQYlohiuSxGuvay_EiOViNYCLre2Ws7_RTtHEF1E3-O342TDEJIJquEh6BnrB_ujvm1p0YXwJK0wNBtJqXSCFDsMbNoleV4_c14_uIacBU5wP5cjpU6XKRxBW0Q7Mp6GKGL4_THNPiAM93-QEHI93t_Qg7nvJ74Fc397LO_3Zkrq0WLEt_rIZzvK9qa4BztOuLbKHWrkQxFNX4yuJQDV1mcyOW9yvP0r0WIHU5MJEBu',
    },
    {
      id: 'car_02',
      title: 'Hyundai Tucson 2.0L AWD',
      category: 'Crossover AWD',
      tag: 'Instant Book',
      tagClass: 'bg-surface-container-lowest text-on-surface',
      location: 'Kazanchis',
      rating: '4.92',
      trips: '24 trips',
      specs: ['Automatic', '5 Seats', 'Petrol 2.0L'],
      price: '4,800',
      note: 'Free Kazanchis drop-off',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC6kP2N1x11r9vokDpRStx9BEBkaxR_pU2Re7osJJSCKAbSCb85oz3yGUGc9td6EjGM1OU0kTtkJdwO73Yh0q6iYsq_N7EbWmHJzYy69KrxSFb2lWiR_wnFTCL95eQxzz1khbD1gy_IYTGPdUMCvIaztrEyANBd3Qn3XqT-bef1ZzodQIzKUzpH0VHDxjaFXTKRAOV-2SfeBsEB_6gPoLdMKiwIE27br_nUP8YkVnOzBe0uB61y9mbi',
    },
    {
      id: 'car_03',
      title: 'Suzuki Dzire Sedan',
      category: 'City Sedan',
      tag: 'Economy',
      tagClass: 'bg-surface-container-lowest text-on-surface',
      location: 'CMC Area',
      rating: '4.88',
      trips: '45 trips',
      specs: ['Manual', '5 Seats', '18 km/L'],
      price: '2,200',
      note: 'Fuel saver favorite',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC91_YPvkctFbAptznHVks0uK7RFBS0vEzN1yWFii3tI3gMVj2gMWL0ozANDAGb8fNJF97oh78UjbW9Wj1mzWDI8uYj9Qf0Ml1YfqH0iut0jk1EvgO8rtXlFlcf-ujgI8vMEOLH1pjBkjHvGzAeMlx34qICQRGzZ5nFNJeJfbUG6zr_ojyOH8yOPi7eC16g6vmxprizwvEzxE-G_Fw4GqrzU_2Eb9_SCP2SX1eG0vDAvN5wrbZ-ZUtP',
    },
    {
      id: 'car_01',
      title: 'Mercedes-Benz C200',
      category: 'Executive Sedan',
      tag: 'Executive Choice',
      tagClass: 'bg-secondary-fixed text-on-secondary-fixed',
      location: 'Old Airport',
      rating: '4.98',
      trips: '19 trips',
      specs: ['Automatic', '5 Seats', 'Leather interior'],
      price: '8,200',
      note: 'Diaspora & VIP favorite',
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCOCOZVlKukf0NXKDQ5kjrudJ56wXsDkPz9Vz_OxprzK3EY0ms-N9CifhjdPbjFm3_HLUKLfNGm_aoUpFBYuhI7BRkgp6CHaEJk3Lt_wobIYYRWjE-UR5xF6J0Yfc0l5A38p_1UjVKYB4RZoULabtVg6HrKwZDk6isTNy9XfPRlLK3CzJZdPqnm5c5FfkDiAP4Du9K99pzTZK4lpwIzXnTCjUGvXswSzzrCCFYXKHuZBYNTr7jgWR_S',
    },
  ];

  const hubs = [
    {
      name: 'Bole International',
      count: '32 cars available',
      icon: 'flight_takeoff',
      query: 'Bole',
    },
    {
      name: 'Kazanchis Diplomatic',
      count: '18 cars available',
      icon: 'domain',
      query: 'Kazanchis',
    },
    {
      name: 'Sarbet & Old Airport',
      count: '14 cars available',
      icon: 'villa',
      query: 'Old Airport',
    },
    {
      name: 'Bole Bulbula',
      count: '9 cars available',
      icon: 'location_city',
      query: 'Bole',
    },
    {
      name: 'CMC Real Estate',
      count: '11 cars available',
      icon: 'home_work',
      query: 'CMC',
    },
  ];

  const steps = [
    {
      num: '01',
      icon: 'saved_search',
      title: 'Discover & Select',
      desc: 'Browse verified local listings in your neighborhood with genuine photos, detailed condition reports, and upfront daily ETB rates. No surprise surcharges.',
      highlight: false,
    },
    {
      num: '02',
      icon: 'account_balance_wallet',
      title: 'Book in 60 Seconds',
      desc: 'Select your dates, review full insurance protection, and confirm through secure simulated TeleBirr escrow. Funds are held safely until handoff completion.',
      highlight: true,
    },
    {
      num: '03',
      icon: 'key',
      title: 'Key Handover & Drive',
      desc: 'Meet your verified host in Bole or Kazanchis, complete a rapid 4-point mobile photo check-in, and cruise with 24/7 dedicated Sheggar roadside support.',
      highlight: false,
    },
  ];

  const heroBlackSUV =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAkoQCVokNx-AtTfU36yH5-khyiPu33FhoYLPwIgmjQkMxXqJ3ZT62GA26ZZlPypMkny8lbc8fluY8mqm4gr2tDk41N8xIuSadKZ-NfAj_vDnniCUSXN1xTB_zcqtBgeJH4Jnp6ruhu58_mGzizTDc4mwttS4Yb0noIfBw6nzOmMcJ5BgTI1jEigZ4s-I2BvdUnHOPbadzeYdCH2QWtfBvu0U0vBGU4E95eQ3ljPOiy2ksJaoX1BS4i';

  return (
    <div className="flex flex-col w-full">
      {/* 1. Top Subtle Notice Badge */}
      <section className="w-full max-w-[1360px] mx-auto px-gutter pt-space-md">
        <div className="flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-high/60 backdrop-blur-xs rounded-full py-2 px-space-md border border-outline-variant/20">
          <div className="flex items-center gap-space-xs text-on-surface">
            <span className="inline-flex w-2 h-2 rounded-full bg-secondary animate-pulse shrink-0" />
            <span className="font-specs-tabular text-specs-tabular text-on-surface">
              New in Sheggar: TeleBirr Escrow direct verification active across 6 metropolitan hubs
            </span>
          </div>
          <div className="flex items-center gap-space-md">
            <span className="hidden sm:inline font-specs-tabular text-specs-tabular text-on-surface-variant">
              Live Fleet Availability: 84 Cars
            </span>
            <Link
              href="/cars"
              className="inline-flex items-center gap-1 font-label-caps text-label-caps text-secondary uppercase hover:underline"
            >
              Browse Live Map
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Hero Section */}
      <section className="w-full max-w-[1360px] mx-auto px-gutter pt-space-lg pb-space-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
          {/* Text & Value Prop */}
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-surface-container font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
              Verified Addis Ababa Car Sharing
            </div>
            <h1 className="font-display-hero text-display-hero text-on-surface tracking-tight">
              Effortless car rental for{' '}
              <span className="text-secondary underline decoration-secondary/30 underline-offset-8">
                modern Addis Ababa
              </span>
              .
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              Unlock vetted local vehicles from trusted hosts across Bole, Kazanchis, Old Airport, and beyond. Instant booking, transparent ETB pricing, and seamless simulated TeleBirr escrow.
            </p>

            {/* Trust Badges Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-xs pt-space-sm">
              <div className="flex flex-col bg-surface-container-lowest p-3 rounded-lg shadow-xs border border-outline-variant/15">
                <span className="font-headline-sm text-headline-sm text-on-surface">350+</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Vetted Vehicles</span>
              </div>
              <div className="flex flex-col bg-surface-container-lowest p-3 rounded-lg shadow-xs border border-outline-variant/15">
                <div className="flex items-center gap-1 font-headline-sm text-headline-sm text-on-surface">
                  <span>4.96</span>
                  <span className="material-symbols-outlined text-[18px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Avg Host Rating</span>
              </div>
              <div className="flex flex-col bg-surface-container-lowest p-3 rounded-lg shadow-xs border border-outline-variant/15">
                <span className="font-headline-sm text-headline-sm text-on-surface">0 ETB</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Hidden Deposit Fee</span>
              </div>
              <div className="flex flex-col bg-surface-container-lowest p-3 rounded-lg shadow-xs border border-outline-variant/15">
                <span className="font-headline-sm text-headline-sm text-secondary">Instant</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">TeleBirr Escrow</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Articulation */}
          <div className="lg:col-span-5 relative">
            <div className="relative w-full h-[460px] rounded-2xl overflow-hidden shadow-xl bg-primary-container">
              <Image
                src={heroBlackSUV}
                alt="Modern black luxury SUV parked along Bole Road in Addis Ababa during golden hour"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                unoptimized={!isOptimizableImage(heroBlackSUV)}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-container via-transparent to-transparent opacity-85" />

              {/* Floating Status Capsule */}
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-surface-container-lowest/95 backdrop-blur-md shadow-lg flex items-center justify-between border border-white/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
                    <span className="material-symbols-outlined text-[20px]">electric_car</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface">Available in Bole Medhanialem</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Toyota Land Cruiser TXL • Ready in 15m</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-specs-tabular text-specs-tabular text-on-surface block font-bold">9,500 ETB</span>
                  <span className="font-label-caps text-[10px] text-secondary font-bold uppercase">Escrow Locked</span>
                </div>
              </div>
            </div>

            {/* Decorative Asymmetrical Floating Accent Card */}
            <div className="hidden sm:flex absolute -top-4 -right-4 p-3 bg-secondary-fixed text-on-secondary-fixed rounded-xl shadow-md items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">shield_with_heart</span>
              <span className="font-specs-tabular text-specs-tabular">Full Comprehensive Coverage Included</span>
            </div>
          </div>
        </div>

        {/* Integrated Quick Reserve Dispatch Panel */}
        <div className="mt-space-lg">
          <HomeSearchWidget />
        </div>
      </section>

      {/* 3. Live Fleet Inventory */}
      <section className="w-full max-w-[1360px] mx-auto px-gutter py-space-xl" id="fleet">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm mb-space-lg">
          <div className="flex flex-col gap-1">
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">
              Available Today in Addis
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Handpicked for urban commutes &amp; countryside getaways
            </h2>
          </div>
          <Link
            className="inline-flex items-center gap-1 font-title-md text-title-md text-on-surface hover:text-secondary group transition-colors"
            href="/cars"
          >
            <span>View all 84 cars</span>
            <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
              trending_flat
            </span>
          </Link>
        </div>

        {/* Vehicles Grid (4 bespoke cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {featuredCars.map((car) => (
            <article
              key={car.id}
              className="bg-surface-container-lowest rounded-xl p-space-sm shadow-md hover:shadow-xl transition-all flex flex-col justify-between group border border-outline-variant/15"
            >
              <div>
                {/* Media Frame */}
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-surface-container-high">
                  <Image
                    src={car.image}
                    alt={car.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    unoptimized={!isOptimizableImage(car.image)}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full font-label-caps text-label-caps uppercase shadow-xs ${car.tagClass}`}>
                    {car.tag}
                  </span>
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-primary-container/80 backdrop-blur-xs text-on-primary font-specs-tabular text-[11px]">
                    {car.location}
                  </div>
                </div>

                {/* Content Details */}
                <div className="pt-3 pb-2 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                      {car.category}
                    </span>
                    <div className="flex items-center gap-1 text-on-surface font-specs-tabular text-specs-tabular">
                      <span className="material-symbols-outlined text-[16px] text-secondary">star</span>
                      <span className="font-bold">{car.rating}</span>
                      <span className="text-on-surface-variant">({car.trips})</span>
                    </div>
                  </div>

                  <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1">
                    {car.title}
                  </h3>

                  {/* Specs Strip */}
                  <div className="flex items-center gap-2 mt-1 py-1.5 px-2 rounded-md bg-surface-container font-specs-tabular text-[12px] text-on-surface-variant">
                    {car.specs.map((spec, i) => (
                      <React.Fragment key={spec}>
                        {i > 0 && <span>•</span>}
                        <span>{spec}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Pricing and Action */}
              <div className="pt-2 flex items-center justify-between border-t border-outline-variant/15 mt-1">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-md text-headline-md text-on-surface">{car.price}</span>
                    <span className="font-specs-tabular text-specs-tabular text-on-surface-variant">ETB / day</span>
                  </div>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">{car.note}</span>
                </div>
                <Link
                  href={`/cars/${car.id}`}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary font-title-md text-title-md hover:bg-surface-container-highest hover:text-on-surface transition-colors shadow-xs"
                >
                  Rent
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 4. Neighborhood Quick Discovery Strip */}
      <section className="w-full bg-surface-container-high/40 py-space-xl">
        <div className="max-w-[1360px] mx-auto px-gutter">
          <div className="flex flex-col gap-space-sm mb-space-md">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              Local Addis Presence
            </span>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Explore by verified neighborhood hubs
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-sm">
            {hubs.map((hub) => (
              <Link
                key={hub.name}
                href={`/cars?neighbourhood=${encodeURIComponent(hub.query)}`}
                className="p-4 rounded-xl bg-surface-container-lowest hover:bg-surface transition-all shadow-xs flex flex-col justify-between group border border-outline-variant/15"
              >
                <div className="flex items-center justify-between text-secondary">
                  <span className="material-symbols-outlined text-[24px]">{hub.icon}</span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
                <div className="mt-4 flex flex-col">
                  <span className="font-title-md text-title-md text-on-surface font-semibold">{hub.name}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">{hub.count}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Three-Step Rental Flow */}
      <section className="w-full max-w-[1360px] mx-auto px-gutter py-space-xl" id="how-it-works">
        <div className="text-center max-w-2xl mx-auto mb-space-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container font-label-caps text-label-caps text-secondary uppercase mb-2">
            <span className="material-symbols-outlined text-[16px]">touch_app</span>
            Simple, Transparent &amp; Secure
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            How Sheggar Wheels Works
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            Skip traditional rental bureaucracies. Experience peer-to-peer automotive mobility built specifically for Ethiopian roadways and verified payments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg relative">
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex flex-col bg-surface-container-lowest p-space-md rounded-2xl shadow-xs relative border border-outline-variant/15"
            >
              <div className="flex items-center justify-between mb-space-md">
                <span className="font-display-hero text-display-hero text-surface-container-highest">
                  {step.num}
                </span>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    step.highlight
                      ? 'bg-secondary-fixed text-on-secondary-fixed'
                      : 'bg-surface-container text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[24px]">{step.icon}</span>
                </div>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">
                {step.title}
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Host-Partner Callout Banner */}
      <section className="w-full max-w-[1360px] mx-auto px-gutter pb-space-xl">
        <div className="w-full bg-primary-container text-on-primary rounded-3xl overflow-hidden shadow-2xl relative">
          {/* Ambient Graphic Vector Glow */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg p-space-lg md:p-space-xl items-center relative z-10">
            {/* Text Column */}
            <div className="lg:col-span-7 flex flex-col gap-space-md">
              <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-surface-container-highest/20 font-label-caps text-label-caps text-secondary-fixed uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">monetization_on</span>
                Host Partnership Program
              </div>
              <h2 className="font-headline-lg text-headline-lg text-on-primary tracking-tight">
                Turn your parked car into <span className="text-secondary-fixed">monthly revenue</span>.
              </h2>
              <p className="font-body-lg text-body-lg text-primary-fixed-dim max-w-xl">
                Active hosts in Bole and Sarbet earn on average <strong className="text-on-primary">up to 85,000 ETB / month</strong> sharing their vehicle while working or traveling abroad. We handle identity vetting, GPS telematics, and automated escrow payouts.
              </p>
              <div className="flex flex-wrap items-center gap-space-sm pt-2">
                <Link
                  className="px-6 py-3 rounded-full bg-secondary-fixed text-on-secondary-fixed font-title-md text-title-md hover:bg-secondary-fixed-dim transition-transform active:scale-95 shadow-md inline-flex items-center gap-2"
                  href="/signin?role=owner"
                >
                  <span>List Your Vehicle Today</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
                <Link
                  className="px-6 py-3 rounded-full bg-surface-container-highest/10 text-on-primary font-title-md text-title-md hover:bg-surface-container-highest/20 transition-colors inline-flex items-center gap-2"
                  href="#how-it-works"
                >
                  <span className="material-symbols-outlined text-[18px]">calculate</span>
                  <span>Calculate Potential Earnings</span>
                </Link>
              </div>
            </div>

            {/* Metric Card / Illustration Column */}
            <div className="lg:col-span-5 bg-surface-container-highest/10 rounded-2xl p-space-md backdrop-blur-md border border-white/5 flex flex-col gap-space-sm">
              <div className="flex items-center justify-between pb-space-xs border-b border-white/10">
                <span className="font-title-md text-title-md text-on-primary">Addis Host Monthly Benchmark</span>
                <span className="font-label-caps text-label-caps text-secondary-fixed uppercase">Real Payouts</span>
              </div>

              {/* Earnings Breakdown Bar Simulation */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-body-md text-body-md text-primary-fixed-dim">Toyota RAV4 / Tucson (14 days)</span>
                  <span className="font-specs-tabular text-specs-tabular text-on-primary font-bold">~64,000 ETB</span>
                </div>
                <div className="w-full bg-surface-container-highest/20 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-secondary-fixed h-full rounded-full w-[75%]" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-body-md text-body-md text-primary-fixed-dim">Prado / Patrol (10 days)</span>
                  <span className="font-specs-tabular text-specs-tabular text-on-primary font-bold">~88,000 ETB</span>
                </div>
                <div className="w-full bg-surface-container-highest/20 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-secondary-fixed h-full rounded-full w-[95%]" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-body-md text-body-md text-primary-fixed-dim">Suzuki Dzire / Vitz (18 days)</span>
                  <span className="font-specs-tabular text-specs-tabular text-on-primary font-bold">~39,600 ETB</span>
                </div>
                <div className="w-full bg-surface-container-highest/20 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-secondary-fixed h-full rounded-full w-[45%]" />
                </div>
              </div>

              <div className="mt-2 p-3 rounded-xl bg-surface-container-highest/10 flex items-center gap-2 text-on-primary text-body-sm font-body-sm">
                <span className="material-symbols-outlined text-secondary-fixed text-[20px]">security</span>
                <span>Comprehensive insurance and host damage protection backed automatically.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Community Testimonials / Diaspora Trust Strip */}
      <section className="w-full max-w-[1360px] mx-auto px-gutter pb-space-xl">
        <div className="p-space-lg rounded-2xl bg-surface-container-lowest shadow-xs grid grid-cols-1 md:grid-cols-3 gap-space-lg items-center border border-outline-variant/15">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-fixed shrink-0">
              <span className="material-symbols-outlined text-[24px]">support_agent</span>
            </div>
            <div className="flex flex-col">
              <h4 className="font-title-md text-title-md text-on-surface">24/7 Roadside Assistance</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Live dispatch team stationed across ring roads and expressway links.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface shrink-0">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
            </div>
            <div className="flex flex-col">
              <h4 className="font-title-md text-title-md text-on-surface">Identity &amp; License Vetted</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Direct integration with Addis Ababa Transport Bureau registry.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface shrink-0">
              <span className="material-symbols-outlined text-[24px]">lock</span>
            </div>
            <div className="flex flex-col">
              <h4 className="font-title-md text-title-md text-on-surface">TeleBirr Secure Escrow</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Renter payments protected until verified car key transfer.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
