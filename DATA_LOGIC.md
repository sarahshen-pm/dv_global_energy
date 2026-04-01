# Global Energy Dashboard — Data Logic Documentation

> **Data Source:** owid-energy-data.csv (Our World in Data)
> **Year Range:** 1965 – 2024

---

## 0. Global Filters → CSV Column Mapping (getField)

| energySource | energyMetric | CSV Column |
|---|---|---|
| fossil | consumption | fossil_fuel_consumption |
| fossil | consumption_share | fossil_share_energy |
| fossil | production | oil_production + coal_production + gas_production | 🚨
| fossil | generation | fossil_electricity |
| fossil | generation_share | fossil_share_elec |
| coal | consumption | coal_consumption |
| coal | consumption_share | coal_share_energy | 🚨
| coal | production | coal_production |
| coal | generation | coal_electricity |
| coal | generation_share | coal_share_elec | 🚨
| oil | consumption | oil_consumption |
| oil | consumption_share | oil_share_energy | 🚨
| oil | production | oil_production |
| oil | generation | oil_electricity |
| oil | generation_share | oil_share_elec | 🚨
| renewables | consumption | renewables_consumption |
| renewables | consumption_share | renewables_share_energy |
| renewables | production | No data | 🚨
| renewables | generation | renewables_electricity |
| renewables | generation_share | renewables_share_elec |
| gas | consumption | gas_consumption |
| gas | consumption_share | gas_share_energy | 🚨
| gas | production | No Data | 🚨
| gas | generation | gas_electricity |
| gas | generation_share | gas_share_elec | 🚨
| hydro | consumption | hydro_consumption |
| hydro | consumption_share | hydro_share_energy | 🚨
| hydro | production | No Data | 🚨
| hydro | generation | hydro_electricity |
| hydro | generation_share | hydro_share_elec | 🚨
| solar | consumption | solar_consumption |
| solar | consumption_share | solar_share_energy | 🚨
| solar | production | No Data | 🚨
| solar | generation | solar_electricity |
| solar | generation_share | solar_share_elec | 🚨
| wind | consumption | wind_consumption |
| wind | consumption_share | wind_share_energy | 🚨
| wind | production | No Data | 🚨
| wind | generation | wind_electricity |
| wind | generation_share | wind_share_elec | 🚨
| other_renew | consumption | other_renewable_consumption |
| other_renew | consumption_share | other_renewables_share_energy | 🚨
| other_renew | production | No Data | 🚨
| other_renew | generation | other_renewable_electricity |
| other_renew | generation_share | other_renew_share_elec | 🚨
| nuclear | consumption | nuclear_consumption |
| nuclear | consumption_share | nuclear_share_energy | 🚨
| nuclear | production | No Data | 🚨
| nuclear | generation | nuclear_electricity |
| nuclear | generation_share | nuclear_share_elec | 🚨

Note: production only valid for coal/oil/gas. Others return null (grey map).

---

## 1. View 1 — Global Overview

### 1a. World Map

Color driven by getField() for S.year.
Hover tooltip: getField() value + renewables_share_energy + fossil_share_energy
(switches to _share_elec columns in generation mode)

### 1b. Sunburst Chart (World rows only)

Data: country==="World" row for S.year.
Mode: _consumption columns or _electricity columns based on S.energyMetric.

Inner ring:
- Renewable -> color #43e97b
- Fossil -> color #c4611a
- Nuclear -> color #7b61ff

Outer ring columns:

| Segment | Consumption | Generation | Color |
|---|---|---|---|
| Hydro | hydro_consumption | hydro_electricity | #38b6d8 |
| Solar | solar_consumption | solar_electricity | #f9a826 |
| Wind | wind_consumption | wind_electricity | #56de90 |
| Biofuel | biofuel_consumption | biofuel_electricity | #8fbe7a |
| Other RE | other_renewable_consumption | other_renewable_electricity | #56c490 |
| Coal | coal_consumption | coal_electricity | #837060 |
| Oil | oil_consumption | oil_electricity | #d4721a |
| Gas | gas_consumption | gas_electricity | #e2b840 |
| Nuclear | nuclear_consumption | nuclear_electricity | #9d8aff |

Hover tooltip: % is absolute TWh / root total * 100 (NOT from _share columns).

