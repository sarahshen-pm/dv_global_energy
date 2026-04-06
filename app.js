/* ================================================================
   GLOBAL ENERGY DASHBOARD — app.js
   SD6105 Data Visualization
================================================================ */

/* ── 1. CONSTANTS ─────────────────────────────────────────── */
const CSV_PATH = 'owid-energy-data.csv';
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';  // 50m includes small nations like Singapore
const YEAR_MIN = 1965, YEAR_MAX = 2024;

/* ── ENERGY FILTER CONFIG ───────────────────────────────── */
const FILTER_SOURCES = {
    all: { label: '🌍 All Sources', color: '#6c7fff', dir: '+' },
    renewables: { label: '🌱 Renewable', color: '#43e97b', dir: '+' },
    fossil: { label: '🏭 Fossil fuel', color: '#c4611a', dir: '-' },
    coal: { label: '⚫ Coal', color: '#837060', dir: '-' },
    oil: { label: '🛢️ Oil', color: '#d4721a', dir: '-' },
    gas: { label: '🔥 Natural gas', color: '#e2b840', dir: '-' },
    nuclear: { label: '☢️ Nuclear', color: '#7b61ff', dir: '~' },
    hydro: { label: '💧 Hydro', color: '#38b6d8', dir: '+' },
    solar: { label: '☀️ Solar', color: '#f9a826', dir: '+' },
    wind: { label: '💨 Wind', color: '#56de90', dir: '+' },
    biofuel: { label: '🌿 Biofuel', color: '#8fbe7a', dir: '+' },
    other_renew: { label: '✨ Other renewable', color: '#56c490', dir: '+' },
};

// Map energySource + energyMetric → CSV column name
// Returns a column string, 'FOSSIL_PROD' sentinel, or null (no data).
function getField() {
    const m = S.energyMetric;
    const src = S.energySource;

    if (src === 'all') {
        if (m === 'consumption') return 'primary_energy_consumption';
        if (m === 'generation')  return 'electricity_generation';
        return null;
    }

    const CONS = {
        fossil: 'fossil_fuel_consumption', coal: 'coal_consumption',
        oil: 'oil_consumption', gas: 'gas_consumption',
        renewables: 'renewables_consumption', hydro: 'hydro_consumption',
        solar: 'solar_consumption', wind: 'wind_consumption',
        biofuel: 'biofuel_consumption', other_renew: 'other_renewable_consumption',
        nuclear: 'nuclear_consumption',
    };
    const CONS_SHARE = {
        fossil: 'fossil_share_energy', coal: 'coal_share_energy',
        oil: 'oil_share_energy', gas: 'gas_share_energy',
        renewables: 'renewables_share_energy', hydro: 'hydro_share_energy',
        solar: 'solar_share_energy', wind: 'wind_share_energy',
        biofuel: 'biofuel_share_energy', other_renew: 'other_renewables_share_energy',
        nuclear: 'nuclear_share_energy',
    };
    const ELEC = {
        fossil: 'fossil_electricity', coal: 'coal_electricity',
        oil: 'oil_electricity', gas: 'gas_electricity',
        renewables: 'renewables_electricity', hydro: 'hydro_electricity',
        solar: 'solar_electricity', wind: 'wind_electricity',
        biofuel: 'biofuel_electricity', other_renew: 'other_renewable_electricity',
        nuclear: 'nuclear_electricity',
    };
    const ELEC_SHARE = {
        fossil: 'fossil_share_elec', coal: 'coal_share_elec',
        oil: 'oil_share_elec', gas: 'gas_share_elec',
        renewables: 'renewables_share_elec', hydro: 'hydro_share_elec',
        solar: 'solar_share_elec', wind: 'wind_share_elec',
        biofuel: 'biofuel_share_elec', other_renew: 'other_renew_share_elec',
        nuclear: 'nuclear_share_elec',
    };

    if (m === 'consumption')       return CONS[src]       || null;
    if (m === 'consumption_share') return CONS_SHARE[src] || null;
    if (m === 'generation')        return ELEC[src]       || null;
    if (m === 'generation_share')  return ELEC_SHARE[src] || null;
    if (m === 'production') {
        if (src === 'fossil') return 'FOSSIL_PROD'; // sentinel: sum of coal+oil+gas
        if (['coal', 'oil', 'gas'].includes(src)) return `${src}_production`;
        return null;
    }
    return null;
}

// Resolve a row value for the current field, handling FOSSIL_PROD sentinel
function getRowValue(row) {
    if (!row) return NaN;
    const f = getField();
    if (!f) return NaN;
    if (f === 'FOSSIL_PROD') {
        const v = (+row.coal_production || 0) + (+row.oil_production || 0) + (+row.gas_production || 0);
        return v || NaN;
    }
    return +row[f];
}

function fmtMetricVal(v) {
    if (v == null || isNaN(v) || v < 0) return 'N/A';
    if (S.energyMetric && S.energyMetric.includes('share')) return `${d3.format('.1f')(v)}%`;
    return `${d3.format('.2f')(v)} TWh`;
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
    { key: 'primary_energy_consumption', label: 'Global Consumption', color: '#eef0ff', width: 2.5 },
    { key: 'fossil_fuel_consumption', label: 'Fossil Consumption', color: '#c4611a', width: 2 },
    { key: 'fossil_production', label: 'Fossil Production', color: '#837060', width: 2, dasharray: '4,4' },
    { key: 'fossil_electricity', label: 'Fossil Generation', color: '#d4a827', width: 2 },
    { key: 'renewables_electricity', label: 'Renewable Generation', color: '#43e97b', width: 2 },
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
    energyMetric: 'consumption_share',
};

/* ── AUTO-PLAY ─────────────────────────────────────────────── */
let playTimer = null;
const PLAY_SPEED = 325; // ms per year

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
        renderSunburst();
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
    NGA: '🇳🇬', EGY: '🇪🇬', KEN: '🇰🇪', ARE: '🇦🇪',
};

/**
 * Flag emojis (regional indicator pairs) are not supported on Windows
 * at the OS level. Detect Windows and hide flags there.
 */
