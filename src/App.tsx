import React, { useState } from 'react';
import {
  TrendingUp,
  Hash,
  Sparkles,
  BookOpen,
  LayoutGrid,
  Columns,
  Layers,
  ChevronDown,
  FileSpreadsheet,
  Download,
  Info,
  Check,
} from 'lucide-react';
import { DataGraph } from './components/DataGraph';
import { RandomGenerator } from './components/RandomGenerator';
import { AIAssistant } from './components/AIAssistant';
import { DocumentationModal } from './components/DocumentationModal';
import { Dataset, ChartType, RngConfig, RngResult } from './types';
import {
  generateSampleStockData,
  generateSampleWeatherStation,
  generateSampleServerMetrics,
  downloadDatasetAsCSV,
} from './utils/dataLoader';
import { generateRandomNumbers } from './utils/rngEngine';

export default function App() {
  // Active dataset state
  const [dataset, setDataset] = useState<Dataset>(() => generateSampleStockData());
  const [activeSeries, setActiveSeries] = useState<string[]>(['Close', 'MA_20']);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [startDateFilter, setStartDateFilter] = useState<string | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<string | undefined>(undefined);
  const [graphFeedback, setGraphFeedback] = useState<string | null>(null);

  // Active view tab: 'graph' | 'rng' | 'split'
  const [activeTab, setActiveTab] = useState<'graph' | 'rng' | 'split'>('graph');

  // RNG Configuration state
  const [rngConfig, setRngConfig] = useState<RngConfig>({
    count: 50,
    min: 10,
    max: 100,
    type: 'integer',
    precision: 2,
    gaussianMean: 50,
    gaussianStdDev: 15,
    unique: false,
    useSeed: false,
    seed: 'seed-42',
    sort: 'none',
  });
  const [rngResult, setRngResult] = useState<RngResult | null>(() => {
    return generateRandomNumbers({
      count: 50,
      min: 10,
      max: 100,
      type: 'integer',
      precision: 2,
      gaussianMean: 50,
      gaussianStdDev: 15,
      unique: false,
      useSeed: false,
      seed: 'seed-42',
      sort: 'none',
    });
  });
  const [rngFeedback, setRngFeedback] = useState<string | null>(null);

  // AI Assistant drawer & bottom quick-command
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Switch dataset helper
  const handleSelectDataset = (newDataset: Dataset) => {
    setDataset(newDataset);
    // select first 2 numeric columns or all if <= 2
    setActiveSeries(newDataset.numericColumns.slice(0, 2));
    setStartDateFilter(undefined);
    setEndDateFilter(undefined);
  };

  // AI Graph action dispatcher
  const handleApplyGraphAction = (action: {
    relativeDays?: number;
    startDate?: string;
    endDate?: string;
    selectedSeries?: string[];
    chartType?: ChartType;
    resetZoom?: boolean;
  }) => {
    if (action.resetZoom) {
      setStartDateFilter(undefined);
      setEndDateFilter(undefined);
      setGraphFeedback('Reset zoom to show full date range');
      setTimeout(() => setGraphFeedback(null), 3500);
      return;
    }

    if (action.relativeDays && dataset.rows.length > 0) {
      const lastDate = new Date(dataset.endDate);
      const dayMs = 24 * 60 * 60 * 1000;
      const start = new Date(lastDate.getTime() - action.relativeDays * dayMs);
      const startStr = start.toISOString().split('T')[0];
      setStartDateFilter(startStr);
      setEndDateFilter(dataset.endDate);
      setGraphFeedback(`AI filtered graph to last ${action.relativeDays} days (${startStr} to ${dataset.endDate})`);
      setTimeout(() => setGraphFeedback(null), 4000);
    } else if (action.startDate || action.endDate) {
      if (action.startDate) setStartDateFilter(action.startDate);
      if (action.endDate) setEndDateFilter(action.endDate);
      setGraphFeedback(`AI filtered range to ${action.startDate || dataset.startDate} - ${action.endDate || dataset.endDate}`);
      setTimeout(() => setGraphFeedback(null), 4000);
    }

    if (action.chartType) {
      setChartType(action.chartType);
    }

    if (action.selectedSeries && action.selectedSeries.length > 0) {
      const valid = action.selectedSeries.filter((s) => dataset.numericColumns.includes(s));
      if (valid.length > 0) setActiveSeries(valid);
    }
  };

  // AI RNG action dispatcher
  const handleApplyRngAction = (action: {
    count?: number;
    min?: number;
    max?: number;
    type?: 'integer' | 'float' | 'gaussian';
    precision?: number;
    gaussianMean?: number;
    gaussianStdDev?: number;
    unique?: boolean;
    execute?: boolean;
  }) => {
    const updated: RngConfig = {
      ...rngConfig,
      count: action.count ?? rngConfig.count,
      min: action.min ?? rngConfig.min,
      max: action.max ?? rngConfig.max,
      type: action.type ?? rngConfig.type,
      precision: action.precision ?? rngConfig.precision,
      gaussianMean: action.gaussianMean ?? rngConfig.gaussianMean,
      gaussianStdDev: action.gaussianStdDev ?? rngConfig.gaussianStdDev,
      unique: action.unique ?? rngConfig.unique,
    };

    setRngConfig(updated);

    if (action.execute) {
      try {
        const res = generateRandomNumbers(updated);
        setRngResult(res);
        setRngFeedback(`AI generated ${res.stats.count} random numbers [${res.config.min}, ${res.config.max}]`);
        setTimeout(() => setRngFeedback(null), 4000);
      } catch (err: any) {
        setRngFeedback(`Error: ${err.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  DataPlot & RNG Studio
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
                  Dual Workspace
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Interactive historical plots • On-demand RNG • Natural language assistant
              </p>
            </div>
          </div>

          {/* Central Mode Switcher: Graph | RNG | Split */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              onClick={() => setActiveTab('graph')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'graph'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Historical Graph</span>
            </button>

            <button
              onClick={() => setActiveTab('rng')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'rng'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Random Generator</span>
            </button>

            <button
              onClick={() => setActiveTab('split')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'split'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Side-by-side split view"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
          </div>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-2">
            {/* Sample Selector Dropdown */}
            <div className="relative group hidden lg:block">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span className="max-w-[120px] truncate">{dataset.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 hidden group-hover:block z-50">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Demonstration Datasets
                </div>
                <button
                  onClick={() => handleSelectDataset(generateSampleStockData())}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between cursor-pointer"
                >
                  <span>Tech Stocks Index (1-Yr OHLCV)</span>
                  {dataset.name.includes('Tech') && <Check className="w-3 h-3 text-blue-600" />}
                </button>
                <button
                  onClick={() => handleSelectDataset(generateSampleWeatherStation())}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between cursor-pointer"
                >
                  <span>Weather & Solar Station (90-Day)</span>
                  {dataset.name.includes('Weather') && <Check className="w-3 h-3 text-blue-600" />}
                </button>
                <button
                  onClick={() => handleSelectDataset(generateSampleServerMetrics())}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between cursor-pointer"
                >
                  <span>Cloud Cluster Telemetry (30-Day)</span>
                  {dataset.name.includes('Cloud') && <Check className="w-3 h-3 text-blue-600" />}
                </button>
              </div>
            </div>

            {/* Guide & Samples Modal Trigger */}
            <button
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title="View setup guide, sample commands, and demo files"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Guide & Samples</span>
            </button>

            {/* AI Assistant Drawer Trigger */}
            <button
              onClick={() => setIsAIOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shadow-2xs cursor-pointer ${
                isAIOpen
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4 pb-20">
        {activeTab === 'graph' && (
          <div className="flex-1 min-h-[580px]">
            <DataGraph
              dataset={dataset}
              onDatasetChange={handleSelectDataset}
              activeSeries={activeSeries}
              onActiveSeriesChange={setActiveSeries}
              chartType={chartType}
              onChartTypeChange={setChartType}
              startDateFilter={startDateFilter}
              endDateFilter={endDateFilter}
              onDateRangeChange={(start, end) => {
                setStartDateFilter(start);
                setEndDateFilter(end);
              }}
              filterFeedback={graphFeedback}
            />
          </div>
        )}

        {activeTab === 'rng' && (
          <div className="flex-1 min-h-[580px]">
            <RandomGenerator
              config={rngConfig}
              onConfigChange={setRngConfig}
              result={rngResult}
              onResultChange={setRngResult}
              onSendToGraph={(newDataset) => {
                handleSelectDataset(newDataset);
                setActiveTab('graph');
                setGraphFeedback('Loaded generated random numbers sequence into Graph tab');
                setTimeout(() => setGraphFeedback(null), 3500);
              }}
              generatedFeedback={rngFeedback}
            />
          </div>
        )}

        {activeTab === 'split' && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[640px]">
            <div className="min-h-[520px]">
              <DataGraph
                dataset={dataset}
                onDatasetChange={handleSelectDataset}
                activeSeries={activeSeries}
                onActiveSeriesChange={setActiveSeries}
                chartType={chartType}
                onChartTypeChange={setChartType}
                startDateFilter={startDateFilter}
                endDateFilter={endDateFilter}
                onDateRangeChange={(start, end) => {
                  setStartDateFilter(start);
                  setEndDateFilter(end);
                }}
                filterFeedback={graphFeedback}
              />
            </div>
            <div className="min-h-[520px]">
              <RandomGenerator
                config={rngConfig}
                onConfigChange={setRngConfig}
                result={rngResult}
                onResultChange={setRngResult}
                onSendToGraph={(newDataset) => {
                  handleSelectDataset(newDataset);
                  setGraphFeedback('Loaded generated random numbers sequence into Graph');
                  setTimeout(() => setGraphFeedback(null), 3500);
                }}
                generatedFeedback={rngFeedback}
              />
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Quick Command Bar */}
      <div className="fixed bottom-3 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl p-2 flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && quickPrompt.trim()) {
                setIsAIOpen(true);
              }
            }}
            placeholder="AI command: e.g. 'Show me only the last 30 days' or 'Give me 50 random integers 10 to 100'..."
            className="flex-1 bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none px-1"
          />
          <button
            onClick={() => {
              setIsAIOpen(true);
            }}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Ask AI
          </button>
        </div>
      </div>

      {/* Slide-out AI Assistant Drawer */}
      <AIAssistant
        dataset={dataset}
        currentRngConfig={rngConfig}
        onApplyGraphAction={handleApplyGraphAction}
        onApplyRngAction={handleApplyRngAction}
        onSwitchTab={setActiveTab}
        isOpen={isAIOpen}
        onToggleOpen={() => setIsAIOpen((prev) => !prev)}
      />

      {/* Guide & Documentation Modal */}
      <DocumentationModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onSelectDataset={handleSelectDataset}
      />
    </div>
  );
}
