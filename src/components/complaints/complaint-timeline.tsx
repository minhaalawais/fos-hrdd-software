"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { FileUploader } from "@/components/ui/file-uploader"
import { Button } from "@/components/ui/button"
import type { Complaint } from "@/types/complaint"
import { formatDate } from "@/lib/utils"
import { fetchComplaintFiles } from "@/lib/api"
import ComplaintRouteModal from "@/components/complaints/complaint-route-modal"
import { Upload, FileText, ImageIcon, Film } from "lucide-react"

// Import ReactQuill directly (no dynamic import)
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface ComplaintTimelineProps {
  complaint: Complaint
  onUpdate?: (complaint: Complaint) => void
}

export default function ComplaintTimeline({ complaint, onUpdate }: ComplaintTimelineProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentCapaSlide, setCurrentCapaSlide] = useState(0)
  const [currentCapa1Slide, setCurrentCapa1Slide] = useState(0)
  const [currentCapa2Slide, setCurrentCapa2Slide] = useState(0)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false)

  // State for editor content
  const [rcaContent, setRcaContent] = useState<string>("")
  const [capaContent, setCapaContent] = useState<string>("")
  const [rca1Content, setRca1Content] = useState<string>("")
  const [capa1Content, setCapa1Content] = useState<string>("")
  const [rca2Content, setRca2Content] = useState<string>("")
  const [capa2Content, setCapa2Content] = useState<string>("")

  // State for deadlines
  const [rcaDeadline, setRcaDeadline] = useState<string>("")
  const [rca1Deadline, setRca1Deadline] = useState<string>("")
  const [rca2Deadline, setRca2Deadline] = useState<string>("")

  // State for files
  const [proofFiles, setProofFiles] = useState<Array<{ type: string; url: string; filename?: string }>>([])
  const [capaFiles, setCapaFiles] = useState<Array<{ type: string; url: string; filename?: string }>>([])
  const [capa1Files, setCapa1Files] = useState<Array<{ type: string; url: string; filename?: string }>>([])
  const [capa2Files, setCapa2Files] = useState<Array<{ type: string; url: string; filename?: string }>>([])
  const [loading, setLoading] = useState<{
    proof: boolean
    capa: boolean
    capa1: boolean
    capa2: boolean
  }>({
    proof: false,
    capa: false,
    capa1: false,
    capa2: false,
  })

  // Quill editor modules and formats
  const quillModules = {
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ indent: "-1" }, { indent: "+1" }],
      ["link"],
      ["clean"],
    ],
  }

  const quillFormats = ["bold", "italic", "underline", "strike", "list", "bullet", "indent", "link"]

  // Load files when component mounts or complaint changes
  useEffect(() => {
    if (!complaint?.ticket_number) return

    const loadFiles = async () => {
      try {
        // Fetch proof files
        setLoading((prev) => ({ ...prev, proof: true }))
        const proofFilesData = await fetchComplaintFiles(complaint.ticket_number, "proof")
        setProofFiles(proofFilesData)
        setLoading((prev) => ({ ...prev, proof: false }))

        // Fetch CAPA files
        setLoading((prev) => ({ ...prev, capa: true }))
        const capaFilesData = await fetchComplaintFiles(complaint.ticket_number, "capa")
        setCapaFiles(capaFilesData)
        setLoading((prev) => ({ ...prev, capa: false }))

        // Fetch CAPA1 files
        setLoading((prev) => ({ ...prev, capa1: true }))
        const capa1FilesData = await fetchComplaintFiles(complaint.ticket_number, "capa1")
        setCapa1Files(capa1FilesData)
        setLoading((prev) => ({ ...prev, capa1: false }))

        // Fetch CAPA2 files
        setLoading((prev) => ({ ...prev, capa2: true }))
        const capa2FilesData = await fetchComplaintFiles(complaint.ticket_number, "capa2")
        setCapa2Files(capa2FilesData)
        setLoading((prev) => ({ ...prev, capa2: false }))
      } catch (error) {
        console.error("Error loading files:", error)
        setLoading({ proof: false, capa: false, capa1: false, capa2: false })
      }
    }

    // Load files
    loadFiles()

    // Initialize local storage values if available
    const ticketNumber = complaint.ticket_number
    const storedRca = localStorage.getItem(`complaint_${ticketNumber}_rca`)
    const storedCapa = localStorage.getItem(`complaint_${ticketNumber}_capa`)
    const storedRca1 = localStorage.getItem(`complaint_${ticketNumber}_rca1`)
    const storedCapa1 = localStorage.getItem(`complaint_${ticketNumber}_capa1`)
    const storedRca2 = localStorage.getItem(`complaint_${ticketNumber}_rca2`)
    const storedCapa2 = localStorage.getItem(`complaint_${ticketNumber}_capa2`)
    const storedRcaDeadline = localStorage.getItem(`complaint_${ticketNumber}_rcaDeadline`)
    const storedRca1Deadline = localStorage.getItem(`complaint_${ticketNumber}_rca1Deadline`)
    const storedRca2Deadline = localStorage.getItem(`complaint_${ticketNumber}_rca2Deadline`)

    if (storedRca) setRcaContent(storedRca)
    if (storedCapa) setCapaContent(storedCapa)
    if (storedRca1) setRca1Content(storedRca1)
    if (storedCapa1) setCapa1Content(storedCapa1)
    if (storedRca2) setRca2Content(storedRca2)
    if (storedCapa2) setCapa2Content(storedCapa2)
    if (storedRcaDeadline) setRcaDeadline(storedRcaDeadline)
    if (storedRca1Deadline) setRca1Deadline(storedRca1Deadline)
    if (storedRca2Deadline) setRca2Deadline(storedRca2Deadline)
  }, [complaint])

  // Save editor content to local storage
  const saveToLocalStorage = (fieldName: string, content: string) => {
    if (!complaint?.ticket_number) return
    localStorage.setItem(`complaint_${complaint.ticket_number}_${fieldName}`, content)
  }

  // Handle editor changes
  const handleRcaChange = (content: string) => {
    setRcaContent(content)
    saveToLocalStorage("rca", content)
  }

  const handleCapaChange = (content: string) => {
    setCapaContent(content)
    saveToLocalStorage("capa", content)
  }

  const handleRca1Change = (content: string) => {
    setRca1Content(content)
    saveToLocalStorage("rca1", content)
  }

  const handleCapa1Change = (content: string) => {
    setCapa1Content(content)
    saveToLocalStorage("capa1", content)
  }

  const handleRca2Change = (content: string) => {
    setRca2Content(content)
    saveToLocalStorage("rca2", content)
  }

  const handleCapa2Change = (content: string) => {
    setCapa2Content(content)
    saveToLocalStorage("capa2", content)
  }

  // Handle deadline changes
  const handleRcaDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRcaDeadline(e.target.value)
    saveToLocalStorage("rcaDeadline", e.target.value)
  }

  const handleRca1DeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRca1Deadline(e.target.value)
    saveToLocalStorage("rca1Deadline", e.target.value)
  }

  const handleRca2DeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRca2Deadline(e.target.value)
    saveToLocalStorage("rca2Deadline", e.target.value)
  }

  // Slider navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(proofFiles.length, 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + proofFiles.length) % Math.max(proofFiles.length, 1))
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextCapaSlide = () => {
    setCurrentCapaSlide((prev) => (prev + 1) % Math.max(capaFiles.length, 1))
  }

  const prevCapaSlide = () => {
    setCurrentCapaSlide((prev) => (prev - 1 + capaFiles.length) % Math.max(capaFiles.length, 1))
  }

  const goToCapaSlide = (index: number) => {
    setCurrentCapaSlide(index)
  }

  const nextCapa1Slide = () => {
    setCurrentCapa1Slide((prev) => (prev + 1) % Math.max(capa1Files.length, 1))
  }

  const prevCapa1Slide = () => {
    setCurrentCapa1Slide((prev) => (prev - 1 + capa1Files.length) % Math.max(capa1Files.length, 1))
  }

  const goToCapa1Slide = (index: number) => {
    setCurrentCapa1Slide(index)
  }

  const nextCapa2Slide = () => {
    setCurrentCapa2Slide((prev) => (prev + 1) % Math.max(capa2Files.length, 1))
  }

  const prevCapa2Slide = () => {
    setCurrentCapa2Slide((prev) => (prev - 1 + capa2Files.length) % Math.max(capa2Files.length, 1))
  }

  const goToCapa2Slide = (index: number) => {
    setCurrentCapa2Slide(index)
  }

  // Handle route complaint
  const handleRouteComplaint = () => {
    setIsRouteModalOpen(true)
  }

  const handleRouteModalClose = () => {
    setIsRouteModalOpen(false)
  }

  const handleRouteSubmit = async (routeData: any) => {
    try {
      // In a real app, this would be an API call to route the complaint
      console.log("Routing complaint with data:", routeData)

      // Update the complaint with routing data if onUpdate is provided
      if (onUpdate) {
        const updatedComplaint = {
          ...complaint,
          status: "In Process",
          // Add routing data here
        }
        onUpdate(updatedComplaint)
      }

      setIsRouteModalOpen(false)
    } catch (error) {
      console.error("Error routing complaint:", error)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!onUpdate) return

    try {
      // Create FormData for the update
      const formData = new FormData()
      formData.append("ticket", complaint.ticket_number)

      // Add editor content
      if (rcaContent) formData.append("rca", rcaContent)
      if (capaContent) formData.append("capa", capaContent)
      if (rca1Content) formData.append("rca1", rca1Content)
      if (capa1Content) formData.append("capa1", capa1Content)
      if (rca2Content) formData.append("rca2", rca2Content)
      if (capa2Content) formData.append("capa2", capa2Content)

      // Add deadlines
      if (rcaDeadline) formData.append("rcaDeadline", rcaDeadline)
      if (rca1Deadline) formData.append("rca1Deadline", rca1Deadline)
      if (rca2Deadline) formData.append("rca2Deadline", rca2Deadline)

      // Update the complaint
      const updatedComplaint = {
        ...complaint,
        rca: rcaContent || complaint.rca,
        capa: capaContent || complaint.capa,
        rca1: rca1Content || complaint.rca1,
        capa1: capa1Content || complaint.capa1,
        rca2: rca2Content || complaint.rca2,
        capa2: capa2Content || complaint.capa2,
        capa_deadline: rcaDeadline || complaint.capa_deadline,
        capa_deadline1: rca1Deadline || complaint.capa_deadline1,
        capa_deadline2: rca2Deadline || complaint.capa_deadline2,
      }

      onUpdate(updatedComplaint)

      // Clear local storage
      if (complaint.ticket_number) {
        const fields = ["rca", "capa", "rca1", "capa1", "rca2", "capa2", "rcaDeadline", "rca1Deadline", "rca2Deadline"]
        fields.forEach((field) => {
          localStorage.removeItem(`complaint_${complaint.ticket_number}_${field}`)
        })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  // Helper function to render file slider
  const renderFileSlider = (
    files: Array<{ type: string; url: string; filename?: string }>,
    currentSlideIndex: number,
    prevSlideFunc: () => void,
    nextSlideFunc: () => void,
    goToSlideFunc: (index: number) => void,
    isLoading: boolean,
    fileCategory: string,
  ) => {
    if (isLoading) {
      return (
        <div
          className="slider-container"
          style={{
            position: "absolute",
            left: "50%",
            marginLeft: "20px",
            marginTop: "55px",
            maxWidth: "600px",
            width: "100%",
            height: "250px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (files.length === 0) {
      return null
    }

    return (
      <div
        className="slider-container"
        style={{
          position: "absolute",
          left: "50%",
          marginLeft: "20px",
          marginTop: "55px",
          maxWidth: "535px",
          width: "100%",
          height: "250px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <div
          className="slider"
          style={{
            display: "flex",
            transition: "transform 0.5s ease",
            width: "100%",
            height: "100%",
            transform: `translateX(-${currentSlideIndex * 100}%)`,
          }}
        >
          {files.map((file, index) => (
            <div
              key={index}
              className="slide"
              style={{
                flex: "0 0 100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              {file.type === "image" ? (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    textAlign: "center",
                  }}
                >
                  <img
                    src={file.url || "/placeholder.svg"}
                    alt={`${fileCategory} ${index + 1}`}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  />
                </a>
              ) : file.type === "pdf" ? (
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div className="w-20 h-20 bg-red-500 rounded flex items-center justify-center text-white">PDF</div>
                  <span className="mt-2 text-sm text-blue-600">
                    {file.filename ? file.filename : `Download PDF ${fileCategory}`}
                  </span>
                </a>
              ) : file.type === "video" ? (
                <video controls className="max-w-full max-h-full rounded">
                  <source src={file.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : null}
            </div>
          ))}
        </div>

        {files.length > 1 && (
          <>
            <div
              className="slider-nav"
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "space-between",
                transform: "translateY(-50%)",
              }}
            >
              <button
                onClick={prevSlideFunc}
                aria-label="Previous Slide"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  marginLeft: "10px",
                }}
              >
                &#10094;
              </button>
              <button
                onClick={nextSlideFunc}
                aria-label="Next Slide"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  marginRight: "10px",
                }}
              >
                &#10095;
              </button>
            </div>
            <div
              className="slide-indicator"
              style={{
                position: "absolute",
                bottom: "10px",
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
              }}
            >
              {files.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${currentSlideIndex === index ? "active" : ""}`}
                  onClick={() => goToSlideFunc(index)}
                  style={{
                    height: "8px",
                    width: "8px",
                    backgroundColor: index === currentSlideIndex ? "#007bff" : "rgba(255,255,255,0.5)",
                    borderRadius: "50%",
                    display: "inline-block",
                    margin: "0 5px",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // Render a rich text editor with ReactQuill
  const renderEditor = (value: string, onChange: (content: string) => void, placeholder?: string) => {
    // Use a simple textarea as a fallback for server-side rendering
    if (typeof window === "undefined") {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[200px] p-3 border rounded"
        />
      )
    }

    return (
      <div className="bg-white rounded">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={quillModules}
          formats={quillFormats}
          placeholder={placeholder || "Enter details here..."}
          className="min-h-[200px]"
        />
      </div>
    )
  }

  // Enhanced FileUploader component
  const EnhancedFileUploader = ({
    id,
    accept,
    multiple,
    className,
  }: {
    id: string
    accept?: string
    multiple?: boolean
    className?: string
  }) => {
    return (
      <div className={`${className} w-full`}>
        <div className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              {accept?.includes("image") && <ImageIcon className="inline-block w-4 h-4 mr-1" />}
              {accept?.includes("pdf") && <FileText className="inline-block w-4 h-4 mr-1" />}
              {accept?.includes("video") && <Film className="inline-block w-4 h-4 mr-1" />}
              {accept?.includes("image") ? "Images" : ""}
              {accept?.includes("pdf") ? (accept?.includes("image") ? ", PDFs" : "PDFs") : ""}
              {accept?.includes("video")
                ? accept?.includes("image") || accept?.includes("pdf")
                  ? ", Videos"
                  : "Videos"
                : ""}
            </p>
          </div>
          <FileUploader id={id} accept={accept} multiple={multiple} className="hidden" />
        </div>
      </div>
    )
  }

  return (
    <div className="container" ref={timelineRef}>
      {/* Route Complaint Button */}
      {(complaint.status === "In Process" || complaint.status === "Bounced" || complaint.status === "Bounced1") && (
        <div className="flex justify-end mb-4">
          <Button variant="secondary" onClick={handleRouteComplaint} className="mr-2">
            Route Complaint
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </div>
      )}

      <div className="timeline">
        {/* Initial Complaint Row */}
        <div className="timeline-row" style={{ minHeight: "300px" }}>
          <div className="timeline-time">
            <strong>{formatDate(complaint.in_process_date)}</strong>
          </div>

          {/* File Proof Section */}
          {renderFileSlider(proofFiles, currentSlide, prevSlide, nextSlide, goToSlide, loading.proof, "Proof")}

          <div className="timeline-content">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <span className="bg-[#206E71] text-white px-2 py-1 rounded text-sm mb-1">
                  {complaint.employee_name}
                </span>
                <span className="text-white text-sm mb-1">{complaint.designation}</span>
                <span className="bg-[#2D9480] text-white px-2 py-1 rounded text-sm">
                  {complaint.complaint_categories}
                </span>
              </div>
              <div className="flex items-center">
                <h4 className="text-white font-bold mr-2">In Process</h4>
                <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </div>
              </div>
            </div>

            <div className="text-left">
              {complaint.additional_comments && (
                <div className="mb-2">
                  <strong className="text-yellow-300">Additional Comments:</strong>
                  <div dangerouslySetInnerHTML={{ __html: complaint.additional_comments }} />
                </div>
              )}

              {complaint.date_of_issue && (
                <p className="mb-2">
                  <strong className="text-yellow-300">Date of Issue:</strong> {complaint.date_of_issue}
                </p>
              )}

              {complaint.person_issue && (
                <p className="mb-2">
                  <strong className="text-yellow-300">Relevant Person:</strong> {complaint.person_issue}
                </p>
              )}

              {complaint.concerned_department && (
                <p className="mb-2">
                  <strong className="text-yellow-300">Concerned Department:</strong> {complaint.concerned_department}
                </p>
              )}

              {complaint.previous_history && (
                <p className="mb-2">
                  <strong className="text-yellow-300">Previous History:</strong> {complaint.previous_history}
                </p>
              )}

              {complaint.proposed_solution && (
                <p className="mb-2">
                  <strong className="text-yellow-300">Proposed Solution:</strong> {complaint.proposed_solution}
                </p>
              )}
            </div>

            <div className="mt-4">
              <p className="text-white">
                <strong className="text-yellow-300">Lodged By:</strong>{" "}
                {complaint.lodged_by_agent && complaint.lodged_from_web
                  ? "Agent from Web"
                  : complaint.lodged_by_agent && !complaint.lodged_from_web
                    ? "Agent from Mobile App"
                    : !complaint.lodged_by_agent && !complaint.lodged_from_web
                      ? "Employee from Mobile App"
                      : "Employee from Web"}
              </p>
            </div>
          </div>
        </div>

        {/* Only show RCA and CAPA sections if not a feedback complaint */}
        {complaint.complaint_categories !== "Feedback" && (
          <>
            {/* RCA Row */}
            <div className="timeline-row">
              <div className="timeline-time">
                <strong>{formatDate(complaint.rca_date)}</strong>
              </div>
              <div className="timeline-content">
                <div className="flex items-center mb-4">
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
                    className="mr-2"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <h4 className="text-white font-bold">RCA-Root Cause Analysis</h4>
                </div>

                {complaint.rca === null ? (
                  <>
                    <div className="mb-4">
                      <p className="text-white mb-2">Detail</p>
                      {renderEditor(rcaContent, handleRcaChange, "Enter root cause analysis details...")}
                    </div>
                    <div>
                      <p className="text-white mb-2">Capa Deadline</p>
                      <input
                        type="datetime-local"
                        value={rcaDeadline}
                        onChange={handleRcaDeadlineChange}
                        className="w-full p-2 rounded"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-white" dangerouslySetInnerHTML={{ __html: complaint.rca || "" }} />
                    <p className="mt-2">
                      <span className="bg-yellow-400 text-black px-2 py-1 rounded text-sm">
                        Capa Deadline: {complaint.capa_deadline}
                      </span>
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* CAPA Row */}
            <div className="timeline-row" style={{ minHeight: "300px" }}>
              <div className="timeline-time">
                <strong>{formatDate(complaint.capa_date)}</strong>
              </div>

              {/* CAPA Files Section */}
              {renderFileSlider(
                capaFiles,
                currentCapaSlide,
                prevCapaSlide,
                nextCapaSlide,
                goToCapaSlide,
                loading.capa,
                "CAPA",
              )}

              <div className="timeline-content">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-white font-bold">CAPA-Corrective & Preventive Actions</h4>
                  <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                  </div>
                </div>

                {complaint.capa === null ? (
                  <>
                    <EnhancedFileUploader
                      id="capaImageInput"
                      accept="image/*,application/pdf,video/*"
                      multiple
                      className="mb-4"
                    />
                    <div>
                      <p className="text-white mb-2">Detail:</p>
                      {renderEditor(capaContent, handleCapaChange, "Enter corrective and preventive actions...")}
                    </div>
                  </>
                ) : (
                  <div
                    className="text-white text-left mt-2"
                    dangerouslySetInnerHTML={{ __html: complaint.capa || "" }}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* For Feedback complaints, show IO Feedback section */}
        {complaint.complaint_categories === "Feedback" && (
          <div className="timeline-row" style={{ minHeight: "300px" }}>
            <div className="timeline-time">
              <strong>{formatDate(complaint.capa_date)}</strong>
            </div>

            {/* IO Feedback Files Section */}
            {renderFileSlider(
              capaFiles,
              currentCapaSlide,
              prevCapaSlide,
              nextCapaSlide,
              goToCapaSlide,
              loading.capa,
              "IO Feedback",
            )}

            <div className="timeline-content">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-white font-bold">Investigation Officer - IO Feedback</h4>
                <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </div>
              </div>

              {complaint.capa === null ? (
                <>
                  <EnhancedFileUploader
                    id="capaImageInput"
                    accept="image/*,application/pdf,video/*"
                    multiple
                    className="mb-4"
                  />
                  <div>
                    <p className="text-white mb-2">Detail:</p>
                    {renderEditor(capaContent, handleCapaChange, "Enter feedback details...")}
                  </div>
                </>
              ) : (
                <div className="text-white text-left mt-2" dangerouslySetInnerHTML={{ __html: complaint.capa || "" }} />
              )}
            </div>
          </div>
        )}

        {/* Bounced Feedback Section */}
        {(complaint.status === "Bounced" || complaint.capa1 !== null) && (
          <>
            <div className="text-center my-6">
              <div className="inline-block bg-gradient-to-r from-[#F5A83C] to-[#FF8C42] px-6 py-4 rounded-lg shadow-md text-white font-bold">
                The Complainant Was Not Satisfied
                <span className="block text-base mt-2 opacity-90">Feedback: {complaint.feedback}</span>
              </div>
            </div>

            {/* RCA1 Row */}
            <div className="timeline-row">
              <div className="timeline-time">
                <strong>{formatDate(complaint.rca1_date)}</strong>
              </div>
              <div className="timeline-content">
                <div className="flex items-center mb-4">
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
                    className="mr-2"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <h4 className="text-white font-bold">RCA1-Root Cause Analysis</h4>
                </div>

                {complaint.rca1 === null ? (
                  <>
                    <div className="mb-4">
                      <p className="text-white mb-2">Detail</p>
                      {renderEditor(rca1Content, handleRca1Change, "Enter follow-up root cause analysis...")}
                    </div>
                    <div>
                      <p className="text-white mb-2">Capa1 Deadline</p>
                      <input
                        type="datetime-local"
                        value={rca1Deadline}
                        onChange={handleRca1DeadlineChange}
                        className="w-full p-2 rounded"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-white" dangerouslySetInnerHTML={{ __html: complaint.rca1 || "" }} />
                    <p className="mt-2">
                      <span className="bg-yellow-400 text-black px-2 py-1 rounded text-sm">
                        Capa1 Deadline: {complaint.capa_deadline1}
                      </span>
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* CAPA1 Row */}
            <div className="timeline-row" style={{ minHeight: "300px" }}>
              <div className="timeline-time">
                <strong>{formatDate(complaint.capa1_date)}</strong>
              </div>

              {/* CAPA1 Files Section */}
              {renderFileSlider(
                capa1Files,
                currentCapa1Slide,
                prevCapa1Slide,
                nextCapa1Slide,
                goToCapa1Slide,
                loading.capa1,
                "CAPA1",
              )}

              <div className="timeline-content">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-white font-bold">CAPA1-Corrective & Preventive Actions</h4>
                  <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                  </div>
                </div>

                {complaint.capa1 === null ? (
                  <>
                    <EnhancedFileUploader
                      id="capa1ImageInput"
                      accept="image/*,application/pdf,video/*"
                      multiple
                      className="mb-4"
                    />
                    <div>
                      <p className="text-white mb-2">Detail:</p>
                      {renderEditor(capa1Content, handleCapa1Change, "Enter follow-up corrective actions...")}
                    </div>
                  </>
                ) : (
                  <div
                    className="text-white text-left mt-2"
                    dangerouslySetInnerHTML={{ __html: complaint.capa1 || "" }}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* Bounced1 Feedback Section */}
        {(complaint.status === "Bounced1" || complaint.capa2 !== null) && (
          <>
            <div className="text-center my-6">
              <div className="inline-block bg-gradient-to-r from-[#F5A83C] to-[#FF8C42] px-6 py-4 rounded-lg shadow-md text-white font-bold">
                The Complainant Was Not Satisfied
                <span className="block text-base mt-2 opacity-90">Feedback: {complaint.feedback1}</span>
              </div>
            </div>

            {/* RCA2 Row */}
            <div className="timeline-row">
              <div className="timeline-time">
                <strong>{formatDate(complaint.rca2_date)}</strong>
              </div>
              <div className="timeline-content">
                <div className="flex items-center mb-4">
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
                    className="mr-2"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <h4 className="text-white font-bold">RCA2-Root Cause Analysis</h4>
                </div>

                {complaint.rca2 === null ? (
                  <>
                    <div className="mb-4">
                      <p className="text-white mb-2">Detail</p>
                      {renderEditor(rca2Content, handleRca2Change, "Enter second follow-up root cause analysis...")}
                    </div>
                    <div>
                      <p className="text-white mb-2">Capa2 Deadline</p>
                      <input
                        type="datetime-local"
                        value={rca2Deadline}
                        onChange={handleRca2DeadlineChange}
                        className="w-full p-2 rounded"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-white" dangerouslySetInnerHTML={{ __html: complaint.rca2 || "" }} />
                    <p className="mt-2">
                      <span className="bg-yellow-400 text-black px-2 py-1 rounded text-sm">
                        Capa2 Deadline: {complaint.capa_deadline2}
                      </span>
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* CAPA2 Row */}
            <div className="timeline-row" style={{ minHeight: "300px" }}>
              <div className="timeline-time">
                <strong>{formatDate(complaint.capa2_date)}</strong>
              </div>

              {/* CAPA2 Files Section */}
              {renderFileSlider(
                capa2Files,
                currentCapa2Slide,
                prevCapa2Slide,
                nextCapa2Slide,
                goToCapa2Slide,
                loading.capa2,
                "CAPA2",
              )}

              <div className="timeline-content">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-white font-bold">CAPA2-Corrective & Preventive Actions</h4>
                  <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white"
                    >
                      <line x1="8" y1="6" x2="21" y2="6"></line>
                      <line x1="8" y1="12" x2="21" y2="12"></line>
                      <line x1="8" y1="18" x2="21" y2="18"></line>
                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                    </svg>
                  </div>
                </div>

                {complaint.capa2 === null ? (
                  <>
                    <EnhancedFileUploader
                      id="capa2ImageInput"
                      accept="image/*,application/pdf,video/*"
                      multiple
                      className="mb-4"
                    />
                    <div>
                      <p className="text-white mb-2">Detail:</p>
                      {renderEditor(capa2Content, handleCapa2Change, "Enter second follow-up corrective actions...")}
                    </div>
                  </>
                ) : (
                  <div
                    className="text-white text-left mt-2"
                    dangerouslySetInnerHTML={{ __html: complaint.capa2 || "" }}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* Unclosed Status */}
        {complaint.status === "Unclosed" && (
          <div className="timeline-row">
            <div className="timeline-time">
              <strong>{formatDate(complaint.unclosed_date)}</strong>
            </div>
            <div className="timeline-content">
              <div className="flex items-center mb-4">
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
                  className="mr-2"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <h4 className="text-white font-bold">UNCLOSED</h4>
              </div>
            </div>
          </div>
        )}

        {/* Submitted Status */}
        {complaint.status === "Submitted" && (
          <div className="timeline-row">
            <div className="timeline-time">
              <strong>{formatDate(complaint.closed_date)}</strong>
            </div>
            <div className="timeline-content">
              <div className="flex items-center mb-4">
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
                  className="mr-2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h4 className="text-white font-bold">SUBMITTED</h4>
              </div>
            </div>
          </div>
        )}

        {/* Completed Status */}
        {complaint.status === "Completed" && (
          <>
            <div className="timeline-row">
              <div className="timeline-time">
                <strong>{formatDate(complaint.closed_date)}</strong>
              </div>
              <div className="timeline-content">
                <div className="flex items-center mb-4">
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
                    className="mr-2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <h4 className="text-white font-bold">SUBMITTED</h4>
                </div>
              </div>
            </div>

            <div className="text-center my-6">
              <div className="inline-block bg-gradient-to-r from-[#60BA81] to-[#A5DC71] px-6 py-4 rounded-lg shadow-md text-white font-bold">
                The Complainant Was Satisfied
                <span className="block text-base mt-2 opacity-90">Feedback: {complaint.closed_feedback}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Route Complaint Modal */}
      {isRouteModalOpen && (
        <ComplaintRouteModal
          complaint={complaint}
          isOpen={isRouteModalOpen}
          onClose={handleRouteModalClose}
          onSubmit={handleRouteSubmit}
        />
      )}
    </div>
  )
}

