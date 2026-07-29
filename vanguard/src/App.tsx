import { useState } from 'react';
import { ArrowUpRight, Award, Crown, X } from 'lucide-react';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260606_154941_df1a96e1-a06f-450c-bd02-d863414cc1a0.mp4';

const NAV_LINKS = ['Projects', 'Studio', 'Offerings', 'Inquire'];

const STATS = [
  { value: '250+', label: 'Brands Transformed' },
  { value: '95%', label: 'Client Retention' },
  { value: '10+', label: 'Years in the Game' },
];

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Shared stagger for the mobile menu: links occupy indexes 0..3,
  // the trailing CTA continues the sequence at index 4.
  const stagger = (i: number) => ({
    transitionDelay: `${i * 80 + 100}ms`,
    opacity: menuOpen ? 1 : 0,
    transform: menuOpen ? 'translateY(0)' : 'translateY(20px)',
  });

  return (
    <div className="relative h-viewport w-full overflow-hidden bg-black">
      {/* ── Background video ── */}
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src={VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Legibility scrim. Delete this div for the raw video. */}
      <div
        className="absolute inset-0 z-10 bg-black/40 bg-gradient-to-r from-black/70 via-black/30 to-transparent"
        aria-hidden="true"
      />

      {/* ── Navbar ── */}
      <header className="absolute inset-x-0 top-0 z-30">
        <nav className="flex items-center justify-between px-6 py-5 sm:px-10 lg:px-16 lg:py-7">
          {/* Brand */}
          <a
            href="#"
            className="font-podium text-2xl font-bold uppercase tracking-wider text-white sm:text-3xl"
          >
            VANGUARD
          </a>

          {/* Center links */}
          <div className="hidden items-center gap-8 md:flex lg:gap-10">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="font-inter text-sm uppercase tracking-widest text-white/80 transition-colors duration-300 hover:text-white"
              >
                {link}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <a
            href="#"
            className="group hidden items-center gap-2 border border-white/30 px-6 py-3 font-inter text-xs uppercase tracking-widest text-white transition-all duration-300 hover:border-white/60 hover:bg-white/10 md:flex"
          >
            Get in Touch
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-end space-y-1.5 md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <div className="h-0.5 w-6 bg-white" />
            <div className="h-0.5 w-6 bg-white" />
            <div className="h-0.5 w-4 bg-white" />
          </button>
        </nav>
      </header>

      {/* ── Mobile menu overlay ── */}
      <div
        className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-sm transition-all duration-500 md:hidden ${
          menuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header row mirrors the navbar */}
          <div className="flex items-center justify-between px-6 py-5 sm:px-10">
            <span className="font-podium text-2xl font-bold uppercase tracking-wider text-white sm:text-3xl">
              VANGUARD
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="text-white transition-opacity duration-300 hover:opacity-70"
              aria-label="Close menu"
            >
              <X className="h-7 w-7" />
            </button>
          </div>

          {/* Centered links */}
          <div className="flex flex-1 flex-col justify-center gap-6 px-6 sm:px-10">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link}
                href="#"
                onClick={() => setMenuOpen(false)}
                className="font-podium text-4xl uppercase text-white transition-all duration-500 sm:text-5xl"
                style={stagger(i)}
              >
                {link}
              </a>
            ))}

            <a
              href="#"
              onClick={() => setMenuOpen(false)}
              className="mt-6 inline-flex w-fit items-center gap-2 border border-white/30 px-6 py-3 font-inter text-xs uppercase tracking-widest text-white transition-all duration-500 hover:border-white/60 hover:bg-white/10"
              style={stagger(NAV_LINKS.length)}
            >
              Get in Touch
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Hero content ── */}
      <main className="relative z-20 flex h-full flex-col justify-center px-6 sm:px-10 lg:px-16">
        {/* 1. Tagline */}
        <div className="animate-fade-up mb-6 flex items-center gap-3 lg:mb-8">
          <Crown className="h-4 w-4 text-white/70" />
          <span className="font-inter text-xs uppercase tracking-[0.3em] text-white/70 sm:text-sm">
            World-Class Digital Collective
          </span>
        </div>

        {/* 2. Main heading */}
        <h1 className="animate-fade-up-delay-1 font-podium uppercase leading-[0.92] tracking-tight text-white">
          <span className="block text-[clamp(2.8rem,8vw,7rem)]">Design.</span>
          <span className="block text-[clamp(2.8rem,8vw,7rem)]">Disrupt.</span>
          <span className="block text-[clamp(2.8rem,8vw,7rem)]">Conquer.</span>
        </h1>

        {/* 3. Subtext */}
        <p className="animate-fade-up-delay-2 mt-6 max-w-md font-inter text-sm leading-relaxed text-white/70 sm:text-base lg:mt-8">
          We build fierce brand identities
          <br />
          that don&apos;t just turn heads &ndash;{' '}
          <span className="font-bold text-white">they lead.</span>
        </p>

        {/* 4. CTA row */}
        <div className="animate-fade-up-delay-3 mt-8 flex flex-wrap items-center gap-4 sm:gap-6 lg:mt-10">
          <a
            href="#"
            className="group inline-flex items-center gap-2 bg-black px-5 py-3 font-inter text-[11px] uppercase tracking-widest text-white transition-colors duration-300 hover:bg-neutral-900 sm:px-7 sm:py-4 sm:text-xs"
          >
            See Our Work
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>

          <div className="hidden items-center gap-3 sm:flex">
            <Award className="h-8 w-8 text-white/50" />
            <div className="font-inter text-xs uppercase tracking-wider text-white/60">
              <div>Top-Rated</div>
              <div>Brand Studio</div>
            </div>
          </div>
        </div>

        {/* 5. Stats row */}
        <div className="animate-fade-up-delay-4 mt-8 flex flex-wrap gap-6 sm:mt-10 sm:gap-12 lg:mt-14 lg:gap-16">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="font-inter text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {stat.value}
              </div>
              <div className="mt-1 font-inter text-[9px] uppercase tracking-widest text-white/50 sm:text-xs">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
