/*****
	Student Name: Nada Hashem
	File Name: JavaScript for Nuvi Case Study
	Date: 09/23/2026
*******/

const caseStudy = document.querySelector(".case-study");

/* ---------- Fit the design to the window ----------
   The whole case study is the 1400px Figma frame, shown in one centered frame
   of width --frame-w and zoomed to fit it (every section's content column,
   the cover text and the nav share Figma's 100px page margin inside it).
   Section backgrounds and the cover texture are full-bleed.
     --frame-w = min(1440px, window width,
                     (window height - the main nav - the card's gaps above
                       and below) x FIGMA_WIDTH / CONTENT_BOTTOM)
   so the main site nav and the cover card (content down to CONTENT_BOTTOM,
   with its rounded bottom corners) fit the window height. The main nav has a
   fixed on-screen height (--site-nav-height in styles.css). */
const FIGMA_WIDTH = 1400;
const FIGMA_HEIGHT = 900;
const CONTENT_BOTTOM = 822; // the headline's bottom (782) + 40px padding
const SITE_NAV_HEIGHT = 64; // on-screen px
const CARD_MAX_GAP = 32; // on-screen px
const CARD_RADIUS = 20; // on-screen px
const MAX_FRAME_WIDTH = 1440;

/* Below this width the page uses its own stacked mobile layout (see the
   "Mobile layout" section of styles.css) instead of the scaled desktop frame. */
const MOBILE_MAX_WIDTH = 767;

function updateZoom() {
    const width = document.documentElement.clientWidth;

    if (width <= MOBILE_MAX_WIDTH) {
        caseStudy.style.setProperty("--page-zoom", 1);
        caseStudy.style.removeProperty("--cover-gap");
        caseStudy.style.removeProperty("--cover-radius");
        return;
    }

    // clientHeight is the stable viewport height (it ignores mobile toolbar show/hide), like 100svh
    const height = document.documentElement.clientHeight;
    // The frame width and the card's top gap depend on each other, so they are solved together
    const bars = SITE_NAV_HEIGHT;
    let zoom = 1;
    let frameWidth = MAX_FRAME_WIDTH;
    let topGap = 0;
    for (let i = 0; i < 20; i++) {
        frameWidth = Math.min(MAX_FRAME_WIDTH, width, (height - bars - 2 * topGap) * FIGMA_WIDTH / CONTENT_BOTTOM);
        zoom = frameWidth / FIGMA_WIDTH;
        topGap = Math.min(CARD_MAX_GAP, (width - frameWidth) / 2);
    }
    caseStudy.style.setProperty("--frame-w", `${frameWidth}px`);
    caseStudy.style.setProperty("--page-zoom", zoom);

    // A card when the window is wider than the frame: rounded, with the side
    // gap (capped) above and below it. Values are in the zoomed page's px.
    caseStudy.style.setProperty("--cover-gap", `${topGap / zoom}px`);
    caseStudy.style.setProperty("--cover-radius", topGap > 0 ? `${CARD_RADIUS / zoom}px` : "0px");

    // The cover is as tall as the Figma frame, or the space left between the
    // main nav and the gap below the card if that is less (only empty green
    // below CONTENT_BOTTOM is cropped)
    const spaceForCover = (height - bars - 2 * topGap) / zoom;
    caseStudy.style.setProperty("--cover-height", `${Math.min(FIGMA_HEIGHT, spaceForCover)}px`);
}

updateZoom();
window.addEventListener("resize", updateZoom);

/* ---------- Hero underline: sized from the headline's longest line ----------
   On mobile the headline wraps, and a wrapped block is as wide as the column,
   not its longest line. This measures the longest line; styles.css sets the
   underline to 40% of it. */
const heroTitle = document.querySelector(".hero-title");

function updateHeroLineWidth() {
    const range = document.createRange();
    range.selectNodeContents(heroTitle);

    // A line can be split into several rects (the hidden <br>s split the text),
    // so rects are grouped into lines by their top edge
    const lines = new Map();
    for (const rect of range.getClientRects()) {
        if (rect.width === 0) {
            continue;
        }
        const top = Math.round(rect.top);
        const line = lines.get(top) ?? { left: rect.left, right: rect.right };
        line.left = Math.min(line.left, rect.left);
        line.right = Math.max(line.right, rect.right);
        lines.set(top, line);
    }

    let longest = 0;
    for (const line of lines.values()) {
        longest = Math.max(longest, line.right - line.left);
    }
    heroTitle.parentElement.style.setProperty("--hero-line-width", `${longest}px`);
}

updateHeroLineWidth();
window.addEventListener("resize", updateHeroLineWidth);
document.fonts.ready.then(updateHeroLineWidth);

/* ---------- Main site nav: the menu button (mobile) opens the links ---------- */
const siteNav = document.querySelector(".site-nav");
const siteNavToggle = siteNav.querySelector(".site-nav-toggle");

siteNavToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    siteNavToggle.setAttribute("aria-expanded", String(isOpen));
});

