/* ════════════════════════════════════════════════════════════════
   main.js — Data Visualisation: The Invisible Fleet
   Story-driven website with four interactive visualizations
   ════════════════════════════════════════════════════════════════ */

/* ── Global State ──────────────────────────────────────────────── */
const state = {
  data: {
    spatial: null,
    seasonal: null,
    fleet: null,
    gear: null,
    flag: null,
    land: null,
  },
  filters: {
    map: { metric: 'gap-count' },
    seasonal: { year: 'all', metric: 'both' },
    multiples: { gear: 'all' },
    ranks: { metric: 'gap-count', limit: 10 },
  },
  currentSection: 'hero',
};

/* ── Initialization ──────────────────────────────────────────────– */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initializing The Invisible Fleet...');
  
  // Initialize sticky navigator
  initStickyNav();
  
  // Load data
  await loadData();
  
  // Render visualizations
  renderVisualizations();
  
  // Attach control listeners
  attachControlListeners();
  
  // Globe animation
  renderGlobeIntro();
  
  // Hero chart (demo/teaser)
  renderHeroChart();
  
  console.log('✓ Site initialized');
});

/* ════════════════════════════════════════════════════════════════
   STICKY NAVIGATOR
   ════════════════════════════════════════════════════════════════ */

function initStickyNav() {
  const stickyNav = document.getElementById('sticky-nav');
  if (!stickyNav) return;

  const items = stickyNav.querySelectorAll('.sticky-nav__item');
  
  // Handle scroll and update active state
  const updateActiveNav = () => {
    const sections = ['hero', 'map-section', 'seasonal-section', 'multiples-section', 'ranks-section', 'about'];
    let current = 'hero';
    
    for (const section of sections) {
      const el = document.getElementById(section);
      if (el && el.getBoundingClientRect().top <= 100) {
        current = section;
      }
    }
    
    items.forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-section') === current);
    });
  };
  
  window.addEventListener('scroll', updateActiveNav);
  window.addEventListener('load', updateActiveNav);
  updateActiveNav();
}

/* ════════════════════════════════════════════════════════════════
   DATA LOADING
   ════════════════════════════════════════════════════════════════ */

async function loadData() {
  try {
    // Load spatial/geographic data
    const spatialRes = await fetch('data/gap_spatial_1deg_summary.csv');
    const spatialText = await spatialRes.text();
    state.data.spatial = d3.csvParse(spatialText, d => ({
      month_period: d.month_period,
      lat: +d.lat_bin_1deg,
      lon: +d.lon_bin_1deg,
      gap_count: +d.gap_count,
      gap_hours: +d.total_gap_hours,
      vessels: +d.unique_vessels,
    }));
    
    // Load seasonal data
    const seasonalRes = await fetch('data/gap_monthly_summary.csv');
    const seasonalText = await seasonalRes.text();
    state.data.seasonal = d3.csvParse(seasonalText, d => ({
      month_period: d.month_period,
      gap_count: +d.gap_count,
      gap_hours: +d.total_gap_hours,
      vessels: +d.unique_vessels,
    }));
    
    // Load fleet effort data
    const fleetRes = await fetch('data/fleet_monthly_summary.csv');
    const fleetText = await fleetRes.text();
    state.data.fleet = d3.csvParse(fleetText, d => ({
      month_period: d.month_period,
      total_hours: +d.total_hours,
      fishing_hours: +d.total_fishing_hours,
      vessel_presence: +d.vessel_presence,
    }));
    
    // Load gear data
    const gearRes = await fetch('data/fleet_gear_summary.csv');
    const gearText = await gearRes.text();
    state.data.gear = d3.csvParse(gearText);
    
    // Load flag data
    const flagRes = await fetch('data/gap_flag_summary.csv');
    const flagText = await flagRes.text();
    state.data.flag = d3.csvParse(flagText, d => ({
      flag: d.flag,
      gap_count: +d.gap_count,
      gap_hours: +d.total_gap_hours,
      vessels: +d.unique_vessels,
    }));
    
    console.log('✓ Data loaded successfully');
    console.log('Spatial data:', state.data.spatial ? state.data.spatial.length : 0, 'records');
    console.log('Seasonal data:', state.data.seasonal ? state.data.seasonal.length : 0, 'records');
    console.log('Flag data:', state.data.flag ? state.data.flag.length : 0, 'records');
  } catch (err) {
    console.error('✗ Error loading data:', err);
  }
}

