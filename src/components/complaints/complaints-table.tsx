"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, AlertCircle } from "lucide-react"
import type { Complaint } from "@/types/complaint"
import { formatDate } from "@/lib/utils"

interface ComplaintsTableProps {
  complaints: Complaint[]
  statusFilter: string
  categoryFilter: string
  onComplaintClick: (complaint: Complaint) => void
}

export default function ComplaintsTable({
  complaints,
  statusFilter,
  categoryFilter,
  onComplaintClick,
}: ComplaintsTableProps) {
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(0)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  useEffect(() => {
    let filtered = [...complaints]

    // Apply status filter
    if (statusFilter) {
      if (statusFilter === "Bounced") {
        filtered = filtered.filter((c) => c.status === "Bounced" || c.status === "Bounced1")
      } else {
        filtered = filtered.filter((c) => c.status === statusFilter)
      }
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((c) => c.complaint_categories === categoryFilter)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          (c.ticket_number?.toLowerCase() || "").includes(term) ||
          (c.employee_name?.toLowerCase() || "").includes(term) ||
          (c.complaint_categories?.toLowerCase() || "").includes(term) ||
          (c.additional_comments?.toLowerCase() || "").includes(term) ||
          (c.mobile_number?.toLowerCase() || "").includes(term)
      )
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.date_entry).getTime()
      const dateB = new Date(b.date_entry).getTime()
      return dateB - dateA
    })

    setFilteredComplaints(filtered)
    setCurrentPage(0) // Reset to first page when filters change
  }, [complaints, statusFilter, categoryFilter, searchTerm])

  const getStatusBadgeVariant = (status: string) => {
    const statusLower = status.toLowerCase()

    switch (statusLower) {
      case "unprocessed":
        return "bg-[#206E71] text-white"
      case "in process":
        return "bg-[#2D9480] text-white"
      case "submitted":
        return "bg-[#60BA81] text-white"
      case "bounced":
      case "bounced1":
        return "bg-[#F5A83C] text-white"
      case "completed":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number.parseInt(value))
    setCurrentPage(0) // Reset to first page when page size changes
  }

  const pageCount = Math.ceil(filteredComplaints.length / pageSize)
  const displayedComplaints = filteredComplaints.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Input
            placeholder="Search complaints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-9 ${isSearchFocused ? "ring-2 ring-primary/20" : ""}`}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Show</span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-20">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-500">entries</span>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12 font-semibold">Sr.</TableHead>
                <TableHead className="font-semibold">Ticket Number</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Complaint Date</TableHead>
                <TableHead className="font-semibold">Mobile Number</TableHead>
                <TableHead className="font-semibold">Complaint Categories</TableHead>
                <TableHead className="font-semibold">Additional Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedComplaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="h-8 w-8 text-gray-300" />
                      <p>No complaints found</p>
                      {searchTerm && <p className="text-sm text-gray-400">Try adjusting your search or filters</p>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayedComplaints.map((complaint, index) => (
                  <TableRow
                    key={complaint.ticket_number}
                    className="h-20 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onComplaintClick(complaint)}
                  >
                    <TableCell className="font-medium">{currentPage * pageSize + index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {complaint.is_urgent && <AlertCircle className="h-4 w-4 text-red-500" />}
                        <span className={complaint.is_urgent ? "text-red-600 font-medium" : ""}>
                          {complaint.ticket_number}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{complaint.employee_name}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusBadgeVariant(complaint.status)}`}>{complaint.status}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(complaint.date_entry)}</TableCell>
                    <TableCell>{complaint.mobile_number}</TableCell>
                    <TableCell>
                      <span className="inline-block max-w-[200px] truncate">{complaint.complaint_categories}</span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      <div
                        className="max-h-10 overflow-hidden text-ellipsis"
                        dangerouslySetInnerHTML={{ __html: complaint.additional_comments || "" }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {pageCount > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500 order-2 sm:order-1">
            Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, filteredComplaints.length)}{" "}
            of {filteredComplaints.length} entries
          </div>
          <div className="flex gap-1 order-1 sm:order-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(0)}
              disabled={currentPage === 0}
              className="h-8 w-8"
            >
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">First page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                // Show current page and surrounding pages
                let pageToShow: number
                if (pageCount <= 5) {
                  pageToShow = i
                } else if (currentPage < 2) {
                  pageToShow = i
                } else if (currentPage > pageCount - 3) {
                  pageToShow = pageCount - 5 + i
                } else {
                  pageToShow = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageToShow}
                    variant={currentPage === pageToShow ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(pageToShow)}
                    className="h-8 w-8"
                  >
                    {pageToShow + 1}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pageCount - 1}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(pageCount - 1)}
              disabled={currentPage === pageCount - 1}
              className="h-8 w-8"
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Last page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

