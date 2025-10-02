# Lightweight Chart Options for Daily Trends Display

## Current Implementation

The Git Spark HTML exporter currently uses CSS-only bar charts for commit size distribution. For daily trends, we can implement several lightweight chart types that don't require additional JavaScript libraries.

## 1. SVG Line Charts (Recommended)

### Simple SVG Line Chart

```html
<svg width="800" height="200" viewBox="0 0 800 200" class="trend-chart">
  <defs>
    <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0066cc;stop-opacity:0.8" />
      <stop offset="100%" style="stop-color:#0066cc;stop-opacity:0.1" />
    </linearGradient>
  </defs>
  
  <!-- Grid lines -->
  <g class="grid" stroke="#e0e0e0" stroke-width="1">
    <line x1="50" y1="20" x2="750" y2="20"/>
    <line x1="50" y1="60" x2="750" y2="60"/>
    <line x1="50" y1="100" x2="750" y2="100"/>
    <line x1="50" y1="140" x2="750" y2="140"/>
    <line x1="50" y1="180" x2="750" y2="180"/>
  </g>
  
  <!-- Trend line -->
  <polyline points="50,150 100,120 150,130 200,100 250,90 300,85 350,95 400,80 450,75 500,85 550,90 600,70 650,65 700,60 750,55"
            fill="none" stroke="#0066cc" stroke-width="2"/>
  
  <!-- Area fill -->
  <polyline points="50,180 50,150 100,120 150,130 200,100 250,90 300,85 350,95 400,80 450,75 500,85 550,90 600,70 650,65 700,60 750,55 750,180"
            fill="url(#trendGradient)"/>
  
  <!-- Data points -->
  <g class="data-points" fill="#0066cc">
    <circle cx="50" cy="150" r="3"/>
    <circle cx="100" cy="120" r="3"/>
    <circle cx="150" cy="130" r="3"/>
    <circle cx="200" cy="100" r="3"/>
    <circle cx="250" cy="90" r="3"/>
    <circle cx="300" cy="85" r="3"/>
    <circle cx="350" cy="95" r="3"/>
    <circle cx="400" cy="80" r="3"/>
    <circle cx="450" cy="75" r="3"/>
    <circle cx="500" cy="85" r="3"/>
    <circle cx="550" cy="90" r="3"/>
    <circle cx="600" cy="70" r="3"/>
    <circle cx="650" cy="65" r="3"/>
    <circle cx="700" cy="60" r="3"/>
    <circle cx="750" cy="55" r="3"/>
  </g>
  
  <!-- Axes -->
  <line x1="50" y1="20" x2="50" y2="180" stroke="#333" stroke-width="2"/>
  <line x1="50" y1="180" x2="750" y2="180" stroke="#333" stroke-width="2"/>
  
  <!-- Labels -->
  <text x="25" y="185" font-size="12" fill="#666" text-anchor="middle">0</text>
  <text x="25" y="105" font-size="12" fill="#666" text-anchor="middle">50</text>
  <text x="25" y="25" font-size="12" fill="#666" text-anchor="middle">100</text>
</svg>
```

### CSS for SVG Charts

```css
.trend-chart {
  max-width: 100%;
  height: auto;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
}

.trend-chart .data-points circle:hover {
  r: 5;
  fill: var(--color-primary);
  cursor: pointer;
}

.trend-chart .grid {
  opacity: 0.3;
}
```

## 2. CSS-Only Sparklines

### Horizontal Bar Sparkline

```html
<div class="sparkline-container">
  <div class="sparkline-bars">
    <div class="spark-bar" style="height: 60%;" title="Day 1: 15 commits"></div>
    <div class="spark-bar" style="height: 80%;" title="Day 2: 20 commits"></div>
    <div class="spark-bar" style="height: 40%;" title="Day 3: 10 commits"></div>
    <div class="spark-bar" style="height: 90%;" title="Day 4: 23 commits"></div>
    <div class="spark-bar" style="height: 70%;" title="Day 5: 18 commits"></div>
    <div class="spark-bar" style="height: 30%;" title="Day 6: 8 commits"></div>
    <div class="spark-bar" style="height: 100%;" title="Day 7: 25 commits"></div>
  </div>
</div>
```

```css
.sparkline-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
}

.sparkline-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 60px;
  padding: 0 0.5rem;
}

.spark-bar {
  flex: 1;
  min-height: 2px;
  background: linear-gradient(to top, var(--color-primary), var(--color-success));
  border-radius: 2px 2px 0 0;
  transition: all 0.2s ease;
  cursor: pointer;
}

.spark-bar:hover {
  background: var(--color-warning);
  transform: scaleY(1.1);
}
```

## 3. Unicode Character Charts

### ASCII-Style Charts

