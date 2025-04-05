"use client"

import { useState, useRef, useEffect } from "react"
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import { Bar } from "react-chartjs-2"
import type { Complaint } from "@/types/complaint"

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface BarChartProps {
  complaints: Complaint[]
  statusFilter: string
  onCategoryFilterChange: (category: string, status: string) => void
}

export default function BarChart({ complaints, statusFilter, onCategoryFilterChange }: BarChartProps) {
  const [lastClickedElement, setLastClickedElement] = useState<{ datasetIndex: number; index: number } | null>(null)
  const chartRef = useRef<Chart | null>(null)
  const [chartHeight, setChartHeight] = useState(300)

  useEffect(() => {
    const updateChartHeight = () => {
      const width = window.innerWidth
      if (width < 768) {
        setChartHeight(220)
      } else {
        setChartHeight(300)
      }
    }

    updateChartHeight()
    window.addEventListener("resize", updateChartHeight)
    return () => window.removeEventListener("resize", updateChartHeight)
  }, [])

  const categories = [
    "Workplace Health, Safety and Environment",
    "Freedom of Association",
    "Child Labor",
    "Wages & Benefits",
    "Working Hours",
    "Forced Labor",
    "Discrimination",
    "Unfair Employment",
    "Ethical Business",
    "Harassment",
    "Discipline",
    "Feedback",
  ]

  const truncatedCategories = categories.map((category) => {
    return category.length > 15 ? category.substring(0, 15) + "..." : category
  })

  const calculateCategoryCounts = (status: string) => {
    const counts: Record<string, number> = {}

    categories.forEach((category) => {
      counts[category] = 0
    })

    complaints.forEach((complaint) => {
      if (categories.includes(complaint.complaint_categories)) {
        if (status === "" || complaint.status === status) {
          counts[complaint.complaint_categories]++
        }
      }
    })

    return counts
  }

  const prepareChartData = () => {
    const statuses = ["Unprocessed", "In Process", "Submitted", "Bounced"]
    let datasets = []

    if (statusFilter === "") {
      datasets = statuses.map((statusName, index) => {
        const counts = calculateCategoryCounts(statusName)
        return {
          label: statusName,
          data: categories.map((category) => counts[category] || 0),
          backgroundColor: ["#206E71", "#2D9480", "#60BA81", "#F5A83C"][index],
          barPercentage: 0.9,
          categoryPercentage: 0.7,
          borderRadius: 4,
        }
      })
    } else {
      const statusIndex = statuses.indexOf(statusFilter)
      if (statusIndex !== -1) {
        const counts = calculateCategoryCounts(statusFilter)
        datasets = [
          {
            label: statusFilter,
            data: categories.map((category) => counts[category] || 0),
            backgroundColor: ["#206E71", "#2D9480", "#60BA81", "#F5A83C"][statusIndex],
            barPercentage: 0.9,
            categoryPercentage: 0.7,
            borderRadius: 4,
          },
        ]
      }
    }

    return {
      labels: truncatedCategories,
      datasets,
    }
  }

  const chartData = prepareChartData()

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        ticks: {
          maxRotation: 70,
          minRotation: 70,
          autoSkip: false,
          font: {
            size: 10,
            family: "'Inter', sans-serif",
          },
          color: "#666",
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: "No. of Complaints",
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          color: "#666",
        },
        beginAtZero: true,
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: "#666",
          padding: 8,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        border: {
          dash: [4, 4],
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11,
            family: "'Inter', sans-serif",
            weight: "500",
          },
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 13,
          family: "'Inter', sans-serif",
        },
        bodyFont: {
          size: 12,
          family: "'Inter', sans-serif",
        },
      },
    },
    onClick: (event: any, elements: any) => {
      if (elements.length > 0) {
        const clickedElement = elements[0]
        const datasetIndex = clickedElement.datasetIndex
        const index = clickedElement.index
        const category = categories[index]
        const status = chartData.datasets[datasetIndex].label

        if (
          lastClickedElement &&
          lastClickedElement.datasetIndex === datasetIndex &&
          lastClickedElement.index === index
        ) {
          // If the same element is clicked twice, reset the filter
          onCategoryFilterChange("", "")
          setLastClickedElement(null)
        } else {
          // Apply the filter for the newly clicked element
          onCategoryFilterChange(category, status)
          setLastClickedElement(clickedElement)
        }
      } else {
        // Clicked outside any bar, reset the filter
        onCategoryFilterChange("", "")
        setLastClickedElement(null)
      }
    },
  }

  return (
    <div style={{ height: chartHeight }} className="relative">
      <Bar data={chartData} options={chartOptions as any} ref={chartRef} />
    </div>
  )
}

