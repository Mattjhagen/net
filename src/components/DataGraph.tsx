import React, { useEffect, useRef, useState, useMemo } from 'react';
import Plotly from 'plotly.js-dist-min';
import jsPDF from 'jspdf';
import {
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Upload,
  Calendar,
  Layers,
  BarChart2,
  TrendingUp,
  Activity,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Dataset, ChartType, DatePreset } from '../types';
import { downloadDatasetAsCSV, parseUploadedFile } from '../utils/dataLoader';

interface DataGraphProps {
  dataset: Dataset;
  onDatasetChange: (newDataset: Dataset) => void;
  activeSeries: string[];
  onActiveSeriesChange: (series: string[]) => void;
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  startDateFilter?: string;
  endDateFilter?: string;
  onDateRangeChange: (start: string, end: string) => void;
  filterFeedback?: string | null;
}

const PALETTE = [
  '#2563eb', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
];

export const DataGraph: React.FC<DataGraphProps> = ({
  dataset,
  onDatasetChange,
  activeSeries,
  onActiveSeriesChange,
  chartType,
  onChartTypeChange,
  startDateFilter,
  endDateFilter,
  onDateRangeChange,
  filterFeedback,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<DatePreset>('ALL');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Filter rows based on date range
  const filteredRows = useMemo(() => {
    if (!startDateFilter && !endDateFilter) return dataset.rows;

    const startMs = startDateFilter ? new Date(startDateFilter).getTime() : -Infinity;
    const endMs = endDateFilter ? new Date(endDateFilter + 'T23:59:59').getTime() : Infinity;

    return dataset.rows.filter((r) => r.timestamp >= startMs && r.timestamp <= endMs);
  }, [dataset.rows, startDateFilter, endDateFilter]);

  // Descriptive statistics for visible rows
  const visibleStats = useMemo(() => {
    if (filteredRows.length === 0 || activeSeries.length === 0) return null;

    const primaryCol = activeSeries[0];
    const vals = filteredRows
      .map((r) => Number(r[primaryCol]))
      .filter((v) => !isNaN(v) && v !== null);

    if (vals.length === 0) return null;

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const sum = vals.reduce((a, b) => a + b, 0);
    const mean = sum / vals.length;
    const latest = vals[vals.length - 1];
    const earliest = vals[0];
    const change = latest - earliest;
    const changePct = earliest !== 0 ? (change / Math.abs(earliest)) * 100 : 0;

    return {
      primaryCol,
      count: vals.length,
      min,
      max,
      mean,
      latest,
      change,
      changePct,
    };
  }, [filteredRows, activeSeries]);

  // Apply Date Preset
  const applyPreset = (preset: DatePreset) => {
    setActivePreset(preset);
    if (dataset.rows.length === 0) return;

    const lastDate = new Date(dataset.endDate);
    const endStr = dataset.endDate;
    let startStr = dataset.startDate;

    const dayMs = 24 * 60 * 60 * 1000;

    if (preset === '7D') {
      const start = new Date(lastDate.getTime() - 7 * dayMs);
      startStr = start.toISOString().split('T')[0];
    } else if (preset === '30D') {
      const start = new Date(lastDate.getTime() - 30 * dayMs);
      startStr = start.toISOString().split('T')[0];
    } else if (preset === '90D') {
      const start = new Date(lastDate.getTime() - 90 * dayMs);
      startStr = start.toISOString().split('T')[0];
    } else if (preset === '1Y') {
      const start = new Date(lastDate.getTime() - 365 * dayMs);
      startStr = start.toISOString().split('T')[0];
    } else if (preset === 'YTD') {
      const start = new Date(lastDate.getFullYear(), 0, 1);
      startStr = start.toISOString().split('T')[0];
    } else if (preset === 'ALL') {
      startStr = dataset.startDate;
    }

    onDateRangeChange(startStr, endStr);
  };

  // Toggle series visibility
  const toggleSeries = (col: string) => {
    if (activeSeries.includes(col)) {
      if (activeSeries.length > 1) {
        onActiveSeriesChange(activeSeries.filter((s) => s !== col));
      }
    } else {
      onActiveSeriesChange([...activeSeries, col]);
    }
  };

  // Render or update Plotly graph
  useEffect(() => {
    if (!containerRef.current) return;
    if (filteredRows.length === 0) {
      containerRef.current.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
          <p class="text-sm font-medium">No data points match the selected range.</p>
          <p class="text-xs text-slate-500 mt-1">Try resetting the zoom or choosing "ALL".</p>
        </div>
      `;
      return;
    }

    const xData = filteredRows.map((r) => r.date);

    // Build traces for each active series
    const traces: any[] = activeSeries.map((col, idx) => {
      const yData = filteredRows.map((r) => r[col]);
      const color = PALETTE[idx % PALETTE.length];

      const baseTrace: any = {
        name: col,
        x: xData,
        y: yData,
        hoverinfo: 'x+y+name',
        marker: { color, size: chartType === 'scatter' ? 7 : 5 },
      };

      if (chartType === 'line') {
        baseTrace.type = 'scatter';
        baseTrace.mode = 'lines';
        baseTrace.line = { color, width: 2.2, shape: 'spline' };
      } else if (chartType === 'area') {
        baseTrace.type = 'scatter';
        baseTrace.mode = 'lines';
        baseTrace.fill = idx === 0 ? 'tozeroy' : 'tonexty';
        baseTrace.fillcolor = color + '22';
        baseTrace.line = { color, width: 2 };
      } else if (chartType === 'bar') {
        baseTrace.type = 'bar';
        baseTrace.marker = { color: color + 'cc' };
      } else if (chartType === 'scatter') {
        baseTrace.type = 'scatter';
        baseTrace.mode = 'markers';
      }

      return baseTrace;
    });

    const layout: any = {
      margin: { l: 56, r: 24, t: 36, b: 48 },
      autosize: true,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: {
        family: 'Inter, system-ui, sans-serif',
        size: 11,
        color: '#64748b',
      },
      hovermode: 'x unified',
      hoverlabel: {
        bgcolor: '#0f172a',
        bordercolor: '#334155',
        font: { color: '#f8fafc', size: 12 },
      },
      legend: {
        orientation: 'h',
        yanchor: 'bottom',
        y: 1.04,
        xanchor: 'right',
        x: 1,
        font: { size: 11, color: '#475569' },
      },
      xaxis: {
        type: 'date',
        showgrid: true,
        gridcolor: '#e2e8f0',
        zeroline: false,
        tickfont: { color: '#64748b', size: 10 },
      },
      yaxis: {
        showgrid: true,
        gridcolor: '#e2e8f0',
        zeroline: false,
        tickfont: { color: '#64748b', size: 10 },
      },
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: `${dataset.name}_plot`,
        height: 700,
        width: 1200,
        scale: 2,
      },
    };

    Plotly.react(containerRef.current, traces, layout, config);

    const handleResize = () => {
      if (containerRef.current) {
        Plotly.Plots.resize(containerRef.current);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [filteredRows, activeSeries, chartType, dataset.name]);

  // PNG Export
  const handleExportPNG = async () => {
    if (!containerRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await Plotly.toImage(containerRef.current, {
        format: 'png',
        width: 1600,
        height: 900,
        scale: 2,
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${dataset.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_graph.png`;
      link.click();
      setExportFeedback('Exported high-res PNG successfully!');
      setTimeout(() => setExportFeedback(null), 3000);
    } catch (err: any) {
      console.error(err);
      setExportFeedback('Error exporting PNG');
    } finally {
      setIsExporting(false);
    }
  };

  // PDF Export
  const handleExportPDF = async () => {
    if (!containerRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await Plotly.toImage(containerRef.current, {
        format: 'png',
        width: 1600,
        height: 900,
        scale: 2,
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Header Banner
      pdf.setFillColor(15, 23, 42); // slate-900
      pdf.rect(0, 0, 297, 24, 'F');

      pdf.setFontSize(14);
      pdf.setTextColor(255, 255, 255);
      pdf.text('HISTORICAL DATA PLOT REPORT', 14, 15);

      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Dataset: ${dataset.name}`, 180, 11);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 180, 17);

      // Graph Image
      pdf.addImage(dataUrl, 'PNG', 14, 28, 269, 125);

      // Metadata & Summary Statistics Table
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(14, 158, 269, 38, 3, 3, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.roundedRect(14, 158, 269, 38, 3, 3, 'D');

      pdf.setFontSize(10);
      pdf.setTextColor(30, 41, 59);
      pdf.text('Summary Metrics & Date Range', 20, 166);

      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Date Range: ${startDateFilter || dataset.startDate} to ${endDateFilter || dataset.endDate}`, 20, 173);
      pdf.text(`Visible Data Points: ${filteredRows.length} rows`, 20, 179);
      pdf.text(`Active Series: ${activeSeries.join(', ')}`, 20, 185);

      if (visibleStats) {
        pdf.text(`Primary Metric: ${visibleStats.primaryCol}`, 150, 173);
        pdf.text(
          `Min: ${visibleStats.min.toLocaleString()} | Max: ${visibleStats.max.toLocaleString()} | Mean: ${visibleStats.mean.toFixed(2)}`,
          150,
          179
        );
        pdf.text(
          `Latest Value: ${visibleStats.latest.toLocaleString()} (${visibleStats.changePct >= 0 ? '+' : ''}${visibleStats.changePct.toFixed(1)}%)`,
          150,
          185
        );
      }

      pdf.save(`${dataset.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_report.pdf`);
      setExportFeedback('Exported full PDF report successfully!');
      setTimeout(() => setExportFeedback(null), 3000);
    } catch (err: any) {
      console.error(err);
      setExportFeedback('Error generating PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Reset Zoom
  const handleResetZoom = () => {
    applyPreset('ALL');
    if (containerRef.current) {
      Plotly.relayout(containerRef.current, {
        'xaxis.autorange': true,
        'yaxis.autorange': true,
      });
    }
  };

  // Handle file drop/upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseUploadedFile(file);
      onDatasetChange(parsed);
      setExportFeedback(`Loaded "${file.name}" (${parsed.totalRows} records)`);
      setTimeout(() => setExportFeedback(null), 3500);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseUploadedFile(file);
      onDatasetChange(parsed);
      setExportFeedback(`Loaded "${file.name}" (${parsed.totalRows} records)`);
      setTimeout(() => setExportFeedback(null), 3500);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-colors ${
        isDraggingFile ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800 tracking-tight">{dataset.name}</h2>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                {filteredRows.length} of {dataset.totalRows} rows
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive historical time-series with zoom, crosshairs, and multi-format exports.
            </p>
          </div>
        </div>

        {/* Action Buttons: Upload, Export PNG, Export PDF */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.tsv,.json,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
            title="Upload CSV or JSON file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Upload File
          </button>

          <button
            onClick={() => downloadDatasetAsCSV(dataset)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
            title="Download full dataset as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Dataset CSV
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            title="Export high-resolution PNG"
          >
            <Download className="w-3.5 h-3.5" />
            Save PNG
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            title="Export full printable PDF report"
          >
            <FileText className="w-3.5 h-3.5" />
            Save PDF
          </button>
        </div>
      </div>

      {/* Feedback banner (if AI filtered or exported) */}
      {(filterFeedback || exportFeedback) && (
        <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs text-blue-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{filterFeedback || exportFeedback}</span>
          </div>
          <button
            onClick={() => {
              setExportFeedback(null);
            }}
            className="text-blue-600 hover:text-blue-900 font-medium ml-4 text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls Bar: Presets, Date Picker, Chart Type, Zoom tools */}
      <div className="px-5 py-2.5 border-b border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Date Presets */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-medium mr-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Range:
          </span>
          {(['7D', '30D', '90D', '1Y', 'YTD', 'ALL'] as DatePreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activePreset === preset
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDateFilter || dataset.startDate}
            min={dataset.startDate}
            max={endDateFilter || dataset.endDate}
            onChange={(e) => {
              setActivePreset('CUSTOM');
              onDateRangeChange(e.target.value, endDateFilter || dataset.endDate);
            }}
            className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDateFilter || dataset.endDate}
            min={startDateFilter || dataset.startDate}
            max={dataset.endDate}
            onChange={(e) => {
              setActivePreset('CUSTOM');
              onDateRangeChange(startDateFilter || dataset.startDate, e.target.value);
            }}
            className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Chart Type Selector */}
        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-white">
          {(
            [
              { id: 'line', label: 'Line' },
              { id: 'area', label: 'Area' },
              { id: 'bar', label: 'Bar' },
              { id: 'scatter', label: 'Scatter' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => onChartTypeChange(t.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                chartType === t.id ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Reset Zoom Button */}
        <button
          onClick={handleResetZoom}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors"
          title="Reset zoom & auto-scale axes"
        >
          <RotateCcw className="w-3 h-3 text-slate-500" />
          Reset Zoom
        </button>
      </div>

      {/* Series Selection Badges */}
      <div className="px-5 py-2 border-b border-slate-100 flex flex-wrap items-center gap-2 bg-white">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
          <Layers className="w-3 h-3" /> Series:
        </span>
        {dataset.numericColumns.map((col, idx) => {
          const isActive = activeSeries.includes(col);
          const color = PALETTE[idx % PALETTE.length];
          return (
            <button
              key={col}
              onClick={() => toggleSeries(col)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'border shadow-2xs'
                  : 'bg-slate-100 text-slate-400 border border-transparent hover:bg-slate-200/60 opacity-60'
              }`}
              style={{
                borderColor: isActive ? color : 'transparent',
                backgroundColor: isActive ? `${color}15` : undefined,
                color: isActive ? color : undefined,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: isActive ? color : '#94a3b8' }}
              />
              {col}
            </button>
          );
        })}
      </div>

      {/* Main Interactive Plotly Graph Canvas */}
      <div className="relative flex-1 min-h-[360px] w-full p-2 bg-white">
        <div ref={containerRef} className="w-full h-full" style={{ minHeight: '360px' }} />
      </div>

      {/* Summary Metrics Footer Bar */}
      {visibleStats && (
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/70 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Primary Metric</span>
            <span className="font-semibold text-slate-800 truncate block">{visibleStats.primaryCol}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Latest Value</span>
            <span className="font-semibold text-slate-800">{visibleStats.latest.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Range Min</span>
            <span className="font-semibold text-slate-700">{visibleStats.min.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Range Max</span>
            <span className="font-semibold text-slate-700">{visibleStats.max.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Mean Average</span>
            <span className="font-semibold text-slate-700">{visibleStats.mean.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Period Change</span>
            <span
              className={`font-semibold ${
                visibleStats.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {visibleStats.change >= 0 ? '+' : ''}
              {visibleStats.change.toFixed(2)} ({visibleStats.changePct >= 0 ? '+' : ''}
              {visibleStats.changePct.toFixed(1)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
