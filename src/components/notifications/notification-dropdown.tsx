"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetchUserNotifications, updateUserNotifications } from "@/lib/api"

interface Notification {
  id: string
  message: string
  created_at: string
  is_read: boolean
}

interface NotificationDropdownProps {
  unreadCount?: number
}

export default function NotificationDropdown({ unreadCount: initialUnreadCount }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [localUnreadCount, setLocalUnreadCount] = useState(initialUnreadCount || 0)
  const [isFirstTime, setIsFirstTime] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Extract user ID from JWT token
  useEffect(() => {
    const extractUserIdFromToken = () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return null

        // JWT tokens are in the format: header.payload.signature
        // We need to decode the payload (second part)
        const payload = token.split(".")[1]
        if (!payload) return null

        // Decode the base64 payload
        const decodedPayload = JSON.parse(atob(payload))

        // Extract access_id from the payload
        return decodedPayload.access_id?.toString() || null
      } catch (error) {
        console.error("Error extracting user ID from token:", error)
        return null
      }
    }

    const extractedUserId = extractUserIdFromToken()
    console.log("Extracted userId from token:", extractedUserId)
    setUserId(extractedUserId)
  }, [])

  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      const data = await fetchUserNotifications();
      if (Array.isArray(data)) {
        setNotifications(data)

        // Count unread notifications
        const unreadCount = data.filter((n: Notification) => !n.is_read).length
        setLocalUnreadCount(unreadCount)
      } else {
        console.error("Unexpected data format:", data)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    console.log("userId:", userId)
    if (userId) {
      fetchNotifications()
    }
  }, [userId, fetchNotifications])

  // Update notifications when dropdown is opened for the first time
  useEffect(() => {
    const updateNotificationsOnFirstOpen = async () => {
      // Only update notifications if the dropdown is opened for the first time
      // and the userId is available
      if (isOpen && isFirstTime && userId) {
        try {
          const result = await updateUserNotifications(userId)
          if (result.success) {
            setIsFirstTime(false)
            // Refresh notifications after marking them as read
            fetchNotifications()
          }
        } catch (error) {
          console.error("Error updating notifications:", error)
        }
      }
    }

    updateNotificationsOnFirstOpen()
  }, [isOpen, isFirstTime, userId, fetchNotifications])

  const handleNotificationClick = async (notification: Notification) => {
    // Mark notification as read in UI immediately
    const updatedNotifications = notifications.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))

    setNotifications(updatedNotifications)

    // Update unread count
    const newUnreadCount = updatedNotifications.filter((n) => !n.is_read).length
    setLocalUnreadCount(newUnreadCount)

    // Extract complaint number for search
    const complaintNumber = extractComplaintNumber(notification.message)

    if (complaintNumber) {
      // Close dropdown
      setIsOpen(false)

      // Trigger search in the complaints table
      // This is a placeholder - you'll need to implement the actual search mechanism
      // For example, you could use a global state or context to communicate with the table component
      const searchEvent = new CustomEvent("searchComplaint", {
        detail: { ticketNumber: complaintNumber },
      })
      window.dispatchEvent(searchEvent)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!userId) return

    try {
      const result = await updateUserNotifications(userId)
      if (result.success) {
        // Update local state to mark all as read
        const updatedNotifications = notifications.map((n) => ({ ...n, is_read: true }))
        setNotifications(updatedNotifications)
        setLocalUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const extractComplaintNumber = (message: string): string | null => {
    const regex = /#([A-Z0-9]+-\d+)/
    const match = message.match(regex)
    return match ? match[1] : null
  }

  const formatNotificationTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {localUnreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {localUnreadCount > 9 ? "9+" : localUnreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-normal">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-sm">Notifications</h4>
            {localUnreadCount > 0 && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{localUnreadCount} new</span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">No notifications to display</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`flex flex-col items-start p-3 border-b cursor-pointer hover:bg-gray-50 ${
                  !notification.is_read ? "bg-blue-50" : ""
                }`}
              >
                <div className="w-full">
                  <div className="flex justify-between items-start w-full">
                    <div className="font-medium text-sm">{notification.message}</div>
                    {!notification.is_read && (
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-1 ml-2 flex-shrink-0"></div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{formatNotificationTime(notification.created_at)}</div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-center">
              <Button variant="ghost" size="sm" className="text-xs w-full text-primary" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