/* ════════════════════════════════════════════════════════════════
   CONTROLS & INTERACTIVITY
   ════════════════════════════════════════════════════════════════ */

function attachControlListeners() {
  // Map metric control
  const mapMetric = document.getElementById('map-metric');
  if (mapMetric) {
    mapMetric.addEventListener('change', (e) => {
      state.filters.map.metric = e.target.value;
      renderMap();
    });
  }
  
  // Seasonal controls
  const seasonalYear = document.getElementById('seasonal-year');
  const seasonalMetric = document.getElementById('seasonal-metric');
  if (seasonalYear) seasonalYear.addEventListener('change', (e) => {
    state.filters.seasonal.year = e.target.value;
    renderSeasonal();
  });
  if (seasonalMetric) seasonalMetric.addEventListener('change', (e) => {
    state.filters.seasonal.metric = e.target.value;
    renderSeasonal();
  });
  
  // Multiples gear filter
  const multiplesGear = document.getElementById('multiples-gear');
  if (multiplesGear) {
    multiplesGear.addEventListener('change', (e) => {
      state.filters.multiples.gear = e.target.value;
      renderMultiples();
    });
  }
  
  // Ranks controls
  const ranksMetric = document.getElementById('ranks-metric');
  const ranksLimit = document.getElementById('ranks-limit');
  if (ranksMetric) ranksMetric.addEventListener('change', (e) => {
    state.filters.ranks.metric = e.target.value;
    renderRanks();
  });
  if (ranksLimit) ranksLimit.addEventListener('change', (e) => {
    state.filters.ranks.limit = e.target.value === 'all' ? 999 : parseInt(e.target.value);
    renderRanks();
  });
}

/* ════════════════════════════════════════════════════════════════
   RENDER ALL VISUALIZATIONS
   ════════════════════════════════════════════════════════════════ */

function renderVisualizations() {
  renderMap();
  renderSeasonal();
  renderMultiples();
  renderRanks();
}

function animateLinePath(pathSelection, duration = 1000) {
  const node = pathSelection.node();
  if (!node) return;
  const totalLength = node.getTotalLength();
  pathSelection
    .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
    .attr('stroke-dashoffset', totalLength)
    .transition()
    .duration(duration)
    .ease(d3.easeCubicOut)
    .attr('stroke-dashoffset', 0);
}

/* ════════════════════════════════════════════════════════════════
   VIZ 0: INTERACTIVE GLOBE INTRO
   ════════════════════════════════════════════════════════════════ */

