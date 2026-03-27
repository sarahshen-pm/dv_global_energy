/* ================================================================
   GLOBAL ENERGY DASHBOARD — app.js
   SD6105 Data Visualization
================================================================ */

/* ── 1. CONSTANTS ─────────────────────────────────────────── */
const CSV_PATH = 'owid-energy-data.csv';
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';  // 50m includes small nations like Singapore
const YEAR_MIN = 1990, YEAR_MAX = 2024;

/* ── ENERGY FILTER CONFIG ───────────────────────────────── */
const FILTER_SOURCES = {
    renewables: { label: '🌱 Renewables', color: '#43e97b', dir: '+' },
    fossil: { label: '🏭 Fossil', color: '#c4611a', dir: '-' },
    coal: { label: '⚫ Coal', color: '#837060', dir: '-' },
    oil: { label: '🛢️ Oil', color: '#d4721a', dir: '-' },
    gas: { label: '🔥 Gas', color: '#e2b840', dir: '-' },
    nuclear: { label: '☢️ Nuclear', color: '#7b61ff', dir: '~' },
    hydro: { label: '💧 Hydro', color: '#38b6d8', dir: '+' },
    solar: { label: '☀️ Solar', color: '#f9a826', dir: '+' },
    wind: { label: '💨 Wind', color: '#56de90', dir: '+' },
};

// Map energySource + energyMetric → CSV column name
function getField() {
    const m = S.energyMetric;
    const map = {
        renewables: { share_energy: 'renewables_share_energy', share_elec: 'renewables_share_elec', per_capita: 'renewables_energy_per_capita' },
        fossil: { share_energy: 'fossil_share_energy', share_elec: 'fossil_share_elec', per_capita: 'fossil_energy_per_capita' },
        coal: { share_energy: 'coal_share_energy', share_elec: 'coal_share_elec', per_capita: 'coal_energy_per_capita' },
        oil: { share_energy: 'oil_share_energy', share_elec: 'oil_share_elec', per_capita: 'oil_energy_per_capita' },
        gas: { share_energy: 'gas_share_energy', share_elec: 'gas_share_elec', per_capita: 'gas_energy_per_capita' },
        nuclear: { share_energy: 'nuclear_share_energy', share_elec: 'nuclear_share_elec', per_capita: 'nuclear_energy_per_capita' },
        hydro: { share_energy: 'hydro_share_energy', share_elec: 'hydro_share_elec', per_capita: 'hydro_energy_per_capita' },
        solar: { share_energy: 'solar_share_energy', share_elec: 'solar_share_elec', per_capita: 'solar_energy_per_capita' },
        wind: { share_energy: 'wind_share_energy', share_elec: 'wind_share_elec', per_capita: 'wind_energy_per_capita' },
    };
    return map[S.energySource]?.[m] || 'renewables_share_energy';
}

function fmtMetricVal(v) {
    if (v == null || isNaN(v) || v < 0) return 'N/A';
    return S.energyMetric === 'per_capita'
        ? `${d3.format(',.0f')(v)} kWh`
        : `${d3.format('.1f')(v)}%`;
}

const ENERGY_SOURCES = [
    { key: 'coal_share_energy', label: 'Coal', color: '#5c4a42' },
    { key: 'oil_share_energy', label: 'Oil', color: '#c4611a' },
    { key: 'gas_share_energy', label: 'Gas', color: '#d4a827' },
    { key: 'nuclear_share_energy', label: 'Nuclear', color: '#7b61ff' },
    { key: 'hydro_share_energy', label: 'Hydro', color: '#38b6d8' },
    { key: 'solar_share_energy', label: 'Solar', color: '#f9a826' },
    { key: 'wind_share_energy', label: 'Wind', color: '#43e97b' },
    { key: 'biofuel_share_energy', label: 'Biofuel', color: '#8fbe7a' },
    { key: 'other_renewables_share_energy', label: 'Other RE', color: '#56c490' },
];
const ENERGY_ABS = [
    { key: 'coal_consumption', label: 'Coal', color: '#5c4a42' },
    { key: 'oil_consumption', label: 'Oil', color: '#c4611a' },
    { key: 'gas_consumption', label: 'Gas', color: '#d4a827' },
    { key: 'nuclear_consumption', label: 'Nuclear', color: '#7b61ff' },
    { key: 'hydro_consumption', label: 'Hydro', color: '#38b6d8' },
    { key: 'solar_consumption', label: 'Solar', color: '#f9a826' },
    { key: 'wind_consumption', label: 'Wind', color: '#43e97b' },
    { key: 'biofuel_consumption', label: 'Biofuel', color: '#8fbe7a' },
    { key: 'other_renewable_consumption', label: 'Other RE', color: '#56c490' },
];

const TREND_LINES = [
    { key: 'renewables_share_energy', label: 'Renewables', color: '#43e97b', width: 3 },
    { key: 'fossil_share_energy', label: 'Fossil', color: '#c4611a', width: 2 },
    { key: 'nuclear_share_energy', label: 'Nuclear', color: '#7b61ff', width: 1.5 },
    { key: 'solar_share_energy', label: 'Solar', color: '#f9a826', width: 1.5 },
    { key: 'wind_share_energy', label: 'Wind', color: '#38d468', width: 1.5 },
];
const RENEW_LINES = [
    { key: 'renewables_share_energy', label: 'Total RE', color: '#43e97b', width: 2.5 },
    { key: 'solar_share_energy', label: 'Solar', color: '#f9a826', width: 1.5 },
    { key: 'wind_share_energy', label: 'Wind', color: '#56c490', width: 1.5 },
    { key: 'hydro_share_energy', label: 'Hydro', color: '#38b6d8', width: 1.5 },
];