if Mode: _production
Inner ring:
- Renewable -> color #43e97b equal zero
- Fossil -> color #c4611a
- Nuclear -> color #7b61ff equal zero
others 
Outring
- Coal -> color #837060
- Oil -> color #d4721a
- Gas -> color #e2b840
others equal zero



### 1c. Top 10 List

Same as map,just ranking and get top10 of metric:

| energySource | energyMetric | CSV Column |
|---|---|---|
| fossil | consumption | fossil_fuel_consumption |
| fossil | consumption_share | fossil_share_energy |
| fossil | production | oil_production + coal_production + gas_production |
| fossil | generation | fossil_electricity |
| fossil | generation_share | fossil_share_elec |
| coal | consumption | coal_consumption |
| coal | consumption_share | coal_share_energy | 
| coal | production | coal_production |
| coal | generation | coal_electricity |
| coal | generation_share | coal_share_elec | 
| oil | consumption | oil_consumption |
| oil | consumption_share | oil_share_energy | 
| oil | production | oil_production |
| oil | generation | oil_electricity |
| oil | generation_share | oil_share_elec | 
| renewables | consumption | renewables_consumption |
| renewables | consumption_share | renewables_share_energy |
| renewables | production | No data | 
| renewables | generation | renewables_electricity |
| renewables | generation_share | renewables_share_elec |
| gas | consumption | gas_consumption |
| gas | consumption_share | gas_share_energy | 
| gas | production | No Data | 
| gas | generation | gas_electricity |
| gas | generation_share | gas_share_elec | 
| hydro | consumption | hydro_consumption |
| hydro | consumption_share | hydro_share_energy | 
| hydro | production | No Data | 
| hydro | generation | hydro_electricity |
| hydro | generation_share | hydro_share_elec | 
| solar | consumption | solar_consumption |
| solar | consumption_share | solar_share_energy | 
| solar | production | No Data | 
| solar | generation | solar_electricity |
| solar | generation_share | solar_share_elec | 
| wind | consumption | wind_consumption |
| wind | consumption_share | wind_share_energy | 
| wind | production | No Data | 
| wind | generation | wind_electricity |
| wind | generation_share | wind_share_elec | 
| other_renew | consumption | other_renewable_consumption |
| other_renew | consumption_share | other_renewables_share_energy | 
| other_renew | production | No Data | 
| other_renew | generation | other_renewable_electricity |
| other_renew | generation_share | other_renew_share_elec | 
| nuclear | consumption | nuclear_consumption |
| nuclear | consumption_share | nuclear_share_energy | 
| nuclear | production | No Data | 
| nuclear | generation | nuclear_electricity |
| nuclear | generation_share | nuclear_share_elec | 

---

## 2. View 2 — Country Detail

Data: DB.byISO[iso] - all years 1965-2024 for clicked country.

### Panel 1 - Energy Mix (Consumption) [Stacked Area]

Filter: #p1-filter legend items

| Legend | CSV Column | Color |
|---|---|---|
| Coal | coal_consumption | #837060 |
| Oil | oil_consumption | #d4721a |
| Gas | gas_consumption | #e2b840 |
| Nuclear | nuclear_consumption | #7b61ff |
| Hydro | hydro_consumption | #38b6d8 |
| Solar | solar_consumption | #f9a826 |
| Wind | wind_consumption | #56de90 |
| Biofuel | biofuel_consumption | #8fbe7a |
| Other RE | other_renew_consumption | #56c490 |

Y: TWh. NaN treated as 0.

AUDIT ISSUE: other_renew_consumption does not exist in OWID CSV.
Correct column: other_renewable_consumption. Other RE will show as 0!

### Panel 2 - Electricity Generation [Stacked Bar]

Filter: #p2-filter legend items. Checkbox: Show shares.

| Legend | Bar Column | Share Line Column |
|---|---|---|
| Coal | coal_electricity | coal_share_elec |
| Oil | oil_electricity | oil_share_elec |
| Gas | gas_electricity | gas_share_elec |
| Nuclear | nuclear_electricity | nuclear_share_elec |
| Hydro | hydro_electricity | hydro_share_elec |
| Solar | solar_electricity | solar_share_elec |
| Wind | wind_electricity | wind_share_elec |
| Biofuel | biofuel_electricity | biofuel_share_elec |
| Other RE | other_renew_electricity | other_renew_share_elec |

