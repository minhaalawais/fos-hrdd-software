"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Complaint } from "@/types/complaint"
import { fetchIOUsers, getComplaintRouteHistory } from "@/lib/api"

interface IOUser {
  id: string
  email: string
  office?: string
}

interface RouteHistoryItem {
  id: string
  method: "email" | "portal"
  recipient: string
  office?: string
  date: string
  message: string
  status: string
}

interface ComplaintRouteModalProps {
  complaint: Complaint
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

export default function ComplaintRouteModal({ complaint, isOpen, onClose, onSubmit }: ComplaintRouteModalProps) {
  const [routeMethod, setRouteMethod] = useState<"email" | "portal">("email")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [ioUser, setIoUser] = useState("")
  const [message, setMessage] = useState("")
  const [ioUsers, setIoUsers] = useState<IOUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [routeHistory, setRouteHistory] = useState<RouteHistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadIOUsers()
      loadRouteHistory()
    }
  }, [isOpen, complaint.ticket_number])

  const loadIOUsers = async () => {
    try {
      const users = await fetchIOUsers()
      setIoUsers(users)
    } catch (error) {
      console.error("Error loading IO users:", error)
    }
  }

  const loadRouteHistory = async () => {
    try {
      const response = await getComplaintRouteHistory(complaint.ticket_number)

      if (response.success && response.history && response.history.length > 0) {
        setRouteHistory(response.history)
        setShowHistory(true)
      } else {
        setShowHistory(false)
      }
    } catch (error) {
      console.error("Error loading route history:", error)
      setShowHistory(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const routeData = {
        complaint_id: complaint.ticket_number,
        method: routeMethod,
        recipient: routeMethod === "email" ? recipientEmail : ioUser,
        message: message,
      }

      onSubmit(routeData)
    } catch (error) {
      console.error("Error routing complaint:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-primary">Route Complaint #{complaint.ticket_number}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Route Method:</label>
              <Select value={routeMethod} onValueChange={(value) => setRouteMethod(value as "email" | "portal")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select route method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Via Email</SelectItem>
                  <SelectItem value="portal">Via IO Portal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {routeMethod === "email" ? (
              <div>
                <label className="block text-sm font-medium mb-1">Recipient Email:</label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">Select IO User:</label>
                <Select value={ioUser} onValueChange={setIoUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select IO user" />
                  </SelectTrigger>
                  <SelectContent>
                    {ioUsers.length === 0 ? (
                      <SelectItem value="" disabled>
                        No IO users available
                      </SelectItem>
                    ) : (
                      ioUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.email} {user.office ? `(${user.office})` : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Message:</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add any additional instructions"
                rows={3}
              />
            </div>
          </div>

          {showHistory && (
            <div className="px-4 pb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Routing History</h4>
              <div className="max-h-48 overflow-y-auto border rounded">
                {routeHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 border-b last:border-b-0 ${
                      item.method === "email" ? "border-l-4 border-l-blue-500" : "border-l-4 border-l-green-500"
                    }`}
                  >
                    <div className="flex justify-between text-sm font-medium">
                      <span>
                        {item.method.toUpperCase()} to {item.recipient}
                        {item.office ? ` (${item.office})` : ""}
                      </span>
                      <span className="text-gray-500">{item.date}</span>
                    </div>
                    {item.message && <div className="text-sm text-gray-600 mt-1">{item.message}</div>}
                    <div className="text-sm text-gray-500 mt-1">Status: {item.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 p-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Routing..." : "Route Complaint"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

