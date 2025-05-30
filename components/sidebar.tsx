"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Car, BarChart3, Map, Settings, LogOut, ChevronDown, ChevronRight, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useFirebase } from "@/contexts/firebase-context"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  submenu?: { title: string; href: string, roles?:string[] }[]
  roles: string[]
}

export default function Sidebar() {
  const pathname = usePathname()
  const { userData, signOut } = useFirebase()
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ["owner", "manager"],
    },
    {
      title: "Parking Operations",
      href: "#",
      icon: <Car className="h-5 w-5" />,
      roles: ["owner", "manager"],
      submenu: [
        { title: "Entry", href: "/parking/generate-slip" },
        { title: "Exit", href: "/parking/exit-payment" },
        { title: "Active Vehicles", href: "/parking/active-vehicles" },
      ],
    },
    {
      title: "Reports & Analytics",
      href: "/reports",
      icon: <BarChart3 className="h-5 w-5" />,
      roles: ["owner"],
    },
    {
      title: "Lot Management",
      href: "/lots",
      icon: <Map className="h-5 w-5" />,
      roles: ["owner"],
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
      roles: ["owner", "manager"],
    },
  ]

  const toggleSubmenu = (title: string) => {
    if (openSubmenu === title) {
      setOpenSubmenu(null)
    } else {
      setOpenSubmenu(title)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Peta Parking</h1>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-2">
          {navItems
            .filter((item) => item.roles.includes(userData?.role || ""))
            .map((item) => {
              const isActive =
                pathname === item.href || (item.submenu && item.submenu.some((subItem) => pathname === subItem.href))

              if (item.submenu) {
                return (
                  <div key={item.title} className="space-y-1">
                    <Button
                      variant="ghost"
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-sm font-medium",
                        isActive
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      )}
                      onClick={() => toggleSubmenu(item.title)}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        <span className="ml-3">{item.title}</span>
                      </div>
                      {openSubmenu === item.title ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {openSubmenu === item.title && (
                      <div className="ml-6 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.title}
                            href={subItem.href}
                            className={cn(
                              "block rounded-md px-3 py-2 text-sm font-medium",
                              pathname === subItem.href
                                ? "bg-slate-100 text-slate-900"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                            )}
                            onClick={() => setIsMobileOpen(false)}
                          >
                            {subItem.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium",
                    isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                  onClick={() => setIsMobileOpen(false)}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Link>
              )
            })}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="mb-2 flex items-center">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
            <span className="text-sm font-medium text-slate-700">
              {userData?.displayName?.charAt(0).toUpperCase() || userData?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{userData?.displayName || userData?.email}</p>
            <p className="text-xs text-slate-500 capitalize">{userData?.role}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start text-slate-600" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )

  if (!userData) return null

  return (
    <>
      {/* Mobile sidebar trigger - fixed position */}
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full bg-white shadow-md"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="p-0 w-[80%] max-w-[300px] border-r">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden h-screen w-64 flex-shrink-0 flex-col border-r bg-white md:flex">
        <SidebarContent />
      </div>
    </>
  )
}

