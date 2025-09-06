// This is the single source of truth for all site-wide JavaScript logic.

// --- Function to fetch and inject HTML partials ---
async function loadHTML(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Could not load ${filePath}`);
        const text = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = text;
        }
    } catch (error) {
        console.error('Error loading HTML partial:', error);
    }
}

// --- Logic for the Sidebar (Collapsing and Highlighting) ---
function initializeSidebar() {
    // 1. COLLAPSE LOGIC
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const body = document.body;
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            body.classList.toggle('sidebar-open');
        });
    } else {
        console.error("Sidebar toggle button not found after load.");
    }

    // 2. ACTIVE LINK HIGHLIGHTING LOGIC
    const currentPage = window.location.pathname; // e.g. /notes/sub/index.html
    const navLinks = document.querySelectorAll('nav a[id^="nav-"]');

    // Split current page path into pieces
    const pathPieces = currentPage.split('/').filter(Boolean); // removes empty strings

    let bestMatch = null;
    let bestScore = 0;

    navLinks.forEach(link => {
        const linkId = link.id.replace(/^nav-/, ''); // remove "nav-" prefix
        const linkPieces = linkId.split('-');        // e.g. "notes-sub" => ["notes","sub"]

        // Count matching pieces from the start
        let score = 0;
        for (let i = 0; i < Math.min(linkPieces.length, pathPieces.length); i++) {
            if (linkPieces[i] === pathPieces[i]) score++;
            else break;
        }

        if (score > bestScore) {
            bestScore = score;
            bestMatch = link;
        }
    });

    if (bestMatch) bestMatch.classList.add('active');
}


// --- THEME SWITCHER LOGIC (GLOBAL) ---
function initializeThemeSwitcher() {
    const themeToggle = document.getElementById('checkbox');
    const body = document.body;
    const prismThemeLink = document.getElementById('prism-theme-link');

    if (!themeToggle || !prismThemeLink) {
      console.warn("Theme switcher or Prism theme link not found. Skipping theme logic.");
      return;
    }

    const prismLightTheme = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css';
    const prismDarkTheme = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-okaidia.min.css';

    function applyTheme(isDarkMode) {
        if (isDarkMode) {
            body.classList.add('dark-mode');
            prismThemeLink.setAttribute('href', prismDarkTheme);
            localStorage.setItem('theme', 'dark-mode');
        } else {
            body.classList.remove('dark-mode');
            prismThemeLink.setAttribute('href', prismLightTheme);
            localStorage.setItem('theme', 'light-mode');
        }

        // Avvia Prism.js manualmente dopo aver impostato tutto
        // Non è strettamente necessario se il codice è già nel DOM, ma è una buona pratica
        Prism.highlightAll();
    }

    // This is the dedicated function to redraw Mermaid diagrams with the new theme.
    function redrawMermaid() {
        if (typeof mermaid === 'undefined') {
            
            return;
        }

        const currentTheme = {
            background: getComputedStyle(document.body).getPropertyValue('--bg-color').trim(),
            primaryColor: getComputedStyle(document.body).getPropertyValue('--table-striped-bg').trim(),
            primaryTextColor: getComputedStyle(document.body).getPropertyValue('--text-color').trim(),
            primaryBorderColor: getComputedStyle(document.body).getPropertyValue('--table-border-color').trim(),
            lineColor: getComputedStyle(document.body).getPropertyValue('--text-color').trim(),
            secondaryColor: getComputedStyle(document.body).getPropertyValue('--table-header-bg').trim(),
            tertiaryColor: getComputedStyle(document.body).getPropertyValue('--bg-color').trim(),
            // You can map more Mermaid variables here if needed
            // See: https://mermaid.js.org/config/theming.html#theme-variables
        };

        // 2. We configure Mermaid to use a 'base' theme, which allows us
        // to override its colors with our own 'themeVariables' object.
        const mermaidConfig = {
            startOnLoad: true,
            // Security level 'loose' is often needed to allow custom styling and advanced features
            securityLevel: 'loose', 
            theme: 'base',
            themeVariables: currentTheme
        };

        // 3. Initialize Mermaid with our dynamically created configuration.
        mermaid.initialize(mermaidConfig);

        // 3. Restore the original diagram code before re-rendering.
        document.querySelectorAll('.mermaid').forEach((element) => {
            const originalCode = element.getAttribute('data-mermaid-code');
            if (originalCode) {
                // Replace the existing SVG with the raw text code.
                element.innerHTML = originalCode;
                // Remove the processed attribute so Mermaid will re-render it.
                element.removeAttribute('data-processed');
            }
        });

        // 4. Run Mermaid again. It will now find the "new" diagrams and
        // render them using the 'dark' or 'default' theme we just initialized.
        mermaid.run();
    }

    themeToggle.addEventListener('change', function() {
        applyTheme(this.checked);
        // We need to re-initialize Mermaid with the new theme colors
        // A simple page reload is the easiest way to ensure consistency
        // window.location.reload();
        requestAnimationFrame(redrawMermaid);
    });

    const savedTheme = localStorage.getItem('theme');
    const isDarkMode = savedTheme === 'dark-mode';

    themeToggle.checked = isDarkMode;
    applyTheme(isDarkMode);
}

// --- MERMAID & PRISM INITIALIZATION (GLOBAL) ---
// --- Logic for Diagrams and Code ---
function initializeDiagramsAndCode() {
    // --- MERMAID INITIALIZATION ---
    if (typeof mermaid !== 'undefined') {
        // **CRITICAL STEP 0: SAVE THE ORIGINAL CODE**
        // Before the very first render, we save each diagram's text content
        // into a data attribute for later use.
        document.querySelectorAll('.mermaid').forEach(el => {
            // Using innerHTML to preserve potential HTML entities in the code
            el.setAttribute('data-mermaid-code', el.innerHTML);
        });

        // 1. We read the current theme's colors directly from the CSS variables on the page.
        // The .trim() is important to remove any whitespace.
        const currentTheme = {
            background: getComputedStyle(document.body).getPropertyValue('--bg-color').trim(),
            primaryColor: getComputedStyle(document.body).getPropertyValue('--table-striped-bg').trim(),
            primaryTextColor: getComputedStyle(document.body).getPropertyValue('--text-color').trim(),
            primaryBorderColor: getComputedStyle(document.body).getPropertyValue('--table-border-color').trim(),
            lineColor: getComputedStyle(document.body).getPropertyValue('--text-color').trim(),
            secondaryColor: getComputedStyle(document.body).getPropertyValue('--table-header-bg').trim(),
            tertiaryColor: getComputedStyle(document.body).getPropertyValue('--bg-color').trim(),
            // You can map more Mermaid variables here if needed
            // See: https://mermaid.js.org/config/theming.html#theme-variables
        };

        // 2. We configure Mermaid to use a 'base' theme, which allows us
        // to override its colors with our own 'themeVariables' object.
        const mermaidConfig = {
            startOnLoad: true,
            // Security level 'loose' is often needed to allow custom styling and advanced features
            securityLevel: 'loose', 
            theme: 'base',
            themeVariables: currentTheme
        };

        // 3. Initialize Mermaid with our dynamically created configuration.
        mermaid.initialize(mermaidConfig);
    }

    // --- PRISM INITIALIZATION (no changes needed here) ---
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
}

// --- MAIN ENTRY POINT ---
// This runs once the entire page is loaded.
document.addEventListener('DOMContentLoaded', async () => {
    // Load static HTML components first. The 'await' ensures we wait for them to be injected.
    await loadHTML('sidebar-container', '/partials/_sidebar.html');

    // Now that all HTML is in place, initialize all the logic.
    initializeSidebar();
    initializeThemeSwitcher();
    initializeDiagramsAndCode();
});


document.addEventListener('DOMContentLoaded', () => {
    // 1) mostra errori parse sotto ogni <pre class="mermaid"> e in console
    mermaid.parseError = function(err, hash) {
    console.group("Mermaid parseError");
    console.error("Error object:", err);
    console.error("Hash:", hash);
    console.error("Full stringified error:", JSON.stringify(err, null, 2));
    console.groupEnd();

    document.querySelectorAll('pre.mermaid').forEach(p => {
        const next = p.nextElementSibling;
        if (next && next.classList && next.classList.contains('mermaid-err')) next.remove();
        const errBox = document.createElement('div');
        errBox.className = 'mermaid-err';
        errBox.style.cssText =
        'background:#fff0f0;border:1px solid #ffb3b3;color:#700;padding:8px;margin:8px 0;border-radius:6px;white-space:pre-wrap;';
        errBox.textContent =
        'Mermaid parse error:\n' +
        (err && err.message ? err.message : String(err)) +
        '\n\nFull error object:\n' +
        JSON.stringify(err, null, 2) +
        (hash ? '\n\nDetails:\n' + JSON.stringify(hash, null, 2) : '');
        p.parentNode.insertBefore(errBox, p.nextSibling);
    });
    };


    // 2) rimuovi l'indentazione causata dal nesting nel file HTML
    document.querySelectorAll('pre.mermaid').forEach(p => {
    const lines = p.textContent.split('\n');
    let minIndent = Infinity;
    lines.forEach(line => { if (line.trim()) { const m = line.match(/^\s*/); if (m) minIndent = Math.min(minIndent, m[0].length); } });
    if (minIndent > 0 && isFinite(minIndent)) {
        p.textContent = lines.map(l => l.slice(minIndent)).join('\n');
    }
    });

    // 3) inizializza Mermaid in debug (aggiungi 'securityLevel' se vuoi permettere più opzioni)
    const baseConfig = {
    startOnLoad: true,
    logLevel: 'debug',     // o 1
    securityLevel: 'loose' // opzionale: evita blocchi di alcune direttive (usalo con cautela)
    };
    // se hai currentConfig dalla tua pagina, puoi fare: Object.assign(baseConfig, currentConfig)
    mermaid.initialize(baseConfig);
});