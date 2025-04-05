"use client"

import { useState, useRef, useEffect } from "react"
import { Chart, ArcElement, Tooltip, Legend } from "chart.js"
import { Doughnut } from "react-chartjs-2"
import type { Complaint } from "@/types/complaint"

Chart.register(ArcElement, Tooltip, Legend)

interface DoughnutChartProps {
  complaints: Complaint[]
  onStatusFilterChange: (status: string) => void
}

export default function DoughnutChart({ complaints, onStatusFilterChange }: DoughnutChartProps) {
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null)
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

  // Reset selected slice when complaints data changes
  useEffect(() => {
    setSelectedSlice(null)
  }, [complaints])

  const calculateStatusCounts = () => {
    const counts = {
      Unprocessed: 0,
      "In Process": 0,
      Submitted: 0,
      Bounced: 0,
    }

    complaints.forEach((complaint) => {
      if (complaint.status === "Unprocessed") {
        counts.Unprocessed++
      } else if (complaint.status === "In Process") {
        counts["In Process"]++
      } else if (complaint.status === "Submitted") {
        counts.Submitted++
      } else if (complaint.status === "Bounced" || complaint.status === "Bounced1") {
        counts.Bounced++
      }
    })

    return counts
  }

  const statusCounts = calculateStatusCounts()
  const statuses = Object.keys(statusCounts)
  const counts = Object.values(statusCounts)
  const totalComplaints = counts.reduce((sum, count) => sum + count, 0)

  // Highlight the selected slice with a slightly larger offset
  const getHoverOffset = (index: number) => {
    return selectedSlice === index ? 15 : 10
  }

  const chartData = {
    labels: statuses,
    datasets: [
      {
        data: counts,
        backgroundColor: ["#206E71", "#2D9480", "#60BA81", "#F5A83C"],
        borderWidth: 0,
        borderRadius: 4,
        hoverOffset: counts.map((_, index) => getHoverOffset(index)),
      },
    ],
  }

  const handleChartClick = (event: any, elements: any) => {
    if (elements.length > 0) {
      const index = elements[0].index

      if (selectedSlice === index) {
        // Deselect the slice if it's already selected
        setSelectedSlice(null)
        onStatusFilterChange("")
      } else {
        // Select the new slice
        setSelectedSlice(index)
        onStatusFilterChange(statuses[index])
      }

      // Force chart update
      if (chartRef.current) {
        chartRef.current.update()
      }
    } else {
      // Click outside any slice
      setSelectedSlice(null)
      onStatusFilterChange("")

      // Force chart update
      if (chartRef.current) {
        chartRef.current.update()
      }
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    radius: "90%",
    plugins: {
      legend: {
        position: "bottom" as const,
        align: "center" as const,
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
        onClick: (e: any, legendItem: any, legend: any) => {
          const index = legendItem.index

          if (selectedSlice === index) {
            // Deselect if already selected
            setSelectedSlice(null)
            onStatusFilterChange("")
          } else {
            // Select the new slice
            setSelectedSlice(index)
            onStatusFilterChange(statuses[index])
          }

          // Force chart update
          if (chartRef.current) {
            chartRef.current.update()
          }
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
        callbacks: {
          label: (context: any) => {
            const label = context.label || ""
            const value = context.raw || 0
            const percentage = totalComplaints > 0 ? Math.round((value / totalComplaints) * 100) : 0
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
    },
    onClick: handleChartClick,
  }

  const plugins = [
    {
      id: "centerText",
      beforeDraw: (chart: any) => {
        const width = chart.width
        const height = chart.height
        const ctx = chart.ctx

        // Get the latest data directly from the chart
        const dataset = chart.data.datasets[0]
        const currentCounts = dataset.data
        const currentTotal = currentCounts.reduce((sum: number, count: number) => sum + count, 0)

        ctx.restore()
        ctx.font = "600 16px Inter, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "#333"

        let text
        if (selectedSlice !== null && selectedSlice < statuses.length) {
          const label = statuses[selectedSlice]
          const value = currentCounts[selectedSlice]
          const percentage = currentTotal > 0 ? Math.round((value / currentTotal) * 100) : 0
          text = `${label}\n${value}\n(${percentage}%)`
        } else {
          text = `Total\n${currentTotal}`
        }

        const lines = text.split("\n")

        // Draw title
        ctx.font = "600 14px Inter, sans-serif"
        ctx.fillText(lines[0], width / 2, height / 2 - 20)

        // Draw value
        ctx.font = "700 24px Inter, sans-serif"
        ctx.fillText(lines[1], width / 2, height / 2 + 5)

        // Draw percentage if available
        if (lines[2]) {
          ctx.font = "400 12px Inter, sans-serif"
          ctx.fillStyle = "#666"
          ctx.fillText(lines[2], width / 2, height / 2 + 25)
        }

        ctx.save()
      },
    },
    {
      id: "selectedSliceHighlight",
      beforeDraw: (chart: any) => {
        if (selectedSlice !== null && chart.getDatasetMeta(0).data[selectedSlice]) {
          // Apply a subtle shadow to the selected slice
          const arc = chart.getDatasetMeta(0).data[selectedSlice]
          const ctx = chart.ctx

          ctx.save()
          ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
          ctx.shadowBlur = 10
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0

          // Redraw the selected arc with shadow
          arc.draw(ctx)

          // Reset shadow
          ctx.shadowColor = "transparent"
          ctx.shadowBlur = 0
          ctx.restore()
        }
      },
    },
  ]

  return (
    <div style={{ height: chartHeight }} className="relative">
      <Doughnut data={chartData} options={chartOptions as any} plugins={plugins as any} ref={chartRef} />
    </div>
  )
}