// ISO 3166-1 numeric → alpha-3 (for world-atlas topojson)
const ISO_NUM = {
    4: 'AFG', 8: 'ALB', 12: 'DZA', 24: 'AGO', 32: 'ARG', 36: 'AUS', 40: 'AUT',
    50: 'BGD', 56: 'BEL', 64: 'BTN', 68: 'BOL', 70: 'BIH', 72: 'BWA', 76: 'BRA',
    84: 'BLZ', 96: 'BRN', 100: 'BGR', 104: 'MMR', 108: 'BDI', 112: 'BLR',
    116: 'KHM', 120: 'CMR', 124: 'CAN', 132: 'CPV', 140: 'CAF', 144: 'LKA',
    148: 'TCD', 152: 'CHL', 156: 'CHN', 170: 'COL', 174: 'COM', 178: 'COG',
    180: 'COD', 188: 'CRI', 191: 'HRV', 192: 'CUB', 196: 'CYP', 203: 'CZE',
    204: 'BEN', 208: 'DNK', 214: 'DOM', 218: 'ECU', 222: 'SLV', 226: 'GNQ',
    231: 'ETH', 232: 'ERI', 233: 'EST', 242: 'FJI', 246: 'FIN', 250: 'FRA',
    262: 'DJI', 266: 'GAB', 270: 'GMB', 276: 'DEU', 288: 'GHA', 300: 'GRC',
    320: 'GTM', 324: 'GIN', 328: 'GUY', 332: 'HTI', 340: 'HND', 348: 'HUN',
    356: 'IND', 360: 'IDN', 364: 'IRN', 368: 'IRQ', 372: 'IRL', 376: 'ISR',
    380: 'ITA', 384: 'CIV', 388: 'JAM', 392: 'JPN', 398: 'KAZ', 400: 'JOR',
    404: 'KEN', 408: 'PRK', 410: 'KOR', 414: 'KWT', 417: 'KGZ', 418: 'LAO',
    422: 'LBN', 426: 'LSO', 428: 'LVA', 430: 'LBR', 434: 'LBY', 440: 'LTU',
    442: 'LUX', 450: 'MDG', 454: 'MWI', 458: 'MYS', 462: 'MDV', 466: 'MLI',
    470: 'MLT', 478: 'MRT', 484: 'MEX', 496: 'MNG', 498: 'MDA', 504: 'MAR',
    508: 'MOZ', 516: 'NAM', 524: 'NPL', 528: 'NLD', 548: 'VUT', 554: 'NZL',
    558: 'NIC', 562: 'NER', 566: 'NGA', 578: 'NOR', 586: 'PAK', 591: 'PAN',
    598: 'PNG', 600: 'PRY', 604: 'PER', 608: 'PHL', 616: 'POL', 620: 'PRT',
    626: 'TLS', 634: 'QAT', 642: 'ROU', 643: 'RUS', 646: 'RWA', 682: 'SAU',
    686: 'SEN', 694: 'SLE', 703: 'SVK', 705: 'SVN', 706: 'SOM', 710: 'ZAF',
    716: 'ZWE', 724: 'ESP', 728: 'SSD', 729: 'SDN', 740: 'SUR', 748: 'SWZ',
    752: 'SWE', 756: 'CHE', 760: 'SYR', 762: 'TJK', 764: 'THA', 768: 'TGO',
    780: 'TTO', 788: 'TUN', 792: 'TUR', 795: 'TKM', 800: 'UGA', 804: 'UKR',
    784: 'ARE', 826: 'GBR', 834: 'TZA', 840: 'USA', 858: 'URY', 860: 'UZB',
    862: 'VEN', 704: 'VNM', 887: 'YEM', 894: 'ZMB', 818: 'EGY', 688: 'SRB',
    807: 'MKD', 499: 'MNE', 90: 'SLB', 776: 'TON', 882: 'WSM', 296: 'KIR',
    520: 'NRU', 162: 'CXR', 166: 'CCK',
    // ── Southeast Asia & small nations (require 50m resolution) ──
    702: 'SGP',  // Singapore ★
    96: 'BRN',  // Brunei
    418: 'LAO',  // Laos (already above, safe duplicate key)
    626: 'TLS',  // Timor-Leste
    764: 'THA',  // Thailand (already above)
    116: 'KHM',  // Cambodia
    104: 'MMR',  // Myanmar
    218: 'ECU',  // Ecuador
    332: 'HTI',  // Haiti
    388: 'JAM',  // Jamaica
    591: 'PAN',  // Panama
};

/* ── 2. STATE ──────────────────────────────────────────────── */
const S = {
    year: YEAR_MIN,
    globalMode: 'relative',
    countryMode: 'relative',
    topTab: 'green',
    cmpMetric: 'renewable',
    mainISO: null,
    cmpISO: null,
    energySource: 'renewables',   // key in FILTER_SOURCES
    energyMetric: 'share_energy', // 'share_energy' | 'share_elec' | 'per_capita'
};

/* ── AUTO-PLAY ─────────────────────────────────────────────── */
let playTimer = null;
const PLAY_SPEED = 650; // ms per year

