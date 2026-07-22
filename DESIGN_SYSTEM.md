# FlowSight Design System

This is the locked visual foundation for the FlowSight web experience. The system should feel calm, clear, human, and financially trustworthy. Orange signals engagement; it is not decorative wallpaper.

## Color palette

| Role | Color | Use |
| --- | --- | --- |
| Ground | `#FFFFFF` | Primary page surface |
| Tinted surface | `#F5F6FA` | Alternating sections and quiet containers |
| Border | `#E2E5EB` | Resting dividers and controls |
| Hover border | `#D0D4DC` | Interactive hover state |
| Brand | `#D4754A` | Primary actions, active controls, editorial labels |
| Logo | `#111111` | Icon and wordmark on light surfaces |
| Heading | `#0F1D3A` | Headlines, key values, text on orange buttons |
| Body | `#374151` | Primary reading text |
| Muted | `#6B7280` | Supporting labels and metadata |
| Dark surface | `#0C1628` | High-emphasis product and trust sections |
| Clear | `#2D8B5A` | Healthy forecast condition |
| Watch | `#CA8A04` | Attention condition |
| Tight | `#B44455` | Material risk condition |
| Update Needed | `#6B7280` | Stale or incomplete data condition |

Use tinted versions of condition colors for badge backgrounds. Never use a condition color to decorate unrelated content.

### Accessibility note

White normal-size text on `#D4754A` has insufficient contrast. Primary orange buttons therefore use `#0F1D3A` text. White remains appropriate on the dark navy surface. Focus, selected, disabled, and error states must never rely on color alone.

## Logo

- Use the black SVG icon and black Bricolage Grotesque wordmark on light surfaces.
- Swap both to white on `#0C1628`.
- Do not place the mark in a colored pill or filled tile.
- Keep the logo neutral so the brand orange remains reserved for interaction.

## Typography

- Display and headings: Bricolage Grotesque, weight 500, letter spacing `-0.01em`.
- Section labels: uppercase, 12px, weight 400, letter spacing `0.15em`, brand orange.
- Body: DM Sans, 15–16px, weight 400, line height `1.7`.
- Card titles: Bricolage Grotesque, 18–20px, weight 500.
- Financial values: DM Mono, weight 500, tabular figures, normally heading navy.
- Avoid weights above 600 except where a compact accessibility treatment genuinely needs it.

## Interaction model

Every control follows the same escalation: quiet at rest, attentive on hover, committed when active or selected.

### Primary actions

- Rest: `#D4754A` fill, `#0F1D3A` text.
- Hover: `#BF6943`, slight lift, subtle navy shadow.
- Active: `#B4633F`, `scale(0.98)`.
- Focus: 3px ring using `rgba(212,117,74,0.20)`.
- Disabled: no lift, no shadow, reduced opacity, `not-allowed` cursor.

The navigation **Join Beta**, hero **Join the Beta**, form submit, and final CTA all use this treatment so the action becomes visibly highlighted on hover.

### Secondary buttons and links

- Rest with a quiet border or muted text.
- Hover changes the border from `#E2E5EB` to `#D0D4DC`, deepens the text, and may add the standard card shadow.
- Active uses `scale(0.98)` when the element reads as a button.
- Text links gain an underline or visible color shift; do not communicate hover only through movement.

### Cards, tabs, and selectors

- Rest: quiet border, no prominent shadow.
- Hover: `#D0D4DC` border and `0 2px 8px rgba(15,29,58,0.06)` shadow.
- Selected: orange border, tint, indicator, or ring. Preserve a text/icon cue in addition to color.
- Keep fact-heavy comparisons under user control. Auto-advance is reserved for lightweight product demonstrations where the current state remains understandable.

### Inputs and accordions

- Inputs use the standard border at rest, hover border on hover, and the shared focus ring while focused.
- Error states use Tight rose plus a clear text explanation.
- Accordion rows receive a subtle tinted hover surface; their plus/chevron visibly changes when open.

## Motion

- Default transition: `all 150ms ease-out`.
- Larger view transitions: 250ms using `cubic-bezier(0.19, 1, 0.22, 1)`.
- Motion should clarify state, causality, or sequence—not keep the page busy.
- Respect `prefers-reduced-motion`; remove lifts, presses, and automatic motion when requested.

## Surface rhythm

Alternate white and `#F5F6FA` to divide the scroll into readable chapters. Use full-bleed dark navy only for moments that benefit from increased seriousness or contrast. Rounded containers may sit on the tinted surface, but should use the same border and shadow rules as interactive cards.

## Product integrity

- Forecast visuals must distinguish confirmed, estimated, and hypothetical events.
- Condition colors always retain their financial meaning.
- Interactive examples must clearly communicate that they are illustrative.
- Do not use fake confidence percentages, fake security claims, or decorative animation presented as live calculation.
