# ZENTRA Responsive UI Architecture and Delivery Workflow

## Objective

ZENTRA must remain usable, readable, touch-friendly, and visually coherent on current iOS, Android, Windows, macOS, and tablet browsers. The layout must work from a 320px CSS viewport through large desktop displays without relying on device detection.

Responsive behavior is a system-level quality attribute. Every public, booking, authentication, client, and admin feature inherits the same viewport, spacing, overflow, motion, and accessibility rules.

## Architectural contract

The responsive hierarchy is:

1. `app/layout.tsx` owns the device viewport and safe-area behavior.
2. `app/globals.css` owns fluid layout tokens and non-negotiable browser-safe defaults.
3. `components/ui/ResponsiveLayout.tsx` owns reusable page, section, container, grid, action, and scroll-region primitives.
4. Persistent public and admin shells own device-specific navigation behavior.
5. Feature components compose the primitives and may add content-driven breakpoints, but may not bypass the global contract.
6. `scripts/check-responsive-ui.mjs` blocks known regressions during lint and deployment verification.

### Shared tokens

Use the variables in `app/globals.css` instead of repeating page-specific values:

| Token | Responsibility |
| --- | --- |
| `--layout-min-width` | Smallest supported CSS viewport (320px) |
| `--layout-max-width` | Maximum application content width |
| `--layout-reading-width` | Comfortable long-form reading width |
| `--layout-gutter` | Fluid phone-to-desktop horizontal padding |
| `--layout-section-space` | Fluid vertical section rhythm |
| `--layout-card-padding` | Fluid card and panel padding |
| `--layout-touch-target` | Minimum interactive target (44px) |
| `--layout-header-height` | Shared sticky-header offset |

### Reusable primitives

New features should begin with the exports from `components/ui/ResponsiveLayout.tsx`:

- `ResponsivePage`: route-level width, dynamic viewport height, and overflow boundary.
- `ResponsiveSection`: consistent vertical section spacing.
- `ResponsiveContainer`: centered fluid gutter and maximum width; use `readingWidth` for policy/content pages.
- `ResponsiveGrid`: content-driven cards that collapse without device-specific column counts.
- `ResponsiveActions`: wrapping action groups; primary controls become full-width on narrow phones.
- `ResponsiveScrollRegion`: keyboard-accessible, labeled horizontal region for truly tabular content.

Use `.responsive-dialog` for modal panels and `.touch-target` for compact icon buttons.

## Device and breakpoint model

Build mobile-first. Base styles must work at 320px before adding wider layouts.

| Range | Expected behavior |
| --- | --- |
| 320–639px | One-column flow, off-canvas navigation, stacked actions, no viewport-wide fixed panels |
| 640–767px (`sm`) | Large phones and small tablets; selectively pair short fields/actions |
| 768–1023px (`md`) | Tablet layout; persistent admin navigation may appear and two-column content is allowed |
| 1024–1279px (`lg`) | Laptop layout; denser toolbars and multi-column workspaces |
| 1280px+ (`xl`) | Desktop layout with bounded content width, never uncontrolled stretching |

Breakpoints respond to content pressure, not a device brand. Do not create iPhone-, iPad-, Samsung-, or orientation-specific branches unless a documented browser defect requires one.

The verification matrix is 320×568, 375×667, 390×844, 768×1024, 820×1180, 1024×768, 1280×800, and 1440×900. Test both portrait and landscape where the workflow is interaction-heavy.

## Component rules

### Layout and typography

- Prefer normal document flow, Grid, and Flexbox. Absolute positioning is for overlays and decoration only.
- Add `min-w-0` to flex/grid children that contain user or database text.
- Use `clamp()` or responsive utilities for display typography; never assume a heading fits on one line.
- Preserve a readable maximum width on large displays.
- Do not hide horizontal overflow to disguise a broken child. Fix the child or place intentional wide data in `ResponsiveScrollRegion`.

### Navigation and interaction

- Every hover interaction must have click/tap and keyboard equivalents.
- Interactive targets are at least 44×44 CSS pixels on touch layouts.
- Mobile navigation is an off-canvas layer with backdrop, Escape handling, scroll lock, visible close control, and correct `aria-*` state.
- Focus indicators must remain visible. Do not remove outlines without a replacement.

