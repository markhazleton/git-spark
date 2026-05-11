/**
 * Component CSS: author profiles, team score, file-type breakdown, repository
 * details, team insights, documentation section, size distribution.
 * Combined with the other html-styles-*.ts modules by html-styles.ts.
 */
export function getComponentStyles(): string {
  return `
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
      .metric-box .metric-value { font-size:1.2rem; font-weight:600; }
      .metric-box .metric-label { font-size:.7rem; color:var(--color-text-secondary); text-transform:uppercase; margin-top:.25rem; }
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
      .file-type-breakdown {
        margin-top: 1rem; padding: 1rem;
        background: var(--color-bg); border: 1px solid var(--color-border); border-radius: 8px;
      }
      .file-type-breakdown h4 {
        margin: 0 0 1rem; font-size: 1.1rem; color: var(--color-text);
        border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem;
      }
      .file-type-categories {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem; margin-bottom: 1rem;
      }
      .category-item {
        padding: 0.75rem; background: var(--color-surface);
        border-radius: 6px; border: 1px solid var(--color-border);
      }
      .category-name {
        font-weight: 600; font-size: 0.9rem; color: var(--color-primary);
        margin-bottom: 0.5rem; text-transform: capitalize;
      }
      .category-percentage { font-size: 1.1rem; font-weight: 600; color: var(--color-text); }
      .file-type-extensions { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border); }
      .file-type-extensions h5 { margin: 0 0 0.75rem; font-size: 0.95rem; color: var(--color-text-secondary); }
      .extensions-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5rem;
      }
      .file-type-item {
        display: flex; justify-content: space-between; align-items: center;
        padding: 0.5rem 0.75rem; background: var(--color-bg);
        border-radius: 4px; border: 1px solid var(--color-border); font-size: 0.85rem;
      }
      .file-extension {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-weight: 600; color: var(--color-primary);
      }
      .file-percentage { font-weight: 600; color: var(--color-text); }
      .repository-details { margin-top: 1.5rem; }
      .repository-details .table-wrapper { margin-bottom: 2rem; }
      .repository-details h3 {
        margin: 0 0 0.5rem; font-size: 1.25rem; font-weight: 600; color: var(--color-text);
      }
      .directory-path {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.9rem; color: var(--color-text-muted);
        background: var(--color-surface); padding: 0.125rem 0.375rem;
        border-radius: 3px; border: 1px solid var(--color-border);
      }
      .team-insights { margin-top:2rem; }
      .insights-section h3 { margin:0 0 1rem; font-size:1.3rem; }
      .dynamic-badges { display:flex; gap:.75rem; flex-wrap:wrap; margin-bottom:1.5rem; }
      .dynamic-badge {
        padding:.5rem 1rem; background:var(--color-primary); color:#fff;
        border-radius:20px; font-size:.85rem; font-weight:500; text-transform:capitalize;
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
        color:var(--color-text); border-bottom:1px solid var(--color-border); padding-bottom:.5rem;
      }
      .insight-category ul { margin:0; padding-left:1.2rem; }
      .insight-category li { font-size:.85rem; margin:.5rem 0; }
      .doc-intro { font-style:italic; color:var(--color-text-secondary); margin-bottom:2rem; }
      .measurement-limitations {
        background:#fff3cd; border:1px solid #ffeaa7; border-radius:8px;
        padding:1.5rem; margin-bottom:2rem; border-left:4px solid #fdcb6e;
      }
      :root.dark .measurement-limitations {
        background:#2d2419; border-color:#635a3e; border-left-color:#fdcb6e;
      }
      .measurement-limitations h3 { color:#856404; margin:0 0 1rem; font-size:1.2rem; }
      :root.dark .measurement-limitations h3 { color:#ffeaa7; }
      .measurement-limitations p { margin:.75rem 0; }
      .measurement-limitations ul { margin:.5rem 0; padding-left:1.5rem; }
      .measurement-limitations li { margin:.25rem 0; }
      .limitation-notice {
        background:#fff3cd; border:1px solid #ffeaa7; border-radius:4px;
        padding:.75rem; margin:.75rem 0; font-size:.9rem; border-left:3px solid #fd7e14;
      }
      :root.dark .limitation-notice { background:#2d2419; border-color:#635a3e; color:#ffeaa7; }
      .doc-section {
        margin-bottom:2.5rem; padding-bottom:1.5rem; border-bottom:1px solid var(--color-border);
      }
      .doc-section:last-child { border-bottom:none; }
      .doc-section h3 {
        color:var(--color-primary); font-size:1.4rem;
        margin-bottom:1rem; border-bottom:2px solid var(--color-primary); padding-bottom:.5rem;
      }
      .doc-section h4 { color:var(--color-text); font-size:1.1rem; margin:1.5rem 0 .75rem; }
      .formula-box {
        background:var(--color-bg); border:1px solid var(--color-border);
        border-radius:6px; padding:1rem; margin:1rem 0; border-left:4px solid var(--color-primary);
      }
      .formula-box h4 { margin:0 0 .75rem; font-size:1rem; color:var(--color-primary); }
      .formula {
        font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size:.9rem; display:block;
        background:var(--color-surface); padding:.75rem;
        border-radius:4px; border:1px solid var(--color-border);
        margin:.5rem 0; color:var(--color-text); overflow-x:auto;
      }
      .metric-docs { margin-top:1.5rem; }
      .metric-category {
        margin-bottom:2rem; background:var(--color-surface);
        border:1px solid var(--color-border); border-radius:6px; padding:1.5rem;
      }
      .metric-category h4 {
        margin-top:0; color:var(--color-primary);
        border-bottom:1px solid var(--color-border); padding-bottom:.5rem;
      }
      .metric-category ul { margin:.75rem 0; }
      .metric-category li { margin:.75rem 0; line-height:1.5; font-size:.9rem; }
      .metric-category strong { color:var(--color-text); }
      .score-thresholds {
        background:var(--color-bg); border:1px solid var(--color-border);
        border-radius:6px; padding:1.5rem; margin-top:1.5rem;
        border-left:4px solid var(--color-success);
      }
      .score-thresholds h4 { margin-top:0; color:var(--color-success); }
      .score-thresholds ul { margin:.75rem 0; }
      .score-thresholds li { margin:.5rem 0; font-size:.9rem; line-height:1.4; }
      .methodology-note {
        background:var(--color-bg); border:1px solid var(--color-border);
        border-radius:6px; padding:1.5rem; margin-top:2rem;
        border-left:4px solid var(--color-warning);
      }
      .methodology-note h4 { margin-top:0; color:var(--color-warning); margin-bottom:1rem; }
      .methodology-note p { margin:.75rem 0; font-size:.9rem; line-height:1.5; }
      .methodology-note strong { color:var(--color-text); }
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
      @media (max-width: 768px) {
        .metrics-grid { grid-template-columns:repeat(auto-fit, minmax(100px, 1fr)); }
        .size-bar { flex-direction:column; align-items:flex-start; gap:.25rem; }
        .size-label { min-width:auto; }
        .size-bar-container { width:100%; }
      }
  `;
}
