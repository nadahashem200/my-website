/*****
	Student Name: Nada Hashem
	File Name: JavaScript for Nuvi Case Study
	Date: 09/23/2026
*******/

const caseStudy = document.querySelector(".case-study");

/* ---------- Fit the design to the window ----------
   The page is the 1400px Figma frame, shown in one centered frame of width
   --frame-w = min(1440px, window width) and zoomed to fit it. --frame-w is
   also set on the root, for the cover and main nav, which sit outside the
   zoomed .case-study (their sizes are in styles.css). */
const FIGMA_WIDTH = 1400;
const MAX_FRAME_WIDTH = 1440;

/* Below this width the page uses its own stacked mobile layout (see the
   "Mobile layout" section of styles.css) instead of the scaled desktop frame. */
const MOBILE_MAX_WIDTH = 767;

function updateZoom() {
    const width = document.documentElement.clientWidth;
    const isMobile = width <= MOBILE_MAX_WIDTH;

    const frameWidth = Math.min(MAX_FRAME_WIDTH, width);
    document.documentElement.style.setProperty("--frame-w", `${frameWidth}px`);
    caseStudy.style.setProperty("--page-zoom", isMobile ? 1 : frameWidth / FIGMA_WIDTH);
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

/* ---------- Case-study bar: section links ---------- */
const nav = document.querySelector(".case-nav");

const tabs = [...nav.querySelectorAll(".nav-tab")];
const sections = [...document.querySelectorAll("main > section")];

/* Mobile: the right-edge fade (styles.css) goes once the row is scrolled to the end */
const navRow = nav.querySelector(".case-nav-links");

function updateNavFade() {
    navRow.classList.toggle("is-scrolled-end", navRow.scrollLeft + navRow.clientWidth >= navRow.scrollWidth - 1);
}

/* Below 1024px the links are centred on one row; if they don't fit, the row
   scrolls instead (.is-overflowing in styles.css). Measured from the links
   themselves, not the row's scroll width, which centring would hide. */
function updateNavFit() {
    const links = [...navRow.children];
    const needed = links[links.length - 1].getBoundingClientRect().right - links[0].getBoundingClientRect().left;
    const available = navRow.parentElement.getBoundingClientRect().width;
    navRow.classList.toggle("is-overflowing", needed > available + 0.5);
    updateNavFade();
}

navRow.addEventListener("scroll", updateNavFade, { passive: true });
window.addEventListener("resize", updateNavFit);
document.fonts.ready.then(updateNavFit);
updateNavFit();

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

/* ---------- Active link ----------
   Exactly one link is active (gold underline, aria-current="true"):
   - "Overview" from page load, including while the bar sits under the cover,
     until Discovery's top passes just below the bar
   - otherwise the last section whose top has passed just below the bar
     (Reflection has no link, so Trade-offs stays active there)
   - within ~50px of the bottom of the page, always the last link
   - after a click, the clicked link, until the smooth scroll finishes */
// A section counts once its top is within the scroll margin (24px) + 8px of
// the bar, so a clicked section (which lands 24px below the bar) is active
const ACTIVE_BUFFER = 24 + 8; // px below the bar
const BOTTOM_SLACK = 50; // px
const linkedSections = sections.filter((section) => section.dataset.nav);
let clickedName = null;
let scrollIdle = null;

function currentSection() {
    const doc = document.documentElement;
    if (window.scrollY + window.innerHeight >= doc.scrollHeight - BOTTOM_SLACK) {
        return tabs[tabs.length - 1].getAttribute("href").slice(1);
    }
    const line = nav.getBoundingClientRect().height + ACTIVE_BUFFER;
    let current = linkedSections[0].dataset.nav;
    linkedSections.forEach((section) => {
        if (section.getBoundingClientRect().top <= line) {
            current = section.dataset.nav;
        }
    });
    return current;
}

function updateActive() {
    selectTab(clickedName ?? currentSection());
}

// The clicked link stays active until scrolling stops (scrollend, or no
// scroll events for 150ms where scrollend isn't supported)
function releaseClick() {
    clickedName = null;
    updateActive();
}

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        clickedName = tab.getAttribute("href").slice(1);
        selectTab(clickedName);
        clearTimeout(scrollIdle);
        scrollIdle = setTimeout(releaseClick, 1000); // in case the page doesn't scroll at all
    });
});

let frame = 0;
window.addEventListener("scroll", () => {
    if (clickedName) {
        clearTimeout(scrollIdle);
        scrollIdle = setTimeout(releaseClick, 150);
        return;
    }
    if (!frame) {
        frame = requestAnimationFrame(() => {
            frame = 0;
            updateActive();
        });
    }
}, { passive: true });

window.addEventListener("scrollend", () => {
    if (clickedName) {
        clearTimeout(scrollIdle);
        releaseClick();
    }
});
window.addEventListener("resize", updateActive);
updateActive();

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