function renderGlobeIntro() {
  const container = document.getElementById('globe-canvas');
  if (!container) return;

  const width = container.clientWidth;
  const height = 400;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = 'block';
  container.innerHTML = '';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  function drawGlobe() {
    const time = Date.now() % 4000;
    const progress = time / 4000;

    ctx.fillStyle = '#0d0f14';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(13, 23, 42, 0.7)';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(108, 138, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let lat = -90; lat <= 90; lat += 30) {
      ctx.beginPath();
      ctx.moveTo(50, (lat + 90) * 2);
      ctx.lineTo(width - 50, (lat + 90) * 2);
      ctx.stroke();
    }

    const hotspots = [
      { lat: 35, lon: -20, size: 8 + progress * 4 },
      { lat: -40, lon: -60, size: 6 + progress * 3 },
      { lat: 55, lon: 10, size: 5 },
    ];

    hotspots.forEach(spot => {
      const screenX = ((spot.lon + 180) / 360) * width;
      const screenY = ((90 - spot.lat) / 180) * height;
      const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, spot.size * 2);
      gradient.addColorStop(0, `rgba(255, 107, 107, ${0.5 * (1 - progress)})`);
      gradient.addColorStop(1, 'rgba(255, 107, 107, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screenX, screenY, spot.size * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(screenX, screenY, spot.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#e8eaf2';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = progress < 0.5 ? 1 - progress * 2 : (progress - 0.5) * 2;
    ctx.fillText(
      progress < 0.5 ? 'Global fishing activity' : 'Zooming to North Atlantic hotspots...',
      width / 2,
      30
    );
    ctx.globalAlpha = 1;

    requestAnimationFrame(drawGlobe);
  }

  drawGlobe();
}

/* ════════════════════════════════════════════════════════════════
   VIZ 1: HERO CHART (teaser with top flags)
   ════════════════════════════════════════════════════════════════ */

function renderHeroChart() {
  const container = document.getElementById('hero-demo');
  if (!container || !state.data.flag || state.data.flag.length === 0) return;
  
  // Show top 8 flags by gap count
  const topFlags = state.data.flag
    .sort((a, b) => b.gap_count - a.gap_count)
    .slice(0, 8);
  
  const margin = { top: 20, right: 20, bottom: 40, left: 80 };
  const width = 600 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;
  
  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 600 300`)
    .attr('preserveAspectRatio', 'xMidYMid meet');
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  const y = d3.scaleBand()
    .domain(topFlags.map(d => d.flag))
    .range([height, 0])
    .padding(0.3);
  
  const x = d3.scaleLinear()
    .domain([0, d3.max(topFlags, d => d.gap_count)])
    .range([0, width]);
  
  // Bars
  g.selectAll('.bar')
    .data(topFlags)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', d => y(d.flag))
    .attr('width', 0)
    .attr('height', y.bandwidth())
    .attr('fill', '#6c8aff')
    .attr('opacity', 0.8)
    .transition()
    .duration(900)
    .ease(d3.easeCubicOut)
    .attr('width', d => x(d.gap_count));
  
  // Y axis
  g.append('g')
    .call(d3.axisLeft(y))
    .call(gg => gg.select('.domain').attr('stroke', '#242836'))
    .call(gg => gg.selectAll('.tick text')
      .attr('fill', '#8890a8')
      .attr('font-size', '12'));
  
  // X axis
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(4))
    .call(gg => gg.select('.domain').attr('stroke', '#242836'))
    .call(gg => gg.selectAll('.tick text')
      .attr('fill', '#8890a8')
      .attr('font-size', '11'));
}

/* ════════════════════════════════════════════════════════════════
   VIZ 2: GEOGRAPHIC MAP (heatmap)
   ════════════════════════════════════════════════════════════════ */

async function renderMap() {
  const container = document.getElementById('map-viz');
  if (!container || !state.data.spatial || state.data.spatial.length === 0) {
    console.warn('Map: spatial data not available');
    return;
  }
  
  container.innerHTML = '';
  
  const metric = state.filters.map.metric;
  const rawData = state.data.spatial
    .filter(d => d.lat !== undefined && d.lon !== undefined && !isNaN(d.lat) && !isNaN(d.lon))
    .filter(d => d.lon >= -100 && d.lon <= -4 && d.lat >= 8 && d.lat <= 72)
    .map(d => ({
      lat: d.lat,
      lon: d.lon,
      value: metric === 'gap-count' ? d.gap_count : d.gap_hours,
    }));

  const data = d3.rollups(
    rawData,
    values => d3.sum(values, v => v.value),
    d => `${d.lon}|${d.lat}`
  ).map(([key, value]) => {
    const [lon, lat] = key.split('|').map(Number);
    return { lon, lat, value };
  });
  
  if (data.length === 0) {
    console.warn('Map: no valid spatial data');
    return;
  }

  if (!state.data.land) {
    try {
      const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      state.data.land = topojson.feature(world, world.objects.countries);
    } catch (err) {
      console.warn('Map: land polygons unavailable, continuing without coastlines.', err);
    }
  }
  
  const margin = { top: 20, right: 20, bottom: 56, left: 20 };
  const contentWidth = container.parentElement.offsetWidth;
  const totalHeight = 400;
  const width = contentWidth - margin.left - margin.right;
  const height = totalHeight - margin.top - margin.bottom;
  
  const svg = d3.select(container)
    .attr('width', contentWidth)
    .attr('height', totalHeight)
    .attr('viewBox', `0 0 ${contentWidth} ${totalHeight}`)
    .style('cursor', 'grab');
  
  const root = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const defs = svg.append('defs');

  const pointFeatures = {
    type: 'FeatureCollection',
    features: data.map(d => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [d.lon, d.lat] },
    })),
  };

  const projection = d3.geoMercator()
    .fitExtent([[24, 18], [width - 24, height - 18]], pointFeatures);

  const plotLayer = root.append('g').attr('class', 'map-plot-layer');

  const clipPathId = 'mapClipPath';
  defs.append('clipPath')
    .attr('id', clipPathId)
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height)
    .attr('rx', 6);

  const oceanGradient = defs.append('linearGradient')
    .attr('id', 'oceanGradient')
    .attr('x1', '0%')
    .attr('x2', '100%')
    .attr('y1', '0%')
    .attr('y2', '100%');

  oceanGradient.append('stop').attr('offset', '0%').attr('stop-color', '#111f3f');
  oceanGradient.append('stop').attr('offset', '100%').attr('stop-color', '#0a1430');

  const background = plotLayer.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'url(#oceanGradient)')
    .attr('rx', 6);

  const geoLayer = plotLayer.append('g')
    .attr('class', 'map-geo-layer')
    .attr('clip-path', `url(#${clipPathId})`);

  const graticule = d3.geoGraticule().step([10, 10]);
  const path = d3.geoPath(projection);

  if (state.data.land) {
    geoLayer.append('path')
      .datum(state.data.land)
      .attr('d', path)
      .attr('fill', '#1f2b45')
      .attr('stroke', '#44557e')
      .attr('stroke-width', 0.7)
      .attr('opacity', 0.9);
  }

  geoLayer.append('path')
    .datum(graticule())
    .attr('d', path)
    .attr('fill', 'none')
    .attr('stroke', 'rgba(136, 144, 168, 0.22)')
    .attr('stroke-width', 0.8);

  plotLayer.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'none')
    .attr('stroke', '#242836');
  
  const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
    .domain([0, d3.max(data, d => d.value)]);
  
  const cellLayer = geoLayer.append('g').attr('class', 'map-cells');

  // Draw each 1-degree cell as a projected polygon for a cleaner geographic map.
  cellLayer.selectAll('.cell')
    .data(data)
    .join('circle')
    .attr('class', 'cell')
    .attr('cx', d => {
      const pt = projection([d.lon, d.lat]);
      return pt ? pt[0] : -9999;
    })
    .attr('cy', d => {
      const pt = projection([d.lon, d.lat]);
      return pt ? pt[1] : -9999;
    })
    .attr('r', 1.8)
    .attr('fill', d => colorScale(d.value))
    .attr('opacity', 0)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1).attr('stroke', '#8aa4ff').attr('stroke-width', 1);
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 0.85).attr('stroke', 'none');
    });

  cellLayer.selectAll('.cell')
    .transition()
    .duration(900)
    .delay((d, i) => Math.min(350, i * 0.5))
    .ease(d3.easeCubicOut)
    .attr('opacity', 0.85);

  const zoom = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [width, height]])
    .on('start', () => svg.style('cursor', 'grabbing'))
    .on('zoom', (event) => {
      plotLayer.attr('transform', event.transform);
    })
    .on('end', () => svg.style('cursor', 'grab'));

  svg.call(zoom)
    .call(zoom.transform, d3.zoomIdentity);

  svg.append('text')
    .attr('x', margin.left + 8)
    .attr('y', margin.top + 18)
    .attr('fill', '#a9b2ca')
    .attr('font-size', '11')
    .text('Use mouse wheel to zoom and drag to pan');

  svg.append('text')
    .attr('x', contentWidth / 2)
    .attr('y', totalHeight - 6)
    .attr('fill', '#8890a8')
    .attr('text-anchor', 'middle')
    .attr('font-size', '11')
    .text('North Atlantic map in 1-degree grid cells');

  svg.append('text')
    .attr('x', contentWidth - 10)
    .attr('y', margin.top + 18)
    .attr('fill', '#a9b2ca')
    .attr('text-anchor', 'end')
    .attr('font-size', '11')
    .text(metric === 'gap-count' ? 'Color = Gap events' : 'Color = Gap hours');

  const legendWidth = 180;
  const legendHeight = 10;
  const legendX = contentWidth - legendWidth - 20;
  const legendY = totalHeight - 26;
  const gradient = defs.append('linearGradient')
    .attr('id', 'mapLegendGradient')
    .attr('x1', '0%')
    .attr('x2', '100%')
    .attr('y1', '0%')
    .attr('y2', '0%');

  gradient.append('stop').attr('offset', '0%').attr('stop-color', colorScale(0));
  gradient.append('stop').attr('offset', '100%').attr('stop-color', colorScale(d3.max(data, d => d.value)));

  svg.append('rect')
    .attr('x', legendX)
    .attr('y', legendY)
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .attr('fill', 'url(#mapLegendGradient)')
    .attr('stroke', '#242836');

  svg.append('text')
    .attr('x', legendX)
    .attr('y', legendY - 3)
    .attr('fill', '#8890a8')
    .attr('font-size', '10')
    .text('Low');

  svg.append('text')
    .attr('x', legendX + legendWidth)
    .attr('y', legendY - 3)
    .attr('fill', '#8890a8')
    .attr('text-anchor', 'end')
    .attr('font-size', '10')
    .text('High');
}

