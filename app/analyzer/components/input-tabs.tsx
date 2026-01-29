"use client"

import { useState } from "react"

import type {
  AnalysisInput,
  ComponentElement,
  InputMethod,
} from "@/lib/types/analyzer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { ElementPicker } from "./element-picker"
import { ImageUploader } from "./image-uploader"
import { TextInput } from "./text-input"

interface InputTabsProps {
  onAnalyze: (input: AnalysisInput) => void
  isLoading?: boolean
}

export function InputTabs({ onAnalyze, isLoading }: InputTabsProps) {
  const [activeTab, setActiveTab] = useState<InputMethod>("elements")

  const handleElementsAnalyze = (elements: ComponentElement[]) => {
    onAnalyze({
      method: "elements",
      data: { elements },
    })
  }

  const handleImageAnalyze = (image: File) => {
    onAnalyze({
      method: "image",
      data: { image },
    })
  }

  const handleDescriptionAnalyze = (description: string) => {
    onAnalyze({
      method: "description",
      data: { description },
    })
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as InputMethod)}
    >
      <TabsList>
        <TabsTrigger value="elements">Pick Elements</TabsTrigger>
        <TabsTrigger value="image">Upload Image</TabsTrigger>
        <TabsTrigger value="description">Describe</TabsTrigger>
        <TabsTrigger value="figma" disabled>
          Figma
        </TabsTrigger>
      </TabsList>

      <TabsContent value="elements">
        <ElementPicker
          onAnalyze={handleElementsAnalyze}
          isLoading={isLoading}
        />
      </TabsContent>

      <TabsContent value="image">
        <ImageUploader onAnalyze={handleImageAnalyze} isLoading={isLoading} />
      </TabsContent>

      <TabsContent value="description">
        <TextInput onAnalyze={handleDescriptionAnalyze} isLoading={isLoading} />
      </TabsContent>

      <TabsContent value="figma">
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 p-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">
              Coming Soon
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Figma integration will be available in a future update.
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