function updateSliderUI(year) {
    const slider = document.getElementById('year-slider');
    const display = document.getElementById('year-display');
    const progress = document.getElementById('slider-progress');
    if (slider) slider.value = year;
    if (display) display.textContent = year;
    if (progress) {
        const pct = ((year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100;
        progress.style.width = pct + '%';
    }
}

function startPlay() {
    const btn = document.getElementById('play-btn');
    if (btn) { btn.textContent = '⏸'; btn.classList.add('playing'); }
    playTimer = setInterval(() => {
        const next = S.year + 1;
        if (next > YEAR_MAX) { stopPlay(); return; } // reached end → pause
        S.year = next;
        updateSliderUI(next);
        updateMapColors();
        renderTopCountries();
    }, PLAY_SPEED);
}

function stopPlay() {
    clearInterval(playTimer);
    playTimer = null;
    const btn = document.getElementById('play-btn');
    if (btn) { btn.textContent = '▶'; btn.classList.remove('playing'); }
}

function togglePlay() {
    if (playTimer) stopPlay(); else startPlay();
}

/* ── 3. DATA STORE ─────────────────────────────────────────── */
let DB = {
    worldRows: [],      // [{year, renewables_share_energy, ...}]
    byISO: {},      // { 'USA': [{year,…}], … }
    countryMeta: [],      // [{iso, name, latest}]
    geoFeatures: null,    // GeoJSON features array
    geoTopo: null,    // raw TopoJSON (for topojson.mesh borders)
};

/* ── 4. DATA LOADING ───────────────────────────────────────── */
async function loadAll() {
    const [topo, csv] = await Promise.all([
        fetch(GEO_URL).then(r => r.json()),
        new Promise((res, rej) => {
            Papa.parse(CSV_PATH, {
                download: true, header: true, dynamicTyping: true,
                skipEmptyLines: true,
                complete: r => res(r.data),
                error: rej,
            });
        }),
    ]);

    // Convert topojson → GeoJSON features; keep raw topo for mesh
    DB.geoTopo = topo;
    DB.geoFeatures = topojson.feature(topo, topo.objects.countries).features;

    // Filter CSV to 1990-2024; separate World vs country rows
    const rows = csv.filter(r => r.year >= YEAR_MIN && r.year <= YEAR_MAX);

    rows.forEach(r => {
        if (r.country === 'World') {
            DB.worldRows.push(r);
        } else if (r.iso_code && /^[A-Z]{3}$/.test(r.iso_code)) {
            if (!DB.byISO[r.iso_code]) DB.byISO[r.iso_code] = [];
            DB.byISO[r.iso_code].push(r);
        }
    });

    // Sort each country's rows by year
    Object.values(DB.byISO).forEach(arr => arr.sort((a, b) => a.year - b.year));
    DB.worldRows.sort((a, b) => a.year - b.year);

    // Build country meta (latest row per country)
    DB.countryMeta = Object.entries(DB.byISO).map(([iso, rows]) => {
        const latest = rows[rows.length - 1];
        const name = latest.country;
        return { iso, name, latest };
    }).filter(d => d.latest.primary_energy_consumption > 0);

    // Populate compare dropdown
    const sel = document.getElementById('compare-select');
    DB.countryMeta
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(({ iso, name }) => {
            const opt = document.createElement('option');
            opt.value = iso; opt.textContent = name;
            sel.appendChild(opt);
        });
}

/* ── 5. HELPERS ────────────────────────────────────────────── */
function getCountryRow(iso, year) {
    const rows = DB.byISO[iso];
    if (!rows) return null;
    return rows.find(r => r.year === year) || null;
}
function getWorldRow(year) {
    return DB.worldRows.find(r => r.year === year) || DB.worldRows[DB.worldRows.length - 1];
}
function fmt(v, decimals = 1) {
    if (v == null || isNaN(v)) return '—';
    return (+v).toFixed(decimals);
}
function fmtPct(v) { return v != null && !isNaN(v) ? fmt(v) + '%' : '—'; }

// Country name → flag emoji (simplified)
const FLAG_OVERRIDE = {
    USA: '🇺🇸', CHN: '🇨🇳', IND: '🇮🇳', DEU: '🇩🇪', GBR: '🇬🇧', FRA: '🇫🇷', JPN: '🇯🇵',
    BRA: '🇧🇷', CAN: '🇨🇦', RUS: '🇷🇺', AUS: '🇦🇺', KOR: '🇰🇷', ITA: '🇮🇹', ESP: '🇪🇸',
    NOR: '🇳🇴', SWE: '🇸🇪', DNK: '🇩🇰', FIN: '🇫🇮', NZL: '🇳🇿', ISL: '🇮🇸',
    SAU: '🇸🇦', ZAF: '🇿🇦', MEX: '🇲🇽', IDN: '🇮🇩', TUR: '🇹🇷', IRN: '🇮🇷',
    PAK: '🇵🇰', BGD: '🇧🇩', VNM: '🇻🇳', POL: '🇵🇱', NLD: '🇳🇱', CHE: '🇨🇭',
    SWZ: '🇸🇿', COL: '🇨🇴', ARG: '🇦🇷', PER: '🇵🇪', CHL: '🇨🇱', ETH: '🇪🇹',
    NGA: '🇳🇬', EGY: '🇪🇬', KEN: '🇰🇪', BRA: '🇧🇷', ARE: '🇦🇪',
};
function getFlag(iso) { return FLAG_OVERRIDE[iso] || '🏳️'; }

/* tooltip helper */
function showTip(tipEl, html, event) {
    tipEl.innerHTML = html;
    tipEl.classList.add('visible');
    moveTip(tipEl, event);
}
function moveTip(tipEl, event) {
    const rect = tipEl.parentElement.getBoundingClientRect();
    let x = event.clientX - rect.left + 12;
    let y = event.clientY - rect.top - 10;
    const tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
    if (x + tw > rect.width - 10) x = event.clientX - rect.left - tw - 12;
    if (y + th > rect.height - 10) y -= th;
    tipEl.style.left = x + 'px';
    tipEl.style.top = y + 'px';
}
function hideTip(tipEl) { tipEl.classList.remove('visible'); }

/* ── ENERGY FILTER HELPERS ─────────────────────────────── */
function makeColorScale() {
    const field = getField();
    const src = FILTER_SOURCES[S.energySource];

    // 98th-percentile domain from live data (avoids outliers dominating)
    const vals = DB.countryMeta
        .map(m => { const r = getCountryRow(m.iso, S.year); return r ? +r[field] : NaN; })
        .filter(v => !isNaN(v) && v > 0)
        .sort(d3.ascending);
    const domMax = vals.length
        ? (vals[Math.floor(vals.length * 0.98)] || vals[vals.length - 1])
        : (S.energyMetric === 'per_capita' ? 10000 : 80);

    // Choose interpolator by direction
    let interp;
    if (src.dir === '+') {
        // clean/positive: RdYlGn for renewables/hydro, single-hue for others
        interp = S.energySource === 'renewables'
            ? d3.interpolateRdYlGn
            : d => d3.interpolateLab('#111629', src.color)(d);
    } else if (src.dir === '-') {
        // fossil: yellow → red (high = concerning)
        interp = d3.interpolateYlOrRd;
    } else {
        // neutral (nuclear): dark → source color
        interp = d => d3.interpolateLab('#111629', src.color)(d);
    }
    return d3.scaleSequentialSqrt([0, Math.max(domMax, 1)], interp).clamp(true);
}

function updateMapTitle() {
    const src = FILTER_SOURCES[S.energySource];
    const mLabel = { share_energy: 'Share of Primary Energy', share_elec: 'Share of Electricity', per_capita: 'Per Capita (kWh)' }[S.energyMetric];
    const full = `${src.label} · ${mLabel}`;
    const el = document.getElementById('map-title'); if (el) el.textContent = full;
    const pill = document.getElementById('nav-metric-pill'); if (pill) pill.textContent = full;
    const note = document.getElementById('legend-note'); if (note) note.textContent = `${src.label}`;
}

function updateLegend() {
    const cs = makeColorScale();
    const max = cs.domain()[1];
    const fmt = S.energyMetric === 'per_capita'
        ? `${Math.round(max).toLocaleString()} kWh`
        : `${Math.round(max)}%`;
    const legMax = document.getElementById('legend-max'); if (legMax) legMax.textContent = fmt;
    const legMin = document.getElementById('legend-min'); if (legMin) legMin.textContent = '0';
    // rebuild gradient from scale
    const grad = document.getElementById('leg-gradient');
    if (grad) {
        const stops = Array.from({ length: 11 }, (_, i) => cs(max * i / 10)).join(',');
        grad.style.background = `linear-gradient(to right,${stops})`;
    }
}

function renderMap() {
    const container = document.getElementById('map-container');
    const W = container.clientWidth || 680;
    const H = Math.max(Math.min(W * 0.54, 430), 300);

    const svg = d3.select('#world-map')
        .attr('width', W).attr('height', H)
        .style('cursor', 'grab');
    svg.selectAll('*').remove();

    // Equal Earth projection — auto-fit to container (Observable style)
    // Singapore: lon 103.8°E, lat 1.35°N
    // D3 rotate([-lon, -lat]) shifts that point to the center of the viewport
    const projection = d3.geoEqualEarth()
        .rotate([-103.8, -1.35])   // ← center on Singapore
        .fitExtent([[2, 2], [W - 2, H - 2]], { type: 'Sphere' });
    const path = d3.geoPath(projection);

    const colorScale = makeColorScale();
    const tip = document.getElementById('map-tooltip');

    // ── Zoom / Pan (Observable-style, max 8× zoom) ──────────
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
            svg.style('cursor', event.transform.k > 1 ? 'grabbing' : 'grab');
        });
    svg.call(zoom);

    const g = svg.append('g');

    // ── Ocean / Sphere fill ─────────────────────────────────
    g.append('path')
        .datum({ type: 'Sphere' })
        .attr('class', 'sphere')
        .attr('d', path);

    // ── Graticule ───────────────────────────────────────────
    g.append('path')
        .datum(d3.geoGraticule()()
        )
        .attr('class', 'graticule')
        .attr('d', path);

    /* ── Country fills ─────────────────────────────────────── */
    const field = getField();
    const countries = g.append('g').attr('class', 'countries-g');
    countries.selectAll('path')
        .data(DB.geoFeatures)
        .join('path')
        .attr('class', 'country-path')
        .attr('d', path)
        .attr('fill', d => {
            const iso = ISO_NUM[+d.id];
            const row = iso ? getCountryRow(iso, S.year) : null;
            const v = row ? +row[field] : NaN;
            return (!isNaN(v) && v >= 0) ? colorScale(v) : null;
        })
        .classed('no-data', d => {
            const iso = ISO_NUM[+d.id];
            const row = iso ? getCountryRow(iso, S.year) : null;
            const v = row ? +row[field] : NaN;
            return isNaN(v) || v < 0;
        })
        .on('mousemove', (event, d) => {
            const iso = ISO_NUM[+d.id];
            const row = iso ? getCountryRow(iso, S.year) : null;
            if (!iso) return;
            const name = row?.country || iso;
            const src = FILTER_SOURCES[S.energySource];
            const v = row ? +row[field] : NaN;
            const re = row?.renewables_share_energy;
            const ff = row?.fossil_share_energy;
            showTip(tip, `
                <div class="tt-title">${getFlag(iso)} ${name}</div>
                <div class="tt-row">
                  <span class="tt-dot" style="background:${src.color}"></span>
                  ${src.label.replace(/^\S+\s/, '')}
                  <span class="tt-val">${fmtMetricVal(v)}</span>
                </div>
                <div class="tt-row" style="font-size:0.7rem;color:var(--text-md)">
                  RE ${fmtPct(re)} &nbsp;|&nbsp; Fossil ${fmtPct(ff)}
                </div>
            `, event);
        })
        .on('mouseleave', () => hideTip(tip))
        .on('click', (event, d) => {
            const iso = ISO_NUM[+d.id];
            if (iso && DB.byISO[iso]) showCountryView(iso);
        });

    // ── Country borders (Observable topojson.mesh technique) ─
    // Interior borders: only draw where two different countries share an edge
    if (DB.geoTopo) {
        g.append('path')
            .datum(topojson.mesh(
                DB.geoTopo,
                DB.geoTopo.objects.countries,
                (a, b) => a !== b  // only interior boundaries
            ))
            .attr('fill', 'none')
            .attr('stroke', 'rgba(255,255,255,0.18)')
            .attr('stroke-width', 0.4)
            .attr('stroke-linejoin', 'round')
            .attr('d', path)
            .style('pointer-events', 'none'); // don't block hover
    }

    // ── Sphere outline ──────────────────────────────────────
    g.append('path')
        .datum({ type: 'Sphere' })
        .attr('fill', 'none')
        .attr('stroke', 'rgba(108,127,255,0.4)')
        .attr('stroke-width', 1.2)
        .attr('d', path)
        .style('pointer-events', 'none');

    // ── Reset zoom on double-click ──────────────────────────
    svg.on('dblclick.zoom', () => {
        svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    });
}

