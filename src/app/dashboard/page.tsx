import type { Metadata } from "next"
import DashboardLayout from "@/components/layouts/dashboard-layout"
import DashboardContent from "@/components/dashboard/dashboard-content"

export const metadata: Metadata = {
  title: "Dashboard | FOS-HRDD Software",
  description: "Grievance Management Portal Dashboard",
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  )
}

