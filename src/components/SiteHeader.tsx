import { useState } from 'react'
import { CalendarDays, Globe2, Menu, Sparkles, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const links = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Rooms & Suites', href: '/rooms' },
  { label: 'Experiences', href: '/experiences' },
  { label: 'Contact', href: '/contact' },
  { label: 'My Booking', href: '/bookings' },
]

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  return (
    <header className="relative z-50 bg-forest-deep text-white">
      <div className="mx-auto flex h-[62px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 text-[13px] font-medium text-white">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-champagne" />
          <span className="font-display text-[15px]">OPZY LUXURY HOTEL</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
          {links.map((link, index) => (
            <Link
              key={link.href}
              to={link.href}
              className={`border-b py-1 text-[11px] transition-colors hover:text-champagne ${((index === 0 && pathname === '/') || (index === 1 && pathname === '/about') || (index === 2 && pathname === '/rooms') || (index === 3 && pathname === '/experiences') || (index === 4 && pathname === '/contact') || (index === 5 && pathname === '/bookings')) ? 'border-champagne text-champagne' : 'border-transparent text-white/80'}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <Link to="/hotel/login" className="text-[10px] font-semibold text-white/80 transition-colors hover:text-champagne">
            HOTEL PORTAL
          </Link>
          <button type="button" aria-label="Language: English" className="text-white/80 transition-colors hover:text-champagne">
            <Globe2 aria-hidden="true" className="h-4 w-4" />
          </button>
          <Link to="/book" aria-label="Book your stay" className="text-white/80 transition-colors hover:text-champagne">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link to="/book" className="bg-champagne px-5 py-2.5 text-[10px] font-semibold text-forest-deep transition-colors hover:bg-white">
            BOOK YOUR STAY
          </Link>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
          className="grid h-10 w-10 place-items-center text-white lg:hidden"
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {menuOpen && (
        <nav aria-label="Mobile navigation" className="absolute inset-x-0 top-full border-t border-white/10 bg-forest-deep px-5 pb-5 pt-2 shadow-xl lg:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMenuOpen(false)}
              className="block border-b border-white/10 py-3 text-sm text-white/85 hover:text-champagne"
            >
              {link.label}
            </Link>
          ))}
          <Link to="/hotel/login" onClick={() => setMenuOpen(false)} className="block border-b border-white/10 py-3 text-sm font-medium text-champagne hover:text-white">
            Hotel Portal
          </Link>
          <Link to="/book" onClick={() => setMenuOpen(false)} className="mt-4 flex items-center justify-center gap-2 bg-champagne px-4 py-3 text-xs font-semibold text-forest-deep">
            <CalendarDays aria-hidden="true" className="h-4 w-4" />
            BOOK YOUR STAY
          </Link>
        </nav>
      )}
    </header>
  )
}