const FLAG_SUPPORTED = !/Windows/i.test(navigator.userAgent);

if (!FLAG_SUPPORTED) {
    document.documentElement.classList.add('no-flags');
}

function getFlag(iso) {
    if (!FLAG_SUPPORTED) return '';
    return FLAG_OVERRIDE[iso] || '';
}

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
    const isFossilProd = field === 'FOSSIL_PROD';

    // Absolute tracking of max value from ALL countries across ALL years
    let rawMax = 0;
    for (const iso in DB.byISO) {
        DB.byISO[iso].forEach(r => {
            let v;
            if (isFossilProd) {
                v = (+r.coal_production || 0) + (+r.oil_production || 0) + (+r.gas_production || 0);
            } else {
                v = +r[field];
            }
            if (!isNaN(v) && v > rawMax) rawMax = v;
        });
    }

    // Step-wise ceil scaling (e.g., 160566.703 -> 160570)
    let domMax = 100;
    if (rawMax > 0) {
        const step = rawMax > 100 ? 10 : (rawMax > 10 ? 1 : 0.1);
        domMax = Math.ceil(rawMax / step) * step;
    }

    // Strict linear mapping from a dark neutral base to the vibrant source color.
    let interp = d => d3.interpolateLab('#1c2038', src.color)(d);

    if (S.energyMetric && S.energyMetric.includes('share')) {
        // Expand yellow/green heavily by compressing red/orange into the 0-15% bracket
        const customDiverging = d3.scaleLinear()
            .domain([0, 0.05, 0.15, 0.40, 1])
            .range(['#d73027', '#fc8d59', '#fee08b', '#d9ef8b', '#1a9850'])
            .interpolate(d3.interpolateLab);

        if (S.energySource === 'renewables' || S.energySource === 'renewable') {
            interp = d => customDiverging(d);
        } else if (S.energySource === 'fossil') {
            interp = d => customDiverging(1 - d);
        }
    }

    return d3.scaleSequential([0, domMax || 1], interp).clamp(true);
}

function updateMapTitle() {
    const src = FILTER_SOURCES[S.energySource];
    const mLabel = { 
        consumption: 'Consumption', 
        production: 'Production', 
        generation: 'Generation',
        consumption_share: 'Consumption %',
        generation_share: 'Generation %'
    }[S.energyMetric] || 'Consumption';
    const full = `${src.label} · ${mLabel}`;
    const el = document.getElementById('map-title'); if (el) el.textContent = full;
    const pill = document.getElementById('nav-metric-pill'); if (pill) pill.textContent = full;
    const note = document.getElementById('legend-note'); if (note) note.textContent = `${src.label}`;
}