function updateMapColors() {
    const colorScale = makeColorScale();
    const field = getField();
    d3.select('#world-map').select('.countries-g').selectAll('.country-path')
        .transition().duration(350)
        .attr('fill', d => {
            const iso = ISO_NUM[+d.id];
            const row = iso ? getCountryRow(iso, S.year) : null;
            const v = row ? +row[field] : NaN;
            return (!isNaN(v) && v >= 0) ? colorScale(v) : null;
        })
        .each(function (d) {
            const iso = ISO_NUM[+d.id];
            const row = iso ? getCountryRow(iso, S.year) : null;
            const v = row ? +row[field] : NaN;
            d3.select(this).classed('no-data', isNaN(v) || v < 0);
        });
    updateMapTitle();
    updateLegend();
}

/* ── 7. GLOBAL TREND LINE CHART ───────────────────────────── */
function renderTrendChart() {
    const card = document.getElementById('card-trend');
    const W = (card.clientWidth || 300) - 32;
    const H = 200;
    const margin = { top: 10, right: 15, bottom: 28, left: 38 };
    const iW = W - margin.left - margin.right;
    const iH = H - margin.top - margin.bottom;

    const svg = d3.select('#trend-chart')
        .attr('width', W).attr('height', H);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const years = DB.worldRows.map(r => r.year);
    const xScale = d3.scaleLinear().domain(d3.extent(years)).range([0, iW]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([iH, 0]);

    g.append('g').attr('transform', `translate(0,${iH})`).call(
        d3.axisBottom(xScale).ticks(6).tickFormat(d3.format('d'))
    );
    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickFormat(d => d + '%'));

    const tip = document.getElementById('trend-tooltip');
    const bisect = d3.bisector(r => r.year).left;

    // Draw lines
    TREND_LINES.forEach(({ key, color, width }) => {
        const lineGen = d3.line()
            .defined(r => r[key] != null && !isNaN(r[key]))
            .x(r => xScale(r.year))
            .y(r => yScale(+r[key]))
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(DB.worldRows)
            .attr('class', 'line-path')
            .attr('stroke', color)
            .attr('stroke-width', width)
            .attr('d', lineGen)
            .attr('opacity', 0.9);
    });

    // Crosshair overlay
    const overlay = g.append('rect')
        .attr('width', iW).attr('height', iH)
        .attr('fill', 'transparent');

    const crosshair = g.append('line').attr('class', 'crosshair').attr('y1', 0).attr('y2', iH).style('display', 'none');

    overlay.on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const year = Math.round(xScale.invert(mx));
        const row = getWorldRow(year);
        if (!row) return;
        crosshair.style('display', null).attr('x1', xScale(row.year)).attr('x2', xScale(row.year));
        const rows = TREND_LINES.map(l => `
      <div class="tt-row">
        <span class="tt-dot" style="background:${l.color}"></span>
        ${l.label} <span class="tt-val">${fmtPct(row[l.key])}</span>
      </div>`).join('');
        showTip(tip, `<div class="tt-title">${year}</div>${rows}`, event);
    }).on('mouseleave', () => { crosshair.style('display', 'none'); hideTip(tip); });

    // Legend
    const legEl = document.getElementById('trend-legend');
    legEl.innerHTML = TREND_LINES.map(l => `
    <span class="leg-item">
      <span class="leg-swatch" style="background:${l.color}"></span>${l.label}
    </span>`).join('');
}

