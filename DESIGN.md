---
name: DungDiBinhLuan
description: Premium dark gaming SaaS for FC 26 mod distribution — 3-layer surfaces, coral CTA/VIP accent, violet mod/profile accent, tactile & confident components.
colors:
  primary: "#f06078"
  primary-strong: "#e14a68"
  secondary: "#8f7bf7"
  surface-0: "#0c0e13"
  surface-1: "#151922"
  surface-2: "#1d2330"
  text-title: "#f4f5f7"
  text-body: "#b6bcc9"
  text-muted: "#7c8494"
  line: "rgba(255,255,255,0.08)"
  ok: "#3ddc97"
  warn: "#f4b860"
  danger: "#f45d6a"
typography:
  display:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 2rem)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Be Vietnam Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "0.06em"
    textTransform: "uppercase"
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "16px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-strong}"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.text-title}"
    borderColor: "{colors.line}"
    rounded: "{rounded.md}"
  button-secondary-hover:
    backgroundColor: "{colors.surface-1}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-body}"
    borderRadius: "{rounded.md}"
  badge:
    borderRadius: "{rounded.sm}"
    fontSize: "11px"
    fontWeight: 900
    letterSpacing: "0.06em"
    textTransform: "uppercase"
  card:
    backgroundColor: "{colors.surface-1}"
    borderColor: "{colors.line}"
    borderRadius: "{rounded.lg}"
  input:
    backgroundColor: "{colors.surface-0}"
    borderColor: "{colors.line}"
    borderRadius: "{rounded.md}"
    padding: "10px 16px"
---

# Design System: DungDiBinhLuan

## Overview

**Creative North Star: "The VIP Arcade Booth"**

DungDiBinhLuan feels like a premium booth inside a gaming arcade after dark: the room is pitch-dark by default, but the surfaces you interact with are solid, layered, and warm — never flat black. Three stepped surfaces carry the depth (page background → normal card → raised/hover), so hierarchy is felt through tonal lift rather than decorative borders or glow. The primary accent, coral, is reserved like a VIP lane rope: it marks purchase, upgrade, and the membership crown. Violet, the secondary accent, lives on the quieter side of the booth — profile, mod library, unlocks — giving the space a two-lane identity: "you pay with coral, you play with violet."

Typography is tall, dense, and confident: Be Vietnam Pro with heavy weights (900/700) and tight tracking on titles, uppercase micro-labels with wide tracking on metadata. Motion is restrained and purposeful (150ms color transitions, one hero pulse), and every state (loading, error, empty) is a designed moment with copy and a next action. Accessibility is structural — coral focus-visible rings, keyboard tabs, reduced-motion respected — not an afterthought.

**Key Characteristics:**
- 3-layer surface system (surface-0 page / surface-1 card / surface-2 raised) — depth via tonal layering, not flat black.
- Dual accent lanes: coral = CTA/VIP (primary), violet = profile/mod (secondary).
- Tactile & confident components — bold typography, heavy label caps, generous 12px radii, solid coral primary.
- Empty states and zero counts always carry copy + an action; nothing dangles.
- Dark surfaces are tinted, never pure black; hairline borders carry structure with low opacity (8–12% white).

## Colors

A near-black navy-tinted base with two saturation accents. Coral dominates every conversion moment; violet modulates ownership surfaces.

