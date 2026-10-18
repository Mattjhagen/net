import Papa from 'papaparse';
import { Dataset, DataRow } from '../types';

/**
 * Generates 1 year of daily historical stock market index data
 */
export function generateSampleStockData(): Dataset {
  const rows: DataRow[] = [];
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const numDays = 365;

  let currentPrice = 142.5;
  const prices: number[] = [];

  // Generate dates going backwards from today
  for (let i = numDays; i >= 0; i--) {
    const d = new Date(now.getTime() - i * dayMs);
    // skip weekends
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const dateStr = d.toISOString().split('T')[0];
    const change = (Math.random() - 0.48) * 3.5;
    currentPrice = Math.max(100, Math.min(260, +(currentPrice + change).toFixed(2)));
    prices.push(currentPrice);

    const open = +(currentPrice - (Math.random() - 0.5) * 1.5).toFixed(2);
    const high = +(Math.max(open, currentPrice) + Math.random() * 2).toFixed(2);
    const low = +(Math.min(open, currentPrice) - Math.random() * 2).toFixed(2);
    const volume = Math.floor(1800000 + Math.random() * 1500000 + Math.abs(change) * 200000);

    // Compute moving average of last 20 observations
    const recent20 = prices.slice(Math.max(0, prices.length - 20));
    const ma20 = +(recent20.reduce((a, b) => a + b, 0) / recent20.length).toFixed(2);

    rows.push({
      date: dateStr,
      timestamp: d.getTime(),
      Close: currentPrice,
      Open: open,
      High: high,
      Low: low,
      Volume: volume,
      MA_20: ma20,
    });
  }

  return {
    name: 'Tech Index Historical (Daily OHLCV & MA20)',
    filename: 'tech_index_daily_history.csv',
    dateColumn: 'date',
    numericColumns: ['Close', 'Open', 'High', 'Low', 'MA_20', 'Volume'],
    rows,
    totalRows: rows.length,
    startDate: rows[0].date,
    endDate: rows[rows.length - 1].date,
  };
}

/**
 * Generates 90 days of weather & solar sensor metrics
 */
export function generateSampleWeatherStation(): Dataset {
  const rows: DataRow[] = [];
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const numDays = 90;

  for (let i = numDays; i >= 0; i--) {
    const d = new Date(now.getTime() - i * dayMs);
    const dateStr = d.toISOString().split('T')[0];
    const progress = (numDays - i) / numDays;
    const seasonal = Math.sin(progress * Math.PI) * 10;

    const temp = +(15 + seasonal + (Math.random() - 0.5) * 6).toFixed(1);
    const humidity = +(55 + Math.sin(i * 0.3) * 20 + (Math.random() - 0.5) * 10).toFixed(1);
    const solar = Math.max(0, +(480 + Math.cos(i * 0.2) * 220 + (Math.random() - 0.5) * 80).toFixed(0));
    const wind = +(4.2 + (Math.random() - 0.5) * 3.8).toFixed(1);

    rows.push({
      date: dateStr,
      timestamp: d.getTime(),
      Temperature_C: temp,
      Humidity_Pct: Math.min(100, Math.max(20, humidity)),
      Solar_Irradiance_Wm2: solar,
      WindSpeed_mps: Math.max(0.5, wind),
    });
  }

  return {
    name: 'Weather & Solar Station (90-Day Sensor Log)',
    filename: 'weather_solar_station_90d.csv',
    dateColumn: 'date',
    numericColumns: ['Temperature_C', 'Humidity_Pct', 'Solar_Irradiance_Wm2', 'WindSpeed_mps'],
    rows,
    totalRows: rows.length,
    startDate: rows[0].date,
    endDate: rows[rows.length - 1].date,
  };
}

/**
 * Generates 30 days of hourly server telemetry
 */
export function generateSampleServerMetrics(): Dataset {
  const rows: DataRow[] = [];
  const now = new Date();
  const hourMs = 60 * 60 * 1000;
  const numHours = 30 * 24;

  for (let i = numHours; i >= 0; i -= 2) {
    const d = new Date(now.getTime() - i * hourMs);
    const dateStr = d.toISOString().replace('T', ' ').substring(0, 16);

    const hourOfDay = d.getHours();
    const peakFactor = (hourOfDay >= 9 && hourOfDay <= 18) ? 1.6 : 0.8;

    const cpu = +(Math.min(98, 25 * peakFactor + Math.random() * 20)).toFixed(1);
    const memory = +(Math.min(95, 45 + progressMemory(i) + Math.random() * 8)).toFixed(1);
    const latency = +(Math.max(12, 28 * peakFactor + (Math.random() - 0.3) * 35)).toFixed(1);
    const requests = Math.floor(800 * peakFactor + Math.random() * 500);

    rows.push({
      date: dateStr,
      timestamp: d.getTime(),
      Latency_ms: latency,
      CPU_Usage_Pct: cpu,
      Memory_Pct: memory,
      Requests_Per_Sec: requests,
    });
  }

  function progressMemory(idx: number): number {
    return (1 - idx / numHours) * 15;
  }

  return {
    name: 'Cloud Cluster Telemetry (30-Day Server Metrics)',
    filename: 'cloud_cluster_telemetry.csv',
    dateColumn: 'date',
    numericColumns: ['Latency_ms', 'CPU_Usage_Pct', 'Memory_Pct', 'Requests_Per_Sec'],
    rows,
    totalRows: rows.length,
    startDate: rows[0].date,
    endDate: rows[rows.length - 1].date,
  };
}

