import Link from 'next/link';

const links = [
  { label: 'home', href: '/' },
  { label: 'about us', href: '/about' },
  { label: 'how it works', href: '/how-it-works' },
  { label: 'volunteer', href: '/volunteer' },
  { label: 'sign in', href: '/sign-in' },
];

export default function Nav() {
  return (
    <nav className="flex items-center justify-between w-full px-8 py-4">
      {/* Left-Aligned Logo */}
      <div className="text-lg font-bold absolute left-8">
        <Link href="/">8</Link>
      </div>

      {/* Centered Navigation Links */}
      <ul className="flex items-center text-sm mx-auto">
        {links.map(({ href, label }, index) => (
          <li key={href} className="flex items-center">
            <Link
              href={href}
              className="hover:underline hover:text-gray-700 dark:hover:text-gray-300 transition"
            >
              {label}
            </Link>
            {/* Add separator except for the last link */}
            {index < links.length - 1 && (
              <span className="inline-block px-2">|</span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