function updateLegend() {
    const cs = makeColorScale();
    const max = cs.domain()[1];
    const isShare = S.energyMetric && S.energyMetric.includes('share');
    const fmt = isShare ? `${max.toLocaleString()}%` : `${max.toLocaleString()} TWh`;
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
    const H = container.clientHeight || 450;

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
            const v = row ? getRowValue(row) : NaN;
            return (!isNaN(v) && v >= 0) ? colorScale(v) : null;
        })
        .classed('no-data', d => {
            const iso = ISO_NUM[+d.id];
            const row = iso ? getCountryRow(iso, S.year) : null;
            const v = row ? getRowValue(row) : NaN;
            return isNaN(v) || v < 0;
        })
        .on('mousemove', (event, d) => {
            const iso = ISO_NUM[+d.id];
            const row = iso ? getCountryRow(iso, S.year) : null;
            if (!iso) return;
            const name = row?.country || iso;
            const src = FILTER_SOURCES[S.energySource];
            const v = row ? getRowValue(row) : NaN;
            
            const isElec = S.energyMetric && S.energyMetric.includes('generation');
            const re = isElec ? row?.renewables_share_elec : row?.renewables_share_energy;
            const ff = isElec ? row?.fossil_share_elec : row?.fossil_share_energy;
            
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
            console.log("Clicked:", d.id, "→ ISO:", iso);
            if (!iso) {
                console.warn("No ISO mapping for id:", d.id);
                return;
            }
            if (!DB.byISO[iso]) {
                console.warn("No data in DB.byISO for iso:", iso);
                return;
            }
            console.log("Entering showCountryView for", iso);
            showCountryView(iso);
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
    d3.select('#world-map').select('.countries-g').selectAll('.country-path')
        .transition().duration(350)
        .attr('fill', d => {
            const iso = ISO_NUM[+d.id];
            const row = iso ? getCountryRow(iso, S.year) : null;
            const v = row ? getRowValue(row) : NaN;
            return (!isNaN(v) && v >= 0) ? colorScale(v) : null;
        })
        .each(function (d) {
            const iso = ISO_NUM[+d.id];
            const row = iso ? getCountryRow(iso, S.year) : null;
            const v = row ? getRowValue(row) : NaN;
            d3.select(this).classed('no-data', isNaN(v) || v < 0);
        });
    updateMapTitle();
    updateLegend();
    renderTopCountries();
}

/* ── 7. GLOBAL TREND LINE CHART ───────────────────────────── */
/* ── 7. ZOOMABLE SUNBURST ─────────────────────────────────── */
function buildSunburstData(year) {
    const row = getWorldRow(year);
    if (!row) return null;

    const isProd = S.energyMetric === 'production';
    const isGen  = S.energyMetric && S.energyMetric.includes('generation');

    function v(key) {
        const val = +row[key];
        return isNaN(val) || val < 0 ? 0 : val;
    }

    if (isProd) {
        // Production mode: only Fossil ring with Coal/Oil/Gas children
        return {
            name: 'World',
            children: [
                {
                    name: 'Fossil',
                    color: '#c4611a',
                    children: [
                        { name: 'Coal', color: '#837060', value: v('coal_production') },
                        { name: 'Oil',  color: '#d4721a', value: v('oil_production') },
                        { name: 'Gas',  color: '#e2b840', value: v('gas_production') },
                    ].filter(d => d.value > 0)
                },
            ].filter(d => d.children && d.children.length > 0)
        };
    }

    const suffix = isGen ? '_electricity' : '_consumption';

    return {
        name: 'World',
        children: [
            {
                name: 'Renewable',
                color: '#43e97b',
                children: [
                    { name: 'Hydro',    color: '#38b6d8', value: v('hydro'            + suffix) },
                    { name: 'Solar',    color: '#f9a826', value: v('solar'            + suffix) },
                    { name: 'Wind',     color: '#56de90', value: v('wind'             + suffix) },
                    { name: 'Biofuel',  color: '#8fbe7a', value: v('biofuel'          + suffix) },
                    { name: 'Other RE', color: '#56c490', value: v('other_renewable'  + suffix) },
                ].filter(d => d.value > 0)
            },
            {
                name: 'Fossil',
                color: '#c4611a',
                children: [
                    { name: 'Coal', color: '#837060', value: v('coal' + suffix) },
                    { name: 'Oil',  color: '#d4721a', value: v('oil'  + suffix) },
                    { name: 'Gas',  color: '#e2b840', value: v('gas'  + suffix) },
                ].filter(d => d.value > 0)
            },
            {
                name: 'Nuclear',
                color: '#7b61ff',
                children: [
                    { name: 'Nuclear', color: '#9d8aff', value: v('nuclear' + suffix) },
                ].filter(d => d.value > 0)
            },
        ].filter(d => d.children && d.children.length > 0 && d.children.reduce((s,c) => s + c.value, 0) > 0)
    };
}

function renderSunburst() {
    const container = document.getElementById('sunburst-container');
    if (!container) return;
    const W = container.clientWidth || 260;
    const H = container.clientHeight || 260;
    // Use 72% of the available space so the ring looks compact
    const size = Math.min(W, H) * 0.72;
    const radius = size / 6;

    const data = buildSunburstData(S.year);
    if (!data) return;

    const yearLabel = document.getElementById('sunburst-year-label');
    if (yearLabel) yearLabel.textContent = S.year;

    const svg = d3.select('#sunburst-svg')
        .attr('viewBox', [-size / 2, -size / 2, size, size])
        .style('font', '8px var(--font)');

    svg.selectAll('*').remove();

    const hierarchy = d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);

    const root = d3.partition()
        .size([2 * Math.PI, hierarchy.height + 1])(hierarchy);

    root.each(d => d.current = d);

    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.004))
        .padRadius(radius * 1.5)
        .innerRadius(d => d.y0 * radius)
        .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

    // Color: use node's own color if defined, else parent's
    function getColor(d) {
        if (d.data.color) return d.data.color;
        if (d.parent && d.parent.data.color) return d.parent.data.color;
        return '#6c7fff';
    }

    const tip = document.getElementById('sb-tooltip');

    const path = svg.append('g')
        .selectAll('path')
        .data(root.descendants().slice(1))
        .join('path')
        .attr('fill', d => getColor(d))
        .attr('fill-opacity', d => arcVisible(d.current) ? (d.children ? 0.75 : 0.55) : 0)
        .attr('pointer-events', d => arcVisible(d.current) ? 'auto' : 'none')
        .attr('d', d => arc(d.current))
        .style('cursor', d => d.children ? 'pointer' : 'default');

    path.filter(d => d.children).on('click', clicked);

    // Floating tooltip on hover
    path.on('mousemove', (event, d) => {
        const total = root.value || 1;
        const pct = ((d.value / total) * 100).toFixed(1);
        const fmt = d3.format(',.0f');
        const isGen = S.energyMetric && S.energyMetric.includes('generation');
        const unit = isGen ? 'TWh elec' : 'TWh';
        // Build ancestry path label
        const ancestors = d.ancestors().reverse().slice(1).map(a => a.data.name).join(' › ');
        const color = getColor(d);
        showTip(tip, `
            <div class="tt-title">${ancestors}</div>
            <div class="tt-row">
                <span class="tt-dot" style="background:${color}"></span>
                Share <span class="tt-val">${pct}%</span>
            </div>
            <div class="tt-row" style="color:var(--text-md);font-size:0.7rem;">${fmt(d.value)} ${unit}</div>
        `, event);
    }).on('mouseleave', () => hideTip(tip));

    // Labels — smaller font
    const label = svg.append('g')
        .attr('pointer-events', 'none')
        .attr('text-anchor', 'middle')
        .style('user-select', 'none')
        .selectAll('text')
        .data(root.descendants().slice(1))
        .join('text')
        .attr('dy', '0.35em')
        .attr('fill', '#fff')
        .attr('fill-opacity', d => +labelVisible(d.current))
        .attr('transform', d => labelTransform(d.current))
        .style('font-size', d => d.depth === 1 ? '7px' : '6px')
        .style('font-weight', d => d.depth === 1 ? '600' : '400')
        .text(d => d.data.name);

    // Center back-click circle
    const parent = svg.append('circle')
        .datum(root)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .style('cursor', 'pointer')
        .on('click', clicked);

    function clicked(event, p) {
        parent.datum(p.parent || root);

        root.each(d => d.target = {
            x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            y0: Math.max(0, d.y0 - p.depth),
            y1: Math.max(0, d.y1 - p.depth),
        });

        const t = svg.transition().duration(750);

        path.transition(t)
            .tween('data', d => {
                const i = d3.interpolate(d.current, d.target);
                return t => d.current = i(t);
            })
            .filter(function(d) {
                return +this.getAttribute('fill-opacity') || arcVisible(d.target);
            })
            .attr('fill-opacity', d => arcVisible(d.target) ? (d.children ? 0.75 : 0.55) : 0)
            .attr('pointer-events', d => arcVisible(d.target) ? 'auto' : 'none')
            .attrTween('d', d => () => arc(d.current));

        label.filter(function(d) {
            return +this.getAttribute('fill-opacity') || labelVisible(d.target);
        }).transition(t)
            .attr('fill-opacity', d => +labelVisible(d.target))
            .attrTween('transform', d => () => labelTransform(d.current));
    }

    function arcVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }
    function labelVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.05;
    }
    function labelTransform(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2 * radius;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }
}


