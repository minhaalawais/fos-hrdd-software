"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, FileText, ImageIcon, Film, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileUploaderProps {
  id: string
  accept?: string
  multiple?: boolean
  className?: string
  onChange?: (files: FileList | null) => void
}

export function FileUploader({ id, accept, multiple = false, className = "", onChange }: FileUploaderProps) {
  const [fileNames, setFileNames] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const names = Array.from(files).map((file) => file.name)
      setFileNames(names)

      if (onChange) {
        onChange(files)
      }
    }
  }

  const removeFile = (index: number) => {
    const newFileNames = [...fileNames]
    newFileNames.splice(index, 1)
    setFileNames(newFileNames)

    // Reset the input if all files are removed
    if (newFileNames.length === 0 && inputRef.current) {
      inputRef.current.value = ""
    }

    // If onChange is provided, we should ideally update the files
    // However, we can't modify a FileList directly, so this is a limitation
  }

  const getFileIcon = (fileName: string) => {
    if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
    } else if (fileName.match(/\.(pdf)$/i)) {
      return <FileText className="h-3.5 w-3.5 text-red-500" />
    } else if (fileName.match(/\.(mp4|avi|mov|wmv|webm)$/i)) {
      return <Film className="h-3.5 w-3.5 text-purple-500" />
    } else {
      return <FileText className="h-3.5 w-3.5 text-gray-500" />
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <input
        ref={inputRef}
        type="file"
        id={id}
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          size="sm"
          className="h-8 px-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-md shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5 text-gray-600" />
          <span className="text-xs font-medium text-gray-700">{multiple ? "Upload Files" : "Upload File"}</span>
        </Button>

        {accept && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {accept.includes("image") && <ImageIcon className="h-3 w-3 text-blue-500" />}
            {accept.includes("pdf") && <FileText className="h-3 w-3 text-red-500" />}
            {accept.includes("video") && <Film className="h-3 w-3 text-purple-500" />}
          </div>
        )}
      </div>

      {fileNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {fileNames.map((name, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full py-0.5 pl-2 pr-1 text-xs text-gray-700 max-w-[200px] group hover:bg-gray-100 transition-colors"
            >
              {getFileIcon(name)}
              <span className="truncate">{name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="h-4 w-4 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                aria-label={`Remove ${name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

