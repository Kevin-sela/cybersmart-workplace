# Design Guide

## Design direction

CyberSmart Workplace is a calm, practical learning service for working professionals. It should feel clear and trustworthy, with a strong reading experience and minimal decoration. Use the supplied light landing page and dashboard images as visual references.

Use the supplied landing page and dashboard images as the layout references. Preserve their composition: a clear top navigation and split hero on the public page, followed by the learning path, benefits and footer; a compact course sidebar, welcome area, progress summary and two-column overview on the dashboard. Apply this guide's palette, typography and spacing consistently across those layouts. Use white cards for modules and dashboard summaries, with a quiet border, restrained corners and little or no shadow. Keep related cards aligned and evenly spaced so the page reads as one system.

## Layout and spacing

- Use a centered content area with a comfortable maximum width. Keep long reading text to a readable measure.
- Design small screens first. Use a single column on phones; introduce sidebars and multi-column layouts when there is room for them.
- Use a consistent spacing scale: 4, 8, 12, 16, 24, 32, 48, and 64 px. Choose spacing by relationship and hierarchy rather than filling empty space.
- Use thin separators or subtle outlines to distinguish content surfaces. Keep card treatment consistent and avoid decorative borders or shadows that do not help navigation or hierarchy.
- Each module view shows its title, estimated duration, learning outcome, and completion state.
- Keep primary actions easy to find and label them with clear verbs.

## Typography

- Use Geist Sans for headings and DM Sans for body text and supporting copy.
- Use this type scale:

  | Text role | Typeface | Size | Weight |
  |---|---|---:|---:|
  | Page title | Geist Sans | 30-32 px | 700 |
  | Section heading | Geist Sans | 20 px | 600 |
  | Card title | Geist Sans | 16 px | 600 |
  | Body text | DM Sans | 14-15 px | 400 |
  | Subtext | DM Sans | 13-14 px | 400 |
  | Small labels | DM Sans | 11-12 px | 600 |

- Set body text and subtext to a line height of about 1.5.
- Keep supporting text readable and use small labels sparingly.
- Use sentence case for headings and navigation.

## Colour palette

Use the supplied palette with consistent meaning. The colors below are design tokens; do not add competing brand colors.

| Token | Colour | Use |
|---|---|---|
| Royal Blue | `#2541B2` | Brand mark, main headings, selected emphasis |
| Navigation | `#2E294E` | Course sidebar, footer, strong navigation surfaces |
| Ocean Blue | `#246A8F` | Links, secondary actions, interactive text |
| Jade Green | `#2A9D8F` | Primary actions and progress indicators |
| Lemon Gold | `#E9C46A` | Highlights and milestones |
| Soft Lavender | `#EDE7F6` | Occasional lesson category accent |
| Mist Blue | `#E7F3F7` | Information and supporting sections |
| Warm Ivory | `#FCFAF5` | Main page background |
| White | `#FFFFFF` | Content surfaces when a distinct surface is useful |
| Charcoal | `#20252B` | Main text |
| Slate Grey | `#52606D` | Secondary text |
| Success Green | `#287D5A` | Completion and positive feedback |
| Error Red | `#B42318` | Errors and failed actions |

Keep text and controls legible against their backgrounds. Use dark text on Jade Green and Lemon Gold fills; verify color contrast for body text and interactive controls. Do not use color alone to communicate quiz correctness or progress.

## Interaction

- Provide a visible keyboard focus style and make links and buttons visually distinct.
- Show quiz feedback beside the relevant question, with an explanation for each answer.
- Warn before losing unsaved forum or group-task text.
- Show progress as text and a visual indicator.
- Give error messages a clear recovery action.

## Accessibility and resilience

- Use semantic headings, labelled controls, and keyboard-accessible navigation.
- Keep touch controls comfortable to use on phones.
- Provide captions or transcripts for audio and video. Provide a downloadable text version for core lessons.
- Avoid autoplay and unnecessary motion. Respect reduced-motion preferences.
- Use compressed media and keep the landing page useful without the API.

## Key screens

1. Public course landing page.
2. Course overview and learner progress.
3. Text-first reading lesson.
4. Scenario-based media lesson.
5. Moderated discussion and collaborative task.
6. Quiz with immediate feedback.
7. Completion summary and learner survey.

## Design-system references

- [GOV.UK Design System: layout](https://design-system.service.gov.uk/styles/layout/) — small-screen-first layouts and readable content widths.
- [GOV.UK Design System: spacing](https://design-system.service.gov.uk/styles/spacing/) — consistent spacing scales.
- [GOV.UK Design System: colour](https://design-system.service.gov.uk/styles/colour/) — functional colour roles and contrast guidance.
- [GOV.UK Frontend: choosing a font without GOV.UK branding](https://frontend.design-system.service.gov.uk/using-govuk-frontend-without-govuk-branding/) — recommends a local Helvetica/Arial stack for other services.
- [Atlassian Design: typography scale](https://atlassian.design/foundations/typography/product-typefaces-and-scale) — consistent type sizes and line heights.
