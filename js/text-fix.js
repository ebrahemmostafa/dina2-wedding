/**
 * Fix: Replace "برفاقي" with "بزفافي" in the announcement SVG overlay
 * Since the SVG text is rendered as vector paths, we overlay the correction.
 */
(function() {
    'use strict';

    function applyFix() {
        // Find the announcement image
        const imgs = document.querySelectorAll('img[src*="announcement.svg"]');
        imgs.forEach(img => {
            if (img.dataset.textFixed) return;
            img.dataset.textFixed = 'true';

            // Make sure parent is positioned
            const parent = img.parentElement;
            if (parent && getComputedStyle(parent).position === 'static') {
                parent.style.position = 'relative';
            }

            // Create overlay to cover "برفاقي" and show "بزفافي"
            const overlay = document.createElement('span');
            overlay.textContent = 'بزفافي';
            overlay.style.cssText = [
                'position: absolute',
                'color: #000000',
                'font-family: "Aref Ruqaa", serif',
                'font-weight: 700',
                'pointer-events: none',
                'z-index: 2',
                'direction: rtl',
                'line-height: 1',
                // Position relative to the image container  
                // "برفاقي" is on the second text line, left side (RTL)
                'left: 24.5%',
                'top: 55.5%',
                'font-size: 3.2vw',
                'background: rgba(237,231,220,0.97)',
                'padding: 0 0.3em',
            ].join(';');

            parent.appendChild(overlay);

            // Adjust on resize for responsive
            function adjustSize() {
                const imgRect = img.getBoundingClientRect();
                const scale = imgRect.width / 810; // SVG viewBox width
                overlay.style.fontSize = (26 * scale) + 'px';
            }
            
            adjustSize();
            window.addEventListener('resize', adjustSize);
            // Also adjust when image finishes loading
            img.addEventListener('load', adjustSize);
        });
    }

    // Watch for the image to appear
    const observer = new MutationObserver(() => {
        applyFix();
    });

    if (document.getElementById('root')) {
        observer.observe(document.getElementById('root'), { childList: true, subtree: true });
    }

    // Also try on load
    window.addEventListener('load', () => {
        setTimeout(applyFix, 500);
        setTimeout(applyFix, 1500);
    });

    // Try immediately too
    if (document.readyState !== 'loading') {
        setTimeout(applyFix, 800);
    }
})();
