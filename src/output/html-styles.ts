/**
 * CSS styles for Git Spark HTML reports
 *
 * Returns a single self-contained style block. Content is SHA-256 hashed
 * in html.ts for CSP compliance — any change here requires the hash to
 * be recomputed in generateHTML().
 */
export function getCustomStyles(): string {
  return `
      :root {
        --color-primary: #0066cc;
        --color-success: #28a745;
        --color-warning: #fd7e14;
        --color-danger: #dc3545;
        --color-bg: #f5f7fb;
        --color-surface: #ffffff;
        --color-border: #dde3ea;
        --color-text: #222222;
        --color-text-secondary: #6c757d;
        --shadow-sm: 0 2px 4px rgba(0,0,0,0.08);
      }
      :root.dark {
        --color-bg: #121417;
        --color-surface: #1e2227;
        --color-border: #2c3239;
        --color-text: #e6e8ea;
        --color-text-secondary: #97a0ab;
      }
      html { scroll-behavior: smooth; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: var(--color-bg); color: var(--color-text); margin:0; }
      .skip-link { position:absolute; left:-999px; top:auto; width:1px; height:1px; overflow:hidden; }
      .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
      .skip-link:focus { position:static; width:auto; height:auto; padding:.5rem 1rem; background:#000; color:#fff; z-index:999; }
      .theme-toggle-wrapper { position:fixed; top:.5rem; right:.5rem; z-index:150; }
      .theme-toggle { background:var(--color-surface); color:var(--color-text); border:1px solid var(--color-border); padding:.4rem .6rem; border-radius:4px; cursor:pointer; box-shadow:var(--shadow-sm); font-size:.85rem; }
      .theme-toggle:hover, .theme-toggle:focus { border-color: var(--color-primary); }
      .site-header { position:sticky; top:0; background:var(--color-surface); border-bottom:1px solid var(--color-border); z-index:100; box-shadow:var(--shadow-sm); }
      .header-inner { display:flex; align-items:center; justify-content:space-between; max-width:1200px; margin:0 auto; padding:.5rem 1rem; }
      .branding { font-weight:600; font-size:1rem; }
      .repo-name { color:var(--color-primary); font-weight:700; }
      .main-nav ul { list-style:none; display:flex; gap:1rem; margin:0; padding:0; }
      .main-nav a { text-decoration:none; color:var(--color-text-secondary); font-size:.9rem; }
      .main-nav a:hover, .main-nav a:focus { color:var(--color-primary); }
      .report { max-width:1200px; margin:0 auto; padding:1rem; }
      .section { background:var(--color-surface); padding:1.2rem 1.4rem; margin:1.2rem 0; border:1px solid var(--color-border); border-radius:8px; box-shadow:var(--shadow-sm); }
      h1 { font-size:2rem; margin:.2rem 0 1rem; }
      h2 { font-size:1.4rem; margin:0 0 .75rem; }
      h3 { font-size:1.15rem; margin:1rem 0 .5rem; }
      .summary-grid { display:grid; gap:.75rem; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); margin-bottom:1rem; }
      .metric-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; padding:.6rem .75rem; text-align:center; display:flex; flex-direction:column; gap:.25rem; box-shadow:var(--shadow-sm); }
      .metric-card:focus { outline:2px solid var(--color-primary); outline-offset:2px; }
      .metric-value { font-size:1.2rem; font-weight:600; }
      .metric-label { font-size:.7rem; text-transform:uppercase; letter-spacing:.05em; color:var(--color-text-secondary); }
      .health-badges { display:flex; gap:1rem; align-items:center; flex-wrap:wrap; margin:.5rem 0 1rem; }
      .health-score, .gov-score { padding:.6rem .9rem; border-radius:6px; font-weight:600; background:var(--color-primary); color:#fff; display:inline-flex; align-items:center; gap:.5rem; }
      .health-score[data-rating='high'] { background:var(--color-success); }
      .health-score[data-rating='moderate'] { background:var(--color-primary); }
      .health-score[data-rating='fair'] { background:var(--color-warning); }
      .health-score[data-rating='low'] { background:var(--color-danger); }
      .activity-breakdown { margin:1rem 0; padding:1rem; background:var(--color-bg); border:1px solid var(--color-border); border-radius:6px; }
      .activity-breakdown h3 { margin:0 0 .75rem; font-size:1rem; color:var(--color-text); }
      .activity-explanation { margin-bottom:1rem; padding:.75rem; background:var(--color-surface); border-left:4px solid var(--color-warning); border-radius:4px; }
      .activity-explanation p { margin:0; font-size:.9rem; color:var(--color-text); }
      .breakdown-components { display:grid; gap:.75rem; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); margin-bottom:1rem; }
      .component { background:var(--color-surface); padding:.75rem; border-radius:4px; border:1px solid var(--color-border); }
      .component-label { font-size:.75rem; color:var(--color-text-secondary); text-transform:uppercase; letter-spacing:.05em; margin-bottom:.25rem; }
      .component-value { font-size:1.1rem; font-weight:600; color:var(--color-primary); margin-bottom:.25rem; }
      .component-detail { font-size:.7rem; color:var(--color-text-secondary); }
      .formula { margin-top:.75rem; padding-top:.75rem; border-top:1px solid var(--color-border); }
      .formula code { background:var(--color-surface); padding:.25rem .4rem; border-radius:3px; font-size:.8rem; }
      .formula-line { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-top:.75rem; padding-top:.75rem; border-top:1px solid var(--color-border); flex-wrap:wrap; }
      .formula-line .formula { margin:0; padding:0; border:none; flex:1; min-width:300px; }
      .formula-line .health-score { margin:0; flex-shrink:0; }
      .analysis-period { font-size:.8rem; margin:.25rem 0 1rem; color:var(--color-text-secondary); }
      
      /* New Limitation Section Styles */
      .critical-notice { background:#fff3cd; border:1px solid #ffeaa7; border-radius:8px; padding:1.5rem; margin-bottom:2rem; border-left:4px solid #fd7e14; }
      :root.dark .critical-notice { background:#2d2419; border-color:#635a3e; }
      .critical-notice h3 { color:#856404; margin:0 0 1rem; font-size:1.2rem; }
      :root.dark .critical-notice h3 { color:#ffeaa7; }
      .limitation-grid { display:grid; gap:1.5rem; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); margin-bottom:1.5rem; }
      .limitation-category { background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; padding:1rem; }
      .limitation-category h4 { margin:0 0 .75rem; color:var(--color-text); font-size:1rem; }
      .limitation-category ul { margin:.5rem 0; padding-left:1.2rem; }
      .limitation-category li { margin:.5rem 0; font-size:.9rem; }
      
      .honest-metrics-notice { background:var(--color-bg); border:1px solid var(--color-border); border-radius:6px; padding:1.5rem; border-left:4px solid var(--color-primary); }
      .honest-metrics-notice h4 { margin:0 0 1rem; color:var(--color-primary); }
      .honest-metrics-notice p { margin:.75rem 0; }
      .metric-categories { display:grid; gap:1rem; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); margin:1rem 0; }
      .metric-category { background:var(--color-surface); border:1px solid var(--color-border); border-radius:4px; padding:1rem; }
      .metric-category h5 { margin:0 0 .75rem; color:var(--color-text); font-size:.95rem; }
      .usage-guidelines { margin-top:1.5rem; background:var(--color-surface); border:1px solid var(--color-border); border-radius:4px; padding:1rem; }
      
      /* Team Patterns Section */
      .section-description { font-style:italic; color:var(--color-text-secondary); margin-bottom:1.5rem; font-size:.9rem; }
      .team-patterns-grid { display:grid; gap:1.5rem; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); margin-bottom:2rem; }
      .pattern-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:8px; padding:1.5rem; box-shadow:var(--shadow-sm); }
      .pattern-card h3 { margin:0 0 1rem; font-size:1.1rem; color:var(--color-text); border-bottom:2px solid var(--color-primary); padding-bottom:.5rem; }
      .pattern-metrics { display:flex; flex-direction:column; gap:.75rem; }
      .pattern-metric { display:flex; justify-content:space-between; align-items:center; padding:.5rem; background:var(--color-bg); border-radius:4px; }
      .pattern-metric .metric-label { font-size:.85rem; color:var(--color-text-secondary); }
      .pattern-metric .metric-value { font-weight:600; }
      .pattern-metric .metric-note { font-size:.75rem; color:var(--color-text-secondary); font-style:italic; }
      
      /* Activity badge styles (renamed from risk badges) */
      .activity-badge { padding:.25rem .5rem; border-radius:4px; font-size:.65rem; font-weight:600; }
      .activity-high { background:var(--color-danger); color:#fff; }
      .activity-medium { background:var(--color-warning); color:#000; }
      .activity-low { background:var(--color-success); color:#fff; }
      .activity-minimal { background:#3b7ddd; color:#fff; }
      
      /* Measurement Principles */
      .measurement-principles { margin-bottom:2rem; }
      .principles-grid { display:grid; gap:1rem; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); margin-top:1rem; }
      .principle-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; padding:1rem; border-left:4px solid var(--color-primary); }
      .principle-card h4 { margin:0 0 .75rem; color:var(--color-primary); font-size:1rem; }
      .principle-card p { margin:0; font-size:.9rem; }
      
      /* Updated formula explanations */
      .formula-explanation { margin-top:.75rem; }
      .formula-explanation ul { margin:.5rem 0; padding-left:1.2rem; }
      .formula-explanation li { font-size:.85rem; margin:.25rem 0; }
      ul { padding-left:1.1rem; }
      li { margin:.25rem 0; }
      .table-wrapper { overflow:auto; border:1px solid var(--color-border); border-radius:6px; }
      table.data-table { width:100%; border-collapse:collapse; font-size:.85rem; }
      table.data-table th, table.data-table td { padding:.5rem .6rem; border-bottom:1px solid var(--color-border); text-align:left; }
      table.data-table th.num, table.data-table td.num { text-align:right; }
      table.data-table tbody tr:hover { background:#f2f6fa; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; font-size:.75rem; }
      .risk-badge { padding:.25rem .5rem; border-radius:4px; font-size:.65rem; font-weight:600; }
      .risk-high { background:var(--color-danger); color:#fff; }
      .risk-medium { background:var(--color-warning); color:#000; }
      .risk-low { background:var(--color-success); color:#fff; }
      .risk-minimal { background:#3b7ddd; color:#fff; }
      .gov-grid { display:grid; gap:.5rem; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); margin-bottom:.75rem; }
      .gov-card { background:var(--color-bg); border:1px solid var(--color-border); padding:.6rem .7rem; border-radius:4px; font-size:.7rem; font-weight:500; }
      .meta-grid { display:grid; grid-template-columns: 120px 1fr; gap:.35rem .75rem; font-size:.75rem; }
      .meta-grid dt { font-weight:600; }
      .site-footer { text-align:center; padding:1.5rem .5rem 3rem; font-size:.7rem; color:var(--color-text-secondary); }
      .footer-content p { margin: 0.25rem 0; }
      .footer-content a { color:var(--color-primary); text-decoration:none; }
      .footer-content a:hover { text-decoration:underline; }
      .back-to-top { position:fixed; bottom:1rem; right:1rem; background:var(--color-primary); color:#fff; border:none; padding:.55rem .7rem; border-radius:4px; font-size:.85rem; cursor:pointer; box-shadow:var(--shadow-sm); }
      .back-to-top:hover, .back-to-top:focus { background:#004f99; }
      .warnings { margin:0; padding-left:1rem; }
      .warnings li { font-size:.7rem; }
      @media (max-width: 760px) { .main-nav ul { flex-wrap:wrap; gap:.5rem; } .branding { font-size:.85rem; } }
      @media print { .site-header, .back-to-top { display:none !important; } body { background:#fff; } .section { page-break-inside:avoid; } }
      @media (prefers-reduced-motion: reduce) { * { animation-duration:0.01ms !important; transition-duration:0.01ms !important; } }
      .show-more { background:var(--color-primary); color:#fff; border:1px solid var(--color-primary); padding:.4rem .7rem; border-radius:4px; cursor:pointer; font-size:.7rem; font-weight:500; box-shadow:var(--shadow-sm); }
      .show-more:hover, .show-more:focus { background:#004f99; }
      :root.dark .show-more { background:#2489ff; border-color:#2489ff; }
      .show-more { margin-top:.6rem; }
      .hidden-row { display:none; }
      
      /* Author Profile Styles */
      .author-link { color:var(--color-primary); text-decoration:none; font-weight:500; }
      .author-link:hover { text-decoration:underline; }
      .author-profiles { display:flex; flex-direction:column; gap:1.5rem; }
      .author-profile-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:8px; padding:1.5rem; box-shadow:var(--shadow-sm); }
      .author-header { margin-bottom:1rem; border-bottom:1px solid var(--color-border); padding-bottom:1rem; }
      .author-header h3 { margin:0; font-size:1.4rem; color:var(--color-text); }
      .author-email { color:var(--color-text-secondary); font-size:.85rem; font-family:ui-monospace, monospace; }
      .author-period { color:var(--color-text-secondary); font-size:.8rem; margin-top:.25rem; }
      
      .contribution-overview, .commit-patterns, .code-focus, .commit-distribution, .insights-section { margin-bottom:1.25rem; }
      .contribution-overview h4, .commit-patterns h4, .code-focus h4, .commit-distribution h4, .insights-section h4 { 
        margin:0 0 .75rem; font-size:1.1rem; color:var(--color-text); border-bottom:1px solid var(--color-border); padding-bottom:.5rem; 
      }
      
      .metrics-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:.75rem; margin-bottom:.75rem; }
      .metric-box { background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; padding:.75rem; text-align:center; color:var(--color-text); }

      /* Team Score Styles */
      .team-score-overview { margin-bottom:2rem; }
      .team-score-main { display:flex; align-items:center; gap:2rem; flex-wrap:wrap; justify-content:center; }
      .score-circle { 
        display:flex; flex-direction:column; align-items:center; justify-content:center; 
        width:120px; height:120px; border-radius:50%; 
        background:linear-gradient(135deg, var(--color-primary), #0056b3);
        color:#fff; box-shadow:0 4px 12px rgba(0,102,204,0.3);
      }
      .score-value { font-size:2.5rem; font-weight:700; line-height:1; }
      .score-label { font-size:.8rem; text-transform:uppercase; letter-spacing:.05em; opacity:.9; }
      
      .score-rating { text-align:center; }
      .rating-label { 
        font-size:1.5rem; font-weight:600; color:var(--color-primary);
        display:block; margin-bottom:.5rem;
      }
      .rating-description { font-size:.9rem; color:var(--color-text-secondary); max-width:300px; }
      
      .team-metrics-grid { 
        display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); 
        gap:1.5rem; margin-bottom:2rem; 
      }
      .team-metrics-grid .metric-card { 
        background:var(--color-surface); border:1px solid var(--color-border); 
        border-radius:8px; padding:1.5rem; box-shadow:var(--shadow-sm);
        text-align:left; display:block;
      }
      .team-metrics-grid .metric-card h3 { 
        margin:0 0 1rem; font-size:1.2rem; color:var(--color-text);
        border-bottom:2px solid var(--color-primary); padding-bottom:.5rem;
      }
      .team-metrics-grid .metric-score { 
        font-size:2rem; font-weight:700; color:var(--color-primary);
        margin-bottom:1rem; text-align:center;
      }
      
      .metric-details { display:flex; flex-direction:column; gap:.75rem; }
      .metric-item { 
        display:flex; justify-content:space-between; align-items:center;
        padding:.5rem; background:var(--color-bg); border-radius:4px;
      }
      .metric-name { font-size:.85rem; color:var(--color-text-secondary); }
      .metric-value { 
        font-weight:600; 
        background:var(--color-primary); color:#fff; 
        padding:.25rem .5rem; border-radius:4px; font-size:.8rem;
      }
      .metric-limitations { 
        margin-top:.5rem; padding:.25rem .5rem; 
        background:var(--color-bg); border-radius:4px; 
        text-align:left; opacity:0.8;
      }
      .metric-limitations small { 
        font-size:.75rem; color:var(--color-text-secondary); 
        font-style:italic;
      }
      
      /* File Type Breakdown Styles */
      .file-type-breakdown {
        margin-top: 1rem;
        padding: 1rem;
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        border-radius: 8px;
      }
      .file-type-breakdown h4 {
        margin: 0 0 1rem;
        font-size: 1.1rem;
        color: var(--color-text);
        border-bottom: 1px solid var(--color-border);
        padding-bottom: 0.5rem;
      }
      .file-type-categories {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .category-item {
        padding: 0.75rem;
        background: var(--color-surface);
        border-radius: 6px;
        border: 1px solid var(--color-border);
      }
      .category-name {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--color-primary);
        margin-bottom: 0.5rem;
        text-transform: capitalize;
      }
      .category-percentage {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--color-text);
      }
      .file-type-extensions {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--color-border);
      }
      .file-type-extensions h5 {
        margin: 0 0 0.75rem;
        font-size: 0.95rem;
        color: var(--color-text-secondary);
      }
      .extensions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 0.5rem;
      }
      .file-type-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0.75rem;
        background: var(--color-bg);
        border-radius: 4px;
        border: 1px solid var(--color-border);
        font-size: 0.85rem;
      }
      .file-extension {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-weight: 600;
        color: var(--color-primary);
      }
      .file-percentage {
        font-weight: 600;
        color: var(--color-text);
      }
      
      /* Repository details styling */
      .repository-details {
        margin-top: 1.5rem;
      }
      .repository-details .table-wrapper {
        margin-bottom: 2rem;
      }
      .repository-details h3 {
        margin: 0 0 0.5rem;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--color-text);
      }
      .directory-path {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.9rem;
        color: var(--color-text-muted);
        background: var(--color-surface);
        padding: 0.125rem 0.375rem;
        border-radius: 3px;
        border: 1px solid var(--color-border);
      }
      
      .team-insights { margin-top:2rem; }
      .insights-section h3 { margin:0 0 1rem; font-size:1.3rem; }
      .dynamic-badges { display:flex; gap:.75rem; flex-wrap:wrap; margin-bottom:1.5rem; }
      .dynamic-badge { 
        padding:.5rem 1rem; background:var(--color-primary); color:#fff; 
        border-radius:20px; font-size:.85rem; font-weight:500;
        text-transform:capitalize;
      }
      
      .insights-grid { 
        display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); 
        gap:1.5rem; margin-bottom:2rem; 
      }
      .insight-category { 
        background:var(--color-bg); border:1px solid var(--color-border); 
        border-radius:6px; padding:1rem; 
      }
      .insight-category h4 { 
        margin:0 0 .75rem; font-size:1rem; 
        color:var(--color-text); border-bottom:1px solid var(--color-border); 
        padding-bottom:.5rem; 
      }
      .insight-category ul { margin:0; padding-left:1.2rem; }
      .insight-category li { font-size:.85rem; margin:.5rem 0; }

      /* Documentation Section Styles */
      .doc-intro { font-style:italic; color:var(--color-text-secondary); margin-bottom:2rem; }
      
      .measurement-limitations {
        background:#fff3cd; border:1px solid #ffeaa7; border-radius:8px; 
        padding:1.5rem; margin-bottom:2rem; border-left:4px solid #fdcb6e;
      }
      :root.dark .measurement-limitations {
        background:#2d2419; border-color:#635a3e; border-left-color:#fdcb6e;
      }
      .measurement-limitations h3 {
        color:#856404; margin:0 0 1rem; font-size:1.2rem;
      }
      :root.dark .measurement-limitations h3 { color:#ffeaa7; }
      .measurement-limitations p { margin:.75rem 0; }
      .measurement-limitations ul { margin:.5rem 0; padding-left:1.5rem; }
      .measurement-limitations li { margin:.25rem 0; }
      .limitation-notice {
        background:#fff3cd; border:1px solid #ffeaa7; border-radius:4px;
        padding:.75rem; margin:.75rem 0; font-size:.9rem;
        border-left:3px solid #fd7e14;
      }
      :root.dark .limitation-notice {
        background:#2d2419; border-color:#635a3e; color:#ffeaa7;
      }
      
      .doc-section { 
        margin-bottom:2.5rem; padding-bottom:1.5rem; 
        border-bottom:1px solid var(--color-border); 
      }
      .doc-section:last-child { border-bottom:none; }
      .doc-section h3 { 
        color:var(--color-primary); font-size:1.4rem; 
        margin-bottom:1rem; border-bottom:2px solid var(--color-primary); 
        padding-bottom:.5rem; 
      }
      .doc-section h4 { 
        color:var(--color-text); font-size:1.1rem; 
        margin:1.5rem 0 .75rem; 
      }
      
      .formula-box { 
        background:var(--color-bg); border:1px solid var(--color-border); 
        border-radius:6px; padding:1rem; margin:1rem 0; 
        border-left:4px solid var(--color-primary); 
      }
      .formula-box h4 { 
        margin:0 0 .75rem; font-size:1rem; 
        color:var(--color-primary); 
      }
      .formula { 
        font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; 
        font-size:.9rem; display:block; 
        background:var(--color-surface); padding:.75rem; 
        border-radius:4px; border:1px solid var(--color-border); 
        margin:.5rem 0; color:var(--color-text); 
        overflow-x:auto; 
      }
      
      .metric-docs { margin-top:1.5rem; }
      .metric-category { 
        margin-bottom:2rem; background:var(--color-surface); 
        border:1px solid var(--color-border); border-radius:6px; 
        padding:1.5rem; 
      }
      .metric-category h4 { 
        margin-top:0; color:var(--color-primary); 
        border-bottom:1px solid var(--color-border); 
        padding-bottom:.5rem; 
      }
      .metric-category ul { margin:.75rem 0; }
      .metric-category li { 
        margin:.75rem 0; line-height:1.5; 
        font-size:.9rem; 
      }
      .metric-category strong { color:var(--color-text); }
      
      .score-thresholds { 
        background:var(--color-bg); border:1px solid var(--color-border); 
        border-radius:6px; padding:1.5rem; margin-top:1.5rem; 
        border-left:4px solid var(--color-success); 
      }
      .score-thresholds h4 { 
        margin-top:0; color:var(--color-success); 
      }
      .score-thresholds ul { margin:.75rem 0; }
      .score-thresholds li { 
        margin:.5rem 0; font-size:.9rem; 
        line-height:1.4; 
      }
      
      .methodology-note { 
        background:var(--color-bg); border:1px solid var(--color-border); 
        border-radius:6px; padding:1.5rem; margin-top:2rem; 
        border-left:4px solid var(--color-warning); 
      }
      .methodology-note h4 { 
        margin-top:0; color:var(--color-warning); 
        margin-bottom:1rem; 
      }
      .methodology-note p { 
        margin:.75rem 0; font-size:.9rem; 
        line-height:1.5; 
      }
      .methodology-note strong { color:var(--color-text); }
      .metric-box .metric-value { font-size:1.2rem; font-weight:600; }
      .metric-box .metric-label { font-size:.7rem; color:var(--color-text-secondary); text-transform:uppercase; margin-top:.25rem; }
      
      .summary-stats { font-size:.85rem; color:var(--color-text-secondary); text-align:center; padding:.5rem; background:var(--color-bg); border-radius:4px; }
      .pattern-info, .collab-stats, .focus-info { font-size:.85rem; line-height:1.4; }
      .pattern-info div, .collab-stats div, .focus-info div { margin:.25rem 0; }
      
      .size-distribution { background:var(--color-bg); padding:.75rem; border-radius:6px; border:1px solid var(--color-border); }
      .size-bar { display:flex; align-items:center; margin:.5rem 0; gap:.75rem; }
      .size-label { min-width:120px; font-size:.75rem; color:var(--color-text-secondary); }
      .size-bar-container { flex:1; position:relative; background:var(--color-border); height:24px; border-radius:12px; overflow:hidden; }
      .size-bar-fill { height:100%; border-radius:12px; transition:width 0.3s ease; min-width:0; }
      .size-bar-fill.micro { background:#28a745; }
      .size-bar-fill.small { background:#20c997; }
      .size-bar-fill.medium { background:#ffc107; }
      .size-bar-fill.large { background:#fd7e14; }
      .size-bar-fill.very-large { background:#dc3545; }
      /* Width classes for commit size bars - CSP compliant */
      .size-bar-fill.w-0 { width: 0%; }
      .size-bar-fill.w-1 { width: 1%; }
      .size-bar-fill.w-2 { width: 2%; }
      .size-bar-fill.w-3 { width: 3%; }
      .size-bar-fill.w-4 { width: 4%; }
      .size-bar-fill.w-5 { width: 5%; }
      .size-bar-fill.w-10 { width: 10%; }
      .size-bar-fill.w-15 { width: 15%; }
      .size-bar-fill.w-20 { width: 20%; }
      .size-bar-fill.w-25 { width: 25%; }
      .size-bar-fill.w-30 { width: 30%; }
      .size-bar-fill.w-35 { width: 35%; }
      .size-bar-fill.w-40 { width: 40%; }
      .size-bar-fill.w-45 { width: 45%; }
      .size-bar-fill.w-50 { width: 50%; }
      .size-bar-fill.w-55 { width: 55%; }
      .size-bar-fill.w-60 { width: 60%; }
      .size-bar-fill.w-65 { width: 65%; }
      .size-bar-fill.w-70 { width: 70%; }
      .size-bar-fill.w-75 { width: 75%; }
      .size-bar-fill.w-80 { width: 80%; }
      .size-bar-fill.w-85 { width: 85%; }
      .size-bar-fill.w-90 { width: 90%; }
      .size-bar-fill.w-95 { width: 95%; }
      .size-bar-fill.w-100 { width: 100%; }
      .size-percentage { position:absolute; right:.5rem; top:50%; transform:translateY(-50%); font-size:.7rem; font-weight:500; color:var(--color-text); background:var(--color-surface); padding:.1rem .4rem; border-radius:10px; border:1px solid var(--color-border); }
      .size-percentage.no-data { background:transparent; border:none; color:var(--color-text-secondary); }
      
      .insights-content { display:flex; flex-direction:column; gap:.5rem; }
      .insight { padding:.5rem .75rem; border-radius:4px; font-size:.85rem; }
      .insight.positive { background:#d4edda; color:#155724; border-left:4px solid #28a745; }
      .insight.growth { background:#fff3cd; color:#856404; border-left:4px solid #ffc107; }
      .largest-commit { background:var(--color-bg); padding:.75rem; border-radius:4px; font-size:.85rem; margin-top:.5rem; }
      .largest-commit strong { color:var(--color-primary); }
      .largest-commit em { color:var(--color-text-secondary); }
      .no-data { text-align:center; color:var(--color-text-secondary); font-size:.85rem; padding:1rem; }
      
      /* Responsive design for author profiles */
      @media (max-width: 768px) { 
        .metrics-grid { grid-template-columns:repeat(auto-fit, minmax(100px, 1fr)); }
        .size-bar { flex-direction:column; align-items:flex-start; gap:.25rem; }
        .size-label { min-width:auto; }
        .size-bar-container { width:100%; }
      }

      /* Daily Trends Section Styles */
      .trends-overview { margin-bottom:2rem; }
      .trends-summary-grid { 
        display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); 
        gap:1rem; margin-bottom:1.5rem; 
      }
      .trend-summary-card { 
        background:var(--color-surface); border:1px solid var(--color-border); 
        border-radius:8px; padding:1.5rem; text-align:center; 
        box-shadow:var(--shadow-sm); 
      }
      .summary-metric .metric-value { 
        font-size:2rem; font-weight:700; margin-bottom:.5rem; 
      }
      .summary-metric .metric-label { 
        font-size:.9rem; font-weight:600; color:var(--color-text); 
        margin-bottom:.25rem; 
      }
      .summary-metric .metric-detail { 
        font-size:.75rem; color:var(--color-text-secondary); 
      }
      
      .key-trends { margin-bottom:2rem; }
      .trend-category { 
        margin-bottom:2.5rem; background:var(--color-surface); 
        border:1px solid var(--color-border); border-radius:8px; 
        padding:1.5rem; border-left:4px solid var(--color-primary); 
      }
      .trend-category h4 { 
        margin:0 0 1rem; font-size:1.2rem; color:var(--color-primary); 
        border-bottom:1px solid var(--color-border); padding-bottom:.5rem; 
      }
      .trend-explanation { 
        margin-bottom:1.5rem; padding:.75rem; 
        background:var(--color-bg); border-radius:4px; 
        border-left:3px solid var(--color-primary); 
      }
      .trend-explanation p { margin:0; font-size:.9rem; color:var(--color-text); }
      
      .trends-table { font-size:.8rem; }
      .trends-table th, .trends-table td { padding:.4rem .6rem; }
      .table-note { 
        font-size:.75rem; color:var(--color-text-secondary); 
        margin-top:.5rem; font-style:italic; 
      }
      
      .trends-limitations { 
        background:#fff3cd; border:1px solid #ffeaa7; 
        border-radius:8px; padding:1.5rem; 
        border-left:4px solid #fd7e14; 
      }
      :root.dark .trends-limitations { 
        background:#2d2419; border-color:#635a3e; 
      }
      .trends-limitations h3 { 
        color:#856404; margin:0 0 1rem; font-size:1.2rem; 
      }
      :root.dark .trends-limitations h3 { color:#ffeaa7; }
      .trends-limitations h4 { 
        color:#856404; margin:1.5rem 0 .75rem; font-size:1rem; 
      }
      :root.dark .trends-limitations h4 { color:#ffeaa7; }
      .trends-limitations ul { margin:.5rem 0; padding-left:1.5rem; }
      .trends-limitations li { margin:.25rem 0; font-size:.9rem; }

      /* Contributions Graph Styles */
      .contributions-graph { 
        margin: 2rem 0; 
        background: var(--color-surface); 
        border: 1px solid var(--color-border); 
        border-radius: 8px; 
        padding: 1.5rem; 
        border-left: 4px solid var(--color-primary); 
      }
      .contributions-graph h3 { 
        margin: 0 0 1rem; 
        font-size: 1.2rem; 
        color: var(--color-primary); 
        border-bottom: 1px solid var(--color-border); 
        padding-bottom: .5rem; 
      }
      .contributions-calendar { 
        display: flex; 
        flex-direction: column; 
        gap: 3px; 
        max-width: 100%; 
        overflow-x: auto; 
        padding: 1rem 0; 
      }
      .contributions-header { 
        display: flex; 
        justify-content: space-between; 
        align-items: center; 
        margin-bottom: 1rem; 
        font-size: .9rem; 
        color: var(--color-text-secondary); 
      }
      .contributions-weeks { 
        display: flex; 
        gap: 3px; 
      }
      .contributions-week { 
        display: flex; 
        flex-direction: column; 
        gap: 3px; 
      }
      .contribution-day { 
        width: 10px; 
        height: 10px; 
        border-radius: 2px; 
        border: 1px solid var(--color-border); 
        cursor: pointer; 
        transition: all 0.2s ease; 
      }
      .contribution-day:hover { 
        border-color: var(--color-primary); 
        transform: scale(1.2); 
      }
      .contribution-day.intensity-0 { 
        background: var(--color-bg); 
      }
      .contribution-day.intensity-1 { 
        background: #9be9a8; 
      }
      .contribution-day.intensity-2 { 
        background: #40c463; 
      }
      .contribution-day.intensity-3 { 
        background: #30a14e; 
      }
      .contribution-day.intensity-4 { 
        background: #216e39; 
      }
      .contributions-legend { 
        display: flex; 
        align-items: center; 
        gap: .5rem; 
        margin-top: 1rem; 
        font-size: .75rem; 
        color: var(--color-text-secondary); 
      }
      .legend-scale { 
        display: flex; 
        gap: 2px; 
      }
      .legend-day { 
        width: 8px; 
        height: 8px; 
        border-radius: 1px; 
        border: 1px solid var(--color-border); 
      }
      .contribution-tooltip { 
        position: absolute; 
        background: var(--color-surface); 
        border: 1px solid var(--color-border); 
        border-radius: 4px; 
        padding: .5rem; 
        font-size: .75rem; 
        box-shadow: var(--shadow-lg); 
        z-index: 1000; 
        pointer-events: none; 
        opacity: 0; 
        transition: opacity 0.2s ease; 
      }
      .contribution-tooltip.visible { 
        opacity: 1; 
      }

      /* Visual Trends Chart Styles */
      .visual-trends { margin: 2rem 0; }
      .charts-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); 
        gap: 2rem; 
        margin: 1.5rem 0; 
      }
      
      .chart-container { 
        background: var(--color-surface); 
        border: 1px solid var(--color-border); 
        border-radius: 8px; 
        padding: 1.5rem; 
        box-shadow: var(--shadow-sm); 
      }
      .chart-container h4 { 
        margin: 0 0 1rem; 
        font-size: 1.1rem; 
        color: var(--color-text); 
        border-bottom: 1px solid var(--color-border); 
        padding-bottom: 0.5rem; 
      }
      
      .trend-chart { 
        max-width: 100%; 
        height: auto; 
        border-radius: 4px; 
        background: var(--color-surface); 
      }
      .trend-chart .data-points circle:hover { 
        r: 5; 
        stroke: var(--color-surface); 
        stroke-width: 2; 
        cursor: pointer; 
      }
      .trend-chart .grid line { 
        stroke: var(--color-border); 
        stroke-opacity: 0.3; 
      }
      
      .chart-placeholder { 
        text-align: center; 
        color: var(--color-text-secondary); 
        font-style: italic; 
        padding: 2rem; 
        background: var(--color-bg); 
        border-radius: 4px; 
        border: 1px dashed var(--color-border); 
      }
      
      /* Sparklines Styles */
      .sparklines-container { 
        grid-column: 1 / -1;
        background: var(--color-surface); 
        border: 1px solid var(--color-border); 
        border-radius: 8px; 
        padding: 1.5rem; 
        box-shadow: var(--shadow-sm); 
      }
      .sparklines-container h4 { 
        margin: 0 0 1rem; 
        font-size: 1.1rem; 
        color: var(--color-text); 
        border-bottom: 1px solid var(--color-border); 
        padding-bottom: 0.5rem; 
      }
      
      .sparklines-grid { 
        display: grid; 
        grid-template-columns: repeat(2, 1fr); 
        gap: 1.5rem; 
      }
      
      .sparkline-item { 
        background: var(--color-bg); 
        border: 1px solid var(--color-border); 
        border-radius: 6px; 
        padding: 1rem; 
      }
      .sparkline-label { 
        font-size: 0.85rem; 
        font-weight: 600; 
        color: var(--color-text); 
        margin-bottom: 0.5rem; 
      }
      .sparkline-summary { 
        font-size: 0.75rem; 
        color: var(--color-text-secondary); 
        margin-top: 0.5rem; 
        text-align: center; 
      }
      
      .sparkline-chart { 
        height: 60px; 
        margin: 0.75rem 0; 
        position: relative;
      }
      .sparkline-chart svg {
        display: block;
        width: 100%;
        height: 50px;
      }
      .sparkline-chart svg rect {
        cursor: pointer;
        transition: opacity 0.2s ease;
      }
      .sparkline-chart svg rect:hover {
        opacity: 0.8;
      }
      
      /* Responsive design for charts */
      @media (max-width: 768px) { 
        .charts-grid { 
          grid-template-columns: 1fr; 
        }
        .sparklines-grid { 
          grid-template-columns: 1fr; 
        }
        .trend-chart { 
          width: 100%; 
          height: auto; 
        }
      }
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); 
        }
      }
    `;
}