/* ── 8. TOP COUNTRIES ─────────────────────────────────────── */
function renderTopCountries() {
    const listEl = document.getElementById('top-list');
    const field = getField();
    const color = FILTER_SOURCES[S.energySource]?.color || '#6c7fff';
    const isFossilProd = field === 'FOSSIL_PROD';
    const isShare = S.energyMetric === 'consumption_share' || S.energyMetric === 'generation_share';

    if (!field) { listEl.innerHTML = ''; return; }

    const data = DB.countryMeta
        .map(d => {
            const r = getCountryRow(d.iso, S.year);
            if (!r) return null;
            let val;
            if (isFossilProd) {
                val = (+r.coal_production || 0) + (+r.oil_production || 0) + (+r.gas_production || 0);
                if (!val) val = NaN;
            } else {
                val = +r[field];
            }
            return { ...d, val };
        })
        .filter(d => Boolean(d) && !isNaN(d.val) && d.val > 0)
        .sort((a, b) => b.val - a.val)
        .slice(0, 10);

    const maxVal = d3.max(data, d => d.val) || 1;
    const fmt = isShare ? v => `${d3.format('.1f')(v)}%` : v => `${d3.format('.2s')(v)} TWh`;

    listEl.innerHTML = data.map((d, i) => `
    <div class="top-item">
      <span class="top-rank">${i + 1}</span>
      <span class="top-flag">${getFlag(d.iso)}</span>
      <span class="top-name">${d.name}</span>
      <div class="top-bar-wrap">
        <div class="top-bar" style="width:${(d.val / maxVal * 100).toFixed(1)}%;background:${color}"></div>
      </div>
      <span class="top-val" style="color:${color}">${fmt(d.val)}</span>
    </div>`).join('');
}



/* ── 8. COUNTRY VIEW (6 PANELS) ───────────────────────── */
function showCountryView(iso) {
    if (!iso || !DB.byISO[iso]) return;
    
    // Switch Views
    S.mainISO = iso;
    document.getElementById('view-global').classList.add('hidden');
    const view = document.getElementById('view-country');
    view.classList.remove('hidden');
    
    // Close comparison mode
    S.cmpISO = null; 
    const row = getCountryRow(iso, S.year) || DB.countryMeta.find(m => m.iso===iso)?.latest;
    const name = row?.country || iso;
    
    const flagEl = document.getElementById('c-flag'); if (flagEl) flagEl.textContent = getFlag(iso);
    const nameEl = document.getElementById('c-name'); if (nameEl) nameEl.textContent = name;
    
    setupPanelWatchers(iso);
    
    // Render all 6 panels
    renderPanelMix(iso);
    renderPanelElec(iso);
    renderPanelFossil(iso);
    renderPanelEcon(iso);
    renderPanelCO2(iso);
    renderPanelImport(iso);
}


// Global watchers state for panels
const P_STATE = {
    p3Mode: 'abs'
};

function setupPanelWatchers(iso) {
    d3.selectAll('.custom-legend .leg-item').on('click', function() {
        const el = d3.select(this);
        el.classed('active', !el.classed('active'));
        const parentId = this.parentNode.id;
        if(parentId === 'p1-filter') renderPanelMix(iso);
        else if(parentId === 'p2-filter') renderPanelElec(iso);
        else if(parentId === 'p3-filter') renderPanelFossil(iso);
        else if(parentId === 'p4-filter') renderPanelEcon(iso);
    });

    d3.select('#p2-share-cb').on('change', () => renderPanelElec(iso));
    
    d3.select('#p3-mode-abs').on('click', function() {
        P_STATE.p3Mode = 'abs';
        d3.selectAll('#p3-fossil .tog').classed('active', false);
        d3.select(this).classed('active', true);
        renderPanelFossil(iso);
    });
    d3.select('#p3-mode-yoy').on('click', function() {
        P_STATE.p3Mode = 'yoy';
        d3.selectAll('#p3-fossil .tog').classed('active', false);
        d3.select(this).classed('active', true);
        renderPanelFossil(iso);
    });
}

// Layout helper
function getDims(id) {
    const el = document.getElementById(id);
    const W = el.parentElement.clientWidth || 300;
    let H = el.clientHeight;
    if (!H || H < 50) {
        H = el.parentElement.clientHeight ? el.parentElement.clientHeight - 80 : 240;
    }
    return { W, H, margin: { top: 20, right: 60, bottom: 30, left: 60 } };
}