/**
 * Parses an uploaded CSV or JSON file into a Dataset
 */
export async function parseUploadedFile(file: File): Promise<Dataset> {
  const filename = file.name;
  const isJson = filename.toLowerCase().endsWith('.json');

  if (isJson) {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Uploaded JSON must contain an array of data objects.');
    }
    return normalizeParsedData(file.name, parsed);
  }

  // Parse CSV/TSV
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            return reject(new Error('Uploaded file is empty or could not be parsed.'));
          }
          const dataset = normalizeParsedData(file.name, results.data as any[]);
          resolve(dataset);
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => {
        reject(new Error(`Failed to parse CSV: ${err.message}`));
      },
    });
  });
}

/**
 * Normalizes rows into a uniform Dataset schema
 */
function normalizeParsedData(filename: string, rawRows: any[]): Dataset {
  if (rawRows.length === 0) {
    throw new Error('No rows found in data.');
  }

  const sampleRow = rawRows[0];
  const keys = Object.keys(sampleRow);

  // Identify date/time column
  const dateCandidates = ['date', 'time', 'timestamp', 'datetime', 'day', 'dt', 'period'];
  let dateCol = keys.find((k) => dateCandidates.includes(k.toLowerCase()));

  if (!dateCol) {
    // Try to find any column whose first value looks like a date string
    for (const k of keys) {
      const val = sampleRow[k];
      if (typeof val === 'string' && !isNaN(Date.parse(val)) && isNaN(Number(val))) {
        dateCol = k;
        break;
      }
    }
  }

  // If still no dateCol, synthesize an index-based sequential timestamp
  const hasValidDateCol = !!dateCol;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Determine numeric columns
  const numericColumns: string[] = [];
  keys.forEach((k) => {
    if (k === dateCol) return;
    const numCount = rawRows.slice(0, 20).filter((r) => typeof r[k] === 'number' && !isNaN(r[k])).length;
    if (numCount >= Math.min(rawRows.length, 5) * 0.7) {
      numericColumns.push(k);
    }
  });

  if (numericColumns.length === 0) {
    throw new Error('No numeric series columns detected to plot.');
  }

  const normalizedRows: DataRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    let dateStr = '';
    let ts = 0;

    if (hasValidDateCol && raw[dateCol!]) {
      const parsedTs = Date.parse(String(raw[dateCol!]));
      if (!isNaN(parsedTs)) {
        ts = parsedTs;
        dateStr = new Date(parsedTs).toISOString().split('T')[0];
      } else {
        ts = now - (rawRows.length - i) * dayMs;
        dateStr = String(raw[dateCol!]);
      }
    } else {
      ts = now - (rawRows.length - i) * dayMs;
      dateStr = new Date(ts).toISOString().split('T')[0];
    }

    const rowObj: DataRow = {
      date: dateStr,
      timestamp: ts,
    };

    numericColumns.forEach((col) => {
      const val = Number(raw[col]);
      rowObj[col] = isNaN(val) ? 0 : val;
    });

    normalizedRows.push(rowObj);
  }

  // Sort chronologically if timestamps are valid
  normalizedRows.sort((a, b) => a.timestamp - b.timestamp);

  return {
    name: filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
    filename,
    dateColumn: 'date',
    numericColumns,
    rows: normalizedRows,
    totalRows: normalizedRows.length,
    startDate: normalizedRows[0].date,
    endDate: normalizedRows[normalizedRows.length - 1].date,
  };
}

/**
 * Downloads a dataset as a CSV file to the user's disk
 */
export function downloadDatasetAsCSV(dataset: Dataset) {
  const exportCols = [dataset.dateColumn, ...dataset.numericColumns];
  const exportData = dataset.rows.map((row) => {
    const item: Record<string, any> = {};
    exportCols.forEach((col) => {
      item[col] = row[col];
    });
    return item;
  });

  const csv = Papa.unparse(exportData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', dataset.filename.endsWith('.csv') ? dataset.filename : `${dataset.filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
