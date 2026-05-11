/**
 * Static HTML section generators for the Git Spark report.
 * These sections contain no dynamic data and are pure HTML strings.
 */

export function generateLimitationsSection(): string {
  return `
    <section id="limitations" class="section">
      <h2>⚠️ Important: Measurement Limitations</h2>
      <div class="critical-notice">
        <h3>What Git Repository Data Can and Cannot Tell Us</h3>
        <div class="limitation-grid">
          <div class="limitation-category">
            <h4>✅ Available from Git Repository</h4>
            <ul>
              <li>Commit metadata (author, timestamp, message)</li>
              <li>File changes (additions, deletions, modifications)</li>
              <li>Branch and merge history</li>
              <li>Authorship and co-authorship information</li>
              <li>Commit relationships and ancestry</li>
            </ul>
          </div>
          <div class="limitation-category">
            <h4>❌ NOT Available from Git Repository</h4>
            <ul>
              <li><strong>Code review data:</strong> No reviewer info, approval status, or review comments</li>
              <li><strong>Pull/merge request metadata:</strong> No PR numbers, descriptions, or review workflows</li>
              <li><strong>Issue tracking:</strong> No bug reports, feature requests, or issue relationships</li>
              <li><strong>Team structure:</strong> No organizational hierarchy, roles, or responsibilities</li>
              <li><strong>Work hours/timezones:</strong> No actual working hours or availability</li>
              <li><strong>Performance metrics:</strong> No build times, test results, or runtime performance</li>
              <li><strong>Code quality:</strong> No actual defect rates, test coverage, or maintainability scores</li>
            </ul>
          </div>
        </div>
        <div class="honest-metrics-notice">
          <h4>📊 Our Approach: Honest, Observable Metrics Only</h4>
          <p>All metrics in this report are calculated exclusively from Git commit history. We do not guess, estimate, or infer team performance, code quality, or individual productivity from Git data alone.</p>
          <div class="metric-categories">
            <div class="metric-category">
              <h5>Author Metrics (Individual)</h5>
              <ul>
                <li><strong>Commit Count:</strong> Number of commits authored</li>
                <li><strong>Lines Changed:</strong> Sum of insertions and deletions</li>
                <li><strong>Commit Size Distribution:</strong> Pattern of small vs large commits</li>
                <li><strong>Active Days:</strong> Number of days with at least one commit</li>
                <li><strong>Files Touched:</strong> Number of unique files modified</li>
              </ul>
            </div>
            <div class="metric-category">
              <h5>Team Metrics (Aggregate)</h5>
              <ul>
                <li><strong>Commit Frequency:</strong> Total commits per time period</li>
                <li><strong>Code Churn:</strong> Total lines changed across repository</li>
                <li><strong>Batch Size Distribution:</strong> Average and variation in commit sizes</li>
                <li><strong>Active Contributors:</strong> Number of distinct authors in time window</li>
                <li><strong>File Hotspots:</strong> Files with highest number of changes</li>
              </ul>
            </div>
          </div>
          <div class="usage-guidelines">
            <h5>🎯 Appropriate Usage Guidelines</h5>
            <ul>
              <li><strong>DO:</strong> Use to understand activity patterns and contribution distribution</li>
              <li><strong>DO:</strong> Identify files that change frequently (maintenance hotspots)</li>
              <li><strong>DO:</strong> Track repository activity trends over time</li>
              <li><strong>DON'T:</strong> Use for performance reviews or productivity assessments</li>
              <li><strong>DON'T:</strong> Assume commit count equals productivity or value</li>
              <li><strong>DON'T:</strong> Draw conclusions about code quality from Git metrics alone</li>
            </ul>
          </div>
        </div>
      </div>
    </section>`;
}