/* ── PANEL 1: ENERGY MIX (CONSUMPTION) ────────────────────── */
function renderPanelMix(iso) {
    const data = DB.byISO[iso];
    const {W, H, margin} = getDims('p1-svg');
    const svg = d3.select('#p1-svg').attr('width', W).attr('height', H);
    svg.selectAll('*').remove();
    
    const cw = W - margin.left - margin.right;
    const ch = H - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    
    const keys = [];
    document.querySelectorAll('#p1-filter .leg-item.active').forEach(e => {
        keys.push(e.dataset.val + '_consumption');
    });
    if (!keys.length) return;
    
    const stack = d3.stack().keys(keys).value((d, key) => isNaN(+d[key]) ? 0 : +d[key])(data);
    const x = d3.scaleLinear().domain([YEAR_MIN, YEAR_MAX]).range([0, cw]);
    const maxVal = d3.max(stack, layer => d3.max(layer, d => d[1])) || 1;
    const y = d3.scaleLinear().domain([0, maxVal]).range([ch, 0]).nice();
    
    g.append('g').attr('transform', `translate(0,${ch})`).call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(5));
    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d => d3.format('.2s')(d)));
    
    const colorMap = {
        'coal_consumption': '#837060', 'oil_consumption': '#d4721a', 'gas_consumption': '#e2b840',
        'nuclear_consumption': '#7b61ff',
        'hydro_consumption': '#38b6d8', 'solar_consumption': '#f9a826', 'wind_consumption': '#56de90',
        'biofuel_consumption': '#8fbe7a', 'other_renewable_consumption': '#56c490'
    };
    const KEY_LABEL_P1 = {
        'coal_consumption':'Coal','oil_consumption':'Oil','gas_consumption':'Gas',
        'nuclear_consumption':'Nuclear','hydro_consumption':'Hydro','solar_consumption':'Solar',
        'wind_consumption':'Wind','biofuel_consumption':'Biofuel','other_renewable_consumption':'Other RE'
    };

    const area = d3.area().x(d => x(d.data.year)).y0(d => y(d[0])).y1(d => y(d[1]));

    stack.forEach(layer => {
        g.append('path').attr('class', 'layer').datum(layer).attr('d', area)
            .style('fill', colorMap[layer.key] || '#999').style('opacity', 0.85);
    });

    const vLine = g.append('line').attr('y1', 0).attr('y2', ch)
        .attr('stroke', 'rgba(255,255,255,0.4)').attr('stroke-width', 1)
        .style('display', 'none').style('pointer-events', 'none');
    const tip = document.getElementById('p1-tt');

    g.append('rect').attr('width', cw).attr('height', ch)
        .style('fill', 'none').style('pointer-events', 'all')
        .on('mousemove', function(event) {
            const [mx] = d3.pointer(event, this);
            const yr = Math.round(x.invert(mx));
            const row = data.find(d => d.year === yr);
            if (!row) return;
            vLine.style('display', null).attr('x1', x(yr)).attr('x2', x(yr));
            const lines = keys.map(k => {
                const v = isNaN(+row[k]) ? 0 : +row[k];
                return `<div class="tt-row"><span class="tt-dot" style="background:${colorMap[k]||'#999'}"></span>${KEY_LABEL_P1[k]||k} <span class="tt-val">${d3.format(',.1f')(v)} TWh</span></div>`;
            }).join('');
            showTip(tip, `<div class="tt-title">${yr}</div>${lines}`, event);
        })
        .on('mouseleave', () => { hideTip(tip); vLine.style('display', 'none'); });
}

/* ── PANEL 2: ELECTRICITY GENERATION ──────────────────────── */
function renderPanelElec(iso) {
    const data = DB.byISO[iso];
    const {W, H, margin} = getDims('p2-svg');
    const svg = d3.select('#p2-svg').attr('width', W).attr('height', H);
    svg.selectAll('*').remove();
    
    const cw = W - margin.left - margin.right;
    const ch = H - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    
    const keys = [];
    document.querySelectorAll('#p2-filter .leg-item.active').forEach(e => {
        keys.push(e.dataset.val + '_electricity');
    });
    const showShare = document.getElementById('p2-share-cb').checked;
    
    if(!keys.length) return;
    
    const stack = d3.stack().keys(keys).value((d, key) => isNaN(+d[key]) ? 0 : +d[key])(data);
    
    const x = d3.scaleBand().domain(data.map(d=>d.year)).range([0, cw]).padding(0.1);
    const maxVal = d3.max(stack, layer => d3.max(layer, d => d[1])) || 1;
    const y = d3.scaleLinear().domain([0, maxVal]).range([ch, 0]).nice();
    
    g.append('g').attr('transform', `translate(0,${ch})`)
     .call(d3.axisBottom(x).tickValues(x.domain().filter(d => d%5===0)));
    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d => d3.format('.2s')(d)));
    
    const colorMap = {
        'coal_electricity': '#837060', 'oil_electricity': '#d4721a', 'gas_electricity': '#e2b840',
        'nuclear_electricity': '#7b61ff',
        'hydro_electricity': '#38b6d8', 'solar_electricity': '#f9a826', 'wind_electricity': '#56de90',
        'biofuel_electricity': '#8fbe7a', 'other_renewable_electricity': '#56c490'
    };
    // Explicit share column map — other_renewable_electricity → other_renewables_share_elec (note the 's')
    const SHARE_ELEC_MAP = {
        'coal_electricity': 'coal_share_elec', 'oil_electricity': 'oil_share_elec',
        'gas_electricity': 'gas_share_elec', 'nuclear_electricity': 'nuclear_share_elec',
        'hydro_electricity': 'hydro_share_elec', 'solar_electricity': 'solar_share_elec',
        'wind_electricity': 'wind_share_elec', 'biofuel_electricity': 'biofuel_share_elec',
        'other_renewable_electricity': 'other_renewables_share_elec'
    };
    const KEY_LABEL_P2 = {
        'coal_electricity':'Coal','oil_electricity':'Oil','gas_electricity':'Gas',
        'nuclear_electricity':'Nuclear','hydro_electricity':'Hydro','solar_electricity':'Solar',
        'wind_electricity':'Wind','biofuel_electricity':'Biofuel','other_renewable_electricity':'Other RE'
    };
    const tip = document.getElementById('p2-tt');

    stack.forEach(layer => {
        g.append('g').attr('fill', colorMap[layer.key] || '#999')
            .selectAll('rect').data(layer).enter().append('rect')
            .attr('x', d => x(d.data.year))
            .attr('y', d => y(d[1]))
            .attr('height', d => Math.max(0, y(d[0]) - y(d[1])))
            .attr('width', x.bandwidth())
            .on('mousemove', function(event, d) {
                const v = d[1] - d[0];
                const shareKey = SHARE_ELEC_MAP[layer.key];
                const shareVal = showShare && shareKey ? +d.data[shareKey] : NaN;
                const shareLine = !isNaN(shareVal) ? `<div class="tt-row" style="color:var(--text-md);font-size:0.7rem">Share: ${d3.format('.1f')(shareVal)}%</div>` : '';
                showTip(tip, `<div class="tt-title">${d.data.year}</div><div class="tt-row"><span class="tt-dot" style="background:${colorMap[layer.key]||'#999'}"></span>${KEY_LABEL_P2[layer.key]||layer.key} <span class="tt-val">${d3.format(',.1f')(v)} TWh</span></div>${shareLine}`, event);
            })
            .on('mouseleave', () => hideTip(tip));
    });

    if (showShare) {
        const yRight = d3.scaleLinear().domain([0, 100]).range([ch, 0]);
        g.append('g').attr('transform', `translate(${cw},0)`).call(d3.axisRight(yRight).ticks(5).tickFormat(d => d + '%'));
        keys.forEach(k => {
            const shareKey = SHARE_ELEC_MAP[k];
            if (!shareKey) return;
            const line = d3.line()
                .defined(d => !isNaN(+d[shareKey]))
                .x(d => x(d.year) + x.bandwidth() / 2)
                .y(d => yRight(+d[shareKey]));
            g.append('path').datum(data)
                .attr('fill', 'none').attr('stroke', colorMap[k] || '#fff')
                .attr('stroke-width', 2).style('pointer-events', 'none').attr('d', line);
        });
    }
}