/* ── 8. TOP COUNTRIES ─────────────────────────────────────── */
function renderTopCountries() {
    const listEl = document.getElementById('top-list');
    const isGreen = S.topTab === 'green';
    const KEY = isGreen ? 'renewables_share_energy' : 'fossil_share_energy';
    const COLOR = isGreen ? '#43e97b' : '#c4611a';

    const data = DB.countryMeta
        .map(d => ({ ...d, val: d.latest[KEY] }))
        .filter(d => d.val != null && !isNaN(d.val))
        .sort((a, b) => isGreen ? b.val - a.val : b.val - a.val)
        .slice(0, 6);

    const maxVal = d3.max(data, d => d.val) || 1;

    listEl.innerHTML = data.map((d, i) => `
    <div class="top-item">
      <span class="top-rank">${i + 1}</span>
      <span class="top-flag">${getFlag(d.iso)}</span>
      <span class="top-name">${d.name}</span>
      <div class="top-bar-wrap">
        <div class="top-bar" style="width:${(d.val / maxVal * 100).toFixed(1)}%;background:${COLOR}"></div>
      </div>
      <span class="top-val" style="color:${COLOR}">${fmt(d.val)}%</span>
    </div>`).join('');
}

/* ── 9. GLOBAL STACKED AREA CHART ─────────────────────────── */
function renderAreaChart() {
    const section = document.querySelector('.area-section');
    const W = (section?.clientWidth || 800) - 40;
    const H = 230;
    const margin = { top: 10, right: 20, bottom: 32, left: 48 };
    const iW = W - margin.left - margin.right;
    const iH = H - margin.top - margin.bottom;

    const svg = d3.select('#area-chart').attr('width', W).attr('height', H);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const sources = S.globalMode === 'relative' ? ENERGY_SOURCES : ENERGY_ABS;
    const dataRows = DB.worldRows.filter(r => r.year >= YEAR_MIN && r.year <= YEAR_MAX);

    // Normalize if relative
    const stackData = dataRows.map(r => {
        const obj = { year: r.year };
        if (S.globalMode === 'relative') {
            const total = sources.reduce((s, e) => s + (+r[e.key] || 0), 0);
            sources.forEach(e => obj[e.key] = total > 0 ? (+r[e.key] || 0) / total * 100 : 0);
        } else {
            sources.forEach(e => obj[e.key] = +r[e.key] || 0);
        }
        return obj;
    });

    const stack = d3.stack().keys(sources.map(e => e.key)).order(d3.stackOrderNone).offset(d3.stackOffsetNone);
    const series = stack(stackData);

    const xScale = d3.scaleLinear().domain([YEAR_MIN, YEAR_MAX]).range([0, iW]);
    const yMax = S.globalMode === 'relative' ? 100 : d3.max(series[series.length - 1], d => d[1]);
    const yScale = d3.scaleLinear().domain([0, yMax]).range([iH, 0]);

    g.append('g').attr('transform', `translate(0,${iH})`).call(
        d3.axisBottom(xScale).ticks(8).tickFormat(d3.format('d'))
    );
    g.append('g').call(
        d3.axisLeft(yScale).ticks(5).tickFormat(d => S.globalMode === 'relative' ? d + '%' : d3.format('.2s')(d))
    );

    const area = d3.area()
        .x(d => xScale(d.data.year))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveMonotoneX);

    const tip = document.getElementById('area-tooltip');
    const bisect = d3.bisector(d => d.data.year).left;

    g.selectAll('.area-path')
        .data(series)
        .join('path')
        .attr('class', 'area-path')
        .attr('fill', (d, i) => sources[i].color)
        .attr('d', area);

    // Crosshair overlay
    g.append('rect').attr('width', iW).attr('height', iH).attr('fill', 'transparent')
        .on('mousemove', (event) => {
            const [mx] = d3.pointer(event);
            const year = Math.round(xScale.invert(mx));
            const row = stackData.find(d => d.year === year);
            if (!row) return;
            const rows = sources.map(e => `
        <div class="tt-row">
          <span class="tt-dot" style="background:${e.color}"></span>
          ${e.label} <span class="tt-val">${S.globalMode === 'relative' ? fmt(row[e.key]) + '%' : d3.format('.1f')(row[e.key]) + ' TWh'}</span>
        </div>`).join('');
            showTip(tip, `<div class="tt-title">${year}</div>${rows}`, event);
        })
        .on('mouseleave', () => hideTip(tip));

    // Legend
    const legEl = document.getElementById('area-legend');
    legEl.innerHTML = sources.map(e => `
    <span class="leg-item">
      <span class="leg-swatch" style="background:${e.color}"></span>${e.label}
    </span>`).join('');
}

