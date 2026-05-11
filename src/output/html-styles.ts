/**
 * CSS styles for Git Spark HTML reports.
 *
 * Returns a single self-contained style block built from three sub-modules:
 *   html-styles-base.ts       — variables, layout, utility classes
 *   html-styles-components.ts — author profiles, team score, doc sections
 *   html-styles-charts.ts     — daily trends, contribution calendar, SVG charts
 *
 * The combined string is SHA-256 hashed in html.ts for CSP compliance —
 * any change here requires the hash to be recomputed in generateHTML().
 */
import { getBaseStyles } from './html-styles-base.js';
import { getComponentStyles } from './html-styles-components.js';
import { getChartStyles } from './html-styles-charts.js';

export function getCustomStyles(): string {
  return getBaseStyles() + getComponentStyles() + getChartStyles();
}
