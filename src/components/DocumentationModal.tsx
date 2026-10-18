import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Terminal,
  MousePointer,
  FileSpreadsheet,
  Download,
  Code2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Dataset } from '../types';
import { downloadDatasetAsCSV, generateSampleStockData, generateSampleWeatherStation, generateSampleServerMetrics } from '../utils/dataLoader';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDataset: (d: Dataset) => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose,
  onSelectDataset,
}) => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'commands' | 'datasets' | 'python'>('quickstart');

  if (!isOpen) return null;

  const stockData = generateSampleStockData();
  const weatherData = generateSampleWeatherStation();
  const serverData = generateSampleServerMetrics();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-400/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-wide uppercase">Workspace Guide & Documentation</h2>
              <p className="text-xs text-slate-400">Setup instructions, sample commands, and demo datasets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 text-xs">
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`py-3 px-4 font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'quickstart'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" /> Quickstart & Setup
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`py-3 px-4 font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'commands'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MousePointer className="w-4 h-4" /> UI Clicks & Commands
          </button>
          <button
            onClick={() => setActiveTab('datasets')}
            className={`py-3 px-4 font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'datasets'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Demo Datasets
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`py-3 px-4 font-medium border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'python'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" /> Python / Node Bridge
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto text-xs leading-relaxed space-y-4">
          {activeTab === 'quickstart' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">Running Locally</h3>
                <p className="text-slate-600 mb-2">
                  This utility runs as a full-stack Node.js + Express + React app using Vite and Plotly.
                </p>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs space-y-1">
                  <div className="text-slate-400"># 1. Install dependencies</div>
                  <div>npm install</div>
                  <div className="text-slate-400 mt-2"># 2. Run the development server (runs Express + Vite on port 3000)</div>
                  <div>npm run dev</div>
                  <div className="text-slate-400 mt-2"># 3. Open your browser at http://localhost:3000</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">Key Technologies</h3>
                <ul className="grid grid-cols-2 gap-2 text-slate-600">
                  <li className="p-2 bg-slate-50 border border-slate-200 rounded-md">
                    <strong>Plotly.js</strong>: Fast interactive historical charting with box zoom, pan, hover crosshairs, and image rendering.
                  </li>
                  <li className="p-2 bg-slate-50 border border-slate-200 rounded-md">
                    <strong>jsPDF</strong>: High-resolution PDF report generation with metadata and summary statistics table.
                  </li>
                  <li className="p-2 bg-slate-50 border border-slate-200 rounded-md">
                    <strong>PRNG & Box-Muller</strong>: Instant integer, float, and Gaussian normal distribution generator with reproducible seeds.
                  </li>
                  <li className="p-2 bg-slate-50 border border-slate-200 rounded-md">
                    <strong>Gemini 3.8 Flash + Local NLP</strong>: Dual AI layer supporting natural language commands with or without an API key.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">Feature 1: Interactive Historical Graph</h3>
                <div className="space-y-2 text-slate-600">
                  <p>
                    <strong>Zoom & Pan:</strong> Click and drag on the chart to box-zoom into any time period. Double-click or click "Reset Zoom" to restore full view.
                  </p>
                  <p>
                    <strong>Hover Values:</strong> Hover over any date to see precise values for all active series in a unified crosshair tooltip.
                  </p>
                  <p>
                    <strong>Date Presets:</strong> Click <code className="bg-slate-100 px-1 py-0.5 rounded">7D</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">30D</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">90D</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">1Y</code>, or <code className="bg-slate-100 px-1 py-0.5 rounded">ALL</code>, or pick dates with the calendar inputs.
                  </p>
                  <p>
                    <strong>Save PNG / PDF:</strong> Click <em>"Save PNG"</em> for a 1600x900 pixel snapshot, or <em>"Save PDF"</em> for a formatted print-ready PDF report with statistics table.
                  </p>
                  <p>
                    <strong>Upload Custom File:</strong> Drag-and-drop any <code className="bg-slate-100 px-1 py-0.5 rounded">.csv</code> or <code className="bg-slate-100 px-1 py-0.5 rounded">.json</code> file onto the workspace or click "Upload File".
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">Feature 2: Random Number Generator</h3>
                <div className="space-y-2 text-slate-600">
                  <p>
                    <strong>Configure:</strong> Enter count (e.g. 50), Min (10), Max (100). Choose <em>Integers</em>, <em>Decimals</em>, or <em>Gaussian</em>.
                  </p>
                  <p>
                    <strong>Instant Generation:</strong> Press <code className="bg-slate-100 px-1 py-0.5 rounded">Enter</code> or click "Generate Numbers".
                  </p>
                  <p>
                    <strong>Export & Copy:</strong> Click <em>"Export CSV"</em> to download a spreadsheet, or <em>"Copy CSV"</em> to paste into external apps.
                  </p>
                  <p>
                    <strong>Plot in Graph:</strong> Click <em>"Plot in Graph"</em> to send the random sequence into the historical graph tab for analysis!
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">AI Assistant Commands</h3>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5 text-blue-900">
                  <div>• <em>"Show me only the last 30 days"</em> → Automatically adjusts zoom range</div>
                  <div>• <em>"Give me 50 random integers between 10 and 100"</em> → Generates numbers and switches to RNG tab</div>
                  <div>• <em>"Switch to bar chart"</em> → Toggles chart visual mode</div>
                  <div>• <em>"Generate 100 normal distribution numbers mean 50 std 10"</em> → Runs Gaussian PRNG</div>
                  <div>• <em>"Summarize dataset trends"</em> → Computes summary metrics & insights</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'datasets' && (
            <div className="space-y-3">
              <p className="text-slate-600">
                You can switch between these realistic demonstration datasets or download them as CSV files to test external uploads:
              </p>

              <div className="space-y-2.5">
                {/* Dataset 1 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{stockData.name}</div>
                    <div className="text-slate-500 text-[11px]">
                      1 Year daily financial index ({stockData.totalRows} trading days). Columns: Close, Open, High, Low, Volume, MA_20.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectDataset(stockData);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium cursor-pointer"
                    >
                      Load in Graph
                    </button>
                    <button
                      onClick={() => downloadDatasetAsCSV(stockData)}
                      className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 cursor-pointer"
                      title="Download CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dataset 2 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{weatherData.name}</div>
                    <div className="text-slate-500 text-[11px]">
                      90 Days environmental station ({weatherData.totalRows} days). Columns: Temperature (°C), Humidity (%), Solar Radiation, Wind Speed.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectDataset(weatherData);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium cursor-pointer"
                    >
                      Load in Graph
                    </button>
                    <button
                      onClick={() => downloadDatasetAsCSV(weatherData)}
                      className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 cursor-pointer"
                      title="Download CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dataset 3 */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{serverData.name}</div>
                    <div className="text-slate-500 text-[11px]">
                      30 Days server telemetry ({serverData.totalRows} intervals). Columns: Latency (ms), CPU Usage (%), Memory (%), Request Count.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectDataset(serverData);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium cursor-pointer"
                    >
                      Load in Graph
                    </button>
                    <button
                      onClick={() => downloadDatasetAsCSV(serverData)}
                      className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 cursor-pointer"
                      title="Download CSV"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-3">
              <p className="text-slate-600">
                Because you requested familiar libraries like <strong>Python + Pandas/Plotly</strong> or <strong>Node</strong>, here is how the exact same logic can be run or extended in a Python script:
              </p>
              <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-xs overflow-x-auto space-y-1">
                <span className="text-slate-400"># python_utility.py</span>
                <div>import pandas as pd</div>
                <div>import numpy as np</div>
                <div>import plotly.express as px</div>
                <div className="text-slate-400 mt-2"># 1. Historical Graph with Plotly</div>
                <div>df = pd.read_csv('tech_index_daily_history.csv', parse_dates=['date'])</div>
                <div>fig = px.line(df, x='date', y=['Close', 'MA_20'], title='Tech Index Historical')</div>
                <div>fig.update_xaxes(rangeslider_visible=True) # zoom slider</div>
                <div>fig.write_image('chart.png') # save PNG</div>
                <div>fig.show()</div>
                <div className="text-slate-400 mt-2"># 2. Random Number Generator (RNG) with CSV export</div>
                <div>random_ints = np.random.randint(low=10, high=101, size=50)</div>
                <div>rng_df = pd.DataFrame({'{'}'Index': range(1, 51), 'Value': random_ints{'}'})</div>
                <div>rng_df.to_csv('generated_numbers.csv', index=False)</div>
                <div>print(f"Generated {`{len(random_ints)}`} numbers: Mean = {`{random_ints.mean():.2f}`}")</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Ready to use with zero steep learning curve</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
