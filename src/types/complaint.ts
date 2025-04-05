export interface Complaint {
  id: string
  ticket_number: string
  employee_name: string
  status: string
  date_entry: string
  mobile_number: string
  complaint_categories: string
  additional_comments: string
  is_urgent: boolean
  company_name: string
  office_name: string
  in_process_date: string
  designation: string
  lodged_by_agent: boolean
  lodged_from_web: boolean
  rca: string | null
  capa: string | null
  rca_date: string
  capa_date: string
  capa_deadline: string
  feedback?: string
  rca1?: string | null
  capa1?: string | null
  rca1_date?: string
  capa1_date?: string
  capa_deadline1?: string
  feedback1?: string
  rca2?: string | null
  capa2?: string | null
  rca2_date?: string
  capa2_date?: string
  capa_deadline2?: string
  closed_date?: string
  completed_date?: string
  closed_feedback?: string
  unclosed_date?: string
  proof_files: FileInfo[]
  capa_files: FileInfo[]
  capa1_files?: FileInfo[]
  capa2_files?: FileInfo[]
}

export interface FileInfo {
  type: "image" | "pdf" | "video"
  url: string
}

