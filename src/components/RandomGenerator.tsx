import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Download,
  FileSpreadsheet,
  Check,
  Hash,
  Sliders,
  BarChart3,
  RefreshCw,
  ArrowUpDown,
  LineChart,
  HelpCircle,
  KeyRound,
} from 'lucide-react';
import { RngConfig, RngResult, Dataset } from '../types';
import { generateRandomNumbers, exportRngToCSV, exportRngToJSON } from '../utils/rngEngine';

interface RandomGeneratorProps {
  config: RngConfig;
  onConfigChange: (newConfig: RngConfig) => void;
  result: RngResult | null;
  onResultChange: (result: RngResult) => void;
  onSendToGraph?: (dataset: Dataset) => void;
  generatedFeedback?: string | null;
}

export const RandomGenerator: React.FC<RandomGeneratorProps> = ({
  config,
  onConfigChange,
  result,
  onResultChange,
  onSendToGraph,
  generatedFeedback,
}) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'raw' | 'histogram'>('grid');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate numbers
  const handleGenerate = () => {
    try {
      setErrorMessage(null);
      const res = generateRandomNumbers(config);
      onResultChange(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating numbers');
    }
  };

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to generate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleGenerate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config]);

  // Copy helpers
  const handleCopy = (format: 'comma' | 'newline' | 'json') => {
    if (!result || result.numbers.length === 0) return;
    let text = '';
    if (format === 'comma') {
      text = result.numbers.join(', ');
    } else if (format === 'newline') {
      text = result.numbers.join('\n');
    } else if (format === 'json') {
      text = JSON.stringify(result.numbers, null, 2);
    }

    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  // Calculate histogram bins for the generated numbers
  const histogramBins = useMemo(() => {
    if (!result || result.numbers.length === 0) return [];

    const numBins = Math.min(24, Math.max(8, Math.floor(Math.sqrt(result.numbers.length))));
    const min = result.stats.min;
    const max = result.stats.max;
    const binWidth = max === min ? 1 : (max - min) / numBins;

    const bins = Array.from({ length: numBins }, (_, i) => ({
      rangeStart: min + i * binWidth,
      rangeEnd: min + (i + 1) * binWidth,
      count: 0,
    }));

    result.numbers.forEach((val) => {
      let binIdx = Math.floor((val - min) / binWidth);
      if (binIdx >= numBins) binIdx = numBins - 1;
      if (binIdx < 0) binIdx = 0;
      bins[binIdx].count++;
    });

    const maxCount = Math.max(...bins.map((b) => b.count), 1);

    return bins.map((b) => ({
      ...b,
      heightPct: (b.count / maxCount) * 100,
    }));
  }, [result]);

  // Send to graph dataset
  const handleSendToGraph = () => {
    if (!result || result.numbers.length === 0 || !onSendToGraph) return;

    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const rows = result.numbers.map((val, idx) => {
      const d = new Date(now.getTime() - (result.numbers.length - idx) * dayMs);
      return {
        date: d.toISOString().split('T')[0],
        timestamp: d.getTime(),
        Generated_RNG: val,
        Index: idx + 1,
      };
    });

    const dataset: Dataset = {
      name: `RNG Sequence (${result.config.count} ${result.config.type}s [${result.config.min}, ${result.config.max}])`,
      filename: `rng_sequence_${Date.now()}.csv`,
      dateColumn: 'date',
      numericColumns: ['Generated_RNG'],
      rows,
      totalRows: rows.length,
      startDate: rows[0].date,
      endDate: rows[rows.length - 1].date,
    };

    onSendToGraph(dataset);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800 tracking-tight">
                On-Demand Random Number Generator
              </h2>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                Instant PRNG
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Configure quantity, ranges, distributions, and export immediately to CSV, JSON, or clipboard.
            </p>
          </div>
        </div>

        {/* Generate Primary Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 rounded-lg transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
            Generate Numbers (Enter)
          </button>
        </div>
      </div>

      {/* Notifications or Error banner */}
      {(errorMessage || generatedFeedback) && (
        <div
          className={`px-5 py-2 border-b text-xs flex items-center justify-between ${
            errorMessage
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{errorMessage || generatedFeedback}</span>
          {errorMessage && (
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-900 font-medium ml-4 text-[11px]"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Configuration Section */}
      <div className="p-5 border-b border-slate-100 bg-white grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
        {/* Quantity (Count) */}
        <div>
          <label className="block text-slate-600 font-medium mb-1.5 flex items-center justify-between">
            <span>Quantity (Count)</span>
            <span className="text-slate-400 font-normal">{config.count.toLocaleString()}</span>
          </label>
          <input
            type="number"
            min={1}
            max={20000}
            value={config.count}
            onChange={(e) => onConfigChange({ ...config, count: Math.max(1, Number(e.target.value)) })}
            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
          />
          <div className="flex items-center gap-1 mt-1.5">
            {[10, 50, 100, 500, 1000].map((preset) => (
              <button
                key={preset}
                onClick={() => onConfigChange({ ...config, count: preset })}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  config.count === preset
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Range: Min & Max */}
        <div>
          <label className="block text-slate-600 font-medium mb-1.5">Range (Min - Max)</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="number"
                value={config.min}
                onChange={(e) => onConfigChange({ ...config, min: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                placeholder="Min"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Minimum</span>
            </div>
            <div>
              <input
                type="number"
                value={config.max}
                onChange={(e) => onConfigChange({ ...config, max: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                placeholder="Max"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Maximum</span>
            </div>
          </div>
        </div>

        {/* Number Type & Precision */}
        <div>
          <label className="block text-slate-600 font-medium mb-1.5">Number Distribution Type</label>
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            {(
              [
                { id: 'integer', label: 'Integers' },
                { id: 'float', label: 'Decimals' },
                { id: 'gaussian', label: 'Gaussian' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => onConfigChange({ ...config, type: t.id })}
                className={`flex-1 py-1 rounded text-[11px] font-medium transition-all ${
                  config.type === t.id
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {config.type === 'float' && (
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Decimal Precision:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 6].map((p) => (
                  <button
                    key={p}
                    onClick={() => onConfigChange({ ...config, precision: p })}
                    className={`w-5 h-5 rounded text-[10px] font-medium ${
                      config.precision === p
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    .{p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {config.type === 'gaussian' && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <input
                  type="number"
                  value={config.gaussianMean}
                  onChange={(e) => onConfigChange({ ...config, gaussianMean: Number(e.target.value) })}
                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                  placeholder="Mean (μ)"
                />
                <span className="text-[9px] text-slate-400">Mean (μ)</span>
              </div>
              <div>
                <input
                  type="number"
                  value={config.gaussianStdDev}
                  onChange={(e) => onConfigChange({ ...config, gaussianStdDev: Number(e.target.value) })}
                  className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                  placeholder="Std Dev (σ)"
                />
                <span className="text-[9px] text-slate-400">Std Dev (σ)</span>
              </div>
            </div>
          )}
        </div>

        {/* Options: Unique, Seed, Sorting */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-slate-600 font-medium">Unique Values Only</label>
            <input
              type="checkbox"
              checked={config.unique}
              onChange={(e) => onConfigChange({ ...config, unique: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-slate-600 font-medium">Sort Order</label>
            <select
              value={config.sort}
              onChange={(e) => onConfigChange({ ...config, sort: e.target.value as any })}
              className="px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-700"
            >
              <option value="none">Original (Unsorted)</option>
              <option value="asc">Ascending (1 → 9)</option>
              <option value="desc">Descending (9 → 1)</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-slate-600 font-medium flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-slate-400" />
              <span>Reproducible Seed</span>
            </label>
            <input
              type="checkbox"
              checked={config.useSeed}
              onChange={(e) => onConfigChange({ ...config, useSeed: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {config.useSeed && (
            <input
              type="text"
              value={config.seed}
              onChange={(e) => onConfigChange({ ...config, seed: e.target.value })}
              placeholder="e.g. seed-42"
              className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono"
            />
          )}
        </div>
      </div>

      {/* Output / Results Display */}
      {result ? (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
          {/* Results Toolbar: Export, Copy, View Mode */}
          <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  viewMode === 'grid' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Pill Cloud
              </button>
              <button
                onClick={() => setViewMode('raw')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  viewMode === 'raw' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Raw Text
              </button>
              <button
                onClick={() => setViewMode('histogram')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  viewMode === 'histogram'
                    ? 'bg-white text-slate-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Distribution Chart
              </button>
            </div>

            {/* Action Buttons: Copy, CSV, JSON, Plot */}
            <div className="flex items-center gap-2">
              {/* Copy dropdown/buttons */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  onClick={() => handleCopy('comma')}
                  className="px-2 py-1 text-slate-600 hover:text-slate-900 text-[11px] font-medium flex items-center gap-1"
                  title="Copy as comma-separated list"
                >
                  {copiedFormat === 'comma' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  Copy CSV
                </button>
                <div className="w-px h-3 bg-slate-200" />
                <button
                  onClick={() => handleCopy('newline')}
                  className="px-2 py-1 text-slate-600 hover:text-slate-900 text-[11px] font-medium flex items-center gap-1"
                  title="Copy with line breaks"
                >
                  {copiedFormat === 'newline' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  Newlines
                </button>
              </div>

              {/* Export CSV button (Explicitly requested by user) */}
              <button
                onClick={() => exportRngToCSV(result.numbers)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
                title="Download as CSV file"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Export CSV
              </button>

              <button
                onClick={() => exportRngToJSON(result)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-2xs"
                title="Download as JSON file"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                JSON
              </button>

              {onSendToGraph && (
                <button
                  onClick={handleSendToGraph}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs"
                  title="Send these numbers to the Graph tab to inspect trend"
                >
                  <LineChart className="w-3.5 h-3.5 text-blue-600" />
                  Plot in Graph
                </button>
              )}
            </div>
          </div>

          {/* Descriptive Statistics Bar */}
          <div className="px-5 py-2.5 bg-slate-100/60 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Count</span>
              <span className="font-semibold text-slate-800 font-mono">{result.stats.count.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Min</span>
              <span className="font-semibold text-slate-800 font-mono">{result.stats.min}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Max</span>
              <span className="font-semibold text-slate-800 font-mono">{result.stats.max}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mean (Avg)</span>
              <span className="font-semibold text-slate-800 font-mono">{result.stats.mean}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Median</span>
              <span className="font-semibold text-slate-800 font-mono">{result.stats.median}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Std Deviation</span>
              <span className="font-semibold text-slate-800 font-mono">{result.stats.stdDev}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Unique Items</span>
              <span className="font-semibold text-emerald-700 font-mono">{result.stats.uniqueCount}</span>
            </div>
          </div>

          {/* Numbers View Container */}
          <div className="flex-1 p-5 overflow-y-auto max-h-[380px]">
            {viewMode === 'grid' && (
              <div className="flex flex-wrap gap-1.5">
                {result.numbers.slice(0, 1000).map((n, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono bg-white border border-slate-200 text-slate-800 shadow-2xs hover:border-emerald-400 transition-colors"
                  >
                    {n}
                  </span>
                ))}
                {result.numbers.length > 1000 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium text-slate-400 bg-slate-100 italic">
                    +{result.numbers.length - 1000} more items hidden in preview (all included in export)
                  </span>
                )}
              </div>
            )}

            {viewMode === 'raw' && (
              <textarea
                readOnly
                value={result.numbers.join(', ')}
                className="w-full h-full min-h-[220px] p-3 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 bg-white focus:outline-none resize-none"
              />
            )}

            {viewMode === 'histogram' && (
              <div className="flex flex-col h-full justify-between pt-2 pb-1">
                <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Frequency Distribution ({histogramBins.length} Bins)</span>
                  <span className="text-slate-400 font-normal">Range: {result.stats.min} to {result.stats.max}</span>
                </div>
                <div className="h-44 flex items-end gap-1.5 px-2 bg-white rounded-lg border border-slate-200 p-3">
                  {histogramBins.map((bin, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-10 pointer-events-none shadow-md">
                        {bin.rangeStart.toFixed(1)} - {bin.rangeEnd.toFixed(1)}: {bin.count} items
                      </div>
                      <div
                        className="w-full bg-emerald-500 group-hover:bg-emerald-600 rounded-t transition-all"
                        style={{ height: `${Math.max(4, bin.heightPct)}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1 font-mono">
                  <span>{result.stats.min}</span>
                  <span>Mean: {result.stats.mean}</span>
                  <span>{result.stats.max}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
          <Hash className="w-10 h-10 text-slate-300 mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">Ready to Generate</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Choose your quantity and range above, or click the "Generate Numbers" button to create your first random sequence.
          </p>
        </div>
      )}
    </div>
  );
};
