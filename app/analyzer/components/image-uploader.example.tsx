/**
 * Example usage of the ImageUploader component
 *
 * This file demonstrates how to integrate the ImageUploader
 * into the analyzer page.
 */

"use client"

import { useState } from "react"

import { ImageUploader } from "./image-uploader"

export function ImageUploaderExample() {
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async (image: File) => {
    setIsLoading(true)

    try {
      // Create FormData to send the image to the API
      const formData = new FormData()
      formData.append("image", image)
      formData.append("method", "image")

      // Call the analyzer API
      const response = await fetch("/api/analyzer", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const result = await response.json()
      console.log("Analysis result:", result)

      // Handle the result (show heuristics, etc.)
      // This would typically update state to display the results
    } catch (error) {
      console.error("Error analyzing image:", error)
      // Handle error (show error message to user)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="mb-4 text-2xl font-bold">Upload Component Image</h2>
      <ImageUploader onAnalyze={handleAnalyze} isLoading={isLoading} />
    </div>
  )
}