### Primary
- **Coral** (#f06078, strong #e14a68): The VIP lane. Sold on primary buttons, membership hero, VIP badges, progress-time bars, focus rings, and the active mobile tab. Its shadow lives hot (`0 8px 24px -12px rgba(240,96,120,0.55)`).

### Secondary
- **Violet** (#8f7bf7): The ownership lane. Used for profile, mod library, unlocked-mod grids, violet buttons/badges, and violet stat accents. Communicates "content you now own / can unlock."

### Neutral
- **Surface 0** (#0c0e13): Page canvas and input fills — darkest, closest to the booth floor.
- **Surface 1** (#151922): Normal card background — the standard resting surface.
- **Surface 2** (#1d2330): Raised/hover surface, active sidebar item, skeleton base.
- **Title text** (#f4f5f7): Near-white, only on high-contrast titles and values.
- **Body text** (#b6bcc9): Default interactive/reading text.
- **Muted text** (#7c8494): Labels, hints, metadata, timestamps.
- **Line** (rgba(255,255,255,0.08), hover 0.12): All hairline borders.
- **OK** (#3ddc97): Success, active-plan indicator, checklists.
- **Warn** (#f4b860): Pending/warning states.
- **Danger** (#f45d6a): Destructive actions, errors, danger zone.

### Named Rules
**The VIP Lane Rule.** Coral appears on conversion and value moments only — buttons that buy/upgrade, VIP crown, active-membership emphasis. It must stay ≥ 80% less common than neutral surfaces on any screen; its rarity is the point.
**The Two-Lane Rule.** Coral and violet never share one interaction surface. If a row is about paying/upgrading use coral; if it's about content you own/unlock use violet. Mixing them on one element dilutes both accents.

## Typography

**Display Font:** Be Vietnam Pro (fallback ui-sans-serif, system-ui, sans-serif)
**Label Font:** Be Vietnam Pro, uppercase with wide tracking — no distinct mono face in the system.

**Character:** Dense and aspiring — heavy weights and tight tracking uptown, tiny uppercase micro-labels downtown. Vietnamese diacritics are first-class: Be Vietnam Pro is chosen for clean rendering at small sizes.

### Hierarchy
- **Display** (900, clamp 1.5–2rem, line-height 1.1, tracking -0.02em): Hero value statements only — membership crown numbers, big stat values.
- **Headline** (700, 1.5rem, 1.2): Section-card titles like "Gói membership".
- **Title** (700, 1.125rem, 1.25): Card inner titles, plan names, stat labels.
- **Body** (400, 0.875rem, 1.625, ~65ch max): Descriptions, list items, hints. Tuned for Vietnamese copy rhythm.
- **Label** (900, 0.6875rem, 1.2, tracking 0.06em, uppercase): Micro-labels — stat card labels, badge text, input labels, tab meta.

### Named Rules
**The Tight-Tracking Rule.** Titles and labels use tight/negative or wide tracking deliberately: display/headline titles tracking -0.02em; uppercase labels tracking +0.06em. Never default tracking on headings.

## Layout

Content rides a `max-w-6xl` container (1152px) with `px-4 sm:px-6` gutters. The account dashboard uses a `lg:grid-cols-[240px_minmax(0,1fr)]` two-rail layout: sticky sidebar (240px) left, fluid content right. Below `lg`, the sidebar dissolves into a horizontal scrollable tab rail (`overflow-x-auto`, `min-w-max`), pinned above content with `-mx-4 sm:-mx-6` edge bleed.

Spacing rhythm is a 4px base with py-6/py-8 page padding; cards use `p-5 sm:p-6`; lists gap `gap-4`; stat grids `grid-cols-2 lg:grid-cols-4`. Form rows stack on mobile and become `sm:flex-row` at ≥640px. Content never exceeds viewport — every rail uses `min-w-0` and horizontal overflow is contained to the tab strip only.

## Elevation & Depth

This system is **layered, not lifted**. Depth is communicated by three tonal surface steps plus one subtle interior highlight (`inset 0 1px 0 rgba(255,255,255,0.03)`), not by big drop shadows. Raised surfaces (surface-2) gain a slightly stronger border (white 0.12) and a deeper soft shadow (`0 16px 40px -20px rgba(0,0,0,0.8)`) to register interactive elevation.

### Shadow Vocabulary
- **Card shadow** (`0 10px 30px -18px rgba(0,0,0,0.7)`): resting normal cards.
- **Raised shadow** (`0 16px 40px -20px rgba(0,0,0,0.8)`): hover, focal cards, membership hero.
- **Coral glow** (`0 8px 24px -12px rgba(240,96,120,0.55)` + hero `0 10px 30px -10px rgba(240,96,120,0.6)`): reserved for primary CTA buttons and the VIP crown tile — the only saturated glow in the system.

### Named Rules
**The Layered-Depth Rule.** Never stack multiple cards inside a card to create hierarchy. Lift a child by switching to surface-raised, not by adding another border card around it.

## Shapes

Radius language is consistent and generous: **12px** (rounded-xl) is the default interactive radius (buttons, inputs, nav items), **16px** (rounded-2xl) for containers (cards, membership hero), **6px** (rounded-lg) for badges and focus outlines.

Borders are hairline and low-opacity: `--color-line` (white 8%) at rest, 12% on raised/hover. Inputs and badges follow the same shape story. The only "sharp" geometry is reserved for small metadata — icon strokes (1.7px), tiny badges — never on surfaces. Focus visibility is a 2px coral outline at 2px offset, unifying all interactive elements.

## Components

All components are **tactile and confident**: solid, slightly-rounded, heavily-worded (font-black labels), instant-state feedback at 150ms.

### Buttons
- **Shape:** 12px radius, full-width-on-mobile for primary CTAs.
- **Primary:** Coral solid (#f06078), white bold text, `px-6 py-3` (lg) / `px-4 py-2.5` (md) / `px-3 py-1.5` (sm); coral glow shadow; hover → coral-strong (#e14a68), 150ms color transition. Disabled: 40% opacity, no pointer events.
- **Secondary:** Surface-2 fill, title text, hairline border; hover surface-1 + border white/20.
- **Ghost:** Transparent, body text; hover title text + surface-2 fill.
- **Violet:** Violet 15% fill, violet text, violet/25 border; hover violet/25 fill — used on content-ownership actions.
- **Danger:** Danger 10% fill, danger text, danger/25 border; hover danger/20 — destructive paths only.

### Badges
- **Shape:** 6px radius, 11px, uppercase, font-black, tracking-wide, hairline border.
- **Tones:** coral / violet / ok / warn / danger at ~12% fill of the accent with 25% border; neutral is white/6 fill, body text, white/12 border. Always contains an inline icon where meaning matters (check, crown).

### Cards / Containers
- **Corner Style:** 16px radius.
- **Background:** Surface-1 at rest; raised → surface-2 with stronger border (white/12).
- **Shadow Strategy:** resting → card shadow; hover/focal → raised shadow (see Elevation).
- **Border:** 1px `--color-line` at rest; accent borders (coral/25) only for VIP/active content.
- **Internal Padding:** `p-5 sm:p-6`; header row `px-5 py-4 sm:px-6 sm:py-5` with a bottom hairline.

### Inputs / Fields
- **Style:** Surface-0 fill (darkest step), 12px radius, hairline border, body text, `placeholder:text-muted`.
- **Focus:** Border flips to coral + 2px coral ring at 20% opacity — the keyboard operator's beacon.
- **Error:** Border danger/50, focus border + ring danger/25; inline `role="alert"` message in danger text below.
- **Disabled:** 40% opacity.
- **Prefix icon:** left 14px, muted, pointer-events-none; input left-padded 40px.

### Navigation
- **Desktop sidebar:** Surface-card rail with 12px items; active = surface-2 fill + title text + coral icon; hover = surface-2/60 + title text.
- **Mobile tabs:** Horizontal scrollable pills; active = coral/15 fill + coral text + coral/30 border; inactive = surface-1 + body. `role=tablist` + arrow-key navigation.

### Stat cards
- **Shape:** 16px radius, surface-card, `p-4 sm:p-5`.
- **Content:** accent icon (coral/violet/ok/neutral) + Display-black value (text-xl font-black) + uppercase label + optional micro-hint. Whole card is a hit target when navigable; hover → surface-raised.

### Membership hero (signature)
- **Active VIP:** raised surface + coral/25 border, crown tile (coral/15 fill or coral solid + glow for CTA), Display-black plan name, exact expiry with days-left, coral progress time-bar with `role=progressbar` semantics, ghost "Gia hạn" action.
- **Upsell state:** coral/30 border, coral solid crown tile with glow, Display "Nâng cấp lên VIP", primary lg CTA — the strongest visual moment on the page.

### Empty & error states
- Icon tile (56px, 14px radius, muted) → title (headline) → body description → single primary CTA (chevron) + optional footnote. Never leave a zero list without a next step.

## Do's and Don'ts

### Do:
- **Do** step depth with the three surfaces (0 → card → raised) instead of adding nested border cards.
- **Do** use coral only for conversion/value (buy, upgrade, VIP) and violet only for ownership (profile, mods, unlocks) — the Two-Lane Rule.
- **Do** give every empty list and zero-value stat an explanation and a CTA.
- **Do** use uppercase font-black micro-labels (11px, tracking 0.06em) for metadata.
- **Do** render coral focus-visible rings (2px, 2px offset) on all interactive elements.
- **Do** keep hairline borders at 8% white (12% on raised) — structure, not decoration.
- **Do** respect reduced motion: animations collapse to ~0.01ms; functionality stays.

### Don't:
- **Don't** use flat pure-black backgrounds or pure-gray text — always tint toward the navy dark base.
- **Don't** apply glow outside coral CTAs, the crown tile, and VIP focal moments.
- **Don't** use glassmorphism or backdrop-blur on account surfaces.
- **Don't** multiply gradients or animated backgrounds; the system is layered-lift, not liquid.
- **Don't** mix coral and violet on one interaction.
- **Don't** let content overflow horizontally below 320px — horizontal scroll is confined to the mobile tab strip.
- **Don't** use bounce/elastic easing — surface transitions are 150ms color shifts.