```html
<div class="ascii-chart">
  <div class="chart-title">Daily Commits Trend</div>
  <pre class="chart-content">
25 ┤                                             ╭─╮
23 ┤                                       ╭─────╯ ╰╮
20 ┤                   ╭───────────────────╯       ╰╮
18 ┤               ╭───╯                            ╰╮
15 ┤           ╭───╯                                 ╰╮
13 ┤       ╭───╯                                     ╰╮
10 ┤   ╭───╯                                         ╰╮
 8 ┤ ╭─╯                                             ╰╮
 5 ┤╭╯                                               ╰╮
 3 ┼╯                                                 ╰
 0 └┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─
   Mon   Tue   Wed   Thu   Fri   Sat   Sun   Mon   Tue
  </pre>
</div>
```

```css
.ascii-chart {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
}

.chart-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-text);
}

.chart-content {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  line-height: 1.2;
  color: var(--color-primary);
  overflow-x: auto;
  margin: 0;
  white-space: pre;
}
```

## 4. CSS Grid-Based Heatmaps

### Activity Heatmap (GitHub-style)

```html
<div class="activity-heatmap">
  <div class="heatmap-title">Daily Activity Heatmap</div>
  <div class="heatmap-grid">
    <div class="heatmap-cell intensity-0" title="No activity"></div>
    <div class="heatmap-cell intensity-1" title="1-3 commits"></div>
    <div class="heatmap-cell intensity-2" title="4-6 commits"></div>
    <div class="heatmap-cell intensity-3" title="7-10 commits"></div>
    <div class="heatmap-cell intensity-4" title="11+ commits"></div>
    <!-- Repeat for each day -->
  </div>
  <div class="heatmap-legend">
    <span>Less</span>
    <div class="legend-scale">
      <div class="legend-cell intensity-0"></div>
      <div class="legend-cell intensity-1"></div>
      <div class="legend-cell intensity-2"></div>
      <div class="legend-cell intensity-3"></div>
      <div class="legend-cell intensity-4"></div>
    </div>
    <span>More</span>
  </div>
</div>
```

```css
.activity-heatmap {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, 12px);
  gap: 2px;
  margin: 1rem 0;
  max-width: 100%;
  overflow-x: auto;
}

.heatmap-cell {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.heatmap-cell:hover {
  transform: scale(1.5);
  z-index: 10;
}

.heatmap-cell.intensity-0 { background: var(--color-bg); }
.heatmap-cell.intensity-1 { background: #9be9a8; }
.heatmap-cell.intensity-2 { background: #40c463; }
.heatmap-cell.intensity-3 { background: #30a14e; }
.heatmap-cell.intensity-4 { background: #216e39; }

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.legend-scale {
  display: flex;
  gap: 2px;
}

.legend-cell {
  width: 8px;
  height: 8px;
  border-radius: 1px;
  border: 1px solid var(--color-border);
}
```

## 5. Minimalist Trend Indicators

### Simple Trend Arrows

```html
<div class="trend-indicators">
  <div class="trend-item">
    <span class="trend-label">Daily Commits</span>
    <span class="trend-value">23.5</span>
    <span class="trend-arrow up">↗</span>
    <span class="trend-change">+15%</span>
  </div>
  <div class="trend-item">
    <span class="trend-label">Active Authors</span>
    <span class="trend-value">5.2</span>
    <span class="trend-arrow down">↘</span>
    <span class="trend-change">-8%</span>
  </div>
  <div class="trend-item">
    <span class="trend-label">Lines Changed</span>
    <span class="trend-value">1,250</span>
    <span class="trend-arrow stable">→</span>
    <span class="trend-change">+2%</span>
  </div>
</div>
```

```css
.trend-indicators {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
}

.trend-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.trend-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  flex: 1;
}

.trend-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text);
}

.trend-arrow {
  font-size: 1.2rem;
  font-weight: bold;
}

.trend-arrow.up { color: var(--color-success); }
.trend-arrow.down { color: var(--color-danger); }
.trend-arrow.stable { color: var(--color-warning); }

.trend-change {
  font-size: 0.8rem;
  font-weight: 500;
}
```

## Recommendation for Git Spark

For the daily trends section, I recommend implementing:

1. **SVG Line Charts** for commit trends over time - provides clear visualization without dependencies
2. **CSS Bar Charts** for daily/weekly aggregates - already proven in the codebase
3. **GitHub-style Heatmap** for activity overview - matches the existing contributions graph
4. **Trend Indicators** for key metrics summary - clean and informative

These approaches maintain:

- ✅ No external JavaScript dependencies
- ✅ CSP compliance
- ✅ Responsive design
- ✅ Accessible markup
- ✅ Consistent with existing styling
- ✅ Lightweight and fast loading

Would you like me to implement any of these chart types specifically for the daily trends section?