/* ---------- Section bar: slides down once the cover is out of view ---------- */
const nav = document.querySelector(".case-nav");
const cover = document.querySelector(".cover");

new IntersectionObserver(([entry]) => {
    nav.classList.toggle("is-visible", !entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
}).observe(cover);
const tabs = [...nav.querySelectorAll(".nav-tab")];
const sections = [...document.querySelectorAll("main > section")];

/* Mobile: the right-edge fade (styles.css) goes once the row is scrolled to the end */
const navRow = nav.querySelector(".case-nav-links");

function updateNavFade() {
    navRow.classList.toggle("is-scrolled-end", navRow.scrollLeft + navRow.clientWidth >= navRow.scrollWidth - 1);
}

navRow.addEventListener("scroll", updateNavFade, { passive: true });
window.addEventListener("resize", updateNavFade);
updateNavFade();

function selectTab(name) {
    tabs.forEach((tab) => {
        const isSelected = tab.getAttribute("href") === `#${name}`;
        tab.classList.toggle("is-selected", isSelected);
        if (isSelected) {
            tab.setAttribute("aria-current", "true");
        } else {
            tab.removeAttribute("aria-current");
        }
        // Keep the current link visible in the scrolling row on mobile (only
        // the row scrolls, never the page)
        if (isSelected && navRow.scrollWidth > navRow.clientWidth) {
            const left = tab.offsetLeft - navRow.offsetLeft;
            if (left < navRow.scrollLeft || left + tab.offsetWidth > navRow.scrollLeft + navRow.clientWidth) {
                navRow.scrollTo({ left: left - 24, behavior: "smooth" });
            }
        }
    });
}

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        selectTab(tab.getAttribute("href").slice(1));
    });
});

/* ---------- Scroll spy ----------
   The current section is the one under a 1px line just below the section bar.
   The cover and Reflection have no link, so the bar shows no selection there. */
const inView = new Set();
let spy = null;

function watchSections() {
    if (spy) {
        spy.disconnect();
    }
    inView.clear();
    const barHeight = Math.round(nav.getBoundingClientRect().height);
    const below = Math.max(0, window.innerHeight - barHeight - 1);
    spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                inView.add(entry.target);
            } else {
                inView.delete(entry.target);
            }
        });
        const current = sections.find((section) => inView.has(section));
        selectTab(current ? current.dataset.nav : null);
    }, { rootMargin: `-${barHeight}px 0px -${below}px 0px` });
    sections.forEach((section) => spy.observe(section));
}

watchSections();
window.addEventListener("resize", watchSections);

/* ---------- Final UI carousel ----------
   Figma prototype: the right arrow moves the next step in from the right and
   the left arrow moves the previous step in from the left (Move In, 0.3s ease-out). */
const slides = [...document.querySelectorAll(".final-ui .slide")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const SLIDE_DURATION = 300;
let currentSlide = 0;
let isAnimating = false;

function showSlide(index, direction) {
    if (isAnimating || index === currentSlide || index < 0 || index >= slides.length) {
        return;
    }

    const outgoing = slides[currentSlide];
    const incoming = slides[index];
    let finished = false;
    const onTransitionEnd = (event) => {
        if (event.target === incoming) {
            finish();
        }
    };
    const finish = () => {
        if (finished) {
            return;
        }
        finished = true;
        incoming.removeEventListener("transitionend", onTransitionEnd);
        incoming.classList.remove("is-entering");
        incoming.style.transform = "";
        outgoing.hidden = true;
        outgoing.classList.remove("is-active");
        incoming.classList.add("is-active");
        isAnimating = false;

        // Keep keyboard focus on the carousel controls
        const focusTarget = incoming.querySelector(direction === "next" ? ".arrow--next" : ".arrow--prev")
            || incoming.querySelector(".arrow");
        if (focusTarget && outgoing.contains(document.activeElement)) {
            focusTarget.focus();
        }
    };

    currentSlide = index;
    incoming.hidden = false;

    if (reduceMotion.matches) {
        finish();
        return;
    }

    isAnimating = true;
    incoming.style.transform = `translateX(${direction === "next" ? 100 : -100}%)`;
    incoming.getBoundingClientRect(); // commit the start position before transitioning
    incoming.classList.add("is-entering");
    incoming.style.transform = "translateX(0)";

    // transitionend can be skipped (e.g. background tabs), so a timer guarantees cleanup
    incoming.addEventListener("transitionend", onTransitionEnd);
    setTimeout(finish, SLIDE_DURATION + 50);
}

slides.forEach((slide, index) => {
    const next = slide.querySelector(".arrow--next");
    const prev = slide.querySelector(".arrow--prev");

    if (next) {
        next.addEventListener("click", () => showSlide(index + 1, "next"));
    }
    if (prev) {
        prev.addEventListener("click", () => showSlide(index - 1, "prev"));
    }
});

document.querySelector(".final-ui").addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
        showSlide(currentSlide + 1, "next");
    } else if (event.key === "ArrowLeft") {
        showSlide(currentSlide - 1, "prev");
    }
});
