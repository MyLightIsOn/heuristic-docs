# Accessibility Heuristics Guide

A comprehensive collection of 37 accessibility heuristics for designers and developers, organized into 6 key categories.

## Overview

This guide provides practical accessibility heuristics based on WCAG guidelines and industry best practices. Each heuristic includes:

- Clear explanations of what it means
- Why it matters for users
- What to check for during design/development
- Common pitfalls to avoid
- References to relevant WCAG and EN 301 549 standards

## Categories

- **Keyboard Interaction** (4 heuristics) - Navigate and interact using keyboard alone
- **Meaningful Content** (7 heuristics) - Clear, understandable information for all users
- **Page Structure** (6 heuristics) - Well-organized, semantic document structure
- **Quality of Life** (7 heuristics) - Enhanced usability and user experience
- **Readability** (6 heuristics) - Easy to read and comprehend content
- **Screen Reader Support** (7 heuristics) - Optimized for assistive technologies

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Component Analyzer

The Component Analyzer is an AI-powered tool that helps identify relevant accessibility heuristics for your components.

### Features

- **Element Picker**: Select UI elements from a predefined list
- **Image Upload**: Upload screenshots or designs for AI analysis
- **Text Description**: Describe your component in natural language
- **Smart Matching**: Get relevant heuristics based on your input
- **Filtering**: Filter results by designer or developer heuristics
- **Export**: Download results as PDF or Markdown checklist

### Setup

The analyzer requires an OpenAI API key for image and text analysis features.

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Add your OpenAI API key to `.env.local`:
   ```bash
   OPENAI_API_KEY=sk-your-actual-api-key
   ```

3. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)

### Usage

1. Navigate to `/analyzer` or click "Analyzer" in the navigation
2. Choose your input method:
   - **Pick Elements**: Select UI components from checkboxes
   - **Upload Image**: Drag and drop or select an image file (PNG, JPG, SVG)
   - **Describe**: Write a text description of your component
3. Click "Analyze Component"
4. Review the matched heuristics grouped by category
5. Filter by designer or developer heuristics
6. Export results as PDF or Markdown

### Architecture

- **Frontend**: Next.js 16 App Router with React Server Components
- **AI Analysis**: OpenAI GPT-4 Vision (images) and GPT-4 (text)
- **Export**: jsPDF for PDF generation, file-saver for downloads
- **API**: Server-side API route (`/api/analyzer`) for secure OpenAI calls

For detailed implementation information, see `docs/ANALYZER_IMPLEMENTATION.md`.

## Built With

- [Next.js](https://nextjs.org) - React framework
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [MDX](https://mdxjs.com) - Content format
- [Rubix Documents](https://github.com/rubixvi/rubix-documents) - Documentation template

## Content Structure

Heuristics are stored as MDX files in `docs/mdx-content/` organized by category.
