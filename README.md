# Global Care Health — Bangladesh Landing Page

A premium, conversion-focused, country-specific medical-tourism landing page for
**patients from Bangladesh 🇧🇩 seeking medical treatment in India 🇮🇳**, built for
**Global Care Health**.

Goal: attract Bangladeshi patients and convert them into leads via enquiry form,
WhatsApp, phone calls and treatment-plan requests.

---

## 1. Tech stack

- **HTML5** (clean, semantic, SEO-friendly)
- **CSS3** (custom design system with CSS variables)
- **JavaScript** (vanilla — no framework)
- **Bootstrap 5.3** (grid, navbar, accordion, utilities — **vendored locally** in `/vendor`)
- **Font Awesome 6** (icons — **vendored locally** in `/vendor`)
- **Google Fonts** — Plus Jakarta Sans + Manrope (loaded from Google; falls back to
  system fonts automatically if offline)

No build step required. It is a static site — open and go. Bootstrap, Font Awesome
and the placeholder images are all bundled in the project, so the layout, icons and
imagery render **even with no internet connection**.

---

## 2. Folder structure

```
bangladesh-landing-page/
├── index.html          # All page sections + SEO meta + JSON-LD schema
├── css/
│   └── style.css       # Design system, components, responsive rules
├── js/
│   └── script.js       # Scroll animations, counters, form, back-to-top, etc.
├── images/             # Local SVG placeholder images (branded, clearly marked)
│   └── README.txt      # Notes on replacing placeholder images
├── vendor/             # Bundled Bootstrap 5 + Font Awesome 6 (works offline)
│   ├── bootstrap/
│   └── fontawesome/
└── README.md           # This file
```

---

## 3. How to run

**Option A — open directly**
Double-click `index.html`. (File uploads in the form may be limited on the
`file://` protocol in some browsers.)

**Option B — local server (recommended)**

```bash
# Python 3
cd bangladesh-landing-page
python3 -m http.server 8000
# then open http://localhost:8000
```

```bash
# or Node
npx serve .
```

No internet connection is required — Bootstrap, Font Awesome and all placeholder
images are bundled in the project. (Google Fonts loads online for the exact
brand typefaces and falls back to clean system fonts if offline.)

**Responsive check:** verified with no horizontal overflow at 360, 375, 390, 414,
768, 1024, 1280 and 1440 px. Desktop (≥1200px) shows the full nav; tablet and
mobile (≤1199px) use the hamburger menu.

---

## 4. Page sections

Sticky header · Hero (BD→IN route) · Trust stats · Why Bangladeshi patients
choose India · Popular treatments · Leading hospitals · **Personalized treatment
plan form** · Patient journey timeline · Visa & travel assistance · Why Global
Care Health · Treatment cost (no fabricated prices) · Doctors · Testimonials
(incl. video support) · Bangladesh-specific contact block · FAQ accordion ·
Final CTA · Footer · Floating WhatsApp / phone / back-to-top / sticky mobile CTA.

---

## 5. ⚠️ IMPORTANT — edit these before publishing

This page is **production-ready in structure**, but all unverifiable content is
intentionally left as editable placeholders. Search `index.html` for these
markers and replace them:

- `[CMS Field]` — contact numbers, addresses, working hours, doctor/hospital details
- `[Replace with verified data]` — stats, images, descriptions, OG image

**Do NOT publish invented:** hospital rankings/accreditations/awards, doctor
names or experience, patient numbers, treatment prices, testimonials, government
approvals, visa guarantees or success rates.

Specific spots to update:

| What | Where |
|---|---|
| WhatsApp number | Every `https://wa.me/910000000000` → your number (intl format, no `+`/spaces) |
| Phone number | `tel:+910000000000` and footer/BD-contact fields |
| Trust statistics | `data-target="..."` attributes in the Stats section |
| Hospital city/specialties/description | Hospital cards (`[CMS Field]`) |
| Doctor cards | All fields are `[CMS Field]` placeholders |
| Testimonials | Replace placeholder text + add consent; wire real video via `data-video-url` |
| Bangladesh contact block | Phone, WhatsApp, office, hours, emergency |
| Footer contact + legal entity | Confirm "Lavayna Medicare Solutions Pvt. Ltd." wording |
| Images | Replace the local SVG placeholders in `/images` with licensed photos (see `images/README.txt`) |
| Canonical URL / OG URL | Confirm final domain + path |

---

## 6. Connecting the enquiry form to leads

The form (`#treatmentPlanForm`) currently runs **client-side validation + a demo
success message only**. To capture real leads, open `js/script.js` (section 7)
and replace the demo block with a real submission to your CRM / ERP / email
endpoint, for example:

```js
var data = new FormData(form);
fetch('https://your-endpoint.example/api/lead', { method: 'POST', body: data })
  .then(function (r) { /* show success */ })
  .catch(function (e) { /* show error */ });
```

Because your role involves ERP-based lead flow and query handling, this form can
be pointed straight at that intake endpoint so enquiries land in your existing
pipeline.

---

## 7. SEO included

- SEO title, meta description, keywords, robots, canonical
- Open Graph + Twitter card tags
- Single `<h1>` with proper `H2`/`H3` hierarchy
- Descriptive image `alt` text
- **JSON-LD**: `MedicalOrganization` + `FAQPage` (keep FAQ schema in sync with
  the visible FAQ text)
- Suggested URL: `/medical-treatment-in-india/bangladesh`

Primary keyword: *Medical Treatment in India for Bangladesh Patients*.

---

## 8. Responsive & accessibility

- Mobile-first; tested layout targets: 360 / 375 / 390 / 414 / 768 / 1024 / 1280 / 1440 px
- Hamburger menu + sticky bottom CTA bar on mobile
- Touch-friendly buttons, readable typography
- Skip-to-content link, ARIA labels, keyboard-focusable controls
- Respects `prefers-reduced-motion`

---

## 9. Customizing the look

All brand colors live at the top of `css/style.css` under
`:root { ... }` (section 1). Change `--gc-primary`, `--gc-secondary`, etc. to
match the exact Global Care Health brand kit and the whole page updates.

---

_Built as a static, framework-free landing page so it is easy to host anywhere
(Netlify, Vercel, cPanel, S3, or inside your existing site)._
