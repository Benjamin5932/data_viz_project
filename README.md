# Data Visualisation Project

Interactive data visualisations built for the **Data Visualisation and Data-driven Decision Making** exam at the IT University of Copenhagen, 2026.

🌐 **Live site:** `https://benjamin5932.github.io/data_viz_project/`

**Topics:**
Fishing data:'https://globalfishingwatch.org/datasets-and-code/'

---

## Project structure

```
data_viz_project/
├── docs/                   ← GitHub Pages root (public site)
│   ├── index.html          ← Landing page
│   ├── style.css           ← Design system & styles
│   ├── main.js             ← Entry-point JS (D3 demo included)
│   └── data/               ← site-ready processed data files
├── data/
│   └── processed/          ← generated summary tables for analysis
├── datasets/               ← raw source CSVs
├── scripts/
│   └── preprocess_data.py  ← generates cleaned and aggregated outputs
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

## Preprocessing workflow

Run the preprocessing script whenever the source CSVs change:

```bash
"/Users/erikaymerich/Desktop/Data Science/4 semester/data visualitation/Semester project /data_viz_project/.venv/bin/python" scripts/preprocess_data.py
```

This writes compact outputs to both `data/processed/` and `docs/data/` so the static site can load the same cleaned tables it was built from.

Coverage and overlap notes are written automatically to `docs/data/data_manifest.json` after each preprocessing run.

## Website Direction

I’m not editing code yet; I’m shaping the website architecture first so the build plan matches the story-driven principles you listed and still fits the current static GitHub Pages setup.

Here is the website direction I would use for your project: a scrollable, story-first page with one strong narrative arc, four main graphs, and light but useful interaction. Because the data now aligns by year, the story can be built around 2017 to 2019 as a matched comparison rather than a forced cross-year merge.

### Overall Structure

- Open with a strong hero section that states the central tension: visible fishing versus invisible fishing.
- Use a Martini Glass flow: start broad, narrow into evidence, then open up into exploration at the end.
- Keep each section in three layers: a short headline, one main graphic, and a compact annotation paragraph.
- Let the page feel like a guided investigation, not a dashboard.

### Suggested 4-Graph Story

- Graph 1: Europe or North Atlantic map of invisible fleet activity.
- Purpose: establish where hidden activity clusters.
- Best interaction: hover for hotspot details, click to pin a region, toggle between gap count and gap hours.
- Visual form: dark map base, bright hotspots, minimal basemap noise.

- Graph 2: Seasonal line chart comparing invisible fleet activity and apparent fishing effort over time.
- Purpose: show whether the two patterns rise and fall together.
- Best interaction: month hover, metric toggle, highlight one year at a time, show a synchronized tooltip with both measures.
- Visual form: two main lines, one for gap activity and one for fishing effort, with subtle confidence or variability shading if needed.

- Graph 3: Small multiples for visible versus invisible activity by region or gear class.
- Purpose: make comparison easy without forcing the viewer to mentally switch contexts.
- Best interaction: filter by region, gear type, or flag; click one panel to expand it.
- Visual form: side-by-side panels with the same axis and identical scale.

- Graph 4: Ranked comparison chart by flag, showing gap counts, total gap hours, and fishing effort share.
- Purpose: reveal who dominates the invisible fleet and how that relates to apparent effort.
- Best interaction: sort by metric, hover bars for exact values, switch between counts and shares.
- Visual form: horizontal bars or lollipops, because they are easier to scan than vertical bars.

If you want a fifth element later, make it a compact uncertainty view, such as gap duration distribution or a small annotation panel about missing AIS and inferred positions. But for now, four graphs are enough.

### Interaction Tools

- A sticky section navigator on the side, so the reader always knows where they are in the story.
- A region selector for the map and comparison charts.
- A month scrubber or timeline slider for the seasonal chart.
- Hover tooltips that stay readable and do not overcomplicate the visuals.
- Click-to-lock interactions so users can compare one flag, one region, or one month across all charts.
- A reset button that clears filters without making the user reload the page.
- A short “What you are seeing” panel that updates with the active selection.

### Color Plan

Use a restrained, maritime palette with one accent for visible activity and one accent for invisible activity.

- Background: deep navy or near-black blue.
- Primary text: off-white, not pure white.
- Visible fishing / AIS-present: muted sea teal or blue-green.
- Invisible activity / dark gaps: warm amber, coral, or signal orange.
- Secondary context: slate gray and soft blue-gray.
- Uncertainty: use lower opacity, not a new bright color.

That gives you a clear semantic separation:

- blue/teal for what is visible,
- amber/red for what disappears or becomes suspicious,
- gray for context and supporting structure.

Avoid using too many saturated colors. If everything is vivid, the key signal gets lost.

### Typography

I would move away from a generic clean-sans-only look and give the page more character.

- Headlines: a serif with strong personality, such as Fraunces, Source Serif, or IBM Plex Serif.
- Body text: a highly readable sans serif, such as IBM Plex Sans, Source Sans 3, or Inter if you need to stay close to the current setup.
- Data labels and numbers: a monospace or semi-monospace font for clarity, such as JetBrains Mono or IBM Plex Mono.

Font sizing should feel editorial, not cramped:

- Hero title: very large, around 56 to 72 px desktop, 36 to 44 px mobile.
- Section titles: around 28 to 36 px.
- Body text: around 18 to 20 px for readability.
- Captions and annotations: 13 to 15 px, but never smaller than necessary.

### Layout and Spacing

- Use a centered reading column for text, around 640 to 760 px wide.
- Let charts span wider than the text when needed, especially for maps and small multiples.
- Keep generous vertical spacing between sections so the scroll feels intentional.
- Use a sticky chart area in some sections, with the text changing as the user scrolls.
- Prefer horizontal labels and short axis titles so the reader can scan quickly.

### Text Strategy

Keep the writing concise and layered.

- Headline: one sentence only.
- Subheadline: one supporting sentence that frames the visual.
- Annotation: 2 to 4 short sentences explaining why the chart matters.
- Do not overload the reader with paragraphs under every chart.
- Use specific callouts for important facts, such as where dark activity clusters, when patterns peak, and what the uncertainty means.

A good pattern is:

- headline says the claim,
- chart shows the evidence,
- annotation explains the interpretation.

### Uncertainty Handling

This matters a lot for your topic.

- Use opacity for inferred or uncertain detections.
- Use dashed lines or faded edges for lower-confidence estimates.
- Add short annotation notes explaining that AIS gaps are not proof of illegal behavior, only a signal of hidden activity.
- Be explicit that the visuals show patterns, not courtroom evidence.

That will make the project more credible and academically stronger.

### Recommended Section Flow

- Section 1: Intro and core claim.
- Section 2: Europe-wide map of invisible fleet hotspots.
- Section 3: Time-series comparison of invisible activity versus fishing effort.
- Section 4: Small multiples comparing visible and invisible patterns by region or gear.
- Section 5: Flag ranking and interpretation, with uncertainty and takeaways.
- Section 6: Short conclusion and a call to explore the data further.

### Deployment Plan

Since the site is static, keep using the current GitHub Pages setup.

- Put final site assets in the public docs folder.
- Keep the processed data in docs/data so the charts can load directly.
- Run the preprocessing script before each deployment.
- Deploy by pushing to main through GitHub Actions.

If you want, I can next turn this into a concrete page wireframe and then implement the first scroll section and the first graph in your current site.

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