/* ════════════════════════════════════════════════════════════════
   VIZ 3: SEASONAL LINE CHART
   ════════════════════════════════════════════════════════════════ */

function renderSeasonal() {
  const container = document.getElementById('seasonal-viz');
  if (!container || !state.data.seasonal || !state.data.fleet) {
    console.warn('Seasonal: data not available');
    return;
  }
  
  container.innerHTML = '';
  
  const selectedMetric = state.filters.seasonal.metric;
  
  // Parse data by month_period
  const gapData = (state.data.seasonal || []).map(d => {
    const [year, month] = d.month_period.split('-');
    return {
      date: new Date(year, parseInt(month) - 1, 1),
      gaps: d.gap_count,
    };
  }).filter(d => !isNaN(d.date.getTime()) && !isNaN(d.gaps));
  
  const fleetData = (state.data.fleet || []).map(d => {
    const [year, month] = d.month_period.split('-');
    return {
      date: new Date(year, parseInt(month) - 1, 1),
      effort: d.total_fishing_hours,
    };
  }).filter(d => !isNaN(d.date.getTime()) && !isNaN(d.effort));

  const yearFilter = state.filters.seasonal.year;
  const gapSeries = yearFilter === 'all'
    ? gapData
    : gapData.filter(d => String(d.date.getFullYear()) === yearFilter);
  const fleetSeries = yearFilter === 'all'
    ? fleetData
    : fleetData.filter(d => String(d.date.getFullYear()) === yearFilter);

  if (gapSeries.length === 0 && fleetSeries.length === 0) {
    return;
  }
  
  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const contentWidth = container.parentElement.offsetWidth;
  const width = contentWidth - margin.left - margin.right;
  const height = 350 - margin.top - margin.bottom;
  
  const svg = d3.select(container)
    .attr('width', contentWidth)
    .attr('height', 350)
    .attr('viewBox', `0 0 ${contentWidth} 350`);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Sort by date
  gapSeries.sort((a, b) => a.date - b.date);
  fleetSeries.sort((a, b) => a.date - b.date);
  
  // Scales
  const xScale = d3.scaleTime()
    .domain([d3.min([...gapSeries, ...fleetSeries], d => d.date), 
             d3.max([...gapSeries, ...fleetSeries], d => d.date)])
    .range([0, width]);
  
  const y1Scale = d3.scaleLinear()
    .domain([0, d3.max(gapSeries, d => d.gaps) || 100])
    .range([height, 0]);
  
  const y2Scale = d3.scaleLinear()
    .domain([0, d3.max(fleetSeries, d => d.effort) || 100])
    .range([height, 0]);
  
  // Line generators
  const line1 = d3.line()
    .x(d => xScale(d.date))
    .y(d => y1Scale(d.gaps));
  
  const line2 = d3.line()
    .x(d => xScale(d.date))
    .y(d => y2Scale(d.effort));
  
  // Draw lines
  if (selectedMetric === 'Both Metrics' || selectedMetric === 'Gap Activity Only' || selectedMetric === 'both' || selectedMetric === 'gap-activity') {
    const gapPath = g.append('path')
      .datum(gapSeries)
      .attr('d', line1)
      .attr('stroke', '#6c8aff')
      .attr('stroke-width', 2)
      .attr('fill', 'none');
    animateLinePath(gapPath, 1100);
  }
  
  if (selectedMetric === 'Both Metrics' || selectedMetric === 'Fleet Effort Only' || selectedMetric === 'both' || selectedMetric === 'fleet-effort') {
    const fleetPath = g.append('path')
      .datum(fleetSeries)
      .attr('d', line2)
      .attr('stroke', '#ff6b6b')
      .attr('stroke-width', 2)
      .attr('fill', 'none');
    animateLinePath(fleetPath, 1100);
  }
  
  // Axes
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).ticks(6))
    .call(gg => gg.select('.domain').attr('stroke', '#242836'))
    .call(gg => gg.selectAll('.tick text').attr('fill', '#8890a8').attr('font-size', '11'));
  
  g.append('g')
    .call(d3.axisLeft(y1Scale).ticks(4))
    .call(gg => gg.select('.domain').attr('stroke', '#242836'))
    .call(gg => gg.selectAll('.tick text').attr('fill', '#8890a8').attr('font-size', '11'));

  g.append('text')
    .attr('x', 0)
    .attr('y', -8)
    .attr('fill', '#a9b2ca')
    .attr('font-size', '11')
    .text(yearFilter === 'all' ? 'Monthly trend (2017-2019)' : `Monthly trend (${yearFilter})`);

  svg.append('text')
    .attr('x', margin.left)
    .attr('y', 14)
    .attr('fill', '#8890a8')
    .attr('font-size', '11')
    .text('Gap events / Fishing hours');
}

