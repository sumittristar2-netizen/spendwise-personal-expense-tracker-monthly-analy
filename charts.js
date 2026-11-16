// SVG Chart Rendering Utilities for Spendwise

export function renderDonutChart(data, options = {}) {
  const width = options.width || 280;
  const height = options.height || 280;
  const radius = Math.min(width, height) / 2 - 20;
  const innerRadius = radius * 0.65;
  const cx = width / 2;
  const cy = height / 2;
  const currency = options.currency || '$';

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0 || data.length === 0) {
    return `
      <div class="chart-box">
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
          <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="var(--border-color)" stroke-width="${radius - innerRadius}" />
          <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" fill="var(--text-muted)" font-size="14">No Data</text>
        </svg>
      </div>
    `;
  }

  let startAngle = -Math.PI / 2;
  const paths = data.map((item, idx) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const ix1 = cx + innerRadius * Math.cos(endAngle);
    const iy1 = cy + innerRadius * Math.sin(endAngle);
    const ix2 = cx + innerRadius * Math.cos(startAngle);
    const iy2 = cy + innerRadius * Math.sin(startAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      'Z'
    ].join(' ');

    startAngle = endAngle;

    return `<path d="${pathData}" fill="${item.color}" opacity="0.9" class="donut-slice">
      <title>${item.label}: ${currency}${item.value.toFixed(2)} (${Math.round((item.value / total) * 100)}%)</title>
    </path>`;
  }).join('');

  return `
    <div class="chart-box">
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="chart-svg">
        <g>${paths}</g>
        <text x="${cx}" y="${cy - 8}" text-anchor="middle" dominant-baseline="central" fill="var(--text-dim)" font-size="12" font-weight="600">TOTAL SPENT</text>
        <text x="${cx}" y="${cy + 14}" text-anchor="middle" dominant-baseline="central" fill="var(--text-main)" font-size="20" font-weight="800">${currency}${total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</text>
      </svg>
      <div class="chart-legend">
        ${data.map(item => `
          <div class="legend-item">
            <span class="legend-color" style="background-color: ${item.color}"></span>
            <span>${item.label} (${Math.round((item.value / total) * 100)}%)</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderBarChart(items, options = {}) {
  const width = options.width || 600;
  const height = options.height || 260;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const currency = options.currency || '$';

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...items.map(i => i.value), 100);
  const gridCount = 4;
  const gridLines = [];

  for (let i = 0; i <= gridCount; i++) {
    const val = (maxValue / gridCount) * i;
    const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
    gridLines.push(`
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="var(--border-color)" stroke-dasharray="3,3" />
      <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="var(--text-dim)" font-size="11">${currency}${Math.round(val)}</text>
    `);
  }

  const slotWidth = chartWidth / (items.length || 1);
  const barWidth = Math.min(slotWidth * 0.5, 40);

  const bars = items.map((item, idx) => {
    const barH = (item.value / maxValue) * chartHeight;
    const x = padding.left + (idx * slotWidth) + (slotWidth - barWidth) / 2;
    const y = padding.top + chartHeight - barH;
    const isCurrent = item.isCurrent;

    return `
      <g class="bar-group">
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="${isCurrent ? 'var(--primary)' : 'var(--bg-elevated)'}">
          <title>${item.label}: ${currency}${item.value.toFixed(2)}</title>
        </rect>
        <text x="${x + barWidth / 2}" y="${height - 12}" text-anchor="middle" fill="${isCurrent ? 'var(--text-main)' : 'var(--text-muted)'}" font-weight="${isCurrent ? '700' : '500'}" font-size="12">${item.label}</text>
      </g>
    `;
  }).join('');

  return `
    <div class="chart-box" style="width: 100%;">
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" class="chart-svg">
        ${gridLines.join('')}
        ${bars}
      </svg>
    </div>
  `;
}

export function renderProgressBar(percentage, statusClass = 'safe') {
  const safePercent = Math.min(Math.max(percentage, 0), 100);
  return `
    <div class="progress-track">
      <div class="progress-fill ${statusClass}" style="width: ${safePercent}%;"></div>
    </div>
  `;
}
