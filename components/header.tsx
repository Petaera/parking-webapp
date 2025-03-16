"use client"

import type React from "react"

import { usePathname } from "next/navigation"

interface HeaderProps {
  title: string
  children?: React.ReactNode
}

export default function Header({ title, children }: HeaderProps) {
  const pathname = usePathname()

  // Extract page title from pathname
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard"
    if (pathname === "/parking/generate-slip") return "Generate Slip"
    if (pathname === "/parking/active-vehicles") return "Active Vehicles"
    if (pathname === "/parking/exit-payment") return "Exit & Payment"
    if (pathname === "/reports") return "Reports & Analytics"
    if (pathname === "/lots") return "Lot Management"
    if (pathname === "/settings") return "Settings"
    return title
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white px-4 md:px-6">
      {/* Add left padding on mobile to avoid overlapping with the menu button */}
      <h1 className="text-lg font-semibold pl-10 md:pl-0 md:text-xl">{getPageTitle()}</h1>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  )
}

