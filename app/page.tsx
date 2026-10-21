import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function Home() {
  const steps = [
    {
      num: "01",
      title: "Find Your Vehicle",
      desc: "Browse vetted sedans, SUVs, and compact cars by neighbourhood, seats, transmission, and upfront ETB daily price.",
    },
    {
      num: "02",
      title: "Request Booking",
      desc: "Select your trip dates, inspect itemized pricing, and submit your request directly to the vehicle owner.",
    },
    {
      num: "03",
      title: "Meet & Drive",
      desc: "Connect with the host in Bole, Kazanchis, or your selected hub for key handover, vehicle inspection, and secure escrow lock.",
    },
    {
      num: "04",
      title: "Return & Review",
      desc: "Conclude your trip at the agreed time, release the simulated escrow, and leave feedback to help build community trust.",
    },
  ];

  return (
    <div className="flex flex-col w-full pb-16 sm:pb-24">
      {/* Top Notice Capsule */}
      <section className="w-full pt-4 sm:pt-6">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#EBE8E1]/80 backdrop-blur-sm rounded-full py-2 px-4 sm:px-6 border border-[#66717D]/12 text-xs">
            <div className="flex items-center gap-2 text-[#111820]">
              <span className="w-2 h-2 rounded-full bg-[#536600] animate-pulse shrink-0" />
              <span className="font-specs-tabular">
                New in Shegger: TeleBirr Escrow direct verification active across 6 metropolitan hubs
              </span>
            </div>
            <Link
              href="/cars"
              className="inline-flex items-center gap-1 font-label-caps text-[10px] text-[#536600] uppercase hover:underline font-bold"
            >
              Browse Fleet
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Container>
      </section>

      {/* Hero Section */}
      <section className="w-full pt-8 sm:pt-14 pb-12 sm:pb-16">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start gap-5">
              <Badge variant="neutral" dot>
                Verified Addis Ababa Car Sharing
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#111820] tracking-tight leading-[1.12]">
                Effortless car rental for{" "}
                <span className="text-[#536600] underline decoration-[#D5F36A] decoration-wavy underline-offset-8">
                  modern Addis Ababa
                </span>
                .
              </h1>

              <p className="text-base sm:text-lg text-[#44474B] leading-relaxed max-w-xl">
                Unlock vetted local vehicles from trusted hosts across Bole, Kazanchis, Old Airport, and beyond. Instant booking, transparent ETB pricing, and seamless simulated TeleBirr escrow.
              </p>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  href="/cars"
                  variant="primary"
                  size="lg"
                  id="hero-explore-cars"
                >
                  Explore Cars
                </Button>
                <Button
                  href="/#how-it-works"
                  variant="outline"
                  size="lg"
                  id="hero-how-it-works"
                >
                  How It Works
                </Button>
              </div>

              {/* Trust Badges Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full pt-6 border-t border-[#66717D]/15 mt-2">
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
                  <span className="font-label-caps text-[9px] text-[#66717D] uppercase">Hidden Fees</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#66717D]/12 shadow-xs">
                  <span className="text-xl sm:text-2xl font-bold text-[#536600] block">Instant</span>
                  <span className="font-label-caps text-[9px] text-[#66717D] uppercase">TeleBirr Escrow</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative w-full h-[400px] sm:h-[460px] rounded-3xl overflow-hidden shadow-xl bg-[#111820]">
                <Image
                  src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
                  alt="Modern SUV in Addis Ababa"
                  fill
                  priority
                  unoptimized
                  className="object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111820]/90 via-transparent to-transparent" />

                {/* Floating Status Capsule */}
                <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-white/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#CEEC64] flex items-center justify-center text-[#171E00] font-bold">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#111820]">Available in Bole</span>
                      <span className="text-xs text-[#66717D]">Toyota RAV4 • Ready in 15m</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-specs-tabular text-sm font-bold text-[#111820] block">
                      4,500 ETB
                    </span>
                    <span className="font-label-caps text-[9px] text-[#536600] font-bold uppercase">
                      Escrow Locked
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Shield Tag */}
              <div className="hidden sm:flex absolute -top-3 -right-3 px-3.5 py-2 bg-[#D1EF67] text-[#171E00] font-semibold text-xs rounded-xl shadow-md items-center gap-2 border border-[#B6D24D]">
                <span>✓ 100% Host Inspection Protocol</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full py-16 sm:py-24 bg-[#F1EEE7]/50 border-t border-[#66717D]/12">
        <Container>
          <SectionHeading
            eyebrow="Simple & Transparent"
            title="How Shegger Wheels Works"
            subtitle="A streamlined peer-to-peer automotive sharing model tailored for vehicle owners and renters in Addis Ababa."
            badgeDot
          />

          {/* 4 Steps Grid */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <Card
                key={step.num}
                variant="default"
                className="flex flex-col justify-between hover:border-[#111820]/30 transition-colors"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#EBE8E1] text-[#111820] flex items-center justify-center font-bold text-sm mb-4">
                    {step.num}
                  </div>
                  <h3 className="text-lg font-bold text-[#111820] tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#44474B] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Dual Value Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* For Renters Card */}
            <Card variant="default" className="p-8">
              <Badge variant="citron">For Renters</Badge>
              <h3 className="mt-3 text-2xl font-bold text-[#111820] tracking-tight">
                Need a reliable car in Addis?
              </h3>
              <p className="mt-2.5 text-sm text-[#44474B] leading-relaxed">
                Skip commercial rental agency markups. Access privately owned, well-maintained cars parked in your own sub-city with transparent daily rates and TeleBirr protection.
              </p>
              <div className="mt-6">
                <Button href="/cars" variant="secondary" size="md">
                  Browse Available Cars
                </Button>
              </div>
            </Card>

            {/* For Car Owners Card */}
            <Card variant="obsidian" className="p-8">
              <Badge variant="citron">For Car Owners</Badge>
              <h3 className="mt-3 text-2xl font-bold text-white tracking-tight">
                Have an idle car parked in Addis?
              </h3>
              <p className="mt-2.5 text-sm text-[#DCDAD3] leading-relaxed">
                Turn your vehicle into passive income when you are not driving. Control your calendar, approve requests, and earn securely with verified local drivers.
              </p>
              <div className="mt-6">
                <Button href="/signin?role=owner" variant="primary" size="md">
                  List Your Car
                </Button>
              </div>
            </Card>
          </div>
        </Container>
      </section>
    </div>
  );
}
