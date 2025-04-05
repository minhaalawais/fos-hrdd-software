"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react"
import DoughnutChart from "@/components/charts/doughnut-chart"
import BarChart from "@/components/charts/bar-chart"
import ComplaintsTable from "@/components/complaints/complaints-table"
import ComplaintModal from "@/components/complaints/complaint-modal"
import type { Complaint } from "@/types/complaint"
import { fetchComplaints } from "@/lib/api"
import { submitComplaintForm } from "@/lib/api"
import { Button } from "@/components/ui/button"

export default function DashboardContent() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadComplaints()
  }, [])

  const loadComplaints = async () => {
    setIsLoading(true)
    try {
      const data = await fetchComplaints()
      setComplaints(data)
    } catch (error) {
      console.error("Error loading complaints:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplaintClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedComplaint(null)
  }

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status)
  }

  const handleCategoryFilterChange = (category: string, status = "") => {
    setCategoryFilter(category)
    if (status) {
      setStatusFilter(status)
    }
  }

  const handleComplaintUpdate = async (updatedComplaint: Complaint) => {
    try {
      // Create FormData for the update
      const formData = new FormData()
      formData.append("ticket", updatedComplaint.ticket_number)

      // Add other fields as needed based on what your API expects
      if (updatedComplaint.rca !== undefined) formData.append("rca", updatedComplaint.rca || "")
      if (updatedComplaint.capa !== undefined) formData.append("capa", updatedComplaint.capa || "")
      if (updatedComplaint.rca1 !== undefined) formData.append("rca1", updatedComplaint.rca1 || "")
      if (updatedComplaint.capa1 !== undefined) formData.append("capa1", updatedComplaint.capa1 || "")
      if (updatedComplaint.rca2 !== undefined) formData.append("rca2", updatedComplaint.rca2 || "")
      if (updatedComplaint.capa2 !== undefined) formData.append("capa2", updatedComplaint.capa2 || "")

      // Submit the form
      const response = await submitComplaintForm(formData)

      if (response.success) {
        // Refresh the complaints data
        await loadComplaints()
        setIsModalOpen(false)
        setSelectedComplaint(null)
      } else {
        console.error("Error updating complaint:", response.message)
      }
    } catch (error) {
      console.error("Error updating complaint:", error)
    }
  }

  // Calculate summary statistics
  const getStatusCount = (status: string) => {
    return complaints.filter((c) => {
      if (status === "Bounced") {
        return c.status === "Bounced" || c.status === "Bounced1"
      }
      return c.status === status
    }).length
  }

  const totalComplaints = complaints.length
  const unprocessedCount = getStatusCount("Unprocessed")
  const inProcessCount = getStatusCount("In Process")
  const submittedCount = getStatusCount("Submitted")
  const bouncedCount = getStatusCount("Bounced")

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Complaints</p>
                <h3 className="text-2xl font-bold mt-1">{totalComplaints}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unprocessed</p>
                <h3 className="text-2xl font-bold mt-1">{unprocessedCount}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Process</p>
                <h3 className="text-2xl font-bold mt-1">{inProcessCount}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                <h3 className="text-2xl font-bold mt-1">{submittedCount}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Complaints By Status</CardTitle>
            <CardDescription>Distribution of complaints by their current status</CardDescription>
          </CardHeader>
          <CardContent>
            <DoughnutChart complaints={complaints} onStatusFilterChange={handleStatusFilterChange} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Complaints By Categories</CardTitle>
            <CardDescription>Distribution of complaints across different categories</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              complaints={complaints}
              statusFilter={statusFilter}
              onCategoryFilterChange={handleCategoryFilterChange}
            />
          </CardContent>
        </Card>
      </div>

      {/* Active Filters */}
      {(statusFilter || categoryFilter) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-500">Active Filters:</span>
          {statusFilter && (
            <Badge variant="outline" className="flex items-center gap-1">
              Status: {statusFilter}
              <button className="ml-1 text-gray-500 hover:text-gray-700" onClick={() => setStatusFilter("")}>
                ×
              </button>
            </Badge>
          )}
          {categoryFilter && (
            <Badge variant="outline" className="flex items-center gap-1">
              Category: {categoryFilter.length > 20 ? categoryFilter.substring(0, 20) + "..." : categoryFilter}
              <button className="ml-1 text-gray-500 hover:text-gray-700" onClick={() => setCategoryFilter("")}>
                ×
              </button>
            </Badge>
          )}
          {(statusFilter || categoryFilter) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => {
                setStatusFilter("")
                setCategoryFilter("")
              }}
            >
              Clear All
            </Button>
          )}
        </div>
      )}

      {/* Complaints Table */}
      <Card>
        <CardHeader>
          <CardTitle>Complaints List</CardTitle>
          <CardDescription>
            Manage and process all grievance complaints
            {statusFilter && ` - Filtered by ${statusFilter}`}
            {categoryFilter && ` - Category: ${categoryFilter}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComplaintsTable
            complaints={complaints}
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
            onComplaintClick={handleComplaintClick}
          />
        </CardContent>
      </Card>

      {selectedComplaint && (
        <ComplaintModal
          isOpen={isModalOpen}
          complaint={selectedComplaint}
          onClose={handleModalClose}
          onUpdate={handleComplaintUpdate}
        />
      )}
    </div>
  )
}

