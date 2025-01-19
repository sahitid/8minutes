import Link from 'next/link';
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

const links = [
  { label: "home", href: "/" },
  { label: "about us", href: "#about" },
  { label: "how it works", href: "#how-it-works" },
  // { label: 'sign in', href: '/sign-in' },
];

export default function Nav() {
  return (
    <nav className="flex items-center justify-between w-full px-8 py-4">
      <div className="text-lg font-bold absolute left-8">
        <Link href="/">8</Link>
      </div>

      <ul className="flex items-center text-sm mx-auto">
        {links.map(({ href, label }, index) => (
          <li key={href} className="flex items-center">
            <Link
              href={href}
              className="hover:underline hover:text-gray-700 dark:hover:text-gray-300 transition"
            >
              {label}
            </Link>

            <span className="inline-block px-2">|</span>

          </li>
        ))}
        <li>
          <SignedOut>
            <SignInButton >sign in</SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </li>

      </ul>
    </nav>
  );
}
