import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ArrowRight,
  Maximize2,
  Minimize2,
  X,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Hash,
} from 'lucide-react';
import { ChatMessage, Dataset, RngConfig, ChartType } from '../types';

interface AIAssistantProps {
  dataset: Dataset;
  currentRngConfig: RngConfig;
  onApplyGraphAction: (action: {
    relativeDays?: number;
    startDate?: string;
    endDate?: string;
    selectedSeries?: string[];
    chartType?: ChartType;
    resetZoom?: boolean;
  }) => void;
  onApplyRngAction: (action: {
    count?: number;
    min?: number;
    max?: number;
    type?: 'integer' | 'float' | 'gaussian';
    precision?: number;
    gaussianMean?: number;
    gaussianStdDev?: number;
    unique?: boolean;
    execute?: boolean;
  }) => void;
  onSwitchTab: (tab: 'graph' | 'rng') => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  dataset,
  currentRngConfig,
  onApplyGraphAction,
  onApplyRngAction,
  onSwitchTab,
  isOpen,
  onToggleOpen,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your AI assistant for this workspace. You can ask me natural language commands like "Show me only the last 30 days" or "Give me 50 random integers between 10 and 100".',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Client-side fallback rule engine when offline or server returns fallback
  const processLocalFallback = (prompt: string) => {
    const lower = prompt.toLowerCase();

    // 1. "Show me only the last X days"
    const daysMatch = lower.match(/last\s+(\d+)\s+days?/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1], 10);
      onApplyGraphAction({ relativeDays: days });
      onSwitchTab('graph');
      return {
        reply: `Filtered graph to show the last ${days} days of data.`,
        actionTaken: `Filtered to last ${days} days`,
      };
    }

    if (lower.includes('last 30 days') || lower.includes('past month')) {
      onApplyGraphAction({ relativeDays: 30 });
      onSwitchTab('graph');
      return {
        reply: 'Filtered graph to show the last 30 days.',
        actionTaken: 'Filtered to last 30 days',
      };
    }

    if (lower.includes('last 7 days') || lower.includes('past week')) {
      onApplyGraphAction({ relativeDays: 7 });
      onSwitchTab('graph');
      return {
        reply: 'Filtered graph to show the last 7 days.',
        actionTaken: 'Filtered to last 7 days',
      };
    }

    if (lower.includes('all data') || lower.includes('reset zoom') || lower.includes('show all')) {
      onApplyGraphAction({ resetZoom: true });
      onSwitchTab('graph');
      return {
        reply: 'Reset graph zoom to show all historical data.',
        actionTaken: 'Reset zoom to full range',
      };
    }

    // Chart type changes
    if (lower.includes('bar chart') || lower.includes('as bar')) {
      onApplyGraphAction({ chartType: 'bar' });
      onSwitchTab('graph');
      return {
        reply: 'Switched chart type to Bar chart.',
        actionTaken: 'Changed chart type to Bar',
      };
    }
    if (lower.includes('line chart') || lower.includes('as line')) {
      onApplyGraphAction({ chartType: 'line' });
      onSwitchTab('graph');
      return {
        reply: 'Switched chart type to Line chart.',
        actionTaken: 'Changed chart type to Line',
      };
    }
    if (lower.includes('area chart')) {
      onApplyGraphAction({ chartType: 'area' });
      onSwitchTab('graph');
      return {
        reply: 'Switched chart type to Area chart.',
        actionTaken: 'Changed chart type to Area',
      };
    }

    // 2. "Give me 50 random integers between 10 and 100"
    // Regex for random numbers: count, min, max
    const rngMatch = lower.match(/(?:give|generate|produce|make|get)\s+(?:me\s+)?(\d+)\s+random\s+(integers?|numbers?|floats?|decimals?)/i);
    const rangeMatch = lower.match(/between\s+(-?\d+)\s+(?:and|to)\s+(-?\d+)/i) || lower.match(/from\s+(-?\d+)\s+to\s+(-?\d+)/i);

    if (rngMatch || (lower.includes('random') && rangeMatch)) {
      const count = rngMatch ? parseInt(rngMatch[1], 10) : 50;
      const isFloat = lower.includes('float') || lower.includes('decimal');
      const isGaussian = lower.includes('normal') || lower.includes('gaussian');
      const min = rangeMatch ? parseInt(rangeMatch[1], 10) : 1;
      const max = rangeMatch ? parseInt(rangeMatch[2], 10) : 100;
      const unique = lower.includes('unique') || lower.includes('no duplicate');

      onApplyRngAction({
        count,
        min,
        max,
        type: isGaussian ? 'gaussian' : isFloat ? 'float' : 'integer',
        unique,
        execute: true,
      });
      onSwitchTab('rng');

      return {
        reply: `Generated ${count} random ${isFloat ? 'floats' : 'integers'} between ${min} and ${max}.`,
        actionTaken: `Generated ${count} numbers [${min}, ${max}]`,
      };
    }

    // 3. Summarize / analyze dataset
    if (lower.includes('summarize') || lower.includes('trend') || lower.includes('analysis') || lower.includes('stats')) {
      const primaryCol = dataset.numericColumns[0];
      const vals = dataset.rows.map((r) => Number(r[primaryCol])).filter((v) => !isNaN(v));
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const avg = +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
      const start = dataset.startDate;
      const end = dataset.endDate;

      return {
        reply: `Dataset Summary for "${dataset.name}":\n- Total Records: ${dataset.totalRows} observations spanning from ${start} to ${end}.\n- Primary Column (${primaryCol}): Range is ${min} to ${max}, with a mean average of ${avg}.\n- Available Series: ${dataset.numericColumns.join(', ')}.`,
        insights: [
          `Date span: ${start} → ${end}`,
          `${primaryCol} Min: ${min}, Max: ${max}, Mean: ${avg}`,
          `${dataset.numericColumns.length} series plotted`,
        ],
      };
    }

    // General fallback
    return {
      reply: `I can help you filter your historical graph or generate random numbers. Try saying:
- "Show me only the last 30 days"
- "Give me 50 random integers between 10 and 100"
- "Switch to bar chart"
- "Generate 25 random floats between 0 and 1"`,
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const datasetMeta = {
        hasData: dataset.rows.length > 0,
        name: dataset.name,
        startDate: dataset.startDate,
        endDate: dataset.endDate,
        totalRows: dataset.totalRows,
        numericColumns: dataset.numericColumns,
      };

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          datasetMeta,
          currentRngConfig,
        }),
      });

      if (!response.ok) {
        throw new Error('API server unreachable');
      }

      const data = await response.json();

      if (data.isLocalFallback || !data.success) {
        // Run smart local parser
        const localResult = processLocalFallback(text);
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            sender: 'assistant',
            text: localResult.reply,
            timestamp: new Date().toLocaleTimeString(),
            actionTaken: localResult.actionTaken,
            insights: localResult.insights,
          },
        ]);
        return;
      }

      // Handle structured actions from AI
      let actionLabel = '';

      if (data.action === 'filter_graph' && data.graphAction) {
        onApplyGraphAction(data.graphAction);
        onSwitchTab('graph');
        actionLabel = data.graphAction.relativeDays
          ? `Filtered to last ${data.graphAction.relativeDays} days`
          : 'Updated graph view';
      } else if (data.action === 'generate_rng' && data.rngAction) {
        onApplyRngAction(data.rngAction);
        onSwitchTab('rng');
        actionLabel = `Generated ${data.rngAction.count || 50} numbers`;
      } else if (data.action === 'switch_tab' && data.tab) {
        onSwitchTab(data.tab);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: data.reply || 'Request processed.',
          timestamp: new Date().toLocaleTimeString(),
          actionTaken: actionLabel,
          insights: data.insights || undefined,
        },
      ]);
    } catch (err) {
      console.warn('Falling back to local NLP handler:', err);
      const localResult = processLocalFallback(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: localResult.reply,
          timestamp: new Date().toLocaleTimeString(),
          actionTaken: localResult.actionTaken,
          insights: localResult.insights,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Show me only the last 30 days',
    'Give me 50 random integers between 10 and 100',
    'Switch to bar chart',
    'Generate 20 random floats between 0 and 1',
    'Summarize dataset trends',
  ];

  return (
    <>
      {/* Drawer / Modal Container */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-wide uppercase">AI Workspace Assistant</h3>
              <p className="text-[11px] text-slate-400">Natural language control & analysis</p>
            </div>
          </div>
          <button
            onClick={onToggleOpen}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-3 bg-slate-50 border-b border-slate-200">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Quick Commands
          </span>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="text-[11px] text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 px-2.5 py-1 rounded-full transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/30 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 shadow-2xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {msg.actionTaken && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Action: {msg.actionTaken}</span>
                  </div>
                )}

                {msg.insights && (
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                    {msg.insights.map((ins, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>{ins}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[9px] mt-1 text-right ${
                    msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-slate-400 text-xs italic">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span>Processing command...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. 'Show last 30 days' or 'Give me 50 integers 10 to 100'..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