/* ── PANEL 3: FOSSIL PRODUCTION ──────────────────────────── */
function renderPanelFossil(iso) {
    const data = DB.byISO[iso];
    const {W, H, margin} = getDims('p3-svg');
    const svg = d3.select('#p3-svg').attr('width', W).attr('height', H);
    svg.selectAll('*').remove();
    
    const cw = W - margin.left - margin.right;
    const ch = H - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    
    const keys = [];
    document.querySelectorAll('#p3-filter .leg-item.active').forEach(e => {
        keys.push(e.dataset.val + '_production');
    });
    if(!keys.length) return;
    
    const x = d3.scaleLinear().domain([YEAR_MIN, YEAR_MAX]).range([0, cw]);
    g.append('g').attr('transform', `translate(0,${ch})`).call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(5));
    
    const colorMap = { 'coal_production': '#837060', 'oil_production': '#d4721a', 'gas_production': '#e2b840' };
    const KEY_LABEL_P3 = { 'coal_production':'Coal','oil_production':'Oil','gas_production':'Gas' };
    const tip = document.getElementById('p3-tt');

    if (P_STATE.p3Mode === 'abs') {
        const maxVal = d3.max(data, d => d3.max(keys, k => +d[k]||0)) || 1;
        const y = d3.scaleLinear().domain([0, maxVal]).range([ch, 0]).nice();
        g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.2s')));
        keys.forEach(k => {
            const lineGen = d3.line().defined(d => !isNaN(+d[k])).x(d => x(d.year)).y(d => y(+d[k]));
            g.append('path').datum(data).attr('fill', 'none').attr('stroke', colorMap[k]).attr('stroke-width', 2).style('pointer-events','none').attr('d', lineGen);
        });
        const vLine = g.append('line').attr('y1',0).attr('y2',ch)
            .attr('stroke','rgba(255,255,255,0.4)').attr('stroke-width',1).style('display','none').style('pointer-events','none');
        g.append('rect').attr('width',cw).attr('height',ch).style('fill','none').style('pointer-events','all')
            .on('mousemove', function(event) {
                const [mx] = d3.pointer(event, this);
                const yr = Math.round(x.invert(mx));
                const row = data.find(d => d.year === yr);
                if (!row) return;
                vLine.style('display',null).attr('x1',x(yr)).attr('x2',x(yr));
                const lines = keys.map(k => {
                    const v = isNaN(+row[k]) ? 0 : +row[k];
                    return `<div class="tt-row"><span class="tt-dot" style="background:${colorMap[k]}"></span>${KEY_LABEL_P3[k]} <span class="tt-val">${d3.format(',.1f')(v)} TWh</span></div>`;
                }).join('');
                showTip(tip, `<div class="tt-title">${yr}</div>${lines}`, event);
            })
            .on('mouseleave', () => { hideTip(tip); vLine.style('display','none'); });
    } else {
        const yoyData = [];
        for (let i = 1; i < data.length; i++) {
            let prev = d3.sum(keys, k => +data[i-1][k]||0);
            let curr = d3.sum(keys, k => +data[i][k]||0);
            let pct = prev > 0 ? ((curr - prev)/prev)*100 : 0;
            yoyData.push({year: data[i].year, val: pct});
        }
        const y = d3.scaleLinear().domain([-20, 20]).range([ch, 0]).clamp(true);
        g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d => d+'%'));
        g.append('line').attr('x1',0).attr('x2',cw).attr('y1',y(0)).attr('y2',y(0)).attr('stroke','#666');
        const xb = d3.scaleBand().domain(yoyData.map(d=>d.year)).range([0,cw]).padding(0.2);
        g.selectAll('rect').data(yoyData).enter().append('rect')
            .attr('x', d => xb(d.year)).attr('width', xb.bandwidth())
            .attr('y', d => d.val >= 0 ? y(d.val) : y(0))
            .attr('height', d => Math.abs(y(d.val) - y(0)))
            .attr('fill', d => d.val >= 0 ? '#d9ef8b' : '#fc8d59')
            .on('mousemove', function(event, d) {
                const c = d.val >= 0 ? '#d9ef8b' : '#fc8d59';
                showTip(tip, `<div class="tt-title">${d.year}</div><div class="tt-row">YoY Change <span class="tt-val" style="color:${c}">${d3.format('+.2f')(d.val)}%</span></div>`, event);
            })
            .on('mouseleave', () => hideTip(tip));
    }
}

