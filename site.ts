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
});
