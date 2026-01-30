"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  // Don't show navbar on login/signup pages
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/saving", label: "Saving" },
    { href: "/ledger", label: "Ledger" },
    { href: "/stats", label: "Stats" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/expense.png"
              alt="Expense Tracker"
              width={250}
              height={100}
              className="h-12 w-auto"
              priority
            />
          </Link>

          {user && (
            <div className="flex items-center space-x-1 md:space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              <div className="hidden md:flex items-center ml-4 pl-4 border-l border-gray-200">
                <span className="text-sm text-gray-600 mr-3">{user.name}</span>
                <button
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Logout
                </button>
              </div>

              {/* Mobile logout */}
              <button
                onClick={logout}
                className="md:hidden px-2 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg"
              >
                Logout
              </button>
            </div>
          )}

          {!user && !loading && (
            <div className="flex space-x-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