/* ════════════════════════════════════════════════════════════════
   VIZ 4: SMALL MULTIPLES (gear comparison)
   ════════════════════════════════════════════════════════════════ */

function renderMultiples() {
  const container = document.getElementById('multiples-viz');
  if (!container || !state.data.gear) return;
  
  container.innerHTML = '';
  
  // Get unique gear types
  const gearTypes = [...new Set(state.data.gear.map(d => d.geartype || 'Other'))]
    .filter(g => g !== 'Other')
    .slice(0, 4);
  
  const margin = { top: 16, right: 16, bottom: 32, left: 40 };
  const cellWidth = 200;
  const cellHeight = 180;
  
  const svg = d3.select(container)
    .attr('width', gearTypes.length * (cellWidth + 20))
    .attr('height', cellHeight + margin.top + margin.bottom)
    .attr('viewBox', `0 0 ${gearTypes.length * (cellWidth + 20)} ${cellHeight + margin.top + margin.bottom}`);
  
  gearTypes.forEach((gear, i) => {
    const gearSubset = state.data.gear.filter(d => d.geartype === gear);
    
    const g = svg.append('g')
      .attr('transform', `translate(${i * (cellWidth + 20) + margin.left},${margin.top})`);
    
    // Title
    g.append('text')
      .attr('x', cellWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-weight', 'bold')
      .attr('font-size', '12')
      .attr('fill', '#e8eaf2')
      .text(gear);
    
    // Simple bar chart for each gear
    const visible = gearSubset.length > 0 ? d3.mean(gearSubset, d => +d.total_fishing_hours || 0) : 0;
    const hidden = gearSubset.length > 0 ? Math.max(0, d3.mean(gearSubset, d => +d.total_hours || 0) - visible) : 0;
    const xVals = ['Visible', 'Hidden'];
    const yVals = [visible, hidden];
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(yVals) || 1])
      .range([cellHeight - 40, 0]);
    
    const xScale = d3.scaleBand()
      .domain(xVals)
      .range([0, cellWidth])
      .padding(0.2);
    
    g.selectAll('.bar')
      .data(yVals)
      .join('rect')
      .attr('x', (d, i) => xScale(xVals[i]))
      .attr('y', d => yScale(d))
      .attr('width', xScale.bandwidth())
      .attr('height', d => cellHeight - 40 - yScale(d))
      .attr('fill', (d, i) => i === 0 ? '#ff6b6b' : '#6c8aff');
  });
}

