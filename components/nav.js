import Link from 'next/link';
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

import { ReactLenis, useLenis } from "lenis/dist/lenis-react";

const links = [
  { label: "home", href: "/" },
  { label: "about us", href: "#about" },
  { label: "how it works", href: "#how-it-works" },
  { label: 'volunteer', href: '/volunteer' },
];

export default function Nav() {
  const lenis = useLenis();
  return (
    <nav className="flex items-center justify-between w-full px-8 py-4">
      <div className="text-lg font-bold absolute left-8">
        <Link href="/">8</Link>
      </div>

      <ul className="flex items-center text-sm mx-auto">
        {links.map(({ href, label }, index) => (
          <li key={href} className="flex items-center">
            <Link
              onClick={() => {
                lenis?.scrollTo(href)
              }}
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