/* ── 10. SHOW COUNTRY VIEW ────────────────────────────────── */
function showCountryView(iso) {
    S.mainISO = iso;
    document.getElementById('view-global').classList.add('hidden');
    const cv = document.getElementById('view-country');
    cv.classList.remove('hidden');

    const rows = DB.byISO[iso];
    const latestRow = getCountryRow(iso, S.year) || rows[rows.length - 1];
    document.getElementById('c-flag').textContent = getFlag(iso);
    document.getElementById('c-name').textContent = latestRow.country;
    document.getElementById('donut-title').textContent = `Energy Mix — ${latestRow.country}`;
    document.getElementById('history-title').textContent = `Energy History — ${latestRow.country}`;

    renderKPIs(iso);
    renderDonut(iso, S.year);
    renderRenewGrowth(iso);
    renderCountryArea(iso);
    renderCompareChart();
}

/* ── 11. KPI STRIP ───────────────────────────────────────── */
function renderKPIs(iso) {
    const row = getCountryRow(iso, S.year) || DB.byISO[iso]?.slice(-1)[0];
    if (!row) return;
    const cmpRow = S.cmpISO ? (getCountryRow(S.cmpISO, S.year) || DB.byISO[S.cmpISO]?.slice(-1)[0]) : null;

    const kpis = [
        { label: 'Renewable Share', val: fmtPct(row.renewables_share_energy), unit: 'of total energy', cmp: cmpRow ? fmtPct(cmpRow.renewables_share_energy) : null },
        { label: 'Carbon Intensity', val: fmt(row.carbon_intensity_elec, 0), unit: 'g CO₂/kWh (electricity)', cmp: cmpRow ? fmt(cmpRow.carbon_intensity_elec, 0) : null },
        { label: 'Energy per Capita', val: fmt(row.energy_per_capita, 0), unit: 'kWh per person', cmp: cmpRow ? fmt(cmpRow.energy_per_capita, 0) : null },
        { label: 'Total Consumption', val: d3.format('.3s')(row.primary_energy_consumption || 0), unit: 'TWh primary energy', cmp: cmpRow ? d3.format('.3s')(cmpRow.primary_energy_consumption || 0) : null },
    ];

    const cm = cmpRow ? getCountryRow(S.cmpISO, S.year) : null;
    document.getElementById('kpi-strip').innerHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-val">${k.val}</div>
      <div class="kpi-unit">${k.unit}</div>
      ${k.cmp ? `<div class="kpi-unit" style="color:#f9a826;margin-top:.3rem">${S.cmpISO}: ${k.cmp}</div>` : ''}
    </div>`).join('');
}

/* ── 12. DONUT CHART ─────────────────────────────────────── */
function renderDonut(iso, year) {
    const card = document.querySelector('.donut-card');
    const size = Math.min(card?.clientWidth || 240, 240);
    const R = size / 2 - 10;
    const innerR = R * 0.52;

    const svg = d3.select('#donut-chart')
        .attr('width', size).attr('height', size);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${size / 2},${size / 2})`);

    const row = getCountryRow(iso, year);
    if (!row) return;

    const data = ENERGY_SOURCES
        .map(e => ({ key: e.key, label: e.label, color: e.color, value: +row[e.key] || 0 }))
        .filter(d => d.value > 0.1);

    const total = d3.sum(data, d => d.value);

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(innerR).outerRadius(R);
    const arcHover = d3.arc().innerRadius(innerR - 2).outerRadius(R + 6);

    g.selectAll('path')
        .data(pie(data))
        .join('path')
        .attr('fill', d => d.data.color)
        .attr('d', arc)
        .attr('stroke', '#111629').attr('stroke-width', 1.5)
        .on('mouseover', function (event, d) {
            d3.select(this).attr('d', arcHover);
            document.getElementById('donut-center').innerHTML = `
        <div class="donut-big">${fmt(d.data.value)}%</div>
        <div class="donut-sub">${d.data.label}</div>`;
        })
        .on('mouseout', function (event, d) {
            d3.select(this).attr('d', arc);
            const re = row.renewables_share_energy;
            document.getElementById('donut-center').innerHTML = `
        <div class="donut-big">${fmt(re)}%</div>
        <div class="donut-sub">Renewable</div>`;
        });

    const re = row.renewables_share_energy;
    document.getElementById('donut-center').innerHTML = `
    <div class="donut-big">${fmt(re)}%</div>
    <div class="donut-sub">Renewable</div>`;

    document.getElementById('donut-legend').innerHTML = data.map(d => `
    <span class="leg-item">
      <span class="leg-swatch" style="background:${d.color}"></span>${d.label} ${fmt(d.value)}%
    </span>`).join('');
}

/* ── 13. RENEWABLE GROWTH CHART ──────────────────────────── */
function renderRenewGrowth(iso) {
    const card = document.querySelector('.renew-card');
    const W = (card?.clientWidth || 340) - 32;
    const H = 210;
    const m = { top: 10, right: 15, bottom: 28, left: 38 };
    const iW = W - m.left - m.right, iH = H - m.top - m.bottom;

    const svg = d3.select('#renew-chart').attr('width', W).attr('height', H);
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const rows = DB.byISO[iso] || [];
    const cmpRows = S.cmpISO ? (DB.byISO[S.cmpISO] || []) : [];
    const allRows = [...rows, ...cmpRows];
    const yMax = d3.max(allRows, r => d3.max(RENEW_LINES, l => +r[l.key] || 0)) || 10;

    const xScale = d3.scaleLinear().domain([YEAR_MIN, YEAR_MAX]).range([0, iW]);
    const yScale = d3.scaleLinear().domain([0, yMax * 1.08]).range([iH, 0]);

    g.append('g').attr('transform', `translate(0,${iH})`).call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.format('d')));
    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickFormat(d => d + '%'));

    const tip = document.getElementById('renew-tooltip');

    function drawLines(data, dasharray) {
        RENEW_LINES.forEach(({ key, color, width }) => {
            const lineGen = d3.line()
                .defined(r => r[key] != null && !isNaN(r[key]))
                .x(r => xScale(r.year))
                .y(r => yScale(+r[key]))
                .curve(d3.curveMonotoneX);
            g.append('path')
                .datum(data)
                .attr('class', 'line-path')
                .attr('stroke', color)
                .attr('stroke-width', width)
                .attr('stroke-dasharray', dasharray)
                .attr('d', lineGen);
        });
    }
    drawLines(rows, null);
    if (cmpRows.length) drawLines(cmpRows, '5,3');

    g.append('rect').attr('width', iW).attr('height', iH).attr('fill', 'transparent')
        .on('mousemove', (event) => {
            const [mx] = d3.pointer(event);
            const year = Math.round(xScale.invert(mx));
            const r1 = rows.find(r => r.year === year);
            if (!r1) return;
            let html = `<div class="tt-title">${year}</div>`;
            RENEW_LINES.forEach(l => {
                html += `<div class="tt-row"><span class="tt-dot" style="background:${l.color}"></span>${l.label} <span class="tt-val">${fmtPct(r1[l.key])}</span></div>`;
            });
            showTip(tip, html, event);
        }).on('mouseleave', () => hideTip(tip));

    document.getElementById('renew-legend').innerHTML = RENEW_LINES.map(l => `
    <span class="leg-item"><span class="leg-swatch" style="background:${l.color}"></span>${l.label}</span>`).join('');
}

