export type ChartType = 'line' | 'scatter' | 'bar' | 'area';

export type DatePreset = '7D' | '30D' | '90D' | '1Y' | 'YTD' | 'ALL' | 'CUSTOM';

export interface DataRow {
  date: string; // ISO date string or formatted date
  timestamp: number; // epoch ms
  [key: string]: any;
}

export interface Dataset {
  name: string;
  filename: string;
  dateColumn: string;
  numericColumns: string[];
  rows: DataRow[];
  totalRows: number;
  startDate: string;
  endDate: string;
}

export type NumberType = 'integer' | 'float' | 'gaussian';

export interface RngConfig {
  count: number;
  min: number;
  max: number;
  type: NumberType;
  precision: number; // for float
  gaussianMean: number; // for gaussian
  gaussianStdDev: number; // for gaussian
  unique: boolean;
  useSeed: boolean;
  seed: string;
  sort: 'none' | 'asc' | 'desc';
}

export interface RngStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  uniqueCount: number;
}

export interface RngResult {
  numbers: number[];
  stats: RngStats;
  config: RngConfig;
  generatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  actionTaken?: string;
  insights?: string[];
}
