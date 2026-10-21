import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Brand Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
              id="brand-logo"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
                  Shegger Wheels
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-700">
                  Addis Ababa P2P
                </span>
              </div>
            </Link>
          </div>

          {/* Simple Navigation */}
          <nav
            aria-label="Main Navigation"
            className="flex items-center gap-1 sm:gap-2"
          >
            <Link
              href="/"
              className="px-3 py-2 text-sm font-medium text-amber-600 rounded-lg hover:bg-amber-50 transition-colors"
              id="nav-home"
            >
              Home
            </Link>
            <Link
              href="/cars"
              className="px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:text-amber-600 hover:bg-slate-100 transition-colors"
              id="nav-explore-cars"
            >
              Explore Cars
            </Link>
            <Link
              href="/signin"
              className="ml-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
              id="nav-sign-in"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Shell */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200/80 py-16 sm:py-24 lg:py-28">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-50/50 via-transparent to-transparent pointer-events-none" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {/* Context Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/80 text-amber-900 text-xs font-semibold mb-6">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Addis Ababa&apos;s Peer-to-Peer Car Rental Marketplace
              </div>

              {/* Hero Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
                Rent trusted cars directly from{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                  local owners
                </span>
              </h1>

              {/* Hero Subtitle */}
              <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
                Skip traditional rental counters. Connect directly with vehicle
                owners across Bole, Kazanchis, CMC, Sarbet, and all Addis Ababa
                neighbourhoods for transparent daily rates and easy booking.
              </p>

              {/* Call to Actions */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/cars"
                  id="hero-cta-explore"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-base shadow-md shadow-amber-600/25 transition-all hover:-translate-y-0.5"
                >
                  Explore Cars
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>

                <a
                  href="#how-it-works"
                  id="hero-cta-how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-semibold text-base bg-white transition-colors"
                >
                  How It Works
                </a>
              </div>

              {/* Quick highlights */}
              <div className="mt-12 pt-8 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold text-slate-900">10+</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    Addis Sub-cities
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">100%</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    Peer-to-Peer
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">ETB</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    Direct Daily Rates
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">Mock</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    TeleBirr Checkout
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rental Concept Section ("How It Works") */}
        <section
          id="how-it-works"
          className="py-16 sm:py-20 lg:py-24 bg-slate-50"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs uppercase font-bold tracking-wider text-amber-700">
                Simple & Transparent
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                How Shegger Wheels Works
              </h2>
              <p className="mt-3 text-base sm:text-lg text-slate-600">
                A seamless peer-to-peer car sharing model tailored for vehicle
                owners and renters in Addis Ababa.
              </p>
            </div>

            {/* 4 Steps Grid */}
            <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-amber-200 transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base mb-4">
                    01
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Find Your Vehicle
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Browse sedans, SUVs, and compact cars by neighbourhood,
                    seats, transmission, and daily price.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-amber-200 transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base mb-4">
                    02
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Request Booking
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Select your rental dates, review the upfront price
                    calculation, and submit your request directly to the owner.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-amber-200 transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base mb-4">
                    03
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Meet & Drive
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    After owner confirmation, pick up the keys, inspect the car,
                    and enjoy your trip across the city or country.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-amber-200 transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base mb-4">
                    04
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Return & Review
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    Return the vehicle at the agreed time, conclude the trip, and
                    leave a review to build trust in our community.
                  </p>
                </div>
              </div>
            </div>

            {/* Community Dual Cards */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                <span className="text-xs uppercase font-bold tracking-wider text-amber-700">
                  For Renters
                </span>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  Need a reliable car for a few days?
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Avoid the hassle and expense of commercial rental agencies.
                  Access well-maintained cars parked in your own sub-city with
                  transparent daily rates.
                </p>
                <Link
                  href="/cars"
                  className="mt-4 inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-500 gap-1"
                >
                  Browse available cars →
                </Link>
              </div>

              <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-white shadow-sm">
                <span className="text-xs uppercase font-bold tracking-wider text-amber-400">
                  For Car Owners
                </span>
                <h3 className="mt-1 text-xl font-bold text-white">
                  Have an idle car parked in Addis?
                </h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Turn your car into passive earnings when you aren&apos;t driving.
                  Control your calendar, approve rental requests, and earn safely
                  with vetted local drivers.
                </p>
                <Link
                  href="/signin"
                  className="mt-4 inline-flex items-center text-sm font-semibold text-amber-400 hover:text-amber-300 gap-1"
                >
                  Sign in to list your car →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Brand Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-bold text-base text-slate-900">
              Shegger Wheels
            </span>
            <span className="text-xs text-slate-600 mt-0.5">
              Peer-to-peer car rental prototype • Addis Ababa, Ethiopia
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">
              Home
            </Link>
            <Link href="/cars" className="hover:text-slate-900">
              Explore Cars
            </Link>
            <Link href="/signin" className="hover:text-slate-900">
              Sign In
            </Link>
          </div>

          <div className="text-xs text-slate-600 text-center md:text-right">
            <span>Simulated Frontend Prototype</span>
            <span className="block text-[11px] text-slate-600">
              Data persisted in browser storage
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

