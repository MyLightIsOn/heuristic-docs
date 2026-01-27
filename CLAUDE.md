# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an accessibility heuristics documentation site built with Next.js 16, presenting 37 accessibility heuristics organized into 6 categories. The site uses MDX for content, Tailwind CSS for styling, and implements a custom documentation template (Rubix Documents).

## Development Commands

### Package Manager
This project uses **pnpm** (v10.25.0) as the package manager. Node version is locked to 24.x.

### Core Commands
- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server

### Code Quality
- `pnpm lint` - Run ESLint (quiet mode)
- `pnpm lint:fix` - Run ESLint with auto-fix
- `pnpm format` - Format all files with Prettier
- `pnpm format:check` - Check formatting without making changes
- `pnpm clean` - Run lint fix, format, and format check in sequence

### Content Generation
- `pnpm generate-content-json` - Generate search index from MDX files (uses ts-node)
- `pnpm generate-content-json:ide` - Alternative using esbuild-register for IDE contexts

This command processes all MDX files in `contents/heuristics/` and generates `public/search-data/documents.json` for the search functionality.

## Architecture

### Content Management System

**MDX Content Structure:**
- MDX files live in `contents/heuristics/{category}/{heuristic}/index.mdx`
- Category folders: `keyboard-interaction`, `meaningful-content`, `page-structure`, `quality-of-life`, `readability`, `screen-reader-support`
- Each heuristic has its own folder containing an `index.mdx` file
- Frontmatter includes: `title`, `keywords`, `owner` (array of designer/developer)

**Navigation Structure:**
- Navigation is defined in `settings/documents.ts` as a hierarchical structure
- The `Documents` array defines categories with `heading`, `title`, `href`, and nested `items`
- `lib/pageroutes.ts` flattens this structure into `PageRoutes` used for routing and pagination
- Paths are constructed by concatenating parent href with child href (e.g., `/keyboard-interaction` + `/visible-focus` = `/keyboard-interaction/visible-focus`)

**Markdown Processing Pipeline:**
- `lib/markdown.ts` handles MDX compilation using `next-mdx-remote`
- Rehype plugins: rehype-code-titles, rehype-prism-plus, rehype-slug, rehype-autolink-headings
- Remark plugins: remark-gfm
- Custom components are registered in `lib/components.ts` and injected into MDX context
- Table of contents is extracted via regex from raw MDX content

**Content Loading Modes:**
- Controlled by `Settings.gitload` in `settings/main.ts` (currently `false`)
- Local mode: reads from `contents/heuristics/` directory
- GitHub mode: fetches from GitHub raw URLs
- Both modes support caching and last-modified timestamps

### Custom MDX Components

Available in MDX content (defined in `lib/components.ts`):
- `<OwnerBadge />` - Display designer/developer ownership
- `<KeywordTags />` - Display keyword tags from frontmatter
- `<StandardsReference />` - Reference WCAG/EN 301 549 standards
- `<Note />` - Callout/admonition blocks
- `<Card />`, `<CardGrid />` - Card layouts
- `<Step />`, `<StepItem />` - Step-by-step instructions
- `<FileTree />`, `<Folder />`, `<File />` - File tree visualization
- `<Tabs />`, `<TabsList />`, `<TabsTrigger />`, `<TabsContent />` - Tabbed content
- `<Pre />` - Custom code block with copy functionality

### Routing and Page Generation

**Dynamic Routes:**
- Main documentation route: `app/docs/[[...slug]]/page.tsx`
- Catch-all route handles all heuristic pages
- Static params generated from `PageRoutes` at build time
- Slug construction: array of path segments (e.g., `['keyboard-interaction', 'visible-focus']`)

**Metadata Generation:**
- Each page generates SEO metadata including OpenGraph and Twitter cards
- Metadata includes last modified timestamp from file stats or GitHub headers
- Canonical URLs use `Settings.metadataBase` from `settings/main.ts`

### Custom Transition System

The site implements a custom page transition system in `lib/transition/`:
- `transition-context.tsx` - React context for transition state
- `use-transition-router.ts` - Custom router hook
- `link.tsx` - Custom Link component with transition support
- `use-hash.ts` - Hash navigation handling
- `browser-native.ts` - Browser-native transition detection

This wraps Next.js navigation with smooth transition effects.

### Search Functionality

**Search Index Generation:**
- Script: `scripts/content.ts`
- Processes all MDX files to extract title, description, content, and metadata
- Cleans content by removing code blocks, formatting, and custom components
- Extracts keywords from frontmatter, headings, bold text, and inline code
- Outputs to `public/search-data/documents.json`
- Must be run manually after content changes

**Custom Component Removal:**
The script removes these custom components from search content: `Tabs`, `TabsList`, `TabsTrigger`, `pre`, `Card`, `CardGrid`, `Step`, `StepItem`, `Note`, `FileTree`, `Folder`, `File`, `OwnerBadge`, `KeywordTags`, `StandardsReference`

## Configuration Files

### Settings
- `settings/main.ts` - Site metadata, feature flags (branding, rightsidebar, feedbackedit, tableofcontent, totopscroll, loadfromgithub)
- `settings/navigation.ts` - Top navigation links and GitHub repository link
- `settings/documents.ts` - Content structure and sidebar navigation
- `settings/icons.ts` - Icon configuration (if present)

### Component Configuration
- `components.json` - shadcn/ui configuration for component generation
- Uses Tailwind CSS v4 with `@tailwindcss/postcss`

## Adding New Heuristics

1. Create folder: `contents/heuristics/{category}/{heuristic-slug}/`
2. Add `index.mdx` with frontmatter (title, keywords, owner)
3. Add entry to appropriate category in `settings/documents.ts`
4. Run `pnpm generate-content-json` to update search index
5. The page will automatically be included in navigation and routing

## Important Notes

- **Node Version:** Strictly requires Node 24.x (specified in package.json engines)
- **File Structure:** Each heuristic must have its own folder with `index.mdx`, not a single MDX file
- **Path Matching:** The slug structure in `settings/documents.ts` must exactly match folder names in `contents/heuristics/`
- **Search Index:** Not auto-generated on build - must run `pnpm generate-content-json` manually after content changes
- **Husky Git Hooks:** Configured via `prepare` script - may run pre-commit checks
