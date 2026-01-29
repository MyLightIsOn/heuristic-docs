"use client"

import { Download, FileDown, FileText, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ExportButtonProps {
  onExport: (format: "pdf" | "markdown") => void
  isLoading?: boolean
}

export function ExportButton({
  onExport,
  isLoading = false,
}: ExportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport("pdf")} disabled={isLoading}>
          <FileText />
          Download PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onExport("markdown")}
          disabled={isLoading}
        >
          <FileDown />
          Download Markdown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