/* ── PANEL 4: EFFICIENCY ──────────────────────────────────── */
function renderPanelEcon(iso) {
    const data = DB.byISO[iso];
    const {W, H, margin} = getDims('p4-svg');
    const svg = d3.select('#p4-svg').attr('width', W).attr('height', H);
    svg.selectAll('*').remove();
    
    const cw = W - margin.left - margin.right;
    const ch = H - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    
    const keys = [];
    document.querySelectorAll('#p4-filter .leg-item.active').forEach(e => {
        keys.push(e.dataset.val);
    });
    if(!keys.length) return;
    
    const x = d3.scaleLinear().domain([YEAR_MIN, YEAR_MAX]).range([0, cw]);
    g.append('g').attr('transform', `translate(0,${ch})`).call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(5));
    
    const colorMap = {
        'per_capita_electricity': '#38b6d8',
        'primary_energy_consumption_custom': '#fc8d59',
        'energy_per_gdp': '#d9ef8b'
    };
    const KEY_LABEL_P4 = {
        'per_capita_electricity': 'Cap. Elec (kWh/person)',
        'primary_energy_consumption_custom': 'Cap. Energy (kWh/billion person)',
        'energy_per_gdp': 'Energy/GDP (kWh/$)'
    };

    // Calculate custom column as requested
    data.forEach(d => {
        if (!isNaN(+d.primary_energy_consumption) && !isNaN(+d.population) && +d.population > 0) {
            d.primary_energy_consumption_custom = (+d.primary_energy_consumption) / (+d.population * 1e9);
        } else {
            d.primary_energy_consumption_custom = NaN;
        }
    });

    const capKeys = keys.filter(k => k === 'per_capita_electricity' || k === 'primary_energy_consumption_custom');
    const gdpKeys = keys.filter(k => k === 'energy_per_gdp');
    let yLscale, yRscale;

    if (capKeys.length) {
        const maxVal = d3.max(data, d => d3.max(capKeys, k => +d[k]||0)) || 1;
        yLscale = d3.scaleLinear().domain([0, maxVal]).range([ch, 0]).nice();
        g.append('g').call(d3.axisLeft(yLscale).ticks(5).tickFormat(d3.format('.2s')));
        capKeys.forEach(k => {
            const line = d3.line().defined(d => !isNaN(+d[k])).x(d => x(d.year)).y(d => yLscale(+d[k]));
            g.append('path').datum(data).attr('fill','none').attr('stroke',colorMap[k]).attr('stroke-width',2).style('pointer-events','none').attr('d',line);
        });
    }
    if (gdpKeys.length) {
        const maxVal = d3.max(data, d => d3.max(gdpKeys, k => +d[k]||0)) || 1;
        yRscale = d3.scaleLinear().domain([0, maxVal]).range([ch, 0]).nice();
        g.append('g').attr('transform',`translate(${cw},0)`).call(d3.axisRight(yRscale).ticks(5).tickFormat(d3.format('.2s')));
        gdpKeys.forEach(k => {
            const line = d3.line().defined(d => !isNaN(+d[k])).x(d => x(d.year)).y(d => yRscale(+d[k]));
            g.append('path').datum(data).attr('fill','none').attr('stroke',colorMap[k]).attr('stroke-width',2).attr('stroke-dasharray','4 2').style('pointer-events','none').attr('d',line);
        });
    }

    const tip = document.getElementById('p4-tt');
    const vLine = g.append('line').attr('y1',0).attr('y2',ch)
        .attr('stroke','rgba(255,255,255,0.4)').attr('stroke-width',1).style('display','none').style('pointer-events','none');
    g.append('rect').attr('width',cw).attr('height',ch).style('fill','none').style('pointer-events','all')
        .on('mousemove', function(event) {
            const [mx] = d3.pointer(event, this);
            const yr = Math.round(x.invert(mx));
            const row = data.find(d => d.year === yr);
            if (!row) return;
            vLine.style('display',null).attr('x1',x(yr)).attr('x2',x(yr));
            const lines = keys.map(k => {
                const v = +row[k];
                return `<div class="tt-row"><span class="tt-dot" style="background:${colorMap[k]||'#999'}"></span>${KEY_LABEL_P4[k]||k} <span class="tt-val">${isNaN(v)?'N/A':d3.format(',.1f')(v)}</span></div>`;
            }).join('');
            showTip(tip, `<div class="tt-title">${yr}</div>${lines}`, event);
        })
        .on('mouseleave', () => { hideTip(tip); vLine.style('display','none'); });
}

/* ── PANEL 5: EMISSIONS ───────────────────────────────────── */
function renderPanelCO2(iso) {
    const data = DB.byISO[iso];
    const {W, H, margin} = getDims('p5-svg');
    const svg = d3.select('#p5-svg').attr('width', W).attr('height', H);
    svg.selectAll('*').remove();
    
    const cw = W - margin.left - margin.right;
    const ch = H - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleLinear().domain([YEAR_MIN, YEAR_MAX]).range([0, cw]);
    g.append('g').attr('transform', `translate(0,${ch})`).call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(5));
    
    const maxCO2 = d3.max(data, d => +d.greenhouse_gas_emissions) || 1;
    const maxInt = d3.max(data, d => +d.carbon_intensity_elec) || 1;
    
    const yL = d3.scaleLinear().domain([0, maxCO2]).range([ch, 0]).nice();
    const yR = d3.scaleLinear().domain([0, maxInt]).range([ch, 0]).nice();
    
    g.append('g').call(d3.axisLeft(yL).ticks(5));
    g.append('g').attr('transform', `translate(${cw},0)`).call(d3.axisRight(yR).ticks(5));

    const l1 = d3.line().defined(d => !isNaN(+d.greenhouse_gas_emissions)).x(d => x(d.year)).y(d => yL(+d.greenhouse_gas_emissions));
    g.append('path').datum(data).attr('fill','none').attr('stroke','#fc8d59').attr('stroke-width',2).style('pointer-events','none').attr('d',l1);
    const l2 = d3.line().defined(d => !isNaN(+d.carbon_intensity_elec)).x(d => x(d.year)).y(d => yR(+d.carbon_intensity_elec));
    g.append('path').datum(data).attr('fill','none').attr('stroke','#a6d96a').attr('stroke-width',2).style('pointer-events','none').attr('d',l2);

    const tip = document.getElementById('p5-tt');
    const vLine = g.append('line').attr('y1',0).attr('y2',ch)
        .attr('stroke','rgba(255,255,255,0.4)').attr('stroke-width',1).style('display','none').style('pointer-events','none');
    g.append('rect').attr('width',cw).attr('height',ch).style('fill','none').style('pointer-events','all')
        .on('mousemove', function(event) {
            const [mx] = d3.pointer(event, this);
            const yr = Math.round(x.invert(mx));
            const row = data.find(d => d.year === yr);
            if (!row) return;
            vLine.style('display',null).attr('x1',x(yr)).attr('x2',x(yr));
            const ghg = +row.greenhouse_gas_emissions;
            const ci = +row.carbon_intensity_elec;
            showTip(tip, `<div class="tt-title">${yr}</div>
                <div class="tt-row"><span class="tt-dot" style="background:#fc8d59"></span>GHG Emissions <span class="tt-val">${isNaN(ghg)?'N/A':d3.format(',.1f')(ghg)} MtCO₂e</span></div>
                <div class="tt-row"><span class="tt-dot" style="background:#a6d96a"></span>Carbon Intensity <span class="tt-val">${isNaN(ci)?'N/A':d3.format(',.1f')(ci)} gCO₂/kWh</span></div>`, event);
        })
        .on('mouseleave', () => { hideTip(tip); vLine.style('display','none'); });
}