/* ════════════════════════════════════════════════════════════════
   VIZ 5: RANKED FLAGS (horizontal bars)
   ════════════════════════════════════════════════════════════════ */

function renderRanks() {
  const container = document.getElementById('ranks-viz');
  if (!container || !state.data.flag || state.data.flag.length === 0) return;
  
  container.innerHTML = '';
  
  const metric = state.filters.ranks.metric;
  const limit = state.filters.ranks.limit;
  
  // Sort and slice
  const ranked = state.data.flag
    .map(d => ({
      flag: d.flag,
      gapCount: d.gap_count || 0,
      gapHours: d.gap_hours || 0,
    }))
    .sort((a, b) => {
      if (metric === 'Gap Count' || metric === 'gap-count' || metric === 'gap_count') return b.gapCount - a.gapCount;
      if (metric === 'Gap Hours' || metric === 'gap-hours' || metric === 'gap_hours') return b.gapHours - a.gapHours;
      return b.gapCount - a.gapCount;
    })
    .slice(0, limit);
  
  const margin = { top: 20, right: 60, bottom: 20, left: 100 };
  const height = Math.max(300, ranked.length * 24);
  const width = 800 - margin.left - margin.right;
  const cellHeight = height - margin.top - margin.bottom;
  
  const svg = d3.select(container)
    .attr('width', '100%')
    .attr('height', height)
    .attr('viewBox', `0 0 800 ${height}`);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  const yScale = d3.scaleBand()
    .domain(ranked.map(d => d.flag))
    .range([0, cellHeight])
    .padding(0.4);
  
  let xMax = d3.max(ranked, d => {
    if (metric === 'Gap Count' || metric === 'gap-count' || metric === 'gap_count') return d.gapCount;
    if (metric === 'Gap Hours' || metric === 'gap-hours' || metric === 'gap_hours') return d.gapHours;
    return d.gapCount;
  });
  
  const xScale = d3.scaleLinear()
    .domain([0, xMax || 100])
    .range([0, width]);
  
  // Bars
  const rankBars = g.selectAll('.bar')
    .data(ranked)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', d => yScale(d.flag))
    .attr('width', 0)
    .attr('height', yScale.bandwidth())
    .attr('fill', '#6c8aff')
    .attr('opacity', 0.85)
    .on('mouseover', function() {
      d3.select(this).attr('opacity', 1).attr('fill', '#8aa4ff');
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 0.85).attr('fill', '#6c8aff');
    });

  rankBars
    .transition()
    .duration(900)
    .delay((d, i) => i * 45)
    .ease(d3.easeCubicOut)
    .attr('width', d => {
      if (metric === 'Gap Count' || metric === 'gap-count' || metric === 'gap_count') return xScale(d.gapCount);
      if (metric === 'Gap Hours' || metric === 'gap-hours' || metric === 'gap_hours') return xScale(d.gapHours);
      return xScale(d.gapCount);
    });
  
  // Y axis (flags)
  g.append('g')
    .call(d3.axisLeft(yScale))
    .call(gg => gg.select('.domain').attr('stroke', '#242836'))
    .call(gg => gg.selectAll('.tick text')
      .attr('fill', '#8890a8')
      .attr('font-size', '11'));
  
  // X axis
  g.append('g')
    .attr('transform', `translate(0,${cellHeight})`)
    .call(d3.axisBottom(xScale).ticks(5))
    .call(gg => gg.select('.domain').attr('stroke', '#242836'))
    .call(gg => gg.selectAll('.tick text')
      .attr('fill', '#8890a8')
      .attr('font-size', '11'));

  g.append('text')
    .attr('x', 0)
    .attr('y', -8)
    .attr('fill', '#a9b2ca')
    .attr('font-size', '11')
    .text('Top flags ranked by selected metric');
}
