# DungDiBinhLuan Design System

Current direction: FC 27 launch campaign, updated 2026-09-15.

The canonical design specification is [NGON-NGU-THIET-KE.md](./NGON-NGU-THIET-KE.md).
The homepage implementation and release blueprint is [FC27-HOMEPAGE-BLUEPRINT.md](./FC27-HOMEPAGE-BLUEPRINT.md).

## Visual direction

A football editorial storefront at night: near-black surfaces, muted coral conversion accents, large player photography, bold Vietnamese typography and restrained motion. FC 27 is the primary campaign; FC 26 and its mod ecosystem remain available below it.

## Source of truth

- app/globals.css: brand primitives and shared semantic tokens.
- app/home.module.css: responsive homepage composition and component styling.
- app/page.tsx: server-rendered content, price and metadata.
- app/components/Navbar.tsx: shared navigation and authentication UI.

Do not introduce a second competing palette. Use semantic tokens; preserve existing authentication and purchase routes. The Vietnamese specification supersedes the previous FC 26 / VIP Arcade Booth document.
