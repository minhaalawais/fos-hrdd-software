"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import ComplaintTimeline from "@/components/complaints/complaint-timeline"
import ComplaintRouteModal from "@/components/complaints/complaint-route-modal"
import type { Complaint } from "@/types/complaint"

interface ComplaintModalProps {
  isOpen: boolean
  complaint: Complaint
  onClose: () => void
  onUpdate: (complaint: Complaint) => void
}

export default function ComplaintModal({ isOpen, complaint, onClose, onUpdate }: ComplaintModalProps) {
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false)
  const [localComplaint, setLocalComplaint] = useState<Complaint>(complaint)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize editors
  const editorRefs = {
    rca: useRef<any>(null),
    capa: useRef<any>(null),
    rca1: useRef<any>(null),
    capa1: useRef<any>(null),
    rca2: useRef<any>(null),
    capa2: useRef<any>(null),
  }

  useEffect(() => {
    setLocalComplaint(complaint)
  }, [complaint])

  const handleSaveChanges = async () => {
    setIsSubmitting(true)

    try {
      // In a real app, this would be an API call to update the complaint
      // For now, we'll just simulate it
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update the complaint with form data
      const updatedComplaint = {
        ...localComplaint,
        // Add any form data here
      }

      onUpdate(updatedComplaint)
    } catch (error) {
      console.error("Error saving changes:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRouteComplaint = () => {
    setIsRouteModalOpen(true)
  }

  const handleRouteModalClose = () => {
    setIsRouteModalOpen(false)
  }

  const handleRouteSubmit = async (routeData: any) => {
    setIsSubmitting(true)

    try {
      // In a real app, this would be an API call to route the complaint
      // For now, we'll just simulate it
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update the complaint with routing data
      const updatedComplaint = {
        ...localComplaint,
        status: "In Process",
        // Add routing data here
      }

      onUpdate(updatedComplaint)
      setIsRouteModalOpen(false)
    } catch (error) {
      console.error("Error routing complaint:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <div>
                {complaint.ticket_number} | {complaint.date_entry}
              </div>
              <div className="text-right">
                {complaint.company_name} | {complaint.office_name}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {complaint.status === "Unprocessed" ? (
              <div className="text-center py-8">Are you sure, you want to process this complaint?</div>
            ) : (
              <ComplaintTimeline complaint={localComplaint} />
            )}
          </div>

          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>

            {(complaint.status === "In Process" ||
              complaint.status === "Bounced" ||
              complaint.status === "Bounced1") && (
              <Button variant="secondary" onClick={handleRouteComplaint}>
                Route Complaint
              </Button>
            )}

            <Button onClick={handleSaveChanges} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isRouteModalOpen && (
        <ComplaintRouteModal
          complaint={complaint}
          isOpen={isRouteModalOpen}
          onClose={handleRouteModalClose}
          onSubmit={handleRouteSubmit}
        />
      )}
    </>
  )
}

