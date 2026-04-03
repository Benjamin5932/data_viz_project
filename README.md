# Data Visualisation Project

Interactive data visualisations built for the **Data Visualisation and Data-driven Decision Making** exam at the IT University of Copenhagen, 2026.

🌐 **Live site:** `https://benjamin5932.github.io/data_viz_project/`

---

## Project structure

```
data_viz_project/
├── docs/                   ← GitHub Pages root (public site)
│   ├── index.html          ← Landing page
│   ├── style.css           ← Design system & styles
│   ├── main.js             ← Entry-point JS (D3 demo included)
│   └── charts/             ← (create this) individual chart pages
│       └── example.html
├── data/                   ← (create this) raw & processed datasets
├── notebooks/              ← (create this) analysis notebooks
├── .github/
│   └── workflows/
│       └── pages.yml       ← Auto-deploy on push to main
└── README.md
```

---

## Getting started locally

Open `docs/index.html` directly in your browser — no build step required.

```bash
# Or serve with Python for proper MIME types
python3 -m http.server 8080 --directory docs
# → http://localhost:8080
```

---

## Adding a new visualisation

1. **Create** `docs/charts/my-chart.html` (copy the structure from `index.html`)
2. **Add your D3 / Vega-Lite code** in a `<script>` block or a linked `.js` file
3. **Add a card** in `docs/index.html` inside the `#viz-grid` div:

```html
<article class="viz-card">
  <div class="viz-card__preview">
    <div id="my-chart-preview"></div>
  </div>
  <div class="viz-card__body">
    <span class="viz-card__tag">Category</span>
    <h3 class="viz-card__title">My Chart Title</h3>
    <p class="viz-card__desc">Short description of what this visualisation shows.</p>
    <a href="charts/my-chart.html" class="viz-card__cta">Explore →</a>
  </div>
</article>
```

4. **Push to `main`** — GitHub Actions will deploy automatically in ~1 minute.

---

## Tech stack

| Library | Version | Purpose |
|---|---|---|
| [D3.js](https://d3js.org) | v7 | Custom interactive charts |
| [Vega-Lite](https://vega.github.io/vega-lite/) | v5 | Declarative visualisations |
| Vanilla JS / CSS | — | No build step needed |
| GitHub Pages + Actions | — | Free public hosting |

---

## Enabling GitHub Pages (one-time setup)

1. Go to **Settings → Pages** in your GitHub repository
2. Under **Source**, select **GitHub Actions**
3. Push any commit to `main` — the workflow handles the rest

The site will be live at:
`https://benjamin5932.github.io/data_viz_project/`