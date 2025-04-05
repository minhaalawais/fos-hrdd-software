"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import NotificationDropdown from "@/components/notifications/notification-dropdown"
import LoadingScreen from "@/components/ui/loading-screen"
import { logoutUser } from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Menu, Settings, User } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-layout-dashboard"
      >
        <rect width="22" height="16" x="1" y="3" rx="2" />
        <line x1="1" x2="1" y1="9" y2="15" />
        <line x1="23" x2="23" y1="9" y2="15" />
        <line x1="11" x2="11" y1="3" y2="21" />
      </svg>
    ),
  },
  {
    name: "Complaints",
    href: "/complaints",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-message-square"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    name: "Users",
    href: "/users",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-users"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <path d="M20 8v5a3 3 0 0 0-3 3H7" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [officeName, setOfficeName] = useState("Demo Office")
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/")
      return
    }

    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    // Fetch office name and other data
    // This would be replaced with actual API calls
    fetchDashboardData()

    return () => clearTimeout(timer)
  }, [router])

  const fetchDashboardData = async () => {
    // In a real app, this would be an API call
    // For now, we'll just simulate it
    setOfficeName("Demo Office")
    setUnreadCount(3)
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
      // Still redirect to login page even if logout API fails
      router.push("/")
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center">
          {/* Left Section - Menu and Logo */}
          <div className="flex items-center gap-2 w-1/3">
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <div className="flex flex-col h-full">
                  <div className="py-4 border-b">
                    <div className="flex items-center gap-2 px-2">
                      <Image
                        src="/fos_logo.png?height=40&width=40"
                        alt="FOS Logo"
                        width={40}
                        height={40}
                        className="rounded-md"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">FOS-HRDD</h3>
                        <p className="text-xs text-gray-500">Grievance Management</p>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 py-4">
                    <ul className="space-y-2 px-2">
                      {navItems.map((item) => (
                        <li key={item.name}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 font-normal"
                            onClick={() => router.push(item.href)}
                          >
                            {item.icon}
                            {item.name}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="border-t py-4 px-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 font-normal"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Image
              src="/horizontal_logo.png?height=80&width=80"
              alt="FOS Logo"
              width={140}
              height={140}
              className="rounded-md"
            />
            <div className="md:hidden">
              <h1 className="font-bold text-lg">FOS-HRDD</h1>
            </div>
          </div>

          {/* Center Section - Office Name */}
          <div className="flex-1 flex justify-center items-center">
            <h1 className="font-bold text-xl hidden md:flex items-center gap-2">
              <span className="bg-primary text-white px-2 py-1 rounded text-sm">{officeName}</span>
              <span className="text-gray-700">Grievance Management Portal</span>
            </h1>
          </div>

          {/* Right Section - Notifications and User */}
          <div className="flex items-center gap-2 justify-end w-1/3">
            <NotificationDropdown unreadCount={unreadCount} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src="/fos_logo.png?height=40&width=40" alt="User" />
                    <AvatarFallback>IO</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-red-500" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}

