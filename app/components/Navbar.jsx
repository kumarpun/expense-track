"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/saving", label: "Saving" },
    { href: "/stats", label: "Stats" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <Image
              src="/expense.png"
              alt="Expense Tracker"
              width={150}
              height={50}
              className="h-12 w-auto"
              priority
            />
          </Link>
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
