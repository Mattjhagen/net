# DataPlot & RNG Studio

A unified, lightweight utility combining **interactive historical data plotting** and **on-demand random number generation**, wrapped in a natural language AI assistant layer.

---

## Deliverables Summary

1. **Source Code**: Fully typed React + Vite + Express + Plotly application with server-side AI integration (`gemini-3.8-flash`) and local NLP fallbacks.
2. **Setup Instructions**: Quick steps below for running locally with Node/npm, plus a standalone Python script bridge.
3. **Sample Commands & UI Clicks**: Detailed click walkthrough and AI chat examples.
4. **Demonstration Dataset**: Included in the app (and downloadable as `sample_tech_stock_history.csv`).

---

## 🚀 Quick Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional for AI)
```bash
cp .env.example .env
# Set your GEMINI_API_KEY if desired for advanced generative chat.
# Note: The app also includes an offline smart local NLP engine that works with 100% functionality without any API key!
```

### 3. Run the Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 📊 Features & UI Click Walkthrough

### 1. Interactive Historical Graph
- **Box Zoom & Pan**: Click and drag any rectangle on the graph to zoom into that time window. Double-click or click **"Reset Zoom"** to restore.
- **Hover-to-See Values**: Crosshair cursor displays timestamp and exact values for all active series in a unified dark tooltip.
- **Date Presets**: One-click quick filters for **7D**, **30D**, **90D**, **1Y**, **YTD**, and **ALL**, or use the custom date calendar pickers.
- **Chart Styles**: Switch between **Line**, **Area**, **Bar**, and **Scatter** modes.
- **Save as PNG**: Click **"Save PNG"** in the top bar to export a crisp 1600×900 image.
- **Save as PDF**: Click **"Save PDF"** to generate a formatted printable report complete with high-resolution graph snapshot and summary statistics table.
- **File Upload**: Drag and drop any `.csv` or `.json` file anywhere on the graph area, or click **"Upload File"**.

### 2. On-Demand Random Number Generator (RNG)
- **Count & Range**: Specify quantity (1 to 20,000) and set `Min` and `Max` bounds.
- **Distribution Types**:
  - **Integers**: Uniform discrete values.
  - **Decimals (Floats)**: Configurable decimal precision (1 to 6 places).
  - **Gaussian / Normal**: Parametric distribution with customizable Mean ($\mu$) and Std Dev ($\sigma$).
- **Options**:
  - **Unique Values Only**: Draw without replacement.
  - **Reproducible Seed**: Pseudorandom PRNG (Mulberry32) for reproducible sets.
  - **Sorting**: Unsorted, Ascending, or Descending.
- **Instant Output**: Press **`Enter`** or click **"Generate Numbers"**.
- **Visualizer**: Frequency distribution histogram + Pill Cloud + Raw text view.
- **Exporting**:
  - **"Export CSV"**: Downloads `generated_random_numbers.csv` ready for Excel/Pandas.
  - **"Copy CSV" / "Newlines"**: Instant clipboard copy with visual feedback.
  - **"Plot in Graph"**: Sends the generated random numbers sequence directly to the Graph tab.

### 3. AI-Assisted Natural Language Layer
Click **"AI Assistant"** or use the bottom quick-command input. Try these queries:
- `Show me only the last 30 days` → Filters historical zoom to the last 30 days.
- `Give me 50 random integers between 10 and 100` → Sets RNG parameters, generates the numbers, and switches to RNG tab.
- `Switch to bar chart` → Toggles graph representation.
- `Generate 100 normal distribution numbers mean 50 std 10` → Configures Gaussian distribution.
- `Summarize dataset trends` → Calculates min, max, mean, and date span metrics.

---

## 🐍 Python + Pandas / Plotly Equivalent

For users who want to extend or run this directly in Python:

```python
import pandas as pd
import numpy as np
import plotly.express as px

# 1. Historical Graph with Plotly
df = pd.read_csv('public/sample_tech_stock_history.csv', parse_dates=['date'])
fig = px.line(df, x='date', y=['Close', 'MA_20'], title='Historical Price & MA')
fig.update_xaxes(rangeslider_visible=True) # zoom slider
fig.write_image('historical_chart.png')     # export PNG
fig.show()

# 2. Random Number Generator with CSV Export
count = 50
min_val, max_val = 10, 100
rng_values = np.random.randint(min_val, max_val + 1, size=count)
rng_df = pd.DataFrame({'Index': range(1, count + 1), 'Value': rng_values})
rng_df.to_csv('generated_random_numbers.csv', index=False)
print(f"Generated {count} numbers. Mean: {rng_values.mean():.2f}")
```
