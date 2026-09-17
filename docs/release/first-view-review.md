# Initial viewport review — 2026-09-17

## Changes
- Removed vertical centering and excessive top padding from the home hero. At 390px width, the heading starts at y=127px rather than y=249px.
- Reduced shared hero and breadcrumb spacing; retained a two-column layout on tablets. Mobile character introductions use compact horizontal cards.
- Added Chroma and Ebisu portraits beside the home introduction. Portrait sizes match their display size.
- Placed demo/proposal copy before artwork on mobile. Demo fictional-content notices remain visible, with details expandable.
- Kept animation and reduced-motion support, fixed contact actions, optimized images, and critical CSS delivery.

## Validation
- Reviewed 73 content routes at 390, 768, and 1440px widths (219 initial viewport screenshots). No horizontal overflow; mobile headings fit above the fixed contact dock in the tested 740px viewport.
- Checked heading, paragraph, label, and button wrapping at 320, 390, 768, and 1440px (292 route/width combinations): no detected overflow or isolated final punctuation/characters.
- After the final home viewport-height adjustment, checked 320×568, 390×664, 390×740, 390×844, 768×900, and 1440×900. The primary mobile CTA remained above the contact dock.
- Verified demo disclosure/menu, AI-to-contact navigation, and assistant opening.
- Targeted ESLint and git diff whitespace checks passed. Production static build and export audit passed (76 HTML files, 50 indexable pages).
- Tests used isolated headless Chrome viewport emulation, not physical iPhone Safari. Screenshots and raw measurements are in /tmp/ebissoft-firstview on the development machine.

GitHub Pages remains a noindex preview. Production deployment is a separate operation.
