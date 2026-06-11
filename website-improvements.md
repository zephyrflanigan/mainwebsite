# Website Improvement Suggestions — zephyrflanigan.com

A comprehensive review of the current site (June 2026) covering bugs, JavaScript modernization, aesthetics, SEO, performance, accessibility, and scalability. Each item includes a difficulty rating and a concrete fix.

---

## Table of Contents

1. [Critical Fixes](#1-critical-fixes)
2. [Scalability & Code Quality](#2-scalability--code-quality)
3. [JavaScript Enhancements](#3-javascript-enhancements)
4. [Aesthetics & Animation](#4-aesthetics--animation)
5. [SEO & Meta Tags](#5-seo--meta-tags)
6. [Performance](#6-performance)
7. [Accessibility](#7-accessibility)
8. [Dark Mode](#8-dark-mode)
9. [UX Micro-improvements](#9-ux-micro-improvements)

---

## 1. Critical Fixes

### 1a. Social buttons on index.html go nowhere

**Difficulty: Easy**

The LinkedIn and GitHub `<a>` tags in the hero right panel have no `href` attribute — they render as styled buttons but clicking does nothing.

```html
<!-- Current (broken) -->
<a class="btn font-jetbrains ...">LinkedIn</a>

<!-- Fix -->
<a href="https://linkedin.com/in/YOUR_HANDLE" target="_blank" rel="noopener noreferrer"
   class="btn font-jetbrains ...">LinkedIn</a>
<a href="https://github.com/YOUR_HANDLE" target="_blank" rel="noopener noreferrer"
   class="btn font-jetbrains ...">GitHub</a>
```

---

### 1b. Profile image missing `alt` text

**Difficulty: Easy**

`<img src="./images/pfp.jpg">` has no alt attribute. Screen readers will read out the file path, and it's an SEO failure.

```html
<!-- Fix -->
<img src="./images/pfp.jpg" alt="Zephyr Flanigan">
```

---

## 2. Scalability & Code Quality

### 2a. Navbar and drawer HTML duplicated across all 4 pages

**Difficulty: Medium**

The navbar (~35 lines), mobile drawer (~40 lines), and the inline `<style>` block (~35 lines) are copy-pasted verbatim into every page. Any change to the nav requires editing 4 files in sync — a maintenance trap.

**Option A — Vanilla JS component injection (no build tool needed)**

Create `src/components.js` and load it first in every page:

```js
// src/components.js
const NAV_HTML = `
<nav class="navbar-start fixed top-0 left-0 w-full bg-transparent z-50 px-4">
  <!-- ... single source of truth ... -->
</nav>
`;

const DRAWER_HTML = `
<div id="nav-overlay" ...></div>
<aside id="nav-drawer" ...>...</aside>
`;

document.getElementById('nav-root').innerHTML = NAV_HTML;
document.getElementById('drawer-root').innerHTML = DRAWER_HTML;
```

Then in every HTML page, replace the nav and drawer blocks with:

```html
<div id="nav-root"></div>
<!-- ... page content ... -->
<div id="drawer-root"></div>
<script src="./src/components.js"></script>
<script src="./src/main.js"></script>
```

**Option B — Move to a static site generator (recommended long-term)**

Astro, Eleventy, or even a simple Vite + HTML template setup lets you write the nav once as a layout file. Zero duplication, faster builds, easy to scale to more pages.

```
# Astro example
npm create astro@latest
```

---

### 2b. Inline `<style>` block duplicated in every page

**Difficulty: Easy**

The drawer/nav CSS (`#nav-overlay`, `#nav-drawer`, `.drawer-link`, `nav.scrolled`) is defined inline in every `<head>`. Move it to `src/input.css` once:

```css
/* src/input.css — add these */
#nav-overlay {
  transition: opacity 0.3s ease;
  opacity: 0;
  pointer-events: none;
  background-color: rgba(74, 60, 48, 0.6);
}
body.drawer-open #nav-overlay { opacity: 1; pointer-events: auto; }

#nav-drawer {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(100%);
  will-change: transform; /* GPU compositing hint */
}
body.drawer-open #nav-drawer { transform: translateX(0%); }

.drawer-link { transition: color 0.2s ease, background-color 0.2s ease; }

nav { transition: background-color 0.3s ease, box-shadow 0.3s ease; }
nav.scrolled {
  background-color: #F0EBE0;
  box-shadow: 0 1px 12px rgba(61, 42, 42, 0.08);
}
```

Then delete all four `<style>` blocks from the HTML files and rebuild the CSS (`npx @tailwindcss/cli -i src/input.css -o src/output.css`).

---

### 2c. Global-scope JS functions

**Difficulty: Easy**

`openDrawer()` and `closeDrawer()` are declared on `window` (global scope), which can conflict with other scripts. Wrap `main.js` in a module or IIFE:

```js
// src/main.js — wrap everything
(function () {
  const openBtn = document.getElementById('nav-open');
  const body = document.body;

  function openDrawer() {
    body.classList.add('drawer-open');
    body.style.overflow = 'hidden';
    openBtn.setAttribute('aria-expanded', 'true');
    document.getElementById('nav-drawer').focus();
  }

  function closeDrawer() {
    body.classList.remove('drawer-open');
    body.style.overflow = '';
    openBtn.setAttribute('aria-expanded', 'false');
    openBtn.focus();
  }

  document.getElementById('nav-open').addEventListener('click', openDrawer);
  document.getElementById('nav-close').addEventListener('click', closeDrawer);
  document.getElementById('nav-overlay').addEventListener('click', closeDrawer);

  // Remove inline onclick="openDrawer()" from HTML after this change
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && body.classList.contains('drawer-open')) closeDrawer();
  });

  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
})();
```

This also lets you remove all `onclick="..."` attributes from the HTML, which is cleaner.

---

## 3. JavaScript Enhancements

### 3a. Scroll-triggered entrance animations (IntersectionObserver)

**Difficulty: Easy**

Elements appear instantly — a subtle fade + slide-up as they enter the viewport makes the site feel alive and modern.

```css
/* src/input.css */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
}
```

```js
// src/main.js — add after your drawer code
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // animate once
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
```

Then add `class="reveal"` to sections, project cards, and role blocks you want to animate:

```html
<!-- about.html -->
<section class="mb-20 reveal">...</section>

<!-- portfolio.html -->
<article class="project-card reveal ...">...</article>
```

---

### 3b. Staggered hero text reveal

**Difficulty: Easy**

Instead of all hero text appearing at once, stagger the lines with CSS animation delays. No JS needed.

```css
/* src/input.css */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hero-line {
  opacity: 0;
  animation: fadeSlideUp 0.6s ease forwards;
}
.hero-line:nth-child(1) { animation-delay: 0.1s; }
.hero-line:nth-child(2) { animation-delay: 0.25s; }
.hero-line:nth-child(3) { animation-delay: 0.4s; }
.hero-line:nth-child(4) { animation-delay: 0.55s; }
.hero-line:nth-child(5) { animation-delay: 0.7s; }

@media (prefers-reduced-motion: reduce) {
  .hero-line { opacity: 1; animation: none; }
}
```

```html
<!-- index.html hero left panel -->
<div class="flex flex-col justify-center max-w-md w-full">
  <h2 class="hero-line ...">Hi, I'm</h2>
  <h1 class="hero-line ...">Zephyr Flanigan</h1>
  <h2 class="hero-line ...">Full Stack Engineer</h2>
  <p  class="hero-line ...">I enjoy building thoughtful...</p>
  <div class="hero-line flex flex-wrap gap-3">...</div>
</div>
```

---

### 3c. Typewriter effect on hero subtitle

**Difficulty: Easy**

A blinking-cursor typewriter on "Full Stack Engineer" is a signature move for developer portfolios.

```js
// src/main.js
function typewriter(element, text, speed = 60) {
  element.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    element.textContent += text[i++];
    if (i === text.length) {
      clearInterval(interval);
      element.classList.add('typing-done'); // stops cursor blink after finish (optional)
    }
  }, speed);
}

// Run after a short delay so the stagger animation completes first
const subtitle = document.getElementById('hero-subtitle');
if (subtitle) {
  const original = subtitle.textContent.trim();
  setTimeout(() => typewriter(subtitle, original), 500);
}
```

```css
/* src/input.css */
#hero-subtitle::after {
  content: '|';
  animation: blink 0.8s step-start infinite;
  margin-left: 2px;
  color: currentColor;
}
#hero-subtitle.typing-done::after { display: none; }

@keyframes blink {
  50% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  #hero-subtitle::after { display: none; }
}
```

```html
<!-- index.html -->
<h2 id="hero-subtitle" class="font-medium text-xl font-jetbrains text-mauve mb-5">
  Full Stack Engineer
</h2>
```

---

### 3d. Copy email to clipboard (contact page)

**Difficulty: Easy**

Add a small clipboard button next to the email address that copies it and shows a "Copied!" tooltip.

```html
<!-- contact.html — beside the email display -->
<div class="flex items-center gap-3">
  <span id="email-text" class="font-jetbrains text-mauve">zephyr.flan@gmail.com</span>
  <button id="copy-email" aria-label="Copy email address"
          class="btn btn-ghost btn-xs text-lichen hover:text-olive">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none"
         viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  </button>
  <span id="copy-confirm" class="font-jetbrains text-xs text-lichen opacity-0 transition-opacity">Copied!</span>
</div>
```

```js
// src/main.js
const copyBtn = document.getElementById('copy-email');
if (copyBtn) {
  copyBtn.addEventListener('click', async () => {
    const email = document.getElementById('email-text').textContent.trim();
    await navigator.clipboard.writeText(email);
    const confirm = document.getElementById('copy-confirm');
    confirm.classList.replace('opacity-0', 'opacity-100');
    setTimeout(() => confirm.classList.replace('opacity-100', 'opacity-0'), 2000);
  });
}
```

---

### 3e. Back-to-top button

**Difficulty: Easy**

The about page is long. A back-to-top button that appears after scrolling 300px is a common modern touch.

```html
<!-- Add to about.html (and any long page) before </body> -->
<button id="back-to-top" aria-label="Back to top"
        class="fixed bottom-8 right-8 btn btn-circle bg-lichen border-lichen text-sand
               hover:bg-olive hover:border-olive opacity-0 pointer-events-none
               transition-opacity z-40">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none"
       viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
  </svg>
</button>
```

```js
// src/main.js
const backToTop = document.getElementById('back-to-top');
if (backToTop) {
  window.addEventListener('scroll', () => {
    const show = window.scrollY > 300;
    backToTop.classList.toggle('opacity-0', !show);
    backToTop.classList.toggle('pointer-events-none', !show);
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
```

---

### 3f. Active navigation state

**Difficulty: Easy**

There's no visual indication of which page you're currently on in the navbar. Fix with a single JS snippet:

```js
// src/main.js — add this
const currentPath = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a[href]').forEach((link) => {
  const linkFile = link.getAttribute('href').split('/').pop();
  if (linkFile === currentPath) {
    link.classList.add('text-mauve', 'font-semibold');
    link.setAttribute('aria-current', 'page');
  }
});
```

---

### 3g. Smooth page transitions

**Difficulty: Medium**

Add a fade-out on link click and fade-in on load for a polished feel between pages.

```css
/* src/input.css */
body {
  animation: pageFadeIn 0.3s ease;
}

@keyframes pageFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  body { animation: none; }
}
```

```js
// src/main.js
document.querySelectorAll('a[href$=".html"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (!href.startsWith('http') && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.2s ease';
      setTimeout(() => { window.location.href = href; }, 200);
    }
  });
});
```

---

## 4. Aesthetics & Animation

### 4a. Portfolio card hover glow

**Difficulty: Easy**

Replace the plain `translateY(-3px)` hover with a more modern glow + lift effect:

```css
/* portfolio.html inline <style> or src/input.css */
.project-card {
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}
.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(61, 42, 42, 0.12);
  border-color: rgba(143, 160, 128, 0.6) !important; /* lichen glow */
}
```

---

### 4b. Animated "More on the way" card

**Difficulty: Easy**

The dashed placeholder card is very static. Add a pulsing dot to signal activity:

```css
/* src/input.css */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.8); }
}

.coming-soon-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #8FA080; /* lichen */
  animation: pulse-dot 1.5s ease-in-out infinite;
  display: inline-block;
  margin-bottom: 12px;
}
```

```html
<!-- portfolio.html "More on the way" card -->
<article class="rounded-2xl flex items-center justify-center h-full min-h-64 p-6"
         style="border: 1.5px dashed rgba(184, 144, 140, 0.4);">
  <div class="text-center">
    <div class="coming-soon-dot mx-auto"></div>
    <p class="font-jakarta font-semibold text-mauve text-xl mb-2">More on the way</p>
    <p class="font-jetbrains text-clay text-base">Check back soon — new projects in progress.</p>
  </div>
</article>
```

---

### 4c. Subtle background texture

**Difficulty: Easy**

A very subtle grain/noise layer on the sand backgrounds adds depth and matches the warm, tactile aesthetic.

```css
/* src/input.css */
.bg-textured {
  position: relative;
}
.bg-textured::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.025;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}
```

```html
<!-- index.html left panel -->
<div class="flex-1 flex items-center bg-sand bg-textured ...">
```

---

### 4d. Skill tag hover animation

**Difficulty: Easy**

The skill tags on about.html are completely static. A subtle scale + color pop on hover adds polish:

```css
/* src/input.css */
.skill-tag {
  transition: transform 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  cursor: default;
}
.skill-tag:hover {
  transform: scale(1.05);
  border-color: rgba(143, 160, 128, 0.7) !important;
  color: #5A6B4A; /* olive */
}
```

```html
<!-- about.html — add class="skill-tag" to every skill span -->
<span class="skill-tag font-jetbrains text-clay text-sm border rounded-full px-3 py-1"
      style="border-color: rgba(184, 144, 140, 0.4);">TypeScript</span>
```

---

## 5. SEO & Meta Tags

### 5a. Add `<meta name="description">` to every page

**Difficulty: Easy**

No description means search engines generate their own (often ugly) snippet.

```html
<!-- index.html -->
<meta name="description" content="Zephyr Flanigan — Full Stack Engineer based in New York City, building thoughtful digital experiences.">

<!-- about.html -->
<meta name="description" content="Learn about Zephyr Flanigan — full stack engineer, background, experience, and what drives the work.">

<!-- portfolio.html -->
<meta name="description" content="Projects built by Zephyr Flanigan — full stack web apps, APIs, and side experiments.">

<!-- contact.html -->
<meta name="description" content="Get in touch with Zephyr Flanigan — open to interesting conversations, new projects, and roles.">
```

---

### 5b. Add Open Graph + Twitter Card meta tags

**Difficulty: Easy**

Links shared on Slack, iMessage, LinkedIn, Twitter show a rich preview card only when these tags exist.

```html
<!-- index.html <head> — repeat appropriate variants on each page -->
<meta property="og:type"        content="website">
<meta property="og:url"         content="https://zephyrflanigan.com/">
<meta property="og:title"       content="Zephyr Flanigan — Full Stack Engineer">
<meta property="og:description" content="Building thoughtful, reliable digital experiences.">
<meta property="og:image"       content="https://zephyrflanigan.com/images/pfp.jpg">

<meta name="twitter:card"        content="summary">
<meta name="twitter:title"       content="Zephyr Flanigan — Full Stack Engineer">
<meta name="twitter:description" content="Building thoughtful, reliable digital experiences.">
<meta name="twitter:image"       content="https://zephyrflanigan.com/images/pfp.jpg">
```

---

### 5c. Add `<link rel="canonical">` to every page

**Difficulty: Easy**

Prevents duplicate-content issues if the site is ever indexed with/without `www` or trailing slashes.

```html
<!-- index.html -->
<link rel="canonical" href="https://zephyrflanigan.com/">

<!-- about.html -->
<link rel="canonical" href="https://zephyrflanigan.com/about.html">
```

---

### 5d. Add `robots.txt` and `sitemap.xml`

**Difficulty: Easy**

These help search engines crawl and index the site properly.

```
# robots.txt (project root)
User-agent: *
Allow: /
Sitemap: https://zephyrflanigan.com/sitemap.xml
```

```xml
<!-- sitemap.xml (project root) -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://zephyrflanigan.com/</loc></url>
  <url><loc>https://zephyrflanigan.com/about.html</loc></url>
  <url><loc>https://zephyrflanigan.com/portfolio.html</loc></url>
  <url><loc>https://zephyrflanigan.com/contact.html</loc></url>
</urlset>
```

---

## 6. Performance

### 6a. Fix Google Fonts loading strategy

**Difficulty: Easy**

Currently fonts load via `@import` in CSS — the browser must download, parse the CSS, then fetch fonts. The faster way uses `<link>` in `<head>` with preconnect hints:

```html
<!-- Every page <head> — replace the @import approach -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap">
```

Then remove the `@import url(...)` line from `src/input.css`.

---

### 6b. Add a favicon

**Difficulty: Easy**

The site has no favicon — browsers show a blank tab icon.

Create a simple `ZF` monogram favicon (use [favicon.io](https://favicon.io) or Figma), save as `favicon.ico` and `favicon.svg` in the project root, then add to every `<head>`:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/x-icon"  href="/favicon.ico">
```

---

### 6c. Add `loading="lazy"` to the profile image

**Difficulty: Easy**

```html
<img src="./images/pfp.jpg" alt="Zephyr Flanigan" loading="lazy">
```

Not critical for the hero (above-the-fold), but a good habit and required for images further down the page.

---

### 6d. Purge unused CSS from output.css

**Difficulty: Medium**

`output.css` is 2,929 lines. Tailwind's content scanning will strip unused utilities at build time. Add a Tailwind config (or use CLI flags) to scope which files to scan:

```js
// tailwind.config.js (create if missing)
export default {
  content: ['./*.html', './src/**/*.js'],
}
```

Then rebuild:

```bash
npx @tailwindcss/cli -i src/input.css -o src/output.css --minify
```

This can reduce `output.css` by 90%+, shaving load time significantly.

---

## 7. Accessibility

### 7a. Drawer focus trap

**Difficulty: Medium**

Currently, pressing Tab inside the open drawer lets focus escape to background content. A proper focus trap keeps Tab cycling within the drawer only while it's open.

```js
// src/main.js — replace the keydown handler with this
function getFocusableElements(container) {
  return [...container.querySelectorAll(
    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )];
}

document.addEventListener('keydown', (e) => {
  if (!document.body.classList.contains('drawer-open')) return;

  if (e.key === 'Escape') { closeDrawer(); return; }

  if (e.key === 'Tab') {
    const drawer = document.getElementById('nav-drawer');
    const focusable = getFocusableElements(drawer);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
});
```

---

### 7b. `prefers-reduced-motion` guard on all animations

**Difficulty: Easy**

Users with vestibular disorders or epilepsy can set `prefers-reduced-motion: reduce` in their OS. All CSS animations and transitions should respect it.

```css
/* src/input.css — add once at the bottom */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Dark Mode

**Difficulty: Medium**

The warm color palette maps beautifully to a dark variant. A toggle button + `localStorage` persistence makes it feel like a first-class feature.

**Step 1 — Define dark theme variables in `src/input.css`:**

```css
/* src/input.css */
[data-theme="dark"] {
  --color-sand:      #1E1A17;
  --color-cream:     #252018;
  --color-parchment: #1A1613;
  --color-taupe:     #3A3228;
  --color-driftwood: #6B5E50;
  --color-mauve:     #C9A8A5;
  --color-clay:      #B09090;
  --color-lichen:    #7A9070;
  --color-sage:      #5A7052;
  --color-olive:     #8FA87A;
}
```

**Step 2 — Add a toggle button to the navbar (every page):**

```html
<button id="theme-toggle" aria-label="Toggle dark mode"
        class="btn btn-ghost btn-square text-mauve md:ml-2">
  <!-- Sun icon (shown in dark mode) -->
  <svg id="icon-sun" class="h-4 w-4 hidden" ...>...</svg>
  <!-- Moon icon (shown in light mode) -->
  <svg id="icon-moon" class="h-4 w-4" ...>...</svg>
</button>
```

**Step 3 — Persist and apply in `main.js`:**

```js
// src/main.js
const themeToggle = document.getElementById('theme-toggle');
const iconSun = document.getElementById('icon-sun');
const iconMoon = document.getElementById('icon-moon');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  iconSun.classList.toggle('hidden', theme === 'light');
  iconMoon.classList.toggle('hidden', theme === 'dark');
}

// On load: respect saved preference, then system preference
const saved = localStorage.getItem('theme');
const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
applyTheme(saved || preferred);

themeToggle?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});
```

---

## 9. UX Micro-improvements

### 9a. Highlight the current page in the drawer too

**Difficulty: Easy**

The active nav fix in section 3f (JS `aria-current` approach) should also apply to mobile drawer links — use the same `querySelectorAll('a[href]')` selector and it will catch both.

---

### 9b. "Send an email" button should be an `href="mailto:"`

**Difficulty: Easy**

If the contact page has a "Send an email" button, verify it uses `mailto:` — some email clients block links without it:

```html
<a href="mailto:zephyr.flan@gmail.com"
   class="btn font-jetbrains text-sand bg-lichen ...">
  Send an email
</a>
```

---

### 9c. Social links should open in a new tab

**Difficulty: Easy**

All external links (LinkedIn, GitHub) should have `target="_blank" rel="noopener noreferrer"` so users don't navigate away from your site.

---

### 9d. Add a `<footer>` with copyright

**Difficulty: Easy**

The site has no footer. A minimal one adds professionalism and is good for SEO:

```html
<!-- Add before </body> on every page -->
<footer class="py-6 px-8 border-t font-jetbrains text-sm text-clay text-center"
        style="border-color: rgba(184, 144, 140, 0.2);">
  © 2026 Zephyr Flanigan
</footer>
```

---

### 9e. Add a resume/CV download link

**Difficulty: Easy**

A "Download resume" link in the about page or navbar is one of the highest-value items recruiters look for on a portfolio site.

```html
<a href="/resume.pdf" download class="btn font-jetbrains ...">
  Resume
  <svg ...><!-- download icon --></svg>
</a>
```

---

## Priority Order

If you implement these one at a time, here's a suggested order by impact-to-effort ratio:

| Priority | Item | Difficulty |
|----------|------|------------|
| 1 | Fix social button `href`s (1a) | Easy |
| 2 | Add `alt` to profile image (1b) | Easy |
| 3 | Add meta description + OG tags (5a, 5b) | Easy |
| 4 | Move shared CSS out of inline `<style>` blocks (2b) | Easy |
| 5 | Add favicon (6b) | Easy |
| 6 | Active nav state (3f) | Easy |
| 7 | Scroll-triggered entrance animations (3a) | Easy |
| 8 | Staggered hero text reveal (3b) | Easy |
| 9 | Fix font loading (6a) | Easy |
| 10 | Copy email button (3d) | Easy |
| 11 | Back-to-top button (3e) | Easy |
| 12 | Portfolio card glow hover (4a) | Easy |
| 13 | `prefers-reduced-motion` guard (7b) | Easy |
| 14 | Purge unused CSS (6d) | Medium |
| 15 | Smooth page transitions (3g) | Medium |
| 16 | Drawer focus trap (7a) | Medium |
| 17 | Deduplicate navbar/drawer HTML (2a) | Medium |
| 18 | Dark mode (8) | Medium |
| 19 | Typewriter hero effect (3c) | Easy |
| 20 | Move to static site generator (2a option B) | Hard |
