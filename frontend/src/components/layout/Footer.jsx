import { Link } from 'react-router-dom';
import { Car } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t bg-white dark:bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              <Car className="h-5 w-5" />
            </span>
            Rent<span className="-ml-2 text-brand-600">Wheels</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            The modern marketplace to rent cars, bikes, vans & more — from verified local owners.
          </p>
        </div>
        <FooterCol title="Explore" links={[['Browse', '/vehicles'], ['Trending', '/vehicles?sort=trending'], ['Compare', '/compare']]} />
        <FooterCol title="Account" links={[['Sign in', '/auth'], ['My bookings', '/dashboard'], ['Wishlist', '/wishlist']]} />
        <FooterCol title="Owners" links={[['List your vehicle', '/auth'], ['Owner dashboard', '/owner']]} />
      </div>
      <div className="border-t py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} RentWheels. Built with the MERN stack.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2 text-sm text-slate-500">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="hover:text-brand-600">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
