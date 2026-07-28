/**
 * ============================================
 * Cinematic Text Reveal System
 * Reveals text elements line-by-line as they
 * enter the viewport, with staggered delays
 * for a cinematic sequential appearance.
 * ============================================
 */
(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        // Base delay between sequential elements within the same section (ms)
        staggerDelay: 650,
        // How far into the viewport the element must be to trigger (0-1)
        viewportThreshold: 0.12,
        // Root margin for early detection
        rootMargin: '0px 0px -40px 0px',
        // Selectors to target for animation
        targetSelectors: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p',
            'span:not(.cinematic-skip)',
            'li',
            'blockquote',
            'a:not(nav a):not([class*="fixed"])',
            'button:not([class*="fixed"]):not([class*="z-50"])',
            'img:not([class*="fixed"])',
            'label',
            'figcaption',
            'time'
        ].join(', '),
        // Elements/selectors to skip entirely
        skipSelectors: [
            '[class*="fixed"]',
            '[class*="sticky"]',
            '[class*="z-50"]',
            'nav *',
            'script',
            'style',
            'noscript',
            'br',
            'hr',
            '.cinematic-skip',
            '[aria-hidden="true"]',
            'svg path',
            'svg circle',
            'svg rect',
            'svg line',
            'svg g'
        ].join(', ')
    };

    // Track which sections have been processed
    const processedSections = new WeakSet();
    // Track which elements are marked for animation
    const markedElements = new WeakSet();

    /**
     * Check if an element should be skipped
     */
    function shouldSkip(el) {
        // Skip invisible or empty elements
        if (!el || !el.offsetParent && el.tagName !== 'BODY' && el.tagName !== 'HTML') return true;
        if (el.matches && el.matches(CONFIG.skipSelectors)) return true;
        // Skip elements with no visible text/content
        if (el.tagName !== 'IMG' && el.tagName !== 'VIDEO' && el.tagName !== 'SVG') {
            const text = el.textContent || '';
            if (text.trim().length === 0 && el.children.length === 0) return true;
        }
        // Skip elements that are already animated by framer-motion (with style opacity:0)
        // but only skip if they're truly hidden - otherwise let our system handle them
        return false;
    }

    /**
     * Get the closest section/container ancestor
     */
    function getSection(el) {
        return el.closest('section, footer, [id="root"] > main > div, [class*="section"], main > div > div');
    }

    /**
     * Mark elements within a section for cinematic reveal
     */
    function markSectionElements(section) {
        if (processedSections.has(section)) return;
        processedSections.add(section);

        const elements = section.querySelectorAll(CONFIG.targetSelectors);
        elements.forEach(el => {
            if (shouldSkip(el) || markedElements.has(el)) return;

            // Don't mark children of already-marked elements (avoid double animation)
            let parent = el.parentElement;
            let parentMarked = false;
            while (parent && parent !== section) {
                if (markedElements.has(parent) && (parent.tagName === 'A' || parent.tagName === 'BUTTON')) {
                    parentMarked = true;
                    break;
                }
                parent = parent.parentElement;
            }
            if (parentMarked) return;

            // Mark this element
            markedElements.add(el);
            el.classList.add('cinematic-line');
        });
    }

    /**
     * Reveal elements in a section sequentially
     */
    function revealSection(section) {
        const elements = section.querySelectorAll('.cinematic-line:not(.revealed)');
        if (elements.length === 0) return;

        elements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('revealed');
            }, index * CONFIG.staggerDelay);
        });
    }

    /**
     * Initialize the Intersection Observer for sections
     */
    function initSectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = entry.target;
                    markSectionElements(section);
                    // Small delay to ensure CSS transitions are ready
                    requestAnimationFrame(() => {
                        revealSection(section);
                    });
                    // Once revealed, stop observing
                    observer.unobserve(section);
                }
            });
        }, {
            threshold: CONFIG.viewportThreshold,
            rootMargin: CONFIG.rootMargin
        });

        return observer;
    }

    /**
     * Find and observe all sections
     */
    function observeSections(observer) {
        // Target direct section containers
        const sections = document.querySelectorAll('section, footer, [class*="section-padding"], main > div');
        sections.forEach(section => {
            // Skip fixed/overlay elements
            const style = window.getComputedStyle(section);
            if (style.position === 'fixed' || style.position === 'sticky') return;

            observer.observe(section);
        });
    }

    /**
     * Handle dynamic content (React renders new content)
     */
    function watchForNewContent(sectionObserver) {
        const contentObserver = new MutationObserver((mutations) => {
            let hasNewContent = false;
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            hasNewContent = true;
                        }
                    });
                }
            });

            if (hasNewContent) {
                // Re-scan for new sections
                observeSections(sectionObserver);
            }
        });

        const root = document.getElementById('root');
        if (root) {
            contentObserver.observe(root, {
                childList: true,
                subtree: true
            });
        }
    }

    /**
     * Main initialization
     */
    function init() {
        const sectionObserver = initSectionObserver();

        // Initial scan
        observeSections(sectionObserver);

        // Watch for dynamically added content (React)
        watchForNewContent(sectionObserver);

        ensureFirstPageScrollCue();
    }

    /**
     * Add a persistent first-screen scroll hint outside React so it stays
     * above the invitation art and is not affected by section animations.
     */
    function ensureFirstPageScrollCue() {
        if (document.querySelector('.first-page-scroll-cue')) return;

        const cue = document.createElement('button');
        cue.type = 'button';
        cue.className = 'first-page-scroll-cue cinematic-skip';
        cue.setAttribute('aria-label', 'مرر لأسفل');
        cue.innerHTML = '<span class="first-page-scroll-cue__arrow" aria-hidden="true"></span><span class="first-page-scroll-cue__label">مرر لأسفل</span>';

        cue.addEventListener('click', () => {
            window.scrollBy({
                top: Math.max(window.innerHeight * 0.82, 420),
                behavior: 'smooth'
            });
        });

        const updateVisibility = () => {
            const invitationReady = !!document.querySelector('#root main');
            const firstScreenLimit = window.innerHeight * 0.62;
            cue.classList.toggle('first-page-scroll-cue--hidden', !invitationReady || window.scrollY > firstScreenLimit);
        };

        window.addEventListener('scroll', updateVisibility, { passive: true });
        window.addEventListener('resize', updateVisibility, { passive: true });
        document.body.appendChild(cue);

        const root = document.getElementById('root');
        if (root) {
            new MutationObserver(updateVisibility).observe(root, {
                childList: true,
                subtree: true
            });
        }
        updateVisibility();
    }

    // Start when DOM is ready and React has rendered
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for React to mount
            setTimeout(init, 600);
        });
    } else {
        // DOM already loaded, wait for React
        setTimeout(init, 600);
    }

    // Also re-initialize if page was already loaded but content changes
    window.addEventListener('load', () => {
        setTimeout(init, 1000);
    });

})();