/* ── 14. COUNTRY STACKED AREA ────────────────────────────── */
function renderCountryArea(iso) {
    const W = ((document.querySelector('.country-card')?.clientWidth || document.querySelector('#view-country')?.clientWidth || 800)) - 40;
    const H = 220;
    const m = { top: 10, right: 20, bottom: 30, left: 48 };
    const iW = W - m.left - m.right, iH = H - m.top - m.bottom;

    const svg = d3.select('#country-area-chart').attr('width', W).attr('height', H);
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const rows = DB.byISO[iso] || [];
    const sources = S.countryMode === 'relative' ? ENERGY_SOURCES : ENERGY_ABS;

    const stackData = rows.map(r => {
        const obj = { year: r.year };
        if (S.countryMode === 'relative') {
            const total = sources.reduce((s, e) => s + (+r[e.key] || 0), 0);
            sources.forEach(e => obj[e.key] = total > 0 ? (+r[e.key] || 0) / total * 100 : 0);
        } else {
            sources.forEach(e => obj[e.key] = +r[e.key] || 0);
        }
        return obj;
    });

    const stack = d3.stack().keys(sources.map(e => e.key));
    const series = stack(stackData);

    const xScale = d3.scaleLinear().domain([YEAR_MIN, YEAR_MAX]).range([0, iW]);
    const yMax = S.countryMode === 'relative' ? 100 : d3.max(series[series.length - 1], d => d[1]);
    const yScale = d3.scaleLinear().domain([0, yMax || 1]).range([iH, 0]);

    g.append('g').attr('transform', `translate(0,${iH})`).call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.format('d')));
    g.append('g').call(d3.axisLeft(yScale).ticks(5).tickFormat(d => S.countryMode === 'relative' ? d + '%' : d3.format('.2s')(d)));

    const area = d3.area().x(d => xScale(d.data.year)).y0(d => yScale(d[0])).y1(d => yScale(d[1])).curve(d3.curveMonotoneX);

    const tip = document.getElementById('c-area-tooltip');
    g.selectAll('.area-path').data(series).join('path')
        .attr('class', 'area-path')
        .attr('fill', (d, i) => sources[i].color)
        .attr('d', area);

    g.append('rect').attr('width', iW).attr('height', iH).attr('fill', 'transparent')
        .on('mousemove', (event) => {
            const [mx] = d3.pointer(event);
            const year = Math.round(xScale.invert(mx));
            const row = stackData.find(d => d.year === year);
            if (!row) return;
            const lines = sources.map(e => `
        <div class="tt-row"><span class="tt-dot" style="background:${e.color}"></span>${e.label}
        <span class="tt-val">${S.countryMode === 'relative' ? fmt(row[e.key]) + '%' : d3.format('.1f')(row[e.key]) + ' TWh'}</span></div>`).join('');
            showTip(tip, `<div class="tt-title">${year}</div>${lines}`, event);
        }).on('mouseleave', () => hideTip(tip));
}

