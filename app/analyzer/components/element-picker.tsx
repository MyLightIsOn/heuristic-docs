"use client"

import { useState } from "react"
import { ComponentElement } from "@/lib/types/analyzer"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

interface ElementPickerProps {
  onAnalyze: (elements: ComponentElement[]) => void
  isLoading?: boolean
}

// Organize elements into logical groups
const ELEMENT_GROUPS = {
  "Form Elements": [
    { value: "text-input", label: "Text Input" },
    { value: "checkbox", label: "Checkbox" },
    { value: "radio", label: "Radio Button" },
    { value: "textarea", label: "Textarea" },
    { value: "select", label: "Select / Dropdown" },
    { value: "file-upload", label: "File Upload" },
    { value: "toggle", label: "Toggle Switch" },
  ] as const,
  "Interactive": [
    { value: "button", label: "Button" },
    { value: "link", label: "Link" },
    { value: "dropdown", label: "Dropdown Menu" },
    { value: "menu", label: "Menu" },
    { value: "modal", label: "Modal / Dialog" },
    { value: "tabs", label: "Tabs" },
    { value: "accordion", label: "Accordion" },
  ] as const,
  "Content": [
    { value: "heading", label: "Heading" },
    { value: "paragraph", label: "Paragraph" },
    { value: "list", label: "List" },
    { value: "table", label: "Table" },
    { value: "icon", label: "Icon" },
  ] as const,
  "Media": [
    { value: "image", label: "Image" },
    { value: "video", label: "Video" },
    { value: "audio", label: "Audio" },
  ] as const,
}

export function ElementPicker({ onAnalyze, isLoading = false }: ElementPickerProps) {
  const [selectedElements, setSelectedElements] = useState<ComponentElement[]>([])

  const handleCheckboxChange = (element: ComponentElement, checked: boolean) => {
    if (checked) {
      setSelectedElements((prev) => [...prev, element])
    } else {
      setSelectedElements((prev) => prev.filter((e) => e !== element))
    }
  }

  const handleAnalyze = () => {
    if (selectedElements.length > 0) {
      onAnalyze(selectedElements)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {Object.entries(ELEMENT_GROUPS).map(([groupName, elements]) => (
          <div key={groupName} className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{groupName}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {elements.map((element) => (
                <div key={element.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={element.value}
                    checked={selectedElements.includes(element.value as ComponentElement)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(
                        element.value as ComponentElement,
                        checked as boolean
                      )
                    }
                    disabled={isLoading}
                  />
                  <label
                    htmlFor={element.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {element.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          {selectedElements.length} {selectedElements.length === 1 ? "element" : "elements"}{" "}
          selected
        </p>
        <Button
          onClick={handleAnalyze}
          disabled={selectedElements.length === 0 || isLoading}
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </Button>
      </div>
    </div>
  )
}