export function generateDocumentationSection(): string {
  return `
    <section id="documentation" class="section">
      <h2>Calculation Documentation</h2>
      <p class="doc-intro">This section provides detailed explanations of the metrics and calculations used, all based exclusively on Git repository commit data.</p>
      <div class="measurement-principles">
        <h3>📐 Measurement Principles</h3>
        <div class="principles-grid">
          <div class="principle-card">
            <h4>Objective Data Only</h4>
            <p>All metrics are calculated from observable Git commit data without interpretation or speculation about team dynamics, productivity, or code quality.</p>
          </div>
          <div class="principle-card">
            <h4>Transparent Limitations</h4>
            <p>We clearly state what our metrics can and cannot measure, avoiding false claims about team performance or code quality assessment.</p>
          </div>
          <div class="principle-card">
            <h4>No Speculation</h4>
            <p>We do not infer work-life balance, collaboration effectiveness, or individual performance from Git commit patterns alone.</p>
          </div>
        </div>
      </div>
      <div class="doc-section">
        <h3>Repository Activity Index</h3>
        <p>The Activity Index provides a normalized measure of repository activity based on observable Git patterns.</p>
        <div class="formula-box">
          <h4>Activity Index Formula</h4>
          <code class="formula">
            Activity Index = (Commit Frequency + Author Participation + Change Consistency) ÷ 3
          </code>
          <div class="formula-explanation">
            <ul>
              <li><strong>Commit Frequency:</strong> Daily commit rate normalized to 0-1 scale</li>
              <li><strong>Author Participation:</strong> Author-to-commit ratio indicating contribution spread</li>
              <li><strong>Change Consistency:</strong> Variation in commit sizes (derived component)</li>
            </ul>
          </div>
        </div>
        <div class="limitation-notice">
          <strong>⚠️ Important:</strong> This index measures repository activity patterns, not project health, team performance, or code quality. High activity doesn't necessarily indicate good outcomes, and low activity doesn't indicate problems.
        </div>
      </div>
      <div class="doc-section">
        <h3>Author Activity Metrics</h3>
        <p>Individual contributor metrics focus on observable activity patterns from Git commit history.</p>
        <div class="metric-docs">
          <div class="metric-category">
            <h4>Core Activity Metrics</h4>
            <ul>
              <li><strong>Commit Count:</strong> Total number of commits authored in the analysis period</li>
              <li><strong>Lines Changed:</strong> Sum of all line insertions and deletions across all commits</li>
              <li><strong>Average Commit Size:</strong> Mean number of lines changed per commit</li>
              <li><strong>Files Touched:</strong> Number of unique files modified by the author</li>
              <li><strong>Active Days:</strong> Number of distinct days with at least one commit</li>
            </ul>
            <div class="formula-box">
              <code class="formula">Lines Changed = Total Insertions + Total Deletions</code>
              <code class="formula">Average Commit Size = Total Lines Changed ÷ Total Commits</code>
            </div>
          </div>
          <div class="metric-category">
            <h4>Commit Size Distribution</h4>
            <p>Classification of commits by the number of lines changed:</p>
            <ul>
              <li><strong>Micro (&lt;20 lines):</strong> Small fixes, minor changes</li>
              <li><strong>Small (20-50 lines):</strong> Focused changes, bug fixes</li>
              <li><strong>Medium (51-200 lines):</strong> Feature additions, moderate refactoring</li>
              <li><strong>Large (201-500 lines):</strong> Significant features, major changes</li>
              <li><strong>Very Large (&gt;500 lines):</strong> Major features, large refactors, or merged changes</li>
            </ul>
            <p><em>Note: Commit size alone does not indicate quality, complexity, or effort.</em></p>
          </div>
          <div class="metric-category">
            <h4>Temporal Patterns</h4>
            <p>Observable timing patterns in commit history:</p>
            <ul>
              <li><strong>Commit Timing:</strong> Distribution of commits across hours and days (timestamp analysis only)</li>
              <li><strong>Activity Periods:</strong> Identification of high and low activity periods</li>
              <li><strong>Consistency:</strong> Regularity of contributions over time</li>
            </ul>
            <div class="limitation-notice">
              <strong>⚠️ Timing Limitations:</strong> Commit timestamps reflect when commits were made, not actual working hours. Do not use for work-life balance assessment.
            </div>
          </div>
        </div>
      </div>
      <div class="doc-section">
        <h3>Team Activity Patterns</h3>
        <div class="metric-docs">
          <div class="metric-category">
            <h4>Aggregate Repository Metrics</h4>
            <ul>
              <li><strong>Total Commits:</strong> Complete count of commits in the analysis period</li>
              <li><strong>Code Churn:</strong> Total lines inserted and deleted across all commits</li>
              <li><strong>Active Contributors:</strong> Number of unique authors with commits in the period</li>
              <li><strong>File Activity:</strong> Number of unique files modified during the period</li>
              <li><strong>Bus Factor:</strong> Percentage of contributors needed to account for 50% of commits</li>
            </ul>
            <div class="formula-box">
              <code class="formula">Bus Factor = (Minimum authors needed for 50% of total commits ÷ Total authors) × 100%</code>
              <code class="formula">Daily Commit Average = Total Commits ÷ Active Days</code>
            </div>
          </div>
        </div>
      </div>
      <div class="doc-section">
        <h3>File Activity Hotspots</h3>
        <div class="metric-docs">
          <div class="metric-category">
            <h4>File Activity Analysis</h4>
            <ul>
              <li><strong>File Commit Count:</strong> Number of commits that modified each file</li>
              <li><strong>File Line Changes:</strong> Total lines added and removed for each file</li>
              <li><strong>File Author Count:</strong> Number of different authors who modified each file</li>
              <li><strong>Activity Score:</strong> Composite score based on commit frequency and author count</li>
            </ul>
            <div class="limitation-notice">
              <strong>⚠️ Activity ≠ Problems:</strong> High file activity does not necessarily indicate problems, bugs, or poor code quality.
            </div>
          </div>
        </div>
      </div>
      <div class="methodology-note">
        <h4>Methodology and Data Sources</h4>
        <p><strong>Data Source:</strong> All metrics are calculated exclusively from Git commit history using standard Git commands (git log, git show, git diff).</p>
        <p><strong>Scope:</strong> Analysis covers the specified date range and branch(es).</p>
        <p><strong>Normalization:</strong> Some metrics are normalized to 0-100 scale for consistency across different repository sizes.</p>
        <p><strong>No External Data:</strong> We deliberately avoid integrating external data sources to maintain transparency about what Git data alone can and cannot reveal.</p>
      </div>
    </section>`;
}