/* ── 15. COMPARISON BAR CHART ────────────────────────────── */
function renderCompareChart() {
    const KEY_MAP = {
        renewable: { field: 'renewables_share_energy', label: 'Renewable %', fmt: v => fmt(v) + '%' },
        carbon: { field: 'carbon_intensity_elec', label: 'Carbon Intensity g/kWh', fmt: v => fmt(v, 0) },
        percap: { field: 'energy_per_capita', label: 'Energy per Capita kWh', fmt: v => d3.format(',.0f')(v) },
    };
    const { field, label, fmt: fmtFn } = KEY_MAP[S.cmpMetric];

    const allData = DB.countryMeta
        .map(d => {
            const row = getCountryRow(d.iso, S.year) || d.latest;
            return { iso: d.iso, name: d.name, val: row?.[field] };
        })
        .filter(d => d.val != null && !isNaN(d.val) && d.val > 0)
        .sort((a, b) => b.val - a.val)
        .slice(0, 30);

    const el = document.querySelector('.compare-card');
    const W = (el?.clientWidth || 800) - 40;
    const barH = 18, rowH = 22;
    const H = allData.length * rowH + 50;
    const m = { top: 20, right: 80, bottom: 20, left: 110 };
    const iW = W - m.left - m.right;

    const svg = d3.select('#compare-chart').attr('width', W).attr('height', H);
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const xScale = d3.scaleLinear().domain([0, d3.max(allData, d => d.val)]).range([0, iW]);
    const yScale = d3.scaleBand().domain(allData.map(d => d.iso)).range([0, allData.length * rowH]).padding(0.2);

    g.append('g').call(d3.axisTop(xScale).ticks(5).tickFormat(v => S.cmpMetric === 'percap' ? d3.format('.2s')(v) : v));

    const tip = document.getElementById('cmp-tooltip');
    const bars = g.selectAll('.bar-g').data(allData).join('g').attr('transform', d => `translate(0,${yScale(d.iso)})`);

    bars.append('rect')
        .attr('width', d => xScale(d.val))
        .attr('height', barH)
        .attr('rx', 3)
        .attr('fill', d => {
            if (d.iso === S.mainISO) return '#6c7fff';
            if (d.iso === S.cmpISO) return '#f9a826';
            return '#2a3050';
        })
        .attr('opacity', d => (d.iso === S.mainISO || d.iso === S.cmpISO) ? 1 : 0.7);

    bars.append('text')
        .attr('x', -5).attr('y', barH / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('fill', d => (d.iso === S.mainISO || d.iso === S.cmpISO) ? '#eef0ff' : '#8b90b8')
        .attr('font-size', '0.7rem')
        .text(d => d.name.length > 14 ? d.name.slice(0, 13) + '…' : d.name);

    bars.append('text')
        .attr('x', d => xScale(d.val) + 5).attr('y', barH / 2 + 4)
        .attr('fill', '#8b90b8').attr('font-size', '0.7rem')
        .text(d => fmtFn(d.val));

    bars.on('mousemove', (event, d) => {
        showTip(tip, `<div class="tt-title">${getFlag(d.iso)} ${d.name}</div>
      <div class="tt-row">${label}: <span class="tt-val">${fmtFn(d.val)}</span></div>`, event);
    }).on('mouseleave', () => hideTip(tip));
}

/* ── 16. EVENT HANDLERS ──────────────────────────────────── */
function bindEvents() {
    // Global year slider — manual drag pauses auto-play
    $on('year-slider', 'input', () => {
        if (playTimer) stopPlay(); // pause on manual interaction
        S.year = +document.getElementById('year-slider').value;
        updateSliderUI(S.year);
        updateMapColors();
        renderTopCountries();
    });

    // Play / Pause button
    $on('play-btn', 'click', togglePlay);

    // Global area mode toggle
    $on('global-mode-btns', 'click', e => {
        const btn = e.target.closest('.tog');
        if (!btn) return;
        S.globalMode = btn.dataset.mode;
        document.querySelectorAll('#global-mode-btns .tog').forEach(b => b.classList.toggle('active', b === btn));
        renderAreaChart();
    });

    // Top countries tabs
    document.querySelectorAll('#card-top .tab').forEach(btn => {
        btn.addEventListener('click', () => {
            S.topTab = btn.dataset.tab;
            document.querySelectorAll('#card-top .tab').forEach(b => b.classList.toggle('active', b === btn));
            renderTopCountries();
        });
    });

    // Back button
    $on('back-btn', 'click', () => {
        document.getElementById('view-country').classList.add('hidden');
        document.getElementById('view-global').classList.remove('hidden');
        S.mainISO = null; S.cmpISO = null;
        const sel = document.getElementById('compare-select');
        if (sel) sel.value = '';
    });

    // Country year slider
    $on('c-year-slider', 'input', () => {
        const v = document.getElementById('c-year-slider').value;
        S.year = +v;
        const lbl = document.getElementById('c-year-display');
        if (lbl) lbl.textContent = S.year;
        if (S.mainISO) renderDonut(S.mainISO, S.year);
    });

    // Country area mode
    $on('country-mode-btns', 'click', e => {
        const btn = e.target.closest('.tog');
        if (!btn) return;
        S.countryMode = btn.dataset.mode;
        document.querySelectorAll('#country-mode-btns .tog').forEach(b => b.classList.toggle('active', b === btn));
        if (S.mainISO) renderCountryArea(S.mainISO);
    });

    // Comparison metric tabs
    $on('.compare-card .tab-row', 'click', e => {
        const btn = e.target.closest('.tab');
        if (!btn) return;
        S.cmpMetric = btn.dataset.cmp;
        document.querySelectorAll('.compare-card .tab').forEach(b => b.classList.toggle('active', b === btn));
        renderCompareChart();
    });

    // Energy source filter pills
    $on('energy-filter', 'click', e => {
        const btn = e.target.closest('.src-pill');
        if (!btn) return;
        S.energySource = btn.dataset.source;
        // Update active pill styles (inline color per source)
        document.querySelectorAll('.src-pill').forEach(b => {
            const active = b === btn;
            const c = FILTER_SOURCES[b.dataset.source].color;
            b.classList.toggle('active', active);
            b.style.borderColor = active ? c : '';
            b.style.color = active ? c : '';
            b.style.background = active ? `${c}22` : '';
        });
        updateMapColors();
    });

    // Metric filter (% energy / % electricity / per capita)
    $on('metric-filter', 'click', e => {
        const btn = e.target.closest('.metric-btn');
        if (!btn) return;
        S.energyMetric = btn.dataset.metric;
        document.querySelectorAll('.metric-btn').forEach(b => b.classList.toggle('active', b === btn));
        updateMapColors();
    });

    // Compare country select
    $on('compare-select', 'change', e => {
        S.cmpISO = e.target.value || null;
        const clr = document.getElementById('cmp-clear');
        if (clr) clr.classList.toggle('hidden', !S.cmpISO);
        if (S.mainISO) { renderKPIs(S.mainISO); renderRenewGrowth(S.mainISO); renderCompareChart(); }
    });

    $on('cmp-clear', 'click', () => {
        S.cmpISO = null;
        const sel = document.getElementById('compare-select');
        if (sel) sel.value = '';
        const clr = document.getElementById('cmp-clear');
        if (clr) clr.classList.add('hidden');
        if (S.mainISO) { renderKPIs(S.mainISO); renderRenewGrowth(S.mainISO); renderCompareChart(); }
    });
}

// Helper at module scope
function $on(sel, event, handler) {
    const el = document.getElementById(sel) || document.querySelector(sel);
    if (el) el.addEventListener(event, handler);
}

/* ── 17. INIT ─────────────────────────────────────────────── */
async function init() {
    try {
        await loadAll();
        document.getElementById('loading-screen').classList.add('done');
        document.getElementById('view-global').classList.remove('hidden');

        renderMap();
        renderTrendChart();
        renderTopCountries();
        renderAreaChart();
        bindEvents();

        // Sync slider UI to initial year (1990) and auto-start playback
        updateSliderUI(S.year);
        updateMapTitle();
        updateLegend();
        // Set initial active pill color for renewables
        const initPill = document.querySelector('.src-pill[data-source="renewables"]');
        if (initPill) {
            const c = FILTER_SOURCES.renewables.color;
            initPill.style.borderColor = c;
            initPill.style.color = c;
            initPill.style.background = `${c}22`;
        }
        startPlay();

        // Re-render on resize
        window.addEventListener('resize', () => {
            renderMap();
            renderTrendChart();
            renderAreaChart();
            if (S.mainISO) { renderRenewGrowth(S.mainISO); renderCountryArea(S.mainISO); renderCompareChart(); }
        });
    } catch (err) {
        console.error('Init error:', err);
        document.querySelector('.loader-inner').innerHTML = `
      <h2 style="color:#ff6060">⚠️ Failed to Load</h2>
      <p>${err.message}</p>
      <p style="margin-top:.5rem">Make sure you're running a local HTTP server<br>(VS Code Live Server, or <code>python -m http.server</code>)</p>
    `;
    }
}

init();