Left Y: TWh. Right Y (share mode): 0-100%.

AUDIT ISSUE: Same as Panel 1. other_renew_electricity likely wrong.

### Panel 3 - Fossil Production [Line / Bar]

Filter: #p3-filter

| Legend | CSV Column | Color |
|---|---|---|
| Coal | coal_production | #837060 |
| Oil | oil_production | #d4721a |
| Gas | gas_production | #e2b840 |

Abs mode: separate lines per source, Y = TWh production.
Change % mode: sum of selected sources, formula = (curr-prev)/prev*100, Y clamped -20% to +20%.
Bar colors: #d9ef8b positive, #fc8d59 negative.

### Panel 4 - Efficiency [Dual-axis Line]

Filter: #p4-filter

| Legend | CSV Column | Axis | Unit | Color |
|---|---|---|---|---|
| Cap. Elec | electricity_generation_per_capita | Left | kWh/person | #38b6d8 |
| Cap. Energy | primary_energy_consumption_per_capita | Left | kWh/person | #fc8d59 |
| Energy/GDP | energy_per_gdp | Right (dashed) | kWh/$ GDP | #d9ef8b |

### Panel 5 - Emissions [Dual-axis Line, no filter]

| Series | CSV Column | Axis | Unit | Color |
|---|---|---|---|---|
| GHG Emissions | greenhouse_gas_emissions | Left | MtCO2e | #fc8d59 |
| Carbon Intensity | carbon_intensity_elec | Right | gCO2/kWh | #a6d96a |

AUDIT: greenhouse_gas_emissions column name may differ. Some OWID versions use total_ghg or co2.

### Panel 6 - Net Electricity Imports [Diverging Bar]

| Element | CSV Column | Unit |
|---|---|---|
| Bars | net_elec_imports | TWh |
| Line | net_elec_imports_share_demand | % of demand |

Positive (importer): #E6A817 amber. Negative (exporter): #1A6B5C teal.
Right Y: -100% to +100%.

---

## 3. All CSV Columns Used

### Consumption (TWh)
- primary_energy_consumption
- fossil_fuel_consumption
- coal_consumption, oil_consumption, gas_consumption
- nuclear_consumption
- renewables_consumption
- hydro_consumption, solar_consumption, wind_consumption
- biofuel_consumption, other_renewable_consumption

### Electricity Generation (TWh)
- electricity_generation, fossil_electricity
- coal_electricity, oil_electricity, gas_electricity
- nuclear_electricity, renewables_electricity
- hydro_electricity, solar_electricity, wind_electricity
- biofuel_electricity, other_renewable_electricity

### Energy Share (%)
- renewables_share_energy, fossil_share_energy
- coal_share_energy, oil_share_energy, gas_share_energy
- nuclear_share_energy, hydro_share_energy
- solar_share_energy, wind_share_energy
- other_renewables_share_energy

### Electricity Share (%)
- renewables_share_elec, fossil_share_elec
- coal_share_elec, oil_share_elec, gas_share_elec
- nuclear_share_elec, hydro_share_elec
- solar_share_elec, wind_share_elec

### Production (TWh)
- coal_production, oil_production, gas_production

### Per-Capita and Efficiency
- electricity_generation_per_capita (kWh/person)
- primary_energy_consumption_per_capita (kWh/person)
- energy_per_gdp (kWh/$ GDP)

### Emissions
- greenhouse_gas_emissions (MtCO2e)
- carbon_intensity_elec (gCO2/kWh)

### Trade
- net_elec_imports (TWh)
- net_elec_imports_share_demand (%)

---

## 4. Priority Audit Items

1. CRITICAL - Panel 1 and 2 Other RE: code reads other_renew_consumption / other_renew_electricity. OWID column is other_renewable_consumption / other_renewable_electricity. Fix data-val in legend or fix the suffix logic.

2. HIGH - Panel 5 GHG column: verify exact csv header. If flat line, wrong column name.

3. MEDIUM - Sunburst % vs share columns: sunburst % = TWh ratio, not _share_energy. Should be numerically close but may differ slightly.

4. MEDIUM - World row completeness: sunburst uses country===World rows. Verify OWID World aggregate covers all mapped countries.

5. LOW - net_elec_imports sign: confirm negative = net exporter in OWID docs.
