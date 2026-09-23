/*****
	Student Name: Nada Hashem
	File Name: JavaScript for Nuvi Case Study
	Date: 09/23/2026
*******/

const DESIGN_WIDTH = 1400;
const caseStudy = document.querySelector(".case-study");

/* ---------- Fit the design to the window ----------
   Every section (cover text and nav included) sits in the same 1200px content
   column. The side margin is chosen first, then the page is zoomed so that
   column fills exactly the space between the margins:
   - 1400px and wider: margins are 1/14 of the width (100px at 1400px, as in Figma)
   - 700-1400px: margins stay at 100px
   - under 700px: margins are 1/7 of the width
   Past MAX_ZOOM the column stops growing and the margins widen instead. */
const CONTENT_WIDTH = 1200;
const MAX_ZOOM = 1.6;

function sideMargin(width) {
    if (width >= DESIGN_WIDTH) {
        return width / 14;
    }
    return width >= 700 ? 100 : width / 7;
}

function updateZoom() {
    const width = document.documentElement.clientWidth;
    const zoom = Math.min(MAX_ZOOM, (width - 2 * sideMargin(width)) / CONTENT_WIDTH);
    caseStudy.style.setProperty("--page-zoom", zoom);
}

updateZoom();
window.addEventListener("resize", updateZoom);

/* ---------- Nav: click scrolls to a section and selects its tab ---------- */
const nav = document.querySelector(".case-nav");
const tabs = [...nav.querySelectorAll(".nav-tab")];
const sections = [...document.querySelectorAll("main > section")];

function selectTab(name) {
    tabs.forEach((tab) => {
        const isSelected = tab.getAttribute("href") === `#${name}`;
        tab.classList.toggle("is-selected", isSelected);
        if (isSelected) {
            tab.setAttribute("aria-current", "true");
        } else {
            tab.removeAttribute("aria-current");
        }
    });
}

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        selectTab(tab.getAttribute("href").slice(1));
    });
});

/* ---------- Scroll spy + sticky nav layering ---------- */
function onScroll() {
    // The cover phone overlaps the nav at rest; once pinned the nav must sit above it
    nav.classList.toggle("is-stuck", nav.getBoundingClientRect().top <= 0);

    // A section is current once it reaches the bottom of the pinned nav
    const threshold = nav.getBoundingClientRect().height + 1;
    let current = null;
    sections.forEach((section) => {
        if (section.getBoundingClientRect().top <= threshold) {
            current = section;
        }
    });

    // The cover and Reflection have no tab, so the nav shows its deselected state there
    selectTab(current ? current.dataset.nav : null);
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

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
