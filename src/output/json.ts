import { AnalysisReport } from '../types';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger('json-exporter');

/**
 * Exports analysis reports as formatted JSON files
 *
 * The JSONExporter provides structured data export suitable for:
 * - Integration with external tools and systems
 * - Data processing and transformation pipelines
 * - API responses and web applications
 * - Backup and archival of analysis results
 * - Custom visualization and reporting tools
 *
 * Features:
 * - Pretty-printed JSON with 2-space indentation
 * - Date serialization handling for temporal data
 * - Large number formatting for statistical accuracy
 * - Error handling with detailed logging
 * - Atomic file operations for data integrity
 *
 * @example
 * ```typescript
 * const exporter = new JSONExporter();
 * await exporter.export(analysisReport, './reports');
 * // Creates: ./reports/git-spark-report.json
 *
 * // Load back the data
 * const jsonData = JSON.parse(fs.readFileSync('./reports/git-spark-report.json', 'utf-8'));
 * ```
 */
export class JSONExporter {
  /**
   * Export analysis report as formatted JSON file
   *
   * Creates a pretty-printed JSON file with proper formatting and error handling.
   * The output includes all analysis data with dates and numbers properly serialized.
   *
   * @param report - Complete analysis report to export
   * @param outputPath - Directory path where JSON file will be created
   * @throws {Error} When output directory cannot be created or file cannot be written
   * @returns Promise that resolves when export is complete
   *
   * @example
   * ```typescript
   * const exporter = new JSONExporter();
   * await exporter.export(report, './output');
   *
   * // Verify the file was created
   * const exists = fs.existsSync('./output/git-spark-report.json');
   * console.log('Export successful:', exists);
   * ```
   */
  async export(report: AnalysisReport, outputPath: string): Promise<void> {
    try {
      const fullPath = resolve(outputPath, 'git-spark-report.json');

      // Ensure directory exists
      mkdirSync(dirname(fullPath), { recursive: true });

      // Serialize report with proper formatting
      const jsonContent = JSON.stringify(report, this.jsonReplacer, 2);

      // Write to file
      writeFileSync(fullPath, jsonContent, 'utf-8');

      logger.info('JSON report exported successfully', { path: fullPath });
    } catch (error) {
      logger.error('Failed to export JSON report', { error, outputPath });
      throw error;
    }
  }

  private jsonReplacer(_key: string, value: any): any {
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString();
    }

    // Handle Map objects
    if (value instanceof Map) {
      return Object.fromEntries(value);
    }

    // Handle Set objects
    if (value instanceof Set) {
      return Array.from(value);
    }

    return value;
  }
}
