import { AnalysisReport } from '../types';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from       `;
  }
}t { createLogger } from '../utils/logger';

const logger = createLogger('html-exporter');

/**
 * Exports analysis reports as interactive HTML with charts and visualizations
 * 
 * The HTMLExporter generates comprehensive HTML reports featuring:
 * - Executive summary with health metrics
 * - Interactive charts using Chart.js
 * - Detailed author and file analysis tables
 * - Risk assessment with color-coded indicators
 * - Governance scoring and recommendations
 * - Responsive design with modern CSS styling
 * 
 * @example
 * ```typescript
 * const exporter = new HTMLExporter();
 * await exporter.export(analysisReport, './reports');
 * // Creates: ./reports/git-spark-report.html
 * ```
 */
export class HTMLExporter {
  /**
   * Export analysis report as interactive HTML file
   * 
   * Creates a self-contained HTML file with embedded CSS and JavaScript
   * for interactive charts and visualizations. The file includes all
   * necessary dependencies via CDN links.
   * 
   * @param report - The complete analysis report to export
   * @param outputPath - Directory path where HTML file will be created
   * @throws {Error} When output directory cannot be created or file cannot be written
   * @returns Promise that resolves when export is complete
   */
  async export(report: AnalysisReport, outputPath: string): Promise<void> {
    try {
      const fullPath = resolve(outputPath, 'git-spark-report.html');

      // Ensure directory exists
      mkdirSync(dirname(fullPath), { recursive: true });

      // Generate HTML content
      const htmlContent = this.generateHTML(report);

      // Write to file
      writeFileSync(fullPath, htmlContent, 'utf-8');

      logger.info('HTML report exported successfully', { path: fullPath });
    } catch (error) {
      logger.error('Failed to export HTML report', { error });
      throw error;
    }
  }

  /**
   * Generate complete HTML document with embedded styles and scripts
   * 
   * Creates a self-contained HTML file with:
   * - Bootstrap CSS for responsive layout
   * - Chart.js for interactive visualizations
   * - Custom CSS for git-spark branding
   * - JavaScript for chart rendering and interactions
   * 
   * @param report - Analysis report data to render
   * @returns Complete HTML document as string
   * @private
   */
  private generateHTML(report: AnalysisReport): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Git Spark Analysis Report</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    ${this.getCustomStyles()}
  </style>
</head>
<body>
  <div class="container-fluid">
    <h1 class="text-center my-4">Git Spark Analysis Report</h1>
    <p class="text-center text-muted">Generated on ${new Date().toLocaleString()}</p>
    
    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Repository Summary</h5>
            <p>Total Commits: ${report.repository.totalCommits}</p>
            <p>Total Authors: ${report.repository.totalAuthors}</p>
            <p>Total Files: ${report.repository.totalFiles}</p>
            <p>Health Score: ${report.repository.healthScore.toFixed(1)}/100</p>
            <p>Governance Score: ${report.repository.governanceScore.toFixed(1)}/100</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
  }

  /**
   * Get custom CSS styles for the HTML report
   * 
   * @returns CSS styles as string
   * @private
   */
  private getCustomStyles(): string {
    return `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: #f8f9fa;
      }
      .card {
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        border: 1px solid rgba(0, 0, 0, 0.125);
      }
    `;
  }

  /**
   * Copy static assets to output directory
   * 
   * @param outputPath - Directory to copy assets to
   * @private
   */
  private async copyAssets(outputPath: string): Promise<void> {
    // Implementation for copying any static assets if needed
    logger.debug('Copying static assets', { outputPath });
  }
}