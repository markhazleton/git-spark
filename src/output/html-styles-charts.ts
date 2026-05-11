/**
 * Chart CSS: daily trends section, contributions calendar, visual trend
 * charts, and sparklines.
 * Combined with the other html-styles-*.ts modules by html-styles.ts.
 */
export function getChartStyles(): string {
  return `
      /* Daily Trends Section Styles */
      .trends-overview { margin-bottom:2rem; }
      .trends-summary-grid {
        display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
        gap:1rem; margin-bottom:1.5rem;
      }
      .trend-summary-card {
        background:var(--color-surface); border:1px solid var(--color-border);
        border-radius:8px; padding:1.5rem; text-align:center; box-shadow:var(--shadow-sm);
      }
      .summary-metric .metric-value { font-size:2rem; font-weight:700; margin-bottom:.5rem; }
      .summary-metric .metric-label { font-size:.9rem; font-weight:600; color:var(--color-text); margin-bottom:.25rem; }
      .summary-metric .metric-detail { font-size:.75rem; color:var(--color-text-secondary); }
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
        background:var(--color-bg); border-radius:4px; border-left:3px solid var(--color-primary);
      }
      .trend-explanation p { margin:0; font-size:.9rem; color:var(--color-text); }
      .trends-table { font-size:.8rem; }
      .trends-table th, .trends-table td { padding:.4rem .6rem; }
      .table-note { font-size:.75rem; color:var(--color-text-secondary); margin-top:.5rem; font-style:italic; }
      .trends-limitations {
        background:#fff3cd; border:1px solid #ffeaa7;
        border-radius:8px; padding:1.5rem; border-left:4px solid #fd7e14;
      }
      :root.dark .trends-limitations { background:#2d2419; border-color:#635a3e; }
      .trends-limitations h3 { color:#856404; margin:0 0 1rem; font-size:1.2rem; }
      :root.dark .trends-limitations h3 { color:#ffeaa7; }
      .trends-limitations h4 { color:#856404; margin:1.5rem 0 .75rem; font-size:1rem; }
      :root.dark .trends-limitations h4 { color:#ffeaa7; }
      .trends-limitations ul { margin:.5rem 0; padding-left:1.5rem; }
      .trends-limitations li { margin:.25rem 0; font-size:.9rem; }
      .contributions-graph {
        margin: 2rem 0; background: var(--color-surface);
        border: 1px solid var(--color-border); border-radius: 8px;
        padding: 1.5rem; border-left: 4px solid var(--color-primary);
      }
      .contributions-graph h3 {
        margin: 0 0 1rem; font-size: 1.2rem; color: var(--color-primary);
        border-bottom: 1px solid var(--color-border); padding-bottom: .5rem;
      }
      .contributions-calendar {
        display: flex; flex-direction: column; gap: 3px;
        max-width: 100%; overflow-x: auto; padding: 1rem 0;
      }
      .contributions-header {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 1rem; font-size: .9rem; color: var(--color-text-secondary);
      }
      .contributions-weeks { display: flex; gap: 3px; }
      .contributions-week { display: flex; flex-direction: column; gap: 3px; }
      .contribution-day {
        width: 10px; height: 10px; border-radius: 2px;
        border: 1px solid var(--color-border); cursor: pointer; transition: all 0.2s ease;
      }
      .contribution-day:hover { border-color: var(--color-primary); transform: scale(1.2); }
      .contribution-day.intensity-0 { background: var(--color-bg); }
      .contribution-day.intensity-1 { background: #9be9a8; }
      .contribution-day.intensity-2 { background: #40c463; }
      .contribution-day.intensity-3 { background: #30a14e; }
      .contribution-day.intensity-4 { background: #216e39; }
      .contributions-legend {
        display: flex; align-items: center; gap: .5rem;
        margin-top: 1rem; font-size: .75rem; color: var(--color-text-secondary);
      }
      .legend-scale { display: flex; gap: 2px; }
      .legend-day { width: 8px; height: 8px; border-radius: 1px; border: 1px solid var(--color-border); }
      .contribution-tooltip {
        position: absolute; background: var(--color-surface);
        border: 1px solid var(--color-border); border-radius: 4px;
        padding: .5rem; font-size: .75rem; box-shadow: var(--shadow-lg);
        z-index: 1000; pointer-events: none; opacity: 0; transition: opacity 0.2s ease;
      }
      .contribution-tooltip.visible { opacity: 1; }
      .visual-trends { margin: 2rem 0; }
      .charts-grid {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 2rem; margin: 1.5rem 0;
      }
      .chart-container {
        background: var(--color-surface); border: 1px solid var(--color-border);
        border-radius: 8px; padding: 1.5rem; box-shadow: var(--shadow-sm);
      }
      .chart-container h4 {
        margin: 0 0 1rem; font-size: 1.1rem; color: var(--color-text);
        border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem;
      }
      .trend-chart { max-width: 100%; height: auto; border-radius: 4px; background: var(--color-surface); }
      .trend-chart .data-points circle:hover { r: 5; stroke: var(--color-surface); stroke-width: 2; cursor: pointer; }
      .trend-chart .grid line { stroke: var(--color-border); stroke-opacity: 0.3; }
      .chart-placeholder {
        text-align: center; color: var(--color-text-secondary); font-style: italic;
        padding: 2rem; background: var(--color-bg); border-radius: 4px;
        border: 1px dashed var(--color-border);
      }
      .sparklines-container {
        grid-column: 1 / -1; background: var(--color-surface);
        border: 1px solid var(--color-border); border-radius: 8px;
        padding: 1.5rem; box-shadow: var(--shadow-sm);
      }
      .sparklines-container h4 {
        margin: 0 0 1rem; font-size: 1.1rem; color: var(--color-text);
        border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem;
      }
      .sparklines-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
      .sparkline-item {
        background: var(--color-bg); border: 1px solid var(--color-border);
        border-radius: 6px; padding: 1rem;
      }
      .sparkline-label { font-size: 0.85rem; font-weight: 600; color: var(--color-text); margin-bottom: 0.5rem; }
      .sparkline-summary { font-size: 0.75rem; color: var(--color-text-secondary); margin-top: 0.5rem; text-align: center; }
      .sparkline-chart { height: 60px; margin: 0.75rem 0; position: relative; }
      .sparkline-chart svg { display: block; width: 100%; height: 50px; }
      .sparkline-chart svg rect { cursor: pointer; transition: opacity 0.2s ease; }
      .sparkline-chart svg rect:hover { opacity: 0.8; }
      @media (max-width: 768px) {
        .charts-grid { grid-template-columns: 1fr; }
        .sparklines-grid { grid-template-columns: 1fr; }
        .trend-chart { width: 100%; height: auto; }
      }
  `;
}