/* ── PANEL 6: NET IMPORTS ─────────────────────────────────── */
function renderPanelImport(iso) {
    const data = DB.byISO[iso];
    const {W, H, margin} = getDims('p6-svg');
    const svg = d3.select('#p6-svg').attr('width', W).attr('height', H);
    svg.selectAll('*').remove();
    
    const cw = W - margin.left - margin.right;
    const ch = H - margin.top - margin.bottom;
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    
    const pb = data.filter(d => !isNaN(+d.net_elec_imports));
    if(!pb.length) return;
    
    const maxM = d3.max(pb, d => Math.abs(+d.net_elec_imports)) || 1;
    
    const x = d3.scaleBand().domain(pb.map(d=>d.year)).range([0, cw]).padding(0.2);
    const y = d3.scaleLinear().domain([-maxM, maxM]).range([ch, 0]).nice();
    
    g.append('g').attr('transform', `translate(0,${y(0)})`).call(d3.axisBottom(x).tickValues(x.domain().filter(d => d%5===0)));
    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.2s')));
    
    const tip = document.getElementById('p6-tt');

    g.selectAll('rect').data(pb).enter().append('rect')
        .attr('x', d => x(d.year))
        .attr('width', x.bandwidth())
        .attr('y', d => +d.net_elec_imports > 0 ? y(+d.net_elec_imports) : y(0))
        .attr('height', d => Math.abs(y(+d.net_elec_imports) - y(0)))
        .attr('fill', d => +d.net_elec_imports > 0 ? '#E6A817' : '#1A6B5C')
        .on('mousemove', function(event, d) {
            const v = +d.net_elec_imports;
            const share = +d.net_elec_imports_share_demand;
            const isImporter = v >= 0;
            const color = isImporter ? '#E6A817' : '#1A6B5C';
            const label = isImporter ? 'Net Importer 📥' : 'Net Exporter 📤';
            const shareLine = !isNaN(share) ? `<div class="tt-row" style="color:var(--text-md);font-size:0.7rem">% of Demand: ${d3.format(',.1f')(share)}%</div>` : '';
            showTip(tip, `<div class="tt-title">${d.year}</div><div class="tt-row"><span class="tt-dot" style="background:${color}"></span>${label}</div><div class="tt-row">Net Imports <span class="tt-val">${d3.format(',.1f')(v)} TWh</span></div>${shareLine}`, event);
        })
        .on('mouseleave', () => hideTip(tip));

    const yR = d3.scaleLinear().domain([-100, 100]).range([ch, 0]);
    g.append('g').attr('transform', `translate(${cw},0)`).call(d3.axisRight(yR).ticks(5).tickFormat(d => d + '%'));
    const line = d3.line().defined(d => !isNaN(+d.net_elec_imports_share_demand))
        .x(d => x(d.year) + x.bandwidth() / 2)
        .y(d => yR(+d.net_elec_imports_share_demand));
    g.append('path').datum(pb).attr('fill', 'none').attr('stroke', '#fff')
        .attr('stroke-width', 1.5).style('pointer-events', 'none').attr('d', line);
}


/* ── INITIALIZATION ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    loadAll().then(() => {
        const viewGlobal = document.getElementById('view-global');
        if(viewGlobal) viewGlobal.classList.remove('hidden');

        // Force browser layout reflow so clientWidth is accurate
        void document.body.offsetHeight;

        renderMap();
        renderSunburst();
        updateMapColors();
        renderTopCountries();
        
        const loader = document.getElementById('loading-screen');
        if(loader) loader.classList.add('done');

        // Add responsive resize listener
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (!viewGlobal.classList.contains('hidden')) {
                    renderMap();
                    renderSunburst();
                    updateMapColors();
                } else if (S.mainISO) {
                    renderPanelMix(S.mainISO);
                    renderPanelElec(S.mainISO);
                    renderPanelFossil(S.mainISO);
                    renderPanelEcon(S.mainISO);
                    renderPanelCO2(S.mainISO);
                    renderPanelImport(S.mainISO);
                }
            }, 200);
        });
    }).catch(err => {
        console.error("Initialization failed:", err);
    });

    const $on = (id, event, handler) => document.getElementById(id)?.addEventListener?.(event, handler);
    const $$on = (sel, event, handler) => document.querySelectorAll(sel).forEach(el => el.addEventListener(event, handler));

    $on('play-btn', 'click', togglePlay);

    $on('back-btn', 'click', () => {
        document.getElementById('view-country').classList.add('hidden');
        document.getElementById('view-global').classList.remove('hidden');
        S.mainISO = null; S.cmpISO = null;
    });

    $on('year-slider', 'input', () => {
        const v = document.getElementById('year-slider').value;
        S.year = +v;
        updateSliderUI(S.year);
        updateMapColors();
        renderSunburst();
        renderTopCountries();
    });

    $on('energy-source-select', 'change', e => {
        S.energySource = e.target.value;
        updateMapColors();
        renderSunburst();
    });

    $$on('.metric-btn', 'click', e => {
        document.querySelectorAll('.metric-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        S.energyMetric = e.target.dataset.metric;
        updateMapColors();
        renderSunburst();
    });
});
