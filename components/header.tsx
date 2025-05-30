"use client"

import type React from "react"
import { usePathname, useRouter } from "next/navigation"


interface HeaderProps {
  title: string
  children?: React.ReactNode
}

export default function Header({ title, children }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()

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

  const showBackButton = pathname !== "/dashboard"

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center gap-4">
        {showBackButton && (
         <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            <span className="pb-1 font-black text-lg">←</span>
          </button>
        )}
        <h1 className="text-lg font-semibold md:text-xl ml-14 md:ml-0">{getPageTitle()}</h1>
        
      </div>
      <div className="flex items-center gap-2">{children}</div>
      {showBackButton &&  (
          <button
          onClick={() => router.push('/dashboard')}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-200 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
          <span className="font-black text-lg">⌂</span>
          </button>)}
    </header>
  )
}

