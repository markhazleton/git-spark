/**
 * Base CSS: custom properties, layout, header/nav, utility classes, badges, tables, print.
 * Combined with the other html-styles-*.ts modules by html-styles.ts.
 */
export function getBaseStyles(): string {
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
      .section-description { font-style:italic; color:var(--color-text-secondary); margin-bottom:1.5rem; font-size:.9rem; }
      .team-patterns-grid { display:grid; gap:1.5rem; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); margin-bottom:2rem; }
      .pattern-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:8px; padding:1.5rem; box-shadow:var(--shadow-sm); }
      .pattern-card h3 { margin:0 0 1rem; font-size:1.1rem; color:var(--color-text); border-bottom:2px solid var(--color-primary); padding-bottom:.5rem; }
      .pattern-metrics { display:flex; flex-direction:column; gap:.75rem; }
      .pattern-metric { display:flex; justify-content:space-between; align-items:center; padding:.5rem; background:var(--color-bg); border-radius:4px; }
      .pattern-metric .metric-label { font-size:.85rem; color:var(--color-text-secondary); }
      .pattern-metric .metric-value { font-weight:600; }
      .pattern-metric .metric-note { font-size:.75rem; color:var(--color-text-secondary); font-style:italic; }
      .activity-badge { padding:.25rem .5rem; border-radius:4px; font-size:.65rem; font-weight:600; }
      .activity-high { background:var(--color-danger); color:#fff; }
      .activity-medium { background:var(--color-warning); color:#000; }
      .activity-low { background:var(--color-success); color:#fff; }
      .activity-minimal { background:#3b7ddd; color:#fff; }
      .measurement-principles { margin-bottom:2rem; }
      .principles-grid { display:grid; gap:1rem; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); margin-top:1rem; }
      .principle-card { background:var(--color-surface); border:1px solid var(--color-border); border-radius:6px; padding:1rem; border-left:4px solid var(--color-primary); }
      .principle-card h4 { margin:0 0 .75rem; color:var(--color-primary); font-size:1rem; }
      .principle-card p { margin:0; font-size:.9rem; }
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
  `;
}
