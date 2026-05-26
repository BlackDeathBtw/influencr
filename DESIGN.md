# Design system — influencr

## Color strategy
Landing: Committed — deep charcoal hero + saffron accent carrying 40%+ of the hero surface.
App: Restrained — same accent used only for primary actions and active states.

## Palette (OKLCH)
- Brand accent: oklch(0.80 0.17 82) — saffron/amber, unexpected for influencer marketing
- Accent foreground: oklch(0.11 0.01 75)
- Hero/brand dark: oklch(0.11 0.022 258) — near-black with cool blue tint
- Background: oklch(0.985 0.004 245) — near-white, slightly cool
- Foreground: oklch(0.12 0.015 250)

## Typography
- Display headings (landing): Urbanist, 700–900 weight
- UI font: Geist (next/font default)
- Scale: 1.25+ ratio between steps

## Motion
- Library: motion/react v12
- Landing entrances: 400–500ms, ease-out-quart [0.16 1 0.3 1]
- Stagger: 80ms between elements
- App: no page-load sequences (product register)
- Micro-interactions: 150ms
