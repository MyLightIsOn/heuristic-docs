import type { ComponentElement } from "@/lib/types/analyzer"

/**
 * Maps UI component elements to relevant accessibility heuristic slugs.
 *
 * This mapping connects component types (buttons, inputs, images, etc.) to the
 * accessibility heuristics that should be considered when implementing them.
 *
 * Each element type maps to an array of heuristic slugs that correspond to
 * the full path structure: /category/heuristic-slug
 *
 * @example
 * ELEMENT_HEURISTIC_MAP['text-input'] returns:
 * [
 *   '/keyboard-interaction/visible-focus',
 *   '/meaningful-content/form-labels',
 *   '/screen-reader-support/form-errors',
 *   ...
 * ]
 */
export const ELEMENT_HEURISTIC_MAP: Record<ComponentElement, string[]> = {
  "text-input": [
    "/meaningful-content/form-labels",
    "/meaningful-content/form-label-visibility",
    "/meaningful-content/error-text",
    "/keyboard-interaction/visible-focus",
    "/keyboard-interaction/focus-order",
    "/quality-of-life/target-areas",
    "/quality-of-life/error-suggestions",
    "/quality-of-life/session-extension",
    "/readability/color-contrast",
    "/readability/padding-spacing",
    "/screen-reader-support/form-errors",
  ],

  checkbox: [
    "/meaningful-content/form-labels",
    "/meaningful-content/form-label-visibility",
    "/keyboard-interaction/visible-focus",
    "/keyboard-interaction/focus-order",
    "/quality-of-life/target-areas",
    "/readability/color-contrast",
    "/readability/use-of-color",
  ],

  radio: [
    "/meaningful-content/form-labels",
    "/meaningful-content/form-label-visibility",
    "/keyboard-interaction/visible-focus",
    "/keyboard-interaction/focus-order",
    "/quality-of-life/target-areas",
    "/readability/color-contrast",
    "/readability/use-of-color",
  ],

  textarea: [
    "/meaningful-content/form-labels",
    "/meaningful-content/form-label-visibility",
    "/meaningful-content/error-text",
    "/keyboard-interaction/visible-focus",
    "/keyboard-interaction/focus-order",
    "/quality-of-life/target-areas",
    "/quality-of-life/error-suggestions",
    "/quality-of-life/session-extension",
    "/readability/color-contrast",
    "/readability/padding-spacing",
    "/readability/horizontal-scroll",
    "/screen-reader-support/form-errors",
  ],

  select: [
    "/meaningful-content/form-labels",
    "/meaningful-content/form-label-visibility",
    "/keyboard-interaction/visible-focus",
    "/keyboard-interaction/focus-order",
    "/quality-of-life/target-areas",
    "/readability/color-contrast",
  ],

  "file-upload": [
    "/meaningful-content/form-labels",
    "/meaningful-content/form-label-visibility",
    "/meaningful-content/error-text",
    "/keyboard-interaction/visible-focus",
    "/keyboard-interaction/focus-order",
    "/quality-of-life/target-areas",
    "/screen-reader-support/form-errors",
  ],

  toggle: [
    "/meaningful-content/form-labels",
    "/meaningful-content/form-label-visibility",
    "/keyboard-interaction/visible-focus",
    "/keyboard-interaction/focus-order",
    "/quality-of-life/target-areas",
    "/readability/color-contrast",
    "/readability/use-of-color",
  ],

  button: [
    "/page-structure/cta-buttons",
    "/meaningful-content/single-cta",
    "/keyboard-interaction/visible-focus",
    "/keyboard-interaction/focus-order",
    "/quality-of-life/target-areas",
    "/readability/color-contrast",
    "/readability/padding-spacing",
  ],

  link: [
    "/page-structure/cta-links",
    "/meaningful-content/meaningful-link-text",
    "/keyboard-interaction/visible-focus",
    "/keyboard-interaction/focus-order",
    "/keyboard-interaction/hover-and-focus",
    "/quality-of-life/target-areas",
    "/readability/link-visibility",
    "/readability/color-contrast",
  ],

  dropdown: [
    "/keyboard-interaction/visible-focus",
    "/keyboard-interaction/focus-order",
    "/keyboard-interaction/keyboard-traps",
    "/quality-of-life/target-areas",
    "/readability/color-contrast",
  ],

  menu: [
    "/meaningful-content/recurring-nav",
    "/keyboard-interaction/visible-focus",
    "/keyboard-interaction/focus-order",
    "/keyboard-interaction/keyboard-traps",
    "/page-structure/content-regions",
    "/quality-of-life/target-areas",
    "/readability/color-contrast",
  ],

  modal: [
    "/page-structure/page-titles",
    "/keyboard-interaction/visible-focus",
    "/keyboard-interaction/focus-order",
    "/keyboard-interaction/keyboard-traps",
    "/quality-of-life/target-areas",
    "/readability/color-contrast",
    "/screen-reader-support/status-messages",
  ],

  tabs: [
    "/keyboard-interaction/visible-focus",
    "/keyboard-interaction/focus-order",
    "/keyboard-interaction/keyboard-traps",
    "/quality-of-life/target-areas",
    "/readability/color-contrast",
    "/readability/use-of-color",
  ],

  accordion: [
    "/keyboard-interaction/visible-focus",
    "/keyboard-interaction/focus-order",
    "/quality-of-life/target-areas",
    "/readability/color-contrast",
    "/readability/use-of-color",
  ],

  heading: [
    "/page-structure/page-titles",
    "/page-structure/heading-hierarchy",
    "/page-structure/content-regions",
    "/readability/color-contrast",
    "/readability/padding-spacing",
  ],

  paragraph: [
    "/readability/color-contrast",
    "/readability/padding-spacing",
    "/readability/horizontal-scroll",
    "/screen-reader-support/language",
  ],

  list: [
    "/page-structure/list-groupings",
    "/page-structure/content-regions",
    "/readability/color-contrast",
    "/readability/padding-spacing",
  ],

  table: [
    "/page-structure/heading-hierarchy",
    "/readability/color-contrast",
    "/readability/padding-spacing",
    "/readability/horizontal-scroll",
    "/screen-reader-support/table-structure",
  ],

  icon: [
    "/screen-reader-support/decorative-images",
    "/screen-reader-support/active-images",
    "/readability/informative-images",
    "/readability/color-contrast",
    "/readability/use-of-color",
    "/quality-of-life/target-areas",
  ],

  image: [
    "/screen-reader-support/decorative-images",
    "/screen-reader-support/active-images",
    "/meaningful-content/images-of-text",
    "/readability/informative-images",
    "/readability/color-contrast",
    "/quality-of-life/target-areas",
  ],

  video: [
    "/quality-of-life/video-captions",
    "/quality-of-life/audio-description",
    "/quality-of-life/transcript",
    "/quality-of-life/pause-animation",
    "/quality-of-life/target-areas",
    "/screen-reader-support/visual-audio-text",
  ],

  audio: [
    "/quality-of-life/transcript",
    "/quality-of-life/pause-animation",
    "/quality-of-life/target-areas",
    "/screen-reader-support/visual-audio-text",
  ],
}

/**
 * Get unique heuristic slugs for a given set of component elements.
 *
 * This function takes an array of component element types and returns
 * a deduplicated array of heuristic slugs that are relevant to those elements.
 *
 * @param elements - Array of component element types to analyze
 * @returns Array of unique heuristic slugs (full paths like '/category/slug')
 *
 * @example
 * ```typescript
 * const elements: ComponentElement[] = ['text-input', 'button']
 * const heuristics = getHeuristicsForElements(elements)
 * // Returns: ['/meaningful-content/form-labels', '/keyboard-interaction/visible-focus', ...]
 * ```
 */
export function getHeuristicsForElements(
  elements: ComponentElement[]
): string[] {
  const heuristicSet = new Set<string>()

  // Collect all heuristics for the given elements
  for (const element of elements) {
    const heuristics = ELEMENT_HEURISTIC_MAP[element] || []
    for (const heuristic of heuristics) {
      heuristicSet.add(heuristic)
    }
  }

  // Convert Set to Array to return unique heuristics
  return Array.from(heuristicSet)
}