### Tables and dense admin data

Use this decision order:

1. Hide low-priority columns only when the omitted information remains reachable.
2. Provide a compact card/list presentation when row scanning remains clear.
3. Otherwise retain semantic `<table>` markup inside a labeled `ResponsiveScrollRegion`.

Never compress a wide operational table until text and actions become unreadable.

### Forms and dialogs

- Forms start as one column. Pair fields at `sm` or later only when both controls remain comfortably usable.
- Dialogs use a viewport-relative maximum height, internal scrolling, safe outer padding, and stacked mobile actions.
- Validation messages must wrap and remain adjacent to their controls.
- Do not let the on-screen keyboard cover the only submit/close action.

### Images and media

- Use `next/image` where practical with intrinsic dimensions or `fill` in a sized parent.
- Supply a truthful `sizes` expression so phones do not download desktop assets.
- Use `object-fit`/`object-position` intentionally and verify important image subjects are not cropped on portrait screens.
- Media must never exceed its container.

### Motion and effects

- Mark decorative animated subtrees with `data-motion="decorative"`; the global reduced-motion rule will minimize them.
- Loading/progress indicators may remain animated because they communicate state.
- Avoid scroll-driven movement that makes controls leave the viewport on short mobile screens.
- Validate blur, fixed backgrounds, and large shadows on physical mobile hardware; simplify expensive decoration at narrow widths if scrolling degrades.

### Safe areas and viewport units

- Use `dvh` for viewport-height UI. Do not use `h-screen` or raw `100vh`.
- Use `env(safe-area-inset-*)` for fixed controls and edge-to-edge surfaces.
- Prefer `w-full` and bounded max widths over `100vw`/`w-screen`, which can include scrollbar width and cause horizontal drift.

## Feature delivery workflow

Every feature or visual update follows this sequence:

1. **Classify the surface.** Public content, form, data workspace, modal/drawer, or media experience.
2. **Choose primitives first.** Start with the responsive page/container/grid/action/scroll contract.
3. **Implement at 320px.** Complete content order, touch targets, wrapping, keyboard flow, loading, empty, error, and long-data states.
4. **Enhance progressively.** Add `sm`, `md`, `lg`, or `xl` rules only where content needs more room.
5. **Exercise hostile content.** Long names/emails, large currency, untranslated text, empty data, maximum rows, validation errors, and slow images.
6. **Run automated gates.** `npm run typecheck`, `npm run lint`, and `npm run build`.
7. **Run the viewport matrix.** Check representative public, auth/booking, and admin routes with browser console/error-overlay checks.
8. **Perform physical-device smoke tests.** At minimum one current iOS Safari device and one Android Chrome device before a major UI release.
9. **Record exceptions.** Any intentional fixed width, horizontal scroll, or device workaround must be documented next to the component and in the pull request.

## Definition of done

A feature is responsive only when all statements are true:

- No page-level horizontal scrollbar exists at any verification width.
- Content is neither clipped nor hidden behind persistent/fixed UI.
- Navigation, menus, forms, and dialogs work with touch, mouse, and keyboard.
- Text remains readable at 200% zoom and long content wraps without breaking the shell.
- Tap targets and form controls are comfortably usable.
- Tables and media have an explicit narrow-screen strategy.
- Portrait and landscape layouts remain operable.
- Reduced-motion behavior is respected.
- Typecheck, lint (including the responsive contract), production build, and browser viewport checks pass.

## Pull request checklist

Copy this into UI-related pull requests:

- [ ] Started at 320px and used shared responsive primitives/tokens.
- [ ] Verified 320, 375/390, 768/820, 1024, 1280, and 1440 widths.
- [ ] Verified touch, keyboard, hover, focus, Escape, and scroll-lock behavior where applicable.
- [ ] Tested long/empty/error/loading content and 200% zoom.
- [ ] Confirmed no unintended horizontal overflow or fixed control collision.
- [ ] Added accurate image `sizes` and checked portrait cropping.
- [ ] Marked decorative motion and checked reduced-motion mode.
- [ ] Ran `npm run typecheck`, `npm run lint`, and `npm run build`.
