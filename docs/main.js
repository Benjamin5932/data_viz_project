/* ────────────────────────────────────────────────────────────
   main.js
   Entry-point for the site. Add your visualisation modules here.
   ──────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  renderDemoChart('#demo-chart');
});

/* ──────────────────────────────────────────────────────────
   Demo animated bar chart — replace with your own content!
   ────────────────────────────────────────────────────────── */
function renderDemoChart(selector) {
  const container = document.querySelector(selector);
  if (!container || typeof d3 === 'undefined') return;

  const { width, height } = container.getBoundingClientRect();
  const margin = { top: 20, right: 20, bottom: 28, left: 36 };
  const W = width  - margin.left - margin.right;
  const H = height - margin.top  - margin.bottom;

  // ── Sample dataset (swap with real data) ──────────────
  const data = [
    { label: 'A', value: 72 },
    { label: 'B', value: 55 },
    { label: 'C', value: 88 },
    { label: 'D', value: 43 },
    { label: 'E', value: 96 },
    { label: 'F', value: 61 },
    { label: 'G', value: 79 },
  ];

  const svg = d3.select(selector)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // ── Scales ─────────────────────────────────────────────
  const x = d3.scaleBand()
    .domain(data.map(d => d.label))
    .range([0, W])
    .padding(0.28);

  const y = d3.scaleLinear()
    .domain([0, 100])
    .range([H, 0]);

  // ── Gridlines ──────────────────────────────────────────
  g.append('g')
    .attr('class', 'grid')
    .call(
      d3.axisLeft(y)
        .ticks(4)
        .tickSize(-W)
        .tickFormat('')
    )
    .call(gg => gg.select('.domain').remove())
    .call(gg => gg.selectAll('.tick line')
      .attr('stroke', '#242836')
      .attr('stroke-dasharray', '4,4'));

  // ── Axes ───────────────────────────────────────────────
  const axisStyle = sel => sel
    .call(gg => gg.select('.domain').attr('stroke', '#242836'))
    .call(gg => gg.selectAll('.tick line').attr('stroke', '#242836'))
    .call(gg => gg.selectAll('.tick text')
      .attr('fill', '#4e5468')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '11'));

  g.append('g')
    .attr('transform', `translate(0,${H})`)
    .call(d3.axisBottom(x).tickSize(0))
    .call(axisStyle);

  g.append('g')
    .call(d3.axisLeft(y).ticks(4))
    .call(axisStyle);

  // ── Gradient definition ────────────────────────────────
  const defs = svg.append('defs');
  const grad = defs.append('linearGradient')
    .attr('id', 'bar-gradient')
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '0%').attr('y2', '100%');

  grad.append('stop').attr('offset', '0%')  .attr('stop-color', '#6c8aff');
  grad.append('stop').attr('offset', '100%').attr('stop-color', '#3a5ad9').attr('stop-opacity', 0.8);

  // ── Bars (animated on load) ────────────────────────────
  g.selectAll('.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.label))
    .attr('width', x.bandwidth())
    .attr('rx', 4)
    .attr('fill', 'url(#bar-gradient)')
    .attr('y', H)          // start at baseline
    .attr('height', 0)
    .on('mouseover', function () {
      d3.select(this).attr('fill', '#8aa4ff');
    })
    .on('mouseout', function () {
      d3.select(this).attr('fill', 'url(#bar-gradient)');
    })
    .transition()
    .duration(700)
    .delay((_, i) => i * 80)
    .ease(d3.easeCubicOut)
    .attr('y', d => y(d.value))
    .attr('height', d => H - y(d.value));
}
