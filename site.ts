import './src/styles/bootstrap.scss';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'highlight.js/styles/github.css';
import hljs from 'highlight.js';
import 'highlightjs-copy/dist/highlightjs-copy.min.css';
import CopyButtonPlugin from 'highlightjs-copy'

// Initialize Highlight.js and add the Copy Button Plugin
document.addEventListener('DOMContentLoaded', () => {
    hljs.addPlugin(new CopyButtonPlugin({autohide: false}));
    hljs.highlightAll();

    // Support ?tab=<id> query parameter to open a specific tab on the index page
    try {
        const params = new URLSearchParams(window.location.search);
        let tab = params.get('tab');
        if (tab) {
            const selector = `#setupTabs [data-bs-target="#${tab}"]`;
            const btn = document.querySelector(selector) as HTMLElement | null;
            if (btn && !btn.classList.contains('active')) {
                // Using click triggers Bootstrap's built-in tab toggle behavior
                btn.click();
            }
        }
    } catch {
        // Silently ignore any errors to avoid breaking the page
    }
});
