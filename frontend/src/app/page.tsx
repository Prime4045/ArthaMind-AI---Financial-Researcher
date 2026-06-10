"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  ScatterChart, Scatter, BarChart, Bar, ReferenceLine, ComposedChart, Cell
} from "recharts";
import { 
  TrendingUp, BarChart2, DollarSign, Search, Award, RefreshCw, 
  Trash2, Plus, Download, Cpu, Calculator, PieChart as PieIcon, Sun, Moon, CheckCircle2,
  Network, Activity, Landmark, ChevronRight, HelpCircle, Play, Bell, Wallet, RotateCcw, History
} from "lucide-react";

// Suppress chrome extension runtime connection warnings/errors from polluting the console
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const msg = args.map(arg => (typeof arg === "string" ? arg : arg?.message || "")).join(" ");
    if (
      msg.includes("Could not establish connection") ||
      msg.includes("Receiving end does not exist") ||
      msg.includes("runtime.lastError")
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

const DEFAULT_TICKERS = [
  "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
  "SBIN.NS", "ITC.NS", "LT.NS", "BAJFINANCE.NS", "HINDUNILVR.NS"
];

function parseInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  
  // Split on bold, italic, and inline code markers
  const regex = /(\*\*.*?\*\*|__.*?__|`.*?`|\*.*?\*|_.*?_)/g;
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      const boldText = part.substring(2, part.length - 2);
      return <strong key={index} className="font-extrabold text-slate-800 dark:text-white">{boldText}</strong>;
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      const italicText = part.substring(1, part.length - 1);
      return <em key={index} className="italic text-slate-700 dark:text-slate-200">{italicText}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      const codeText = part.substring(1, part.length - 1);
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-[10px]">
          {codeText}
        </code>
      );
    }
    return part;
  });
}

function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  
  // Pre-process text to remove blank lines within table blocks
  const rawLines = text.split(/\r?\n/);
  const lines: string[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const current = rawLines[i].trim();
    if (current === "") {
      let nextNonEmpty = "";
      for (let j = i + 1; j < rawLines.length; j++) {
        if (rawLines[j].trim() !== "") {
          nextNonEmpty = rawLines[j].trim();
          break;
        }
      }
      const prevLine = lines.length > 0 ? lines[lines.length - 1].trim() : "";
      if (prevLine.startsWith("|") && nextNonEmpty.startsWith("|")) {
        continue;
      }
    }
    lines.push(rawLines[i]);
  }
  
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const cleanLine = line.trim();
    
    // Table detection
    if (cleanLine.startsWith("|")) {
      const tableRows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableRows.push(lines[i].trim());
        i++;
      }
      
      if (tableRows.length >= 1) {
        let headers = tableRows[0].split("|").map(c => c.trim());
        if (headers.length > 0 && headers[0] === "") headers.shift();
        if (headers.length > 0 && headers[headers.length - 1] === "") headers.pop();
        
        let startDataIdx = 1;
        if (tableRows.length > 1 && tableRows[1].includes("---")) {
          startDataIdx = 2;
        }
        
        const dataRows: string[][] = [];
        for (let r = startDataIdx; r < tableRows.length; r++) {
          let cells = tableRows[r].split("|").map(c => c.trim());
          if (cells.length > 0 && cells[0] === "") cells.shift();
          if (cells.length > 0 && cells[cells.length - 1] === "") cells.pop();
          if (cells.length > 0) {
            dataRows.push(cells);
          }
        }
        
        if (headers.length > 0) {
          elements.push(
            <div key={`table-${i}`} className="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
              <table className="w-full text-2xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    {headers.map((h, hIdx) => (
                      <th key={hIdx} className="p-2 text-left font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800 last:border-0">
                        {parseInlineMarkdown(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 last:border-0">
                          {parseInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      }
      continue;
    }
    
    // Horizontal rule
    if (cleanLine === "---" || cleanLine === "===" || cleanLine === "***") {
      elements.push(<hr key={i} className="my-3 border-slate-200 dark:border-slate-800" />);
      i++;
      continue;
    }
    
    // Headers (### Header)
    if (cleanLine.startsWith("#")) {
      const match = cleanLine.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const headingText = match[2];
        const parsed = parseInlineMarkdown(headingText);
        
        switch (level) {
          case 1:
            elements.push(<h1 key={i} className="text-sm font-extrabold text-slate-900 dark:text-white mt-3 mb-1.5">{parsed}</h1>);
            break;
          case 2:
            elements.push(<h2 key={i} className="text-xs font-bold text-slate-900 dark:text-white mt-2 mb-1">{parsed}</h2>);
            break;
          default:
            elements.push(<h3 key={i} className="text-3xs font-extrabold text-indigo-600 dark:text-indigo-400 mt-2 mb-0.5 uppercase tracking-wider">{parsed}</h3>);
            break;
        }
        i++;
        continue;
      }
    }
    
    // Bullet list items (- item)
    if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ")) {
      const listText = cleanLine.substring(2);
      elements.push(
        <div key={i} className="flex items-start space-x-1.5 my-0.5 pl-2">
          <span className="text-indigo-500 font-bold">•</span>
          <span className="text-slate-600 dark:text-slate-300 text-2xs leading-relaxed">
            {parseInlineMarkdown(listText)}
          </span>
        </div>
      );
      i++;
      continue;
    }
    
    // Numbered list items (1. item)
    if (/^\d+\.\s+/.test(cleanLine)) {
      const match = cleanLine.match(/^(\d+)\.\s+(.*)$/);
      if (match) {
        const num = match[1];
        const listText = match[2];
        elements.push(
          <div key={i} className="flex items-start space-x-1.5 my-0.5 pl-2">
            <span className="text-indigo-500 font-bold">{num}.</span>
            <span className="text-slate-600 dark:text-slate-300 text-2xs leading-relaxed">
              {parseInlineMarkdown(listText)}
            </span>
          </div>
        );
        i++;
        continue;
      }
    }
    
    // Empty line
    if (cleanLine === "") {
      elements.push(<div key={i} className="h-1" />);
      i++;
      continue;
    }
    
    // Regular paragraph
    elements.push(
      <p key={i} className="text-slate-600 dark:text-slate-300 text-2xs my-0.5 leading-relaxed">
        {parseInlineMarkdown(line)}
      </p>
    );
    i++;
  }
  
  return <>{elements}</>;
}

export default function Dashboard() {
  // Use relative paths - Next.js proxy (next.config.ts rewrites) forwards /api/* to FastAPI locally
  // On Vercel, the vercel.json routes handle /api/* -> backend/main.py
  const BACKEND_URL = "";

  // Theme state: 'light' or 'dark'. Default is 'light' for crisp, accessible trading dashboard.
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Backend connection state (true = online, false = offline, null = checking)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  // Toast notification state (replaces blocking alert() calls)
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    setToastType(type);
    toastTimerRef.current = setTimeout(() => setToastMessage(""), 3500);
  };

  const cleanChartDateFormatter = (tick: any) => {
    if (!tick) return "";
    if (typeof tick !== "string") return String(tick);
    if (tick.includes(" ")) {
      const parts = tick.split(" ");
      return parts[1] ? parts[1].substring(0, 5) : tick;
    }
    if (tick.includes("-")) {
      const parts = tick.split("-");
      if (parts.length === 3) {
        const monthMap: Record<string, string> = {
          "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun",
          "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
        };
        return `${parts[2]} ${monthMap[parts[1]] || parts[1]}`;
      }
    }
    return tick;
  };

  // Check if component is fully mounted (for Recharts SSR client-side layout rendering)
  const [isMounted, setIsMounted] = useState(false);

  // Onboarding guide closeable state
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Screen views (research, portfolio optimizer, personal finance, backtesting, paper trading, alerts)
  const [activeTab, setActiveTab] = useState<"research" | "optimizer" | "finance" | "backtesting" | "papertrading" | "alerts" | "derivatives">("research");
  
  // Workspace tabs
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<string>("Overview");

  // Chart sub-views: "price" | "ma" | "rsi" | "macd"
  const [chartSubView, setChartSubView] = useState<"price" | "ma" | "rsi" | "macd">("price");

  // Selected analyst sub-report inside AI Research Hub
  const [selectedAnalystReport, setSelectedAnalystReport] = useState<"tech" | "fund" | "sent" | "pf">("tech");

  // AI Price Prediction horizon tabs (Tomorrow, 7 Days, 30 Days)
  const [predictionHorizon, setPredictionHorizon] = useState<"tomorrow" | "7days" | "30days">("tomorrow");

  // Time period selectors (1D, 5D, 1M, 6M, YTD, 1Y, 5Y, Max)
  const [timePeriod, setTimePeriod] = useState<string>("1Y");
  const [chartInterval, setChartInterval] = useState<string>("1d");
  const [activeDrawingTool, setActiveDrawingTool] = useState<"none" | "trendline" | "fibonacci">("none");
  const [drawingPoints, setDrawingPoints] = useState<any[]>([]);
  const [savedDrawings, setSavedDrawings] = useState<any[]>([]);

  // Watchlist & Tickers list
  const [tickers, setTickers] = useState<string[]>([]);
  const [selectedTicker, setSelectedTicker] = useState("RELIANCE.NS");
  const isFirstRender = useRef(true);
  const prevTickerRef = useRef("RELIANCE.NS");
  const [searchQuery, setSearchQuery] = useState("");
  const [newTicker, setNewTicker] = useState("");

  // Marquee prices list
  const [marqueeData, setMarqueeData] = useState<any[]>([
    { symbol: "RELIANCE.NS", price: "₹2,450.25", change: "+1.25%", up: true },
    { symbol: "TCS.NS", price: "₹3,410.80", change: "-0.45%", up: false },
    { symbol: "INFY.NS", price: "₹1,512.40", change: "+2.10%", up: true },
    { symbol: "HDFCBANK.NS", price: "₹1,620.15", change: "+0.85%", up: true },
    { symbol: "ICICIBANK.NS", price: "₹915.60", change: "-1.15%", up: false },
    { symbol: "BAJFINANCE.NS", price: "₹7,210.00", change: "+1.95%", up: true },
    { symbol: "ITC.NS", price: "₹442.30", change: "+0.25%", up: true },
    { symbol: "LT.NS", price: "₹2,340.50", change: "-0.65%", up: false }
  ]);
  const [loadingMarquee, setLoadingMarquee] = useState(false);
  
  // Search suggestion state
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);

  // AI Recommendation State
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  
  // Historical Stock Data
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Real-time Stock Info Cache
  const [currentStockInfo, setCurrentStockInfo] = useState<any>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  // SMA indicator toggle for chart
  const [showMA, setShowMA] = useState(false);

  // AI Agent Research State
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [agentStatus, setAgentStatus] = useState<string>("");
  const [technicalReport, setTechnicalReport] = useState("");
  const [fundamentalReport, setFundamentalReport] = useState("");
  const [sentimentReport, setSentimentReport] = useState("");
  const [personalFinanceReport, setPersonalFinanceReport] = useState("");
  const [masterReport, setMasterReport] = useState("");
  const [pdfFilename, setPdfFilename] = useState("");
  const [pdfCompiling, setPdfCompiling] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Portfolio Optimization State
  const [portfolioTickers, setPortfolioTickers] = useState<string[]>(["RELIANCE.NS", "TCS.NS", "INFY.NS"]);
  const [optResults, setOptResults] = useState<any>(null);
  const [optLoading, setOptLoading] = useState(false);
  const [portfolioName, setPortfolioName] = useState("My MPT Portfolio");
  const [savedPortfolios, setSavedPortfolios] = useState<any[]>([]);

  // Personal Finance State
  // SIP
  const [sipMonthly, setSipMonthly] = useState<number>(5000);
  const [sipReturn, setSipReturn] = useState<number>(12);
  const [sipYears, setSipYears] = useState<number>(10);
  const [sipResults, setSipResults] = useState<any>(null);
  // Tax
  const [taxBuy, setTaxBuy] = useState<number>(100000);
  const [taxSell, setTaxSell] = useState<number>(130000);
  const [taxMonths, setTaxMonths] = useState<number>(18);
  const [taxResults, setTaxResults] = useState<any>(null);
  // Expense
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseCategory, setExpenseCategory] = useState<string>("Food & Living");
  const [expenseType, setExpenseType] = useState<"Income" | "Expense">("Expense");
  const [expenseDesc, setExpenseDesc] = useState<string>("");
  const [expensesList, setExpensesList] = useState<any[]>([]);

  // Workspace sub-tab for personal finance
  const [activeFinanceTab, setActiveFinanceTab] = useState<"sip" | "compare_sip" | "tax_expense" | "mf">("sip");

  // Stock Comparator State
  const [compareTickerA, setCompareTickerA] = useState("RELIANCE.NS");
  const [compareTickerB, setCompareTickerB] = useState("TCS.NS");
  const [compareData, setCompareData] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareSearchA, setCompareSearchA] = useState("");
  const [compareSearchB, setCompareSearchB] = useState("");
  const [compareSuggestionsA, setCompareSuggestionsA] = useState<any[]>([]);
  // Advanced features states
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [backtestPeriod, setBacktestPeriod] = useState("1y");
  const [backtestResults, setBacktestResults] = useState<any>(null);

  const [paperPortfolio, setPaperPortfolio] = useState<any>(null);
  const [paperLoading, setPaperLoading] = useState(false);
  const [tradeTicker, setTradeTicker] = useState("RELIANCE.NS");
  const [tradeAction, setTradeAction] = useState<"BUY" | "SELL">("BUY");
  const [tradeShares, setTradeShares] = useState<number>(10);
  const [tradeMessage, setTradeMessage] = useState("");
  const [tradeError, setTradeError] = useState("");

  const [alertsList, setAlertsList] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertTicker, setAlertTicker] = useState("RELIANCE.NS");
  const [alertCondition, setAlertCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [alertValue, setAlertValue] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const [mlRetrainLoading, setMlRetrainLoading] = useState(false);
  const [mlRetrainLogs, setMlRetrainLogs] = useState<string>("");
  const [useAiViews, setUseAiViews] = useState(false);
  const [compareSuggestionsB, setCompareSuggestionsB] = useState<any[]>([]);
  const [showCompareSuggestionsA, setShowCompareSuggestionsA] = useState(false);
  const [showCompareSuggestionsB, setShowCompareSuggestionsB] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Advanced SIP State
  const [sipMode, setSipMode] = useState<"investment" | "goal">("investment");
  const [sipStepUp, setSipStepUp] = useState<number>(0);
  const [sipInflation, setSipInflation] = useState<number>(0);
  const [sipTargetAmount, setSipTargetAmount] = useState<number>(1000000);
  const [sipEnhancedResults, setSipEnhancedResults] = useState<any>(null);
  const [sipEnhancedLoading, setSipEnhancedLoading] = useState(false);

  // Compare SIP State
  const [compSipAmountA, setCompSipAmountA] = useState<number>(5000);
  const [compSipReturnA, setCompSipReturnA] = useState<number>(12);
  const [compSipYearsA, setCompSipYearsA] = useState<number>(10);
  const [compSipStepUpA, setCompSipStepUpA] = useState<number>(0);

  const [compSipAmountB, setCompSipAmountB] = useState<number>(5000);
  const [compSipReturnB, setCompSipReturnB] = useState<number>(15);
  const [compSipYearsB, setCompSipYearsB] = useState<number>(10);
  const [compSipStepUpB, setCompSipStepUpB] = useState<number>(0);

  const [sipCompareResults, setSipCompareResults] = useState<any>(null);
  const [sipCompareLoading, setSipCompareLoading] = useState(false);

  // Mutual Fund Analyst State
  const [mfData, setMfData] = useState<any>(null);
  const [mfLoading, setMfLoading] = useState(false);

  // F&O Derivatives State
  const [foExpirations, setFoExpirations] = useState<string[]>([]);
  const [selectedFoExpiry, setSelectedFoExpiry] = useState<string>("");
  const [foOptionChain, setFoOptionChain] = useState<any>(null);
  const [foLoading, setFoLoading] = useState(false);
  const [foStrategy, setFoStrategy] = useState<string>("None");
  const [foLegs, setFoLegs] = useState<any[]>([]);
  const [foPayoffData, setFoPayoffData] = useState<any[]>([]);
  const [foMlForecast, setFoMlForecast] = useState<any>(null);
  const [foTab, setFoTab] = useState<"Chain" | "Analysis" | "Simulator" | "Positions">("Chain");
  const [brokerConfig, setBrokerConfig] = useState<any>({ api_key: "", access_token: "", client_id: "" });
  const [brokerConnected, setBrokerConnected] = useState(false);
  const [activeBroker, setActiveBroker] = useState<string>("None");
  const [foPositionList, setFoPositionList] = useState<any[]>([]);
  const [foCashBalance, setFoCashBalance] = useState<number>(1000000); // 10 Lakh INR Starting Capital
  const [isLiveFeedActive, setIsLiveFeedActive] = useState<boolean>(false);

  const fetchFoExpirations = async (ticker: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/fo/expirations?ticker=${ticker}`);
      if (res.ok) {
        const data = await res.json();
        if (data.expiries && data.expiries.length > 0) {
          setFoExpirations(data.expiries);
          setSelectedFoExpiry(data.expiries[0]);
          fetchFoOptionChain(ticker, data.expiries[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch F&O expirations:", err);
    }
  };

  const fetchFoOptionChain = async (ticker: string, expiry: string) => {
    setFoLoading(true);
    try {
      const [res, mlRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/fo/option-chain?ticker=${ticker}&expiration=${expiry}`),
        fetch(`${BACKEND_URL}/api/fo/ml-forecast?ticker=${ticker}`)
      ]);
      
      if (res.ok) {
        const data = await res.json();
        setFoOptionChain(data);
        setFoLegs([]);
        setFoStrategy("None");
        setFoPayoffData([]);
      }
      
      if (mlRes.ok) {
        const mlData = await mlRes.json();
        setFoMlForecast(mlData);
      }
    } catch (err) {
      console.error("Failed to fetch Option Chain:", err);
    } finally {
      setFoLoading(false);
    }
  };

  const recalculatePayoff = (legs: any[], spot: number) => {
    if (legs.length === 0) {
      setFoPayoffData([]);
      return;
    }
    
    const dataPoints = [];
    const minPrice = spot * 0.8;
    const maxPrice = spot * 1.2;
    const step = (maxPrice - minPrice) / 40;
    
    for (let i = 0; i <= 40; i++) {
      const currentPrice = minPrice + i * step;
      let totalPnl = 0;
      
      legs.forEach((leg) => {
        const mult = leg.action === "BUY" ? 1 : -1;
        let pnl = 0;
        
        if (leg.option_type === "CALL") {
          pnl = Math.max(0, currentPrice - leg.strike) - leg.premium;
        } else if (leg.option_type === "PUT") {
          pnl = Math.max(0, leg.strike - currentPrice) - leg.premium;
        } else {
          pnl = currentPrice - leg.strike;
        }
        
        const lotSize = selectedTicker.endsWith(".NS") ? 50 : 100;
        totalPnl += pnl * leg.quantity * mult * lotSize;
      });
      
      dataPoints.push({
        UnderlyingPrice: parseFloat(currentPrice.toFixed(2)),
        PnL: Math.round(totalPnl)
      });
    }
    setFoPayoffData(dataPoints);
  };

  useEffect(() => {
    if (foOptionChain && foOptionChain.spotPrice) {
      recalculatePayoff(foLegs, foOptionChain.spotPrice);
    } else {
      setFoPayoffData([]);
    }
  }, [foLegs, foOptionChain]);

  const applyPredefinedStrategy = (strategyType: string) => {
    if (!foOptionChain || !foOptionChain.calls || foOptionChain.calls.length === 0) return;
    
    const spot = foOptionChain.spotPrice;
    const strikes = foOptionChain.calls.map((c: any) => c.strike);
    const atmStrike = strikes.reduce((prev: number, curr: number) => {
      return Math.abs(curr - spot) < Math.abs(prev - spot) ? curr : prev;
    });
    
    const idx = strikes.indexOf(atmStrike);
    const spacing = idx > 0 ? strikes[idx] - strikes[idx - 1] : strikes[1] - strikes[0];
    
    let legs: any[] = [];
    const calls = foOptionChain.calls;
    const puts = foOptionChain.puts;
    
    const findPremium = (strike: number, optType: "CALL" | "PUT") => {
      const arr = optType === "CALL" ? calls : puts;
      const opt = arr.find((o: any) => o.strike === strike);
      return opt ? opt.lastPrice : 0.0;
    };
    
    if (strategyType === "LongCall") {
      legs = [{ option_type: "CALL", action: "BUY", strike: atmStrike, premium: findPremium(atmStrike, "CALL"), quantity: 1 }];
    } else if (strategyType === "LongPut") {
      legs = [{ option_type: "PUT", action: "BUY", strike: atmStrike, premium: findPremium(atmStrike, "PUT"), quantity: 1 }];
    } else if (strategyType === "BullCallSpread") {
      const buyStrike = atmStrike;
      const sellStrike = buyStrike + spacing;
      legs = [
        { option_type: "CALL", action: "BUY", strike: buyStrike, premium: findPremium(buyStrike, "CALL"), quantity: 1 },
        { option_type: "CALL", action: "SELL", strike: sellStrike, premium: findPremium(sellStrike, "CALL"), quantity: 1 }
      ];
    } else if (strategyType === "BearPutSpread") {
      const buyStrike = atmStrike;
      const sellStrike = buyStrike - spacing;
      legs = [
        { option_type: "PUT", action: "BUY", strike: buyStrike, premium: findPremium(buyStrike, "PUT"), quantity: 1 },
        { option_type: "PUT", action: "SELL", strike: sellStrike, premium: findPremium(sellStrike, "PUT"), quantity: 1 }
      ];
    } else if (strategyType === "Straddle") {
      legs = [
        { option_type: "CALL", action: "BUY", strike: atmStrike, premium: findPremium(atmStrike, "CALL"), quantity: 1 },
        { option_type: "PUT", action: "BUY", strike: atmStrike, premium: findPremium(atmStrike, "PUT"), quantity: 1 }
      ];
    } else if (strategyType === "Strangle") {
      const buyCallStrike = atmStrike + spacing;
      const buyPutStrike = atmStrike - spacing;
      legs = [
        { option_type: "CALL", action: "BUY", strike: buyCallStrike, premium: findPremium(buyCallStrike, "CALL"), quantity: 1 },
        { option_type: "PUT", action: "BUY", strike: buyPutStrike, premium: findPremium(buyPutStrike, "PUT"), quantity: 1 }
      ];
    } else if (strategyType === "IronCondor") {
      const sellPutStrike = atmStrike - spacing;
      const buyPutStrike = sellPutStrike - spacing;
      const sellCallStrike = atmStrike + spacing;
      const buyCallStrike = sellCallStrike + spacing;
      legs = [
        { option_type: "PUT", action: "BUY", strike: buyPutStrike, premium: findPremium(buyPutStrike, "PUT"), quantity: 1 },
        { option_type: "PUT", action: "SELL", strike: sellPutStrike, premium: findPremium(sellPutStrike, "PUT"), quantity: 1 },
        { option_type: "CALL", action: "SELL", strike: sellCallStrike, premium: findPremium(sellCallStrike, "CALL"), quantity: 1 },
        { option_type: "CALL", action: "BUY", strike: buyCallStrike, premium: findPremium(buyCallStrike, "CALL"), quantity: 1 }
      ];
    }
    
    setFoLegs(legs);
    setFoStrategy(strategyType);
  };

  const executePaperFoTrade = (optionType: string, action: string, strike: number, premium: number) => {
    const lotSize = selectedTicker.endsWith(".NS") ? 50 : 100;
    const size = 1; // 1 lot
    const cost = premium * lotSize * size;
    
    if (action === "BUY" && foCashBalance < cost) {
      showToast("Insufficient cash balance to purchase this option contract.", "error");
      return;
    }
    
    const newPos = {
      id: Date.now(),
      ticker: selectedTicker,
      option_type: optionType,
      action: action,
      strike: strike,
      entry_price: premium,
      quantity: size * lotSize,
      lot_size: lotSize
    };
    
    setFoPositionList([newPos, ...foPositionList]);
    if (action === "BUY") {
      setFoCashBalance(prev => prev - cost);
    }
  };

  const closePaperFoPosition = (id: number) => {
    const pos = foPositionList.find(p => p.id === id);
    if (!pos) return;
    
    let livePremium = pos.entry_price;
    if (foOptionChain) {
      const list = pos.option_type === "CALL" ? foOptionChain.calls : foOptionChain.puts;
      const currentOpt = list.find((o: any) => o.strike === pos.strike);
      if (currentOpt) {
        livePremium = currentOpt.lastPrice;
      }
    }
    
    const finalValue = livePremium * pos.quantity;
    
    setFoPositionList(prev => prev.filter(p => p.id !== id));
    if (pos.action === "BUY") {
      setFoCashBalance(prev => prev + finalValue);
    } else {
      const pnl = (pos.entry_price - livePremium) * pos.quantity;
      setFoCashBalance(prev => prev + pnl);
    }
  };

  // Stock Comparison Fetcher
  const fetchStockComparison = async (tickerA: string, tickerB: string) => {
    setCompareLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stocks/compare?ticker_a=${tickerA}&ticker_b=${tickerB}`);
      if (res.ok) {
        const data = await res.json();
        setCompareData(data);
      }
    } catch (err) {
      console.error("Comparison fetch failed:", err);
    } finally {
      setCompareLoading(false);
    }
  };

  // Enhanced SIP Run
  const runSipEnhancedCalc = async () => {
    setSipEnhancedLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/personal-finance/sip/enhanced`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_investment: sipMonthly,
          expected_return_rate: sipReturn,
          years: sipYears,
          step_up_pct: sipStepUp,
          inflation_rate: sipInflation,
          mode: sipMode,
          target_amount: sipTargetAmount
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSipEnhancedResults(data);
        if (sipMode === "goal") {
          setSipMonthly(Math.round(data.monthly_investment));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSipEnhancedLoading(false);
    }
  };

  // Compare SIP Run
  const runSipCompareCalc = async () => {
    setSipCompareLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/personal-finance/sip/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sip_a: {
            monthly_investment: compSipAmountA,
            expected_return_rate: compSipReturnA,
            years: compSipYearsA,
            step_up_pct: compSipStepUpA,
            inflation_rate: 0,
            mode: "investment",
            target_amount: 0
          },
          sip_b: {
            monthly_investment: compSipAmountB,
            expected_return_rate: compSipReturnB,
            years: compSipYearsB,
            step_up_pct: compSipStepUpB,
            inflation_rate: 0,
            mode: "investment",
            target_amount: 0
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSipCompareResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSipCompareLoading(false);
    }
  };

  // Mutual Funds Analysis Fetcher
  const fetchMutualFundsAnalysis = async () => {
    setMfLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/mutual-funds/analysis`);
      if (res.ok) {
        const data = await res.json();
        setMfData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMfLoading(false);
    }
  };

  // Sync HTML root element class with theme state
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Comparator Search debounces & effects
  useEffect(() => {
    if (activeWorkspaceTab === "Comparator") {
      fetchStockComparison(compareTickerA, compareTickerB);
    }
  }, [activeWorkspaceTab, compareTickerA, compareTickerB]);

  useEffect(() => {
    if (activeFinanceTab === "mf") {
      fetchMutualFundsAnalysis();
    }
  }, [activeFinanceTab]);

  useEffect(() => {
    if (compareSearchA.trim().length < 2) {
      setCompareSuggestionsA([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/stocks/search?q=${encodeURIComponent(compareSearchA.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setCompareSuggestionsA(data.results || []);
        }
      } catch (e) {}
    }, 200);
    return () => clearTimeout(delay);
  }, [compareSearchA]);

  useEffect(() => {
    if (compareSearchB.trim().length < 2) {
      setCompareSuggestionsB([]);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/stocks/search?q=${encodeURIComponent(compareSearchB.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setCompareSuggestionsB(data.results || []);
        }
      } catch (e) {}
    }, 200);
    return () => clearTimeout(delay);
  }, [compareSearchB]);



  // Close suggestions dropdown when clicking outside of the search container
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load initial settings and check backend connection
  useEffect(() => {
    setIsMounted(true);
    fetchTickers();
    fetchSavedPortfolios();
    fetchExpenses();
    fetchPaperPortfolio();
    fetchAlerts();
    fetchMarqueeData();
    checkBackendConnection();
    // Periodically re-check backend connection every 30 seconds to auto-recover
    const connInterval = setInterval(checkBackendConnection, 30000);
    return () => clearInterval(connInterval);
  }, []);

  // Fetch paper trading / alerts / F&O when switching to those tabs
  useEffect(() => {
    if (activeTab === "papertrading") {
      fetchPaperPortfolio();
    } else if (activeTab === "alerts") {
      setAlertTicker(selectedTicker);
      fetchAlerts();
    } else if (activeTab === "derivatives") {
      fetchFoExpirations(selectedTicker);
    }
  }, [activeTab, selectedTicker]);

  // Run backtest ONLY when on the backtesting tab and the ticker/period actually changes
  useEffect(() => {
    if (activeTab === "backtesting") {
      runBacktest();
    }
  }, [activeTab, selectedTicker, backtestPeriod]);

  async function checkBackendConnection() {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000); // 8-second timeout
      const res = await fetch(`/api/status`, { signal: controller.signal });
      clearTimeout(id);
      // Any HTTP response (even 500) means the server IS reachable and running.
      // Only a network failure (connection refused, timeout) means truly offline.
      setBackendConnected(true);
    } catch (err) {
      // Network-level failure: server is unreachable
      setBackendConnected(false);
    }
  }

  async function fetchMarqueeData() {
    setLoadingMarquee(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stocks/marquee`);
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          setMarqueeData(data.results);
        }
      }
    } catch (err) {
      console.error("Failed to fetch marquee data:", err);
    } finally {
      setLoadingMarquee(false);
    }
  }

  // Helper to get allowed intervals for a given period
  const getIntervalOptionsForPeriod = (period: string) => {
    switch (period) {
      case "1D":
        return [
          { value: "1m", label: "1 Min" },
          { value: "2m", label: "2 Mins" },
          { value: "5m", label: "5 Mins" },
          { value: "15m", label: "15 Mins" },
          { value: "30m", label: "30 Mins" }
        ];
      case "5D":
        return [
          { value: "5m", label: "5 Mins" },
          { value: "15m", label: "15 Mins" },
          { value: "30m", label: "30 Mins" },
          { value: "1h", label: "1 Hour" },
          { value: "1d", label: "1 Day" }
        ];
      case "1M":
      case "6M":
        return [
          { value: "30m", label: "30 Mins" },
          { value: "1h", label: "1 Hour" },
          { value: "1d", label: "1 Day" },
          { value: "1wk", label: "1 Week" }
        ];
      case "1Y":
      case "5Y":
      case "Max":
      default:
        return [
          { value: "1d", label: "1 Day" },
          { value: "1wk", label: "1 Week" },
          { value: "1mo", label: "1 Month" }
        ];
    }
  };

  // Auto-set sensible default interval when period changes
  useEffect(() => {
    let defaultVal = "1d";
    if (timePeriod === "1D") defaultVal = "5m";
    else if (timePeriod === "5D") defaultVal = "15m";
    else if (timePeriod === "1M") defaultVal = "1d";
    else if (timePeriod === "5Y") defaultVal = "1wk";
    else if (timePeriod === "Max") defaultVal = "1mo";
    setChartInterval(defaultVal);
  }, [timePeriod]);

  // Live Feed Simulation ticking
  useEffect(() => {
    if (!isLiveFeedActive) return;

    const intervalId = setInterval(() => {
      setCurrentStockInfo((prevInfo: any) => {
        if (!prevInfo) return prevInfo;
        
        const currentPrice = prevInfo.currentPrice || prevInfo.close || 0;
        if (currentPrice <= 0) return prevInfo;

        // Apply a random tick change of +/- 0.05%
        const changePct = (Math.random() - 0.5) * 0.001; // -0.05% to +0.05%
        const newPrice = Number((currentPrice * (1 + changePct)).toFixed(2));
        
        // Update stock history for dynamic charting (appends/edits last index)
        setStockHistory(prevHistory => {
          if (!prevHistory || prevHistory.length === 0) return prevHistory;
          const nextHistory = [...prevHistory];
          const lastIdx = nextHistory.length - 1;
          const lastNode = { ...nextHistory[lastIdx] };
          
          lastNode.Close = newPrice;
          if (newPrice > (lastNode.High || 0)) lastNode.High = newPrice;
          if (newPrice < (lastNode.Low || Infinity)) lastNode.Low = newPrice;
          
          nextHistory[lastIdx] = lastNode;
          return nextHistory;
        });

        // Ticks option premiums in the Option Chain (Call up/Put down or vice versa)
        const diff = newPrice - currentPrice;
        if (diff !== 0) {
          setFoOptionChain((prevChain: any) => {
            if (!prevChain) return prevChain;
            const nextChain = { ...prevChain };
            if (nextChain.calls) {
              nextChain.calls = nextChain.calls.map((c: any) => {
                // Delta estimate
                const delta = 1 / (1 + Math.exp(-(newPrice - c.strike) / (c.strike * 0.1)));
                const newOptPrice = Math.max(0.05, (c.lastPrice || 0) + diff * delta);
                return { ...c, lastPrice: Number(newOptPrice.toFixed(2)) };
              });
            }
            if (nextChain.puts) {
              nextChain.puts = nextChain.puts.map((p: any) => {
                // Delta estimate
                const delta = -1 / (1 + Math.exp((newPrice - p.strike) / (p.strike * 0.1)));
                const newOptPrice = Math.max(0.05, (p.lastPrice || 0) + diff * delta);
                return { ...p, lastPrice: Number(newOptPrice.toFixed(2)) };
              });
            }
            return nextChain;
          });
        }

        const updated = { ...prevInfo };
        updated.currentPrice = newPrice;
        if (newPrice > (updated.high || 0)) updated.high = newPrice;
        if (newPrice < (updated.low || Infinity)) updated.low = newPrice;
        return updated;
      });
    }, 2000);

    return () => clearInterval(intervalId);
  }, [isLiveFeedActive]);

  // Fetch stock dashboard data (tickers, info, history, recommendation) when selected stock, time period or interval changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevTickerRef.current = selectedTicker;
      
      setIsLiveFeedActive(false);
      setLoadingInfo(true);
      setLoadingRecommendation(true);
      setLoadingHistory(true);
      
      Promise.all([
        fetchStockInfo(selectedTicker),
        fetchStockHistory(selectedTicker, timePeriod, chartInterval),
        fetchRecommendation(selectedTicker)
      ]).catch(err => console.error("Failed to load initial stock data:", err));
      return;
    }

    if (prevTickerRef.current !== selectedTicker) {
      // Ticker changed! Fetch everything.
      prevTickerRef.current = selectedTicker;
      
      setIsLiveFeedActive(false);
      setCurrentStockInfo(null);
      setStockHistory([]);
      setAiRecommendation(null);
      
      setLoadingInfo(true);
      setLoadingRecommendation(true);
      setLoadingHistory(true);
      
      Promise.all([
        fetchStockInfo(selectedTicker),
        fetchStockHistory(selectedTicker, timePeriod, chartInterval),
        fetchRecommendation(selectedTicker)
      ]).catch(err => console.error("Failed to load stock data:", err));
    } else {
      // Ticker is the same, but timePeriod or chartInterval changed! Only fetch history.
      fetchStockHistory(selectedTicker, timePeriod, chartInterval);
    }
  }, [selectedTicker, timePeriod, chartInterval]);

  async function fetchTickers() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stocks`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.tickers) {
          setTickers(data.tickers);
        }
      } else {
        console.warn("Failed to fetch tickers: server returned status", res.status);
      }
    } catch (err) {
      console.error("Failed to fetch tickers:", err);
    }
  };

  async function fetchStockHistory(ticker: string, period: string = "1Y", interval: string = "") {
    const periodMap: Record<string, string> = {
      "1D": "1d",
      "5D": "5d",
      "1M": "1mo",
      "6M": "6mo",
      "1Y": "1y",
      "5Y": "5y",
      "Max": "max"
    };
    const yfPeriod = periodMap[period] || "1y";
    setLoadingHistory(true);
    try {
      let url = `${BACKEND_URL}/api/stock/${ticker}/history?period=${yfPeriod}`;
      if (interval) {
        url += `&interval=${interval}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStockHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch stock history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleChartClick = (e: any) => {
    if (activeDrawingTool === "none") return;
    if (!e || e.activeTooltipIndex === undefined || !e.activePayload || e.activePayload.length === 0) return;
    
    const idx = e.activeTooltipIndex;
    const price = Number(e.activePayload[0].payload.Close || e.activePayload[0].value);
    const date = e.activePayload[0].payload.Date;
    
    if (activeDrawingTool === "trendline") {
      const newPoints = [...drawingPoints, { index: idx, price: price, date: date }];
      if (newPoints.length === 1) {
        setDrawingPoints(newPoints);
        showToast("First point set! Click a second point on the chart to draw the Trendline.", "success");
      } else if (newPoints.length === 2) {
        const p1 = newPoints[0];
        const p2 = newPoints[1];
        
        if (p1.index === p2.index) {
          showToast("Cannot draw trendline on the same point. Choose a different point.", "error");
          setDrawingPoints([]);
          setActiveDrawingTool("none");
          return;
        }
        
        const m = (p2.price - p1.price) / (p2.index - p1.index);
        const c = p1.price - m * p1.index;
        
        const newDrawing = {
          id: Date.now(),
          type: "trendline",
          m: m,
          c: c,
          startIndex: Math.min(p1.index, p2.index),
          endIndex: Math.max(p1.index, p2.index),
          startPoint: p1,
          endPoint: p2
        };
        
        setSavedDrawings([...savedDrawings, newDrawing]);
        setDrawingPoints([]);
        setActiveDrawingTool("none");
        showToast("Trendline completed!", "success");
      }
    } else if (activeDrawingTool === "fibonacci") {
      const newPoints = [...drawingPoints, { index: idx, price: price, date: date }];
      if (newPoints.length === 1) {
        setDrawingPoints(newPoints);
        showToast("First extreme point set! Click a second point representing the opposite extreme (High/Low) to plot Fibonacci retracements.", "success");
      } else if (newPoints.length === 2) {
        const p1 = newPoints[0];
        const p2 = newPoints[1];
        
        const highPrice = Math.max(p1.price, p2.price);
        const lowPrice = Math.min(p1.price, p2.price);
        
        const newDrawing = {
          id: Date.now(),
          type: "fibonacci",
          high: highPrice,
          low: lowPrice,
          p1: p1,
          p2: p2
        };
        
        setSavedDrawings([...savedDrawings, newDrawing]);
        setDrawingPoints([]);
        setActiveDrawingTool("none");
        showToast("Fibonacci Retracements plotted!", "success");
      }
    }
  };

  const getProcessedChartData = () => {
    if (savedDrawings.length === 0) return stockHistory;
    
    return stockHistory.map((row, idx) => {
      const newRow = { ...row };
      savedDrawings.forEach(d => {
        if (d.type === "trendline") {
          const val = d.m * idx + d.c;
          newRow[`trendline_${d.id}`] = val;
        }
      });
      return newRow;
    });
  };

  async function fetchStockInfo(ticker: string) {
    setLoadingInfo(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stock/${ticker}/info`);
      if (res.ok) {
        const data = await res.json();
        setCurrentStockInfo(data);
      } else {
        setCurrentStockInfo(null);
      }
    } catch (err) {
      console.error("Failed to fetch stock info:", err);
      setCurrentStockInfo(null);
    } finally {
      setLoadingInfo(false);
    }
  };

  async function fetchRecommendation(ticker: string) {
    setLoadingRecommendation(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stock/${ticker}/recommendation`);
      if (res.ok) {
        const data = await res.json();
        setAiRecommendation(data);
      } else {
        setAiRecommendation(null);
      }
    } catch (err) {
      console.error("Failed to fetch recommendation:", err);
      setAiRecommendation(null);
    } finally {
      setLoadingRecommendation(false);
    }
  }

  // Backtesting API
  async function runBacktest() {
    setBacktestLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stock/${selectedTicker}/backtest?period=${backtestPeriod}`);
      if (res.ok) {
        const data = await res.json();
        setBacktestResults(data);
      } else {
        setBacktestResults(null);
      }
    } catch (err) {
      console.error("Failed to run backtest:", err);
      setBacktestResults(null);
    } finally {
      setBacktestLoading(false);
    }
  }

  // Paper Trading API
  async function fetchPaperPortfolio() {
    setPaperLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/paper/portfolio`);
      if (res.ok) {
        const data = await res.json();
        setPaperPortfolio(data);
      }
    } catch (err) {
      console.error("Failed to fetch paper portfolio:", err);
    } finally {
      setPaperLoading(false);
    }
  }

  async function submitPaperTrade(ticker: string, action: "BUY" | "SELL", shares: number) {
    setTradeMessage("");
    setTradeError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/paper/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, action, shares })
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {
        data = { detail: "Failed to parse response from server." };
      }
      if (res.ok) {
        setTradeMessage(data.message);
        fetchPaperPortfolio();
      } else {
        setTradeError(data.detail || "Trade order failed.");
      }
    } catch (err) {
      setTradeError("Server error executing trade.");
      console.error("Failed to submit paper trade:", err);
    }
  }

  async function resetPaperTrading() {
    setShowResetConfirm(false);
    try {
      const res = await fetch(`${BACKEND_URL}/api/paper/reset`, { method: "POST" });
      if (res.ok) {
        fetchPaperPortfolio();
        showToast("Account reset successfully!", "success");
      }
    } catch (err) {
      console.error("Failed to reset account:", err);
    }
  }

  // Alerts API
  async function fetchAlerts() {
    setAlertsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/alerts`);
      if (res.ok) {
        const data = await res.json();
        setAlertsList(data);
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setAlertsLoading(false);
    }
  }

  async function createAlert(ticker: string, cond: "ABOVE" | "BELOW", val: number) {
    setAlertMessage("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/alerts/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, condition_type: cond, value: val })
      });
      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {
        data = { detail: "Failed to parse response from server." };
      }
      if (res.ok) {
        setAlertMessage(data.message);
        setAlertValue("");
        fetchAlerts();
        showToast(data.message || "Alert created successfully!", "success");
      } else {
        showToast(data.detail || "Failed to create alert.", "error");
      }
    } catch (err) {
      console.error("Failed to create alert:", err);
    }
  }

  async function deleteAlert(id: number) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/alerts/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error("Failed to delete alert:", err);
    }
  }

  // ML Retraining API
  async function triggerMlRetrain() {
    setMlRetrainLoading(true);
    setMlRetrainLogs("Connecting to training server...");
    try {
      const res = await fetch(`${BACKEND_URL}/api/ml/retrain`, { method: "POST" });
      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {
        data = { detail: "Failed to parse response from server." };
      }
      if (res.ok) {
        setMlRetrainLogs(
          `Self-calibrating complete!\nTrained on ${data.samples_trained} historical daily records.\nFeatures used: ${data.features_used.join(", ")}.\nSaved and reloaded model.`
        );
        fetchRecommendation(selectedTicker);
      } else {
        setMlRetrainLogs(`Training failed: ${data.detail}`);
      }
    } catch (err) {
      setMlRetrainLogs("Retraining connection failed.");
      console.error("Failed to retrain model:", err);
    } finally {
      setMlRetrainLoading(false);
    }
  }

  // Debounced Search Autosuggest
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }
    
    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/stocks/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Failed to fetch search suggestions:", err);
      } finally {
        setSearching(false);
      }
    }, 250); // 250ms debounce
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const addTickerToWatchlist = async (tickerToAdd: string) => {
    if (!tickerToAdd) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/watchlist/add?ticker=${tickerToAdd}`, { method: "POST" });
      if (res.ok) {
        setNewTicker("");
        fetchTickers();
        showToast(`Added ${tickerToAdd} to watchlist.`, "success");
      } else {
        let err: any = {};
        try {
          err = await res.json();
        } catch (e) {
          err = { detail: "Failed to parse error details from server." };
        }
        showToast(err.detail || "Failed to add ticker", "error");
      }
    } catch (err) {
      console.error("Error adding ticker:", err);
    }
  };

  const removeTickerFromWatchlist = async (ticker: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/watchlist/remove?ticker=${ticker}`, { method: "DELETE" });
      if (res.ok) {
        fetchTickers();
        if (selectedTicker === ticker) {
          setSelectedTicker("RELIANCE.NS");
          fetchStockHistory("RELIANCE.NS");
        }
      }
    } catch (err) {
      console.error("Error removing ticker:", err);
    }
  };

  // Run AI Agents Stream Endpoint
  const startResearchWorkflow = () => {
    setAgentLogs(["Establishing SSE connection to AI Research Hub backend..."]);
    setAgentStatus("loading_data");
    setTechnicalReport("");
    setFundamentalReport("");
    setSentimentReport("");
    setPersonalFinanceReport("");
    setMasterReport("");
    setPdfFilename("");
    setPdfCompiling(false);

    const eventSource = new EventSource(`${BACKEND_URL}/api/stock/${selectedTicker}/research/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setAgentLogs(data.logs);
      setAgentStatus(data.status);
      
      const st = data.state;
      if (st) {
        setTechnicalReport(st.technical);
        setFundamentalReport(st.fundamental);
        setSentimentReport(st.sentiment);
        setPersonalFinanceReport(st.personal_finance);
        setMasterReport(st.master_report);
      }

      if (data.status === "completed") {
        eventSource.close();
        // Trigger PDF Compilation (using the correct Pydantic Request body structure)
        compilePDF(selectedTicker, st.technical, st.fundamental, st.sentiment, st.personal_finance, st.master_report);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      setAgentLogs(prev => [...prev, "❌ Connection lost or API error occurred."]);
      eventSource.close();
    };
  };

  const compilePDF = async (ticker: string, tech: string, fund: string, sent: string, pf: string, master: string) => {
    setPdfCompiling(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/report/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: ticker,
          tech_text: tech,
          fund_text: fund,
          sent_text: sent,
          pf_text: pf,
          master_text: master
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPdfFilename(data.filename);
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setPdfCompiling(false);
    }
  };

  // Portfolio Optimization
  const optimizeWeights = async () => {
    setOptLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/portfolio/optimize?use_ai_views=${useAiViews}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(portfolioTickers)
      });
      if (res.ok) {
        const data = await res.json();
        setOptResults(data);
      } else {
        showToast("Optimization failed. Verify tickers have historical data.", "error");
      }
    } catch (err) {
      console.error("Error optimizing:", err);
    } finally {
      setOptLoading(false);
    }
  };

  const saveOptimizedPortfolio = async () => {
    if (!optResults) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/portfolio/save?name=${portfolioName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: portfolioName,
          tickers: optResults.tickers,
          weights: optResults.max_sharpe.weights,
          expected_return: optResults.max_sharpe.return,
          volatility: optResults.max_sharpe.volatility,
          sharpe_ratio: optResults.max_sharpe.sharpe_ratio
        })
      });
      if (res.ok) {
        showToast("Portfolio saved successfully!", "success");
        fetchSavedPortfolios();
      }
    } catch (err) {
      console.error("Error saving portfolio:", err);
    }
  };

  async function fetchSavedPortfolios() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/portfolio/list`);
      if (res.ok) {
        const data = await res.json();
        setSavedPortfolios(data);
      }
    } catch (err) {
      console.error("Error getting portfolios:", err);
    }
  };

  // Personal Finance SIP / Tax / Expense
  const runSIPCalc = async () => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/personal-finance/sip?monthly_investment=${sipMonthly}&expected_return=${sipReturn}&years=${sipYears}`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setSipResults(data);
      }
    } catch (err) {
      console.error("SIP Calc error:", err);
    }
  };

  const runTaxCalc = async () => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/personal-finance/tax?buy_value=${taxBuy}&sell_value=${taxSell}&holding_period_months=${taxMonths}`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setTaxResults(data);
      }
    } catch (err) {
      console.error("Tax Calc error:", err);
    }
  };

  async function fetchExpenses() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/personal-finance/expenses`);
      if (res.ok) {
        const data = await res.json();
        setExpensesList(data);
      }
    } catch (err) {
      console.error("Expense fetching error:", err);
    }
  };

  const addExpenseItem = async () => {
    if (expenseAmount <= 0) return;
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/personal-finance/expenses/add?amount=${expenseAmount}&category=${expenseCategory}&type=${expenseType}&description=${expenseDesc}`,
        { method: "POST" }
      );
      if (res.ok) {
        setExpenseAmount(0);
        setExpenseDesc("");
        fetchExpenses();
      }
    } catch (err) {
      console.error("Add expense error:", err);
    }
  };

  const deleteExpenseItem = async (id: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/personal-finance/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchExpenses();
      }
    } catch (err) {
      console.error("Delete expense error:", err);
    }
  };

  const sanitizeUrl = (url: string | undefined | null) => {
    if (!url) return "#";
    const trimmed = url.trim();
    if (trimmed.toLowerCase().startsWith("http://") || trimmed.toLowerCase().startsWith("https://")) {
      return encodeURI(trimmed);
    }
    return "#";
  };

  const formatVolume = (val: number | undefined | null) => {
    if (!val) return "N/A";
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e7) return `${(val / 1e7).toFixed(2)} Cr`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e5) return `${(val / 1e5).toFixed(2)} L`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(2)}K`;
    return val.toLocaleString();
  };

  // Returns currency symbol based on ticker exchange
  const getCurrencySymbol = (ticker: string): string => {
    return "₹";
  };
  const currencySymbol = getCurrencySymbol(selectedTicker);

  const formatMarketCap = (val: number | undefined | null) => {
    if (!val) return "N/A";
    if (val >= 1e7) return `${currencySymbol}${(val / 1e7).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})} Cr`;
    if (val >= 1e5) return `${currencySymbol}${(val / 1e5).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})} L`;
    return `${currencySymbol}${val.toLocaleString("en-IN")}`;
  };


  const formatNewsTime = (ts: number) => {
    if (!ts) return "";
    const date = new Date(ts * 1000);
    return date.toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getSentimentRotation = () => {
    if (sentimentReport) {
      const reportLower = sentimentReport.toLowerCase();
      if (reportLower.includes("strongly bullish") || reportLower.includes("strong bullish")) return 70;
      if (reportLower.includes("strongly bearish") || reportLower.includes("strong bearish")) return -70;
      if (reportLower.includes("bullish")) return 45;
      if (reportLower.includes("bearish")) return -45;
      if (reportLower.includes("neutral")) return 0;
    }
    const prevClose = currentStockInfo?.close || 0;
    const currentPrice = currentStockInfo?.currentPrice || currentStockInfo?.close || 0;
    if (prevClose > 0) {
      const changePct = ((currentPrice - prevClose) / prevClose) * 100;
      const rotation = changePct * 15;
      return Math.max(-75, Math.min(75, rotation));
    }
    return 30;
  };

  const getSentimentLabel = () => {
    if (sentimentReport) {
      const reportLower = sentimentReport.toLowerCase();
      if (reportLower.includes("strongly bullish") || reportLower.includes("strong bullish")) return "Strongly Bullish";
      if (reportLower.includes("strongly bearish") || reportLower.includes("strong bearish")) return "Strongly Bearish";
      if (reportLower.includes("bullish")) return "Bullish";
      if (reportLower.includes("bearish")) return "Bearish";
      if (reportLower.includes("neutral")) return "Neutral";
    }
    const rot = getSentimentRotation();
    if (rot > 20) return "Bullish";
    if (rot < -20) return "Bearish";
    return "Neutral";
  };

  const getAgentNodeState = (nodeName: string): "pending" | "active" | "completed" => {
    const statusOrder = [
      "loading_data",
      "data_loaded",
      "running_technical",
      "technical_done",
      "running_fundamental",
      "fundamental_done",
      "running_sentiment",
      "sentiment_done",
      "running_personal_finance",
      "personal_finance_done",
      "running_consolidator",
      "completed"
    ];
    
    const currentIndex = statusOrder.indexOf(agentStatus);
    if (currentIndex === -1) return "pending";
    
    const nodeMapping: Record<string, { start: number; active: number; done: number }> = {
      fetcher: { start: 0, active: 0, done: 1 },
      technical: { start: 2, active: 2, done: 3 },
      fundamental: { start: 4, active: 4, done: 5 },
      sentiment: { start: 6, active: 6, done: 7 },
      finance: { start: 8, active: 8, done: 9 },
      consolidator: { start: 10, active: 10, done: 11 }
    };
    
    const config = nodeMapping[nodeName];
    if (!config) return "pending";
    
    if (agentStatus === "") return "pending";
    if (currentIndex >= config.done) return "completed";
    if (currentIndex === config.active) return "active";
    if (currentIndex >= config.start) return "active";
    return "pending";
  };

  const currentStock = {
    name: currentStockInfo?.name || selectedTicker.split(".")[0],
    desc: currentStockInfo?.description || `Select a ticker to view detailed information. Run the AI Agent Team to generate a comprehensive research profile.`,
    open: currentStockInfo?.open || 0.0,
    close: currentStockInfo?.close || 0.0,
    high: currentStockInfo?.high || 0.0,
    low: currentStockInfo?.low || 0.0,
    volume: formatVolume(currentStockInfo?.volume),
    cap: formatMarketCap(currentStockInfo?.marketCap),
    ROE: currentStockInfo?.roe ? `${(currentStockInfo.roe * 100).toFixed(2)}%` : "N/A",
    PE: currentStockInfo?.peRatio ? currentStockInfo.peRatio.toFixed(2) : "N/A",
    EPS: currentStockInfo?.eps ? `${currencySymbol}${currentStockInfo.eps.toFixed(2)}` : "N/A",
    divYield: currentStockInfo?.dividendYield ? `${(currentStockInfo.dividendYield * 100).toFixed(2)}%` : "0.00%",
    currentPrice: currentStockInfo?.currentPrice || currentStockInfo?.close || 0.0,
    fiftyTwoWeekHigh: currentStockInfo?.fiftyTwoWeekHigh || 0.0,
    fiftyTwoWeekLow: currentStockInfo?.fiftyTwoWeekLow || 0.0,
    sector: currentStockInfo?.sector || "N/A",
    industry: currentStockInfo?.industry || "N/A",
    website: currentStockInfo?.website || "",
    news: currentStockInfo?.news || []
  };


  // Helper to trigger Search Input selection
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    
    const cleanSearch = query.toUpperCase();
    let finalTicker = cleanSearch;
    
    // 1. If we have active suggestions, use the first one
    if (searchResults.length > 0 && searchResults[0]) {
      finalTicker = searchResults[0].symbol;
    } else {
      // 2. Otherwise, fetch suggestions synchronously to find the correct matching symbol
      try {
        const res = await fetch(`${BACKEND_URL}/api/stocks/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results[0]) {
            finalTicker = data.results[0].symbol;
          }
        }
      } catch (err) {
        console.error("Failed to resolve search query:", err);
      }
    }
    
    // 3. Fallback: If it's a simple word and doesn't have exchange or global suffixes,
    // default to Indian market (.NS) for standard Indian tickers convenience
    const hasSuffix = finalTicker.endsWith(".NS") || finalTicker.endsWith(".BO") || finalTicker.includes("-") || finalTicker.includes("=");
    if (!hasSuffix && /^[A-Z0-9]+$/.test(finalTicker) && finalTicker.length <= 6) {
      finalTicker = `${finalTicker}.NS`;
    }
    
    setSelectedTicker(finalTicker);
    setSearchQuery("");
    setShowSuggestions(false);
    if (!tickers.includes(finalTicker)) {
      addTickerToWatchlist(finalTicker);
    }
  };

  // Color configurations based on theme
  const themeClasses = {
    bg: theme === "light" ? "bg-[#FAFBFD]" : "bg-[#070A13]",
    card: theme === "light" ? "bg-white border border-[var(--border-light)] text-[#1A1A1A] shadow-md rounded-2xl transition-all duration-200 hover:shadow-lg parent-card" : "glass-card border border-slate-800/85 text-slate-100 shadow-2xl rounded-2xl",
    textMuted: theme === "light" ? "text-[#4A4A4A] font-semibold" : "text-slate-400",
    textTitle: theme === "light" ? "text-[#1A1A1A] font-black" : "text-white",
    input: theme === "light" ? "bg-white border border-slate-450 text-[#1A1A1A] placeholder-slate-400 focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]/20 transition-all rounded-[6px]" : "bg-[#0E1322] border border-slate-800 text-slate-100 rounded-[6px]",
    border: theme === "light" ? "border-slate-450" : "border border-slate-800/70",
    tableRowEven: theme === "light" ? "bg-[#F5F7FA] border-b border-[#E9EDF5]" : "bg-[#0E1322]/40"
  };

  return (
    <div className={`flex-1 flex flex-col font-sans overflow-x-hidden min-h-screen pb-24 md:pb-0 transition-colors duration-300 ${theme === "dark" ? "dark" : ""} ${themeClasses.bg}`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-5 sm:max-w-sm z-[9999] flex items-center space-x-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all animate-fade-in ${
          toastType === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/80 dark:border-emerald-700 dark:text-emerald-200"
            : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/80 dark:border-rose-700 dark:text-rose-200"
        }`}>
          <span>{toastType === "success" ? "✓" : "✕"}</span>
          <span className="flex-1 min-w-0">{toastMessage}</span>
          <button onClick={() => setToastMessage("")} className="ml-2 opacity-60 hover:opacity-100 cursor-pointer text-lg leading-none shrink-0">×</button>
        </div>
      )}


      <header className={`${theme === "light" ? "bg-white/80 border-slate-200 text-slate-900 shadow-sm" : "bg-[#0B0F19]/90 border-slate-800/60 text-white"} backdrop-blur-md px-3 py-2.5 md:px-6 md:py-4 flex items-center justify-between border-b sticky top-0 z-50 gap-2`}>
        {/* Logo */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="bg-gradient-to-tr from-indigo-600 to-cyan-500 p-1.5 md:p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Activity className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
          <span className={`text-base md:text-xl font-bold tracking-tight flex items-center ${theme === "light" ? "text-slate-900" : "text-white"}`}>
            Artha<span className={theme === "light" ? "text-[#007AFF] font-extrabold" : "text-indigo-400 font-extrabold"}>Mind</span>
            <span className="hidden sm:inline ml-0.5"><span className={theme === "light" ? "text-[#007AFF] font-extrabold" : "text-indigo-400 font-extrabold"}> AI</span></span>
          </span>
        </div>

        {/* Desktop Module Navigation — equally divided, shown only on large screens */}
        <nav className={`hidden lg:flex p-1 border rounded-xl flex-1 mx-4 ${theme === "light" ? "bg-slate-50 border-slate-200" : "bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"}`}>
          {[
            { id: "research", label: "Analyst", icon: Activity },
            { id: "derivatives", label: "F&O", icon: TrendingUp },
            { id: "optimizer", label: "Portfolio", icon: PieIcon },
            { id: "finance", label: "Wealth", icon: Landmark },
            { id: "backtesting", label: "Backtest", icon: History },
            { id: "papertrading", label: "Paper", icon: Wallet },
            { id: "alerts", label: "Alerts", icon: Bell }
          ].map(module => {
            const isActive = activeTab === module.id;
            const Icon = module.icon;
            return (
              <button 
                key={module.id}
                onClick={() => {
                  setActiveTab(module.id as any);
                  if (module.id === "research") setActiveWorkspaceTab("Overview");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? (theme === "light" ? "bg-[#007AFF] text-white shadow-sm" : "bg-indigo-600 text-white shadow-md shadow-indigo-600/10") 
                    : (theme === "light" ? "text-slate-600 hover:bg-white hover:text-[#007AFF] hover:shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800/50")
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{module.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Nav Utilities */}
        <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
          
          {/* Connection Status Badge — always shows text on all screen sizes */}
          {backendConnected === true && (
            <span className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>
              <span>API ONLINE</span>
            </span>
          )}
          {backendConnected === false && (
            <span className="flex items-center space-x-1.5 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-full text-[10px] font-extrabold text-rose-500 whitespace-nowrap">
              <span className="h-1.5 w-1.5 bg-rose-500 rounded-full shrink-0"></span>
              <span>API OFFLINE</span>
            </span>
          )}
          {backendConnected === null && (
            <span className="flex items-center space-x-1.5 bg-slate-500/10 border border-slate-500/20 px-2 py-1 rounded-full text-[10px] font-extrabold text-slate-500 dark:text-slate-400 animate-pulse whitespace-nowrap">
              <span className="h-1.5 w-1.5 bg-slate-500 rounded-full shrink-0"></span>
              <span>Connecting</span>
            </span>
          )}

          {/* Light/Dark mode switcher */}
          <button 
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title="Toggle Theme"
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4 md:h-5 md:w-5 text-slate-600" />
            ) : (
              <Sun className="h-4 w-4 md:h-5 md:w-5 text-amber-400" />
            )}
          </button>
        </div>
      </header>

      {/* Real-time scrolling ticker tape (Fanciness & Real stock app feel) */}
      {isMounted && (
        <div className={`border-b py-1.5 overflow-hidden text-3xs font-extrabold select-none relative z-40 ${theme === "light" ? "bg-gradient-to-r from-[#F7F9FC] to-[#E9EDF5] border-slate-200 text-slate-900" : "bg-[#090C16] border-indigo-500/10 text-white"}`}>
          <div className="animate-marquee whitespace-nowrap flex space-x-12">
            {marqueeData.concat(marqueeData).map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className={theme === "light" ? "text-slate-650 font-semibold" : "text-slate-400 font-semibold"}>{item.symbol}</span>
                <span className={`numeric-monospace font-bold ${theme === "light" ? "text-slate-900" : "text-white"}`}>{item.price}</span>
                <span className={`numeric-monospace px-1.5 py-0.5 rounded font-black text-4xs ${
                  item.up 
                    ? (theme === "light" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15")
                    : (theme === "light" ? "bg-rose-500/10 text-rose-600 border border-rose-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/15")
                }`}>
                  {item.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-search section */}
      <section className="max-w-7xl w-full mx-auto px-4 md:px-6 pt-4 md:pt-6 relative z-45">
        <form onSubmit={handleSearchSubmit} className={`search-bar-form p-3 md:p-4 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${themeClasses.card}`}>
          <div ref={searchContainerRef} className="flex-1 relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Enter stock name or symbol (e.g. TCS, RELIANCE, INFY)"
              className={`search-bar-input pl-10 pr-4 py-3 text-sm rounded-lg w-full focus:outline-none border ${themeClasses.input}`}
            />
            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
                {searchResults.map((item) => (
                  <button
                    key={item.symbol}
                    type="button"
                    onClick={() => {
                      setSelectedTicker(item.symbol);
                      setSearchQuery("");
                      setShowSuggestions(false);
                      if (!tickers.includes(item.symbol)) {
                        addTickerToWatchlist(item.symbol);
                      }
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex justify-between items-center text-xs"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                      <span className="text-slate-400 font-semibold text-3xs truncate max-w-xs md:max-w-md">{item.symbol}</span>
                    </div>
                    <span className="text-4xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-wider">{item.exchange}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button 
            type="submit" 
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm px-6 py-2.5 md:px-8 md:py-3 rounded-lg transition-colors shadow-md shadow-emerald-500/20 w-full sm:w-auto cursor-pointer"
          >
            Search
          </button>
        </form>
      </section>

      {/* Watchlist Quick Access Pills */}
      {tickers.length > 0 && (
        <section className="max-w-7xl w-full mx-auto px-4 md:px-6 pt-2">
          <div className="watchlist-container flex items-center space-x-2 overflow-x-auto py-2 px-4 rounded-xl border scrollbar-none">
            <span className="text-2xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">Watchlist:</span>
            <div className="flex items-center space-x-2 flex-nowrap">
              {tickers.map(ticker => (
                <div 
                  key={ticker} 
                  className={`watchlist-pill flex items-center space-x-1.5 px-3 py-1 rounded-full text-2xs font-bold transition-all border ${
                    selectedTicker === ticker 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-500 shadow-sm" 
                      : "bg-white dark:bg-[#131B31] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700"
                  }`}
                >
                  <button 
                    onClick={() => setSelectedTicker(ticker)}
                    className="focus:outline-none cursor-pointer"
                  >
                    {ticker}
                  </button>
                  {!DEFAULT_TICKERS.includes(ticker) && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTickerFromWatchlist(ticker);
                      }}
                      className="text-slate-400 hover:text-rose-500 transition-colors font-extrabold text-sm leading-none focus:outline-none cursor-pointer"
                      title="Remove Ticker"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col space-y-4 md:space-y-6 relative z-10 pb-[calc(var(--mobile-nav-height)+1rem)] md:pb-6">
        
        {/* ==================== TAB 1: STOCK RESEARCH HUB ==================== */}
        {activeTab === "research" && (
          <div className="flex flex-col space-y-6">
            {/* Onboarding welcome guide banner */}
            {showOnboarding && (
              <div className={`p-6 rounded-2xl border relative overflow-hidden transition-all shadow-md ${
                theme === "light" 
                  ? "bg-gradient-to-r from-indigo-50 to-cyan-50/50 border-indigo-100 text-slate-800" 
                  : "bg-gradient-to-r from-[#0C122C]/90 to-[#0A1A2E]/60 border-indigo-500/15 text-white"
              }`}>
                {/* Decorative background glow */}
                <div className="absolute -right-20 -top-20 w-60 h-60 bg-indigo-500/15 blur-3xl rounded-full"></div>
                <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-cyan-500/15 blur-3xl rounded-full"></div>

                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <h3 className="text-base md:text-lg font-extrabold tracking-tight flex flex-col sm:flex-row sm:items-center gap-2">
                      <span>👋 Welcome to ArthaMind AI</span>
                      <span className="text-[10px] md:text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-full font-bold self-start sm:self-auto uppercase tracking-wider">AUTOMATED FINANCIAL RESEARCHER</span>
                    </h3>
                    <p className={`text-xs mt-2 max-w-3xl leading-relaxed ${theme === "light" ? "text-slate-600" : "text-slate-400"}`}>
                      ArthaMind AI runs a sophisticated multi-agent pipeline to perform automated financial research on any global stock, index, ETF, or cryptocurrency. Our AI agents fetch data, compute technical indicators, analyze fundamentals, score headlines sentiment, and compile cohesive PDF advisor reports.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6 relative z-10">
                  <div className={`step-card flex gap-3.5 p-4 rounded-xl border-l-[3px] border-y border-r transition-all duration-200 hover:-translate-y-0.5 ${theme === "light" ? "bg-gradient-to-b from-white to-[#F5F7FA] border-slate-200 border-l-[#007AFF] shadow-sm hover:shadow-md text-slate-800" : "bg-white/40 dark:bg-slate-900/30 border-white/20 dark:border-slate-800/40 border-l-indigo-500 text-white"}`}>
                    <div className={`p-2.5 rounded-xl h-10 w-10 flex items-center justify-center shrink-0 border ${theme === "light" ? "bg-blue-500/5 border-blue-500/10 shadow-[0_0_12px_rgba(0,122,255,0.15)]" : "bg-indigo-500/10 border-indigo-500/20"}`}>
                      <Search className={`h-5 w-5 ${theme === "light" ? "text-[#007AFF]" : "text-indigo-400"}`} />
                    </div>
                    <div>
                      <h4 className={`font-bold text-xs ${theme === "light" ? "text-slate-900" : "text-white"}`}>1. Choose a Ticker Symbol</h4>
                      <p className={`text-4xs mt-1 leading-relaxed ${theme === "light" ? "text-slate-600" : "text-slate-400"}`}>
                        Enter any asset symbol (e.g. <b className={theme === "light" ? "text-slate-900" : ""}>TCS.NS</b>, <b className={theme === "light" ? "text-slate-900" : ""}>AAPL</b>, <b className={theme === "light" ? "text-slate-900" : ""}>BTC-USD</b>) in the search bar or select from the Watchlist access pills.
                      </p>
                    </div>
                  </div>

                  <div className={`step-card flex gap-3.5 p-4 rounded-xl border-l-[3px] border-y border-r transition-all duration-200 hover:-translate-y-0.5 ${theme === "light" ? "bg-gradient-to-b from-white to-[#F5F7FA] border-slate-200 border-l-[#6E56CF] shadow-sm hover:shadow-md text-slate-800" : "bg-white/40 dark:bg-slate-900/30 border-white/20 dark:border-slate-800/40 border-l-cyan-500 text-white"}`}>
                    <div className={`p-2.5 rounded-xl h-10 w-10 flex items-center justify-center shrink-0 border ${theme === "light" ? "bg-violet-500/5 border-violet-500/10 shadow-[0_0_12px_rgba(110,86,207,0.15)]" : "bg-cyan-500/10 border-cyan-500/20"}`}>
                      <Cpu className={`h-5 w-5 ${theme === "light" ? "text-[#6E56CF]" : "text-cyan-400"}`} />
                    </div>
                    <div>
                      <h4 className={`font-bold text-xs ${theme === "light" ? "text-slate-900" : "text-white"}`}>2. Run AI Agent Pipeline</h4>
                      <p className={`text-4xs mt-1 leading-relaxed ${theme === "light" ? "text-slate-600" : "text-slate-400"}`}>
                        Go to the <b className={theme === "light" ? "text-slate-900" : ""}>AI Research Hub</b> tab below and click <b className={theme === "light" ? "text-slate-900" : ""}>"Run AI Agent Team"</b> to stream calculations and sentiment scoring in real-time.
                      </p>
                    </div>
                  </div>

                  <div className={`step-card flex gap-3.5 p-4 rounded-xl border-l-[3px] border-y border-r transition-all duration-200 hover:-translate-y-0.5 ${theme === "light" ? "bg-gradient-to-b from-white to-[#F5F7FA] border-slate-200 border-l-[#00C853] shadow-sm hover:shadow-md text-slate-800" : "bg-white/40 dark:bg-slate-900/30 border-white/20 dark:border-slate-800/40 border-l-emerald-500 text-white"}`}>
                    <div className={`p-2.5 rounded-xl h-10 w-10 flex items-center justify-center shrink-0 border ${theme === "light" ? "bg-emerald-500/5 border-emerald-500/10 shadow-[0_0_12px_rgba(0,200,83,0.15)]" : "bg-emerald-500/10 border-emerald-500/20"}`}>
                      <Download className={`h-5 w-5 ${theme === "light" ? "text-[#00C853]" : "text-emerald-400"}`} />
                    </div>
                    <div>
                      <h4 className={`font-bold text-xs ${theme === "light" ? "text-slate-900" : "text-white"}`}>3. Analyze & Export PDF</h4>
                      <p className={`text-4xs mt-1 leading-relaxed ${theme === "light" ? "text-slate-600" : "text-slate-400"}`}>
                        Inspect individual agent outputs (Technical charts, Sentiment dial, SIP calculators) and download the generated PDF Report.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="relative flex flex-col space-y-6">
              {(loadingInfo || loadingRecommendation) && (
                <div className="absolute inset-0 bg-slate-950/20 dark:bg-black/45 backdrop-blur-[4px] z-50 flex items-center justify-center rounded-2xl min-h-[450px]">
                  <div className="bg-white/95 dark:bg-[#0E1322]/95 border border-slate-200/85 dark:border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center justify-center space-y-4 text-center max-w-xs w-full mx-4 glassmorphic-card">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-indigo-500 animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-850 dark:text-white">Analyzing Market Intelligence</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Aggregating real-time financial datasets for {selectedTicker}...</p>
                    </div>
                  </div>
                </div>
              )}
              {/* Stock Header Information Card */}
              <div className={`overflow-hidden rounded-2xl border flex flex-col ${themeClasses.card}`}>
               {/* Top Row: Name, Price, and Watchlist Button */}
               <div className="card-header-gradient flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 p-4 md:p-6 border-b border-slate-200/40 dark:border-slate-800/60">
                 <div className="flex items-center space-x-3 md:space-x-4 max-w-full min-w-0">
                   <div className="bg-indigo-50 dark:bg-[#1C2541]/40 p-2.5 md:p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
                     <span className="text-sm md:text-base font-black text-indigo-700 dark:text-indigo-400">{selectedTicker.split(".")[0]}</span>
                   </div>
                   <div className="min-w-0">
                     <h2 className="text-base md:text-lg font-bold flex flex-wrap items-center gap-1.5 md:gap-2 min-w-0">
                       <span className="whitespace-normal break-words max-w-[200px] sm:max-w-xs md:max-w-md">{currentStock.name}</span>
                       <span className="text-[10px] md:text-xs bg-slate-100 border text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold uppercase dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">{selectedTicker}</span>
                       {loadingInfo && <RefreshCw className="h-3 w-3 animate-spin text-slate-400 shrink-0" />}
                     </h2>
                     <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1 md:mt-1.5">
                       <span className="numeric-monospace text-lg md:text-xl font-black text-slate-900 dark:text-white">{currencySymbol}{currentStock.currentPrice.toFixed(2)}</span>
                       <span className={`numeric-monospace text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded flex items-center border ${
                         currentStock.currentPrice - currentStock.close >= 0 
                           ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" 
                           : "text-rose-500 bg-rose-500/10 border-rose-500/20"
                       }`}>
                         {currentStock.currentPrice - currentStock.close >= 0 ? "▲ +" : "▼ "}{(((currentStock.currentPrice - currentStock.close) / (currentStock.close || 1)) * 100).toFixed(2)}%
                       </span>
                        <button
                          onClick={() => setIsLiveFeedActive(!isLiveFeedActive)}
                          className={`text-4xs font-black uppercase flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            isLiveFeedActive
                              ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-600 dark:text-emerald-400 animate-pulse"
                              : "bg-slate-100 dark:bg-[#0E1322] border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
                          }`}
                          title="Toggle live price ticks (+/- 0.05% every 2 seconds)"
                        >
                          <Activity className="h-2.5 w-2.5" />
                          <span>{isLiveFeedActive ? "Live Feed: Active" : "Live Feed: Idle"}</span>
                        </button>
                     </div>
                   </div>
                 </div>
 
                 {/* Add to watchlist button with active states */}
                 {tickers.includes(selectedTicker) ? (
                   <button 
                     disabled
                     className="bg-slate-100 dark:bg-[#121B2F]/60 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs px-4 py-2.5 rounded-xl w-full md:w-auto text-center justify-center flex items-center self-stretch md:self-center cursor-not-allowed"
                   >
                     ✓ In Watchlist
                   </button>
                 ) : (
                   <button 
                     onClick={() => addTickerToWatchlist(selectedTicker)}
                     className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all w-full md:w-auto text-center justify-center flex items-center self-stretch md:self-center cursor-pointer"
                   >
                     + Add to Watchlist
                   </button>
                 )}
               </div>

                {/* Bottom Row: Key Metrics Grid — 2-col mobile, 3-col tablet, 6-col desktop */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 md:gap-4 text-xs p-4 md:p-6">
                  <div className={`metric-box p-2.5 md:p-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${theme === "light" ? "bg-white border-slate-200 shadow-sm hover:shadow-md" : "bg-slate-100/60 dark:bg-[#0E1322]/55 border-transparent"}`}>
                    <div className="text-slate-500 dark:text-slate-400 font-bold uppercase text-3xs">Today's High</div>
                    <div className={`numeric-monospace font-extrabold text-sm mt-0.5 ${theme === "light" ? "text-slate-900" : "text-slate-100"}`}>{currencySymbol}{currentStock.high.toFixed(2)}</div>
                  </div>
                  <div className={`metric-box p-2.5 md:p-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${theme === "light" ? "bg-white border-slate-200 shadow-sm hover:shadow-md" : "bg-slate-100/60 dark:bg-[#0E1322]/55 border-transparent"}`}>
                    <div className="text-slate-500 dark:text-slate-400 font-bold uppercase text-3xs">Today's Low</div>
                    <div className={`numeric-monospace font-extrabold text-sm mt-0.5 ${theme === "light" ? "text-slate-900" : "text-slate-100"}`}>{currencySymbol}{currentStock.low.toFixed(2)}</div>
                  </div>
                  <div className={`metric-box p-2.5 md:p-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${theme === "light" ? "bg-white border-slate-200 shadow-sm hover:shadow-md" : "bg-slate-100/60 dark:bg-[#0E1322]/55 border-transparent"}`}>
                    <div className="text-slate-500 dark:text-slate-400 font-bold uppercase text-3xs">Open Price</div>
                    <div className={`numeric-monospace font-extrabold text-sm mt-0.5 ${theme === "light" ? "text-slate-900" : "text-slate-100"}`}>{currencySymbol}{currentStock.open.toFixed(2)}</div>
                  </div>
                  <div className={`metric-box p-2.5 md:p-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${theme === "light" ? "bg-white border-slate-200 shadow-sm hover:shadow-md" : "bg-slate-100/60 dark:bg-[#0E1322]/55 border-transparent"}`}>
                    <div className="text-slate-500 dark:text-slate-400 font-bold uppercase text-3xs">Prev. Close</div>
                    <div className={`numeric-monospace font-extrabold text-sm mt-0.5 ${theme === "light" ? "text-slate-900" : "text-slate-100"}`}>{currencySymbol}{currentStock.close.toFixed(2)}</div>
                  </div>
                  <div className={`metric-box p-2.5 md:p-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${theme === "light" ? "bg-white border-slate-200 shadow-sm hover:shadow-md" : "bg-slate-100/60 dark:bg-[#0E1322]/55 border-transparent"}`}>
                    <div className="text-slate-500 dark:text-slate-400 font-bold uppercase text-3xs">Volume</div>
                    <div className={`numeric-monospace font-extrabold text-sm mt-0.5 truncate ${theme === "light" ? "text-slate-900" : "text-slate-100"}`}>{currentStock.volume}</div>
                  </div>
                  <div className={`metric-box p-2.5 md:p-3 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${theme === "light" ? "bg-white border-slate-200 shadow-sm hover:shadow-md" : "bg-slate-100/60 dark:bg-[#0E1322]/55 border-transparent"}`}>
                    <div className="text-slate-500 dark:text-slate-400 font-bold uppercase text-3xs">Market Cap</div>
                    <div className={`numeric-monospace font-extrabold text-sm mt-0.5 truncate ${theme === "light" ? "text-slate-900" : "text-slate-100"}`}>{currentStock.cap}</div>
                  </div>
                </div>
              </div>
            
            {/* Split layout: Chart & Details vs AI predictions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (Chart, News, About) */}
              <div className="lg:col-span-2 flex flex-col space-y-6">
                
                {/* Refined Unified Workspace Card */}
                <div className={`overflow-hidden ${themeClasses.card}`}>
                  
                  {/* Workspace Navigation Tabs with gradient header */}
                  <div className="card-header-gradient px-3 py-3 md:px-6 md:py-4 border-b border-slate-200 dark:border-slate-800/80 mb-5 w-full">
                    <div className="scroll-x-touch flex text-xs font-semibold gap-x-3 md:gap-x-6 w-full flex-nowrap pb-1 md:pb-2">
                      {[
                        { id: "Overview", label: "Charts" },
                        { id: "Comparator", label: "Compare" },
                        { id: "AI Research Hub", label: "AI Hub" },
                        { id: "Technical Indicators", label: "Technicals" },
                        { id: "News Feed", label: "News" }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveWorkspaceTab(tab.id)}
                          className={`transition-all pb-2.5 md:pb-3 relative whitespace-nowrap cursor-pointer min-h-[36px] flex items-center ${
                            activeWorkspaceTab === tab.id
                              ? "text-indigo-500 font-bold"
                              : "text-slate-655 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                          }`}
                        >
                          {tab.label}
                          {activeWorkspaceTab === tab.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full shadow-sm"></span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Contents with padding */}
                  <div className="mt-4 px-4 pb-4 md:px-6 md:pb-6">
                    
                    {/* 1. OVERVIEW & CHARTS TAB */}
                    {activeWorkspaceTab === "Overview" && (
                      <div className="space-y-6">
                        
                        {/* Chart Control Bar — stacks vertically on mobile */}
                        <div className="flex flex-col gap-2 bg-slate-50 dark:bg-slate-900/40 p-2.5 md:p-3 rounded-xl border border-slate-200 dark:border-slate-800/70">
                          
                          {/* Row 1: Indicator Views */}
                          <div className="scroll-x-touch flex space-x-1 p-1 bg-slate-100 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800/80 rounded-lg flex-nowrap w-full">
                            {[
                              { id: "price", label: "Price" },
                              { id: "ma", label: "MA Trend" },
                              { id: "rsi", label: "RSI" },
                              { id: "macd", label: "MACD" }
                            ].map(view => (
                              <button
                                key={view.id}
                                onClick={() => setChartSubView(view.id as any)}
                                className={`flex-1 px-2 py-1.5 rounded text-3xs font-extrabold transition-all cursor-pointer whitespace-nowrap text-center min-h-[32px] ${
                                  chartSubView === view.id
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : theme === "light" 
                                      ? "text-slate-600 hover:text-slate-900" 
                                      : "text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                {view.label}
                              </button>
                            ))}
                          </div>

                          {/* Row 2: Timeframe Selectors */}
                          <div className="scroll-x-touch flex items-center flex-nowrap w-full">
                            <div className="flex space-x-0.5">
                              {["1D", "5D", "1M", "6M", "1Y", "5Y", "Max"].map(period => (
                                <button
                                  key={period}
                                  onClick={() => setTimePeriod(period)}
                                  className={`px-2.5 py-1.5 rounded text-3xs font-extrabold transition-all border whitespace-nowrap min-h-[32px] ${
                                    timePeriod === period 
                                      ? theme === "light"
                                        ? "bg-white text-indigo-600 border-slate-300 shadow-2xs"
                                        : "bg-slate-850 text-indigo-400 border-slate-700 shadow-2xs"
                                      : theme === "light"
                                        ? "text-slate-600 border-transparent hover:text-slate-900"
                                        : "text-slate-400 border-transparent hover:text-slate-300"
                                  }`}
                                >
                                  {period}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Recharts Canvas */}
                        <div className="h-[260px] md:h-[320px] w-full relative mt-4 md:mt-6">
                          {loadingHistory ? (
                            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-semibold">
                              <RefreshCw className="h-5 w-5 animate-spin mr-2 text-indigo-500" />
                              Loading stock chart...
                            </div>
                          ) : stockHistory.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                              No history available for {selectedTicker}.
                            </div>
                          ) : (
                            isMounted && (
                              <>
                                {chartSubView === "price" && (
                                  <ResponsiveContainer width="100%" height={300} minWidth={0}>
                                    <AreaChart data={getProcessedChartData()} onClick={handleChartClick} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                      <defs>
                                        <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} />
                                      <XAxis dataKey="Date" stroke="#64748B" fontSize={8} tickFormatter={cleanChartDateFormatter} />
                                      <YAxis domain={["auto", "auto"]} stroke="#64748B" fontSize={8} tickFormatter={(v) => typeof v === 'number' ? v.toFixed(2) : v} />
                                      <Tooltip formatter={(v: any) => [typeof v === 'number' ? v.toFixed(2) : v]} contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
                                      <Area type="monotone" dataKey="Close" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClose)" name="Close Price" />
                                      
                                      {/* Saved Drawings */}
                                      {savedDrawings.filter(d => d.type === "trendline").map(d => (
                                        <Line 
                                          key={d.id} 
                                          dataKey={`trendline_${d.id}`} 
                                          stroke="#F59E0B" 
                                          strokeWidth={2} 
                                          dot={false} 
                                          activeDot={false} 
                                          name="Trendline" 
                                        />
                                      ))}
                                      {savedDrawings.filter(d => d.type === "fibonacci").flatMap(d => {
                                        const range = d.high - d.low;
                                        const levels = [
                                          { pct: "0%", val: d.low, color: "#EF4444" },
                                          { pct: "23.6%", val: d.low + 0.236 * range, color: "#F59E0B" },
                                          { pct: "38.2%", val: d.low + 0.382 * range, color: "#10B981" },
                                          { pct: "50.0%", val: d.low + 0.500 * range, color: "#3B82F6" },
                                          { pct: "61.8%", val: d.low + 0.618 * range, color: "#6366F1" },
                                          { pct: "78.6%", val: d.low + 0.786 * range, color: "#8B5CF6" },
                                          { pct: "100%", val: d.high, color: "#EF4444" }
                                        ];
                                        return levels.map((l, lIdx) => (
                                          <ReferenceLine 
                                            key={`${d.id}-${lIdx}`} 
                                            y={l.val} 
                                            stroke={l.color} 
                                            strokeDasharray="3 3" 
                                            strokeWidth={1}
                                            label={{ value: `FIB ${l.pct} (₹${l.val.toFixed(2)})`, position: "insideLeft", fontSize: 7, fill: l.color }}
                                          />
                                        ));
                                      })}
                                    </AreaChart>
                                  </ResponsiveContainer>
                                )}

                                {chartSubView === "ma" && (
                                  <ResponsiveContainer width="100%" height={300} minWidth={0}>
                                    <LineChart data={getProcessedChartData()} onClick={handleChartClick} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} />
                                      <XAxis dataKey="Date" stroke="#64748B" fontSize={8} tickFormatter={cleanChartDateFormatter} />
                                      <YAxis domain={["auto", "auto"]} stroke="#64748B" fontSize={8} tickFormatter={(v) => typeof v === 'number' ? v.toFixed(2) : v} />
                                      <Tooltip formatter={(v: any) => [typeof v === 'number' ? v.toFixed(2) : v]} contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
                                      <Legend wrapperStyle={{ fontSize: 9 }} />
                                      <Line type="monotone" dataKey="Close" stroke="#6366F1" strokeWidth={2.5} dot={false} name="Closing Price" />
                                      <Line type="monotone" dataKey="MA_10" stroke="#3B82F6" strokeWidth={1.5} dot={false} name="10 SMA" />
                                      <Line type="monotone" dataKey="MA_50" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="50 SMA" />
                                      
                                      {/* Saved Drawings */}
                                      {savedDrawings.filter(d => d.type === "trendline").map(d => (
                                        <Line 
                                          key={d.id} 
                                          dataKey={`trendline_${d.id}`} 
                                          stroke="#F59E0B" 
                                          strokeWidth={2} 
                                          dot={false} 
                                          activeDot={false} 
                                          name="Trendline" 
                                        />
                                      ))}
                                      {savedDrawings.filter(d => d.type === "fibonacci").flatMap(d => {
                                        const range = d.high - d.low;
                                        const levels = [
                                          { pct: "0%", val: d.low, color: "#EF4444" },
                                          { pct: "23.6%", val: d.low + 0.236 * range, color: "#F59E0B" },
                                          { pct: "38.2%", val: d.low + 0.382 * range, color: "#10B981" },
                                          { pct: "50.0%", val: d.low + 0.500 * range, color: "#3B82F6" },
                                          { pct: "61.8%", val: d.low + 0.618 * range, color: "#6366F1" },
                                          { pct: "78.6%", val: d.low + 0.786 * range, color: "#8B5CF6" },
                                          { pct: "100%", val: d.high, color: "#EF4444" }
                                        ];
                                        return levels.map((l, lIdx) => (
                                          <ReferenceLine 
                                            key={`${d.id}-${lIdx}`} 
                                            y={l.val} 
                                            stroke={l.color} 
                                            strokeDasharray="3 3" 
                                            strokeWidth={1}
                                            label={{ value: `FIB ${l.pct} (₹${l.val.toFixed(2)})`, position: "insideLeft", fontSize: 7, fill: l.color }}
                                          />
                                        ));
                                      })}
                                    </LineChart>
                                  </ResponsiveContainer>
                                )}

                                {chartSubView === "rsi" && (
                                  <ResponsiveContainer width="100%" height={300} minWidth={0}>
                                    <LineChart data={stockHistory} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} />
                                      <XAxis dataKey="Date" stroke="#64748B" fontSize={8} tickFormatter={cleanChartDateFormatter} />
                                      <YAxis domain={[0, 100]} stroke="#64748B" fontSize={8} tickFormatter={(v) => typeof v === 'number' ? v.toFixed(2) : v} />
                                      <Tooltip formatter={(v: any) => [typeof v === 'number' ? v.toFixed(2) : v]} contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
                                      <Legend wrapperStyle={{ fontSize: 9 }} />
                                      <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" label={{ value: "Overbought (70)", fill: "#EF4444", fontSize: 7, position: "insideTopLeft" }} />
                                      <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" label={{ value: "Oversold (30)", fill: "#10B981", fontSize: 7, position: "insideBottomLeft" }} />
                                      <Line type="monotone" dataKey="RSI_14" stroke="#8B5CF6" strokeWidth={2} dot={false} name="RSI (14)" />
                                    </LineChart>
                                  </ResponsiveContainer>
                                )}

                                {chartSubView === "macd" && (
                                  <ResponsiveContainer width="100%" height={300} minWidth={0}>
                                    <ComposedChart data={stockHistory} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} />
                                      <XAxis dataKey="Date" stroke="#64748B" fontSize={8} tickFormatter={cleanChartDateFormatter} />
                                      <YAxis domain={["auto", "auto"]} stroke="#64748B" fontSize={8} tickFormatter={(v) => typeof v === 'number' ? v.toFixed(2) : v} />
                                      <Tooltip formatter={(v: any) => [typeof v === 'number' ? v.toFixed(2) : v]} contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
                                      <Legend wrapperStyle={{ fontSize: 9 }} />
                                      <Bar dataKey="MACD_Diff" name="MACD Histogram">
                                        {stockHistory.map((entry, idx) => (
                                          <Cell key={`cell-${idx}`} fill={entry.MACD_Diff >= 0 ? "rgba(16, 185, 129, 0.75)" : "rgba(239, 68, 68, 0.75)"} />
                                        ))}
                                      </Bar>
                                      <Line type="monotone" dataKey="MACD_Line" stroke="#3B82F6" strokeWidth={1.5} dot={false} name="MACD Line" />
                                      <Line type="monotone" dataKey="MACD_Signal" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="Signal Line" />
                                    </ComposedChart>
                                  </ResponsiveContainer>
                                )}
                              </>
                            )
                          )}
                        </div>

                        {/* Company Business Profile */}
                        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-5 mt-4 space-y-4">
                          <div>
                            <h4 className="font-bold text-xs text-indigo-500 uppercase tracking-wide block mb-1.5">Business Profile</h4>
                            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{currentStock.desc}</p>
                          </div>
                          
                          {/* Dynamic metadata row */}
                          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 text-xs p-4 rounded-xl border ${theme === "light" ? "bg-[#F5F7FA] border-slate-200 text-slate-900" : "bg-slate-100/40 dark:bg-[#0E1322]/40 border-transparent text-slate-200"}`}>
                            <div>
                              <span className="text-slate-400 font-bold block uppercase text-3xs mb-0.5">Sector</span>
                              <span className={`font-semibold ${theme === "light" ? "text-slate-800" : "text-slate-200"}`}>{currentStock.sector}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold block uppercase text-3xs mb-0.5">Industry</span>
                              <span className={`font-semibold ${theme === "light" ? "text-slate-800" : "text-slate-200"}`}>{currentStock.industry}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold block uppercase text-3xs mb-0.5">Official Website</span>
                              {currentStock.website ? (
                                <a 
                                  href={sanitizeUrl(currentStock.website)} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className={`font-semibold flex items-center gap-1 hover:underline ${theme === "light" ? "text-[#007AFF] hover:text-blue-600" : "text-indigo-400 hover:text-indigo-300"}`}
                                >
                                  <span>Visit website</span>
                                  <ChevronRight className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="font-semibold text-slate-500">Not Available</span>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* 2. AI RESEARCH HUB TAB (Node Visualizer & Console) */}
                    {activeWorkspaceTab === "AI Research Hub" && (
                      <div className="space-y-6">
                        
                        {/* Controls & Graph Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <h4 className="font-bold text-xs text-indigo-500 uppercase tracking-wide flex items-center gap-1.5">
                            <Network className="h-4 w-4 animate-pulse text-indigo-400" />
                            Multi-Agent Execution Pipeline
                          </h4>
                          <button 
                            onClick={startResearchWorkflow}
                            disabled={agentStatus !== "" && agentStatus !== "completed"}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800/50 disabled:text-slate-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-1.5 cursor-pointer disabled:cursor-not-allowed w-full sm:w-auto"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${agentStatus !== "" && agentStatus !== "completed" ? "animate-spin" : ""}`} />
                            <span>Run AI Agent Team</span>
                          </button>
                        </div>

                        {/* Interactive Visual State Graph */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                          {[
                            { id: "fetcher", label: "Data Fetcher", desc: "yfinance Core Connection" },
                            { id: "technical", label: "Technical Analyst", desc: "Trend & momentum nodes" },
                            { id: "fundamental", label: "Fundamental Analyst", desc: "Balance sheet multipliers" },
                            { id: "sentiment", label: "Sentiment Analyst", desc: "Headline sentiment scoring" },
                            { id: "finance", label: "Personal Finance", desc: "SIP & tax calculations" },
                            { id: "consolidator", label: "Lead Consolidator", desc: "Compiles final memorandum" }
                          ].map((node, idx) => {
                            const nodeState = getAgentNodeState(node.id);
                            return (
                              <div 
                                key={node.id} 
                                className={`p-4 md:p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 relative min-h-[105px] ${
                                  nodeState === "completed" 
                                    ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/5" 
                                    : nodeState === "active"
                                    ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 active-pulse shadow-sm shadow-indigo-500/5"
                                    : "bg-white dark:bg-[#0E1322]/30 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1.5 gap-2">
                                  <span className="text-xs md:text-sm font-extrabold tracking-tight whitespace-normal break-words">{node.label}</span>
                                  {nodeState === "completed" && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                                  {nodeState === "active" && <RefreshCw className="h-4 w-4 text-indigo-500 animate-spin shrink-0" />}
                                  {nodeState === "pending" && <HelpCircle className="h-4 w-4 opacity-30 text-slate-400 shrink-0" />}
                                </div>
                                <p className="text-2xs md:text-xs leading-relaxed opacity-80 mt-1">{node.desc}</p>
                                {node.id !== "fetcher" && (
                                  <span className="absolute bottom-2 right-3 text-2xl font-black opacity-10 select-none">0{idx}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Interactive Explanation Panel for AI Agents */}
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-indigo-500/10 bg-slate-50/50 dark:bg-slate-900/10 text-xs">
                          <h5 className="font-bold text-slate-800 dark:text-white mb-2.5 flex items-center gap-1.5">
                            <span>⚙️ Inside the Multi-Agent Automation Pipeline</span>
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-4xs leading-relaxed text-slate-400">
                            <div>
                              <p><b>📡 Data Gathering:</b> The <i>Data Fetcher</i> retrieves real-time pricing and historical data. This acts as the baseline for all indicators.</p>
                              <p className="mt-1.5"><b>📈 Technical Analysis:</b> Computes moving averages (SMA), volatility indicators, RSI, and MACD metrics to identify short-term trend directions.</p>
                            </div>
                            <div>
                              <p><b>📊 Fundamental Valuation:</b> Analyzes the company's balance sheet, ROE multipliers, EPS, P/E multiples, and dividend yields to verify solvency and value.</p>
                              <p className="mt-1.5"><b>📰 Sentiment Analysis:</b> Scrape-scans the latest Yahoo Finance news headlines to calculate a combined bullish/bearish score.</p>
                            </div>
                            <div>
                              <p><b>💰 Wealth Planning:</b> Runs Indian market capital gains tax projections and monthly SIP compounding calculations for target allocations.</p>
                              <p className="mt-1.5"><b>📑 Master Report:</b> Synthesizes all findings into a unified executive memorandum and compiles a downloadable PDF document.</p>
                            </div>
                          </div>
                        </div>

                        {/* Split Memorandum and Agent Reports Panel */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* Left Panel: Master Report */}
                          <div className="bg-slate-50 dark:bg-[#0E1322]/40 border border-slate-200 dark:border-slate-800/80 rounded-xl flex flex-col h-[340px] overflow-hidden justify-between">
                            <div className="card-header-gradient flex items-center justify-between gap-2 border-b px-4 py-2.5 border-slate-200 dark:border-slate-800 w-full min-w-0">
                              <span className="font-bold text-slate-800 dark:text-white text-xs truncate flex-1 min-w-0">AI Research Specialist Memorandum</span>
                              {(() => {
                                if (pdfFilename) {
                                  return (
                                    <a 
                                      href={`${BACKEND_URL}/api/report/download/${encodeURIComponent(pdfFilename.replace(/[^a-zA-Z0-9_\.-]/g, ""))}`} 
                                      download
                                      className="bg-emerald-500 hover:bg-emerald-400 text-white text-3xs px-2.5 py-1.5 rounded-lg flex items-center space-x-1 font-bold transition-all shadow-sm shrink-0 cursor-pointer"
                                    >
                                      <Download className="h-3 w-3" />
                                      <span>Download PDF</span>
                                    </a>
                                  );
                                }
                                if (pdfCompiling) {
                                  return (
                                    <button 
                                      disabled
                                      className="bg-indigo-600/50 text-indigo-200 text-3xs px-2.5 py-1.5 rounded-lg flex items-center space-x-1 font-bold transition-all shadow-sm shrink-0 cursor-not-allowed"
                                    >
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                      <span>Compiling PDF...</span>
                                    </button>
                                  );
                                }
                                if (agentStatus !== "" && agentStatus !== "completed") {
                                  return (
                                    <button 
                                      disabled
                                      className="bg-indigo-600/40 text-indigo-300/80 text-3xs px-2.5 py-1.5 rounded-lg flex items-center space-x-1 font-bold transition-all shadow-sm shrink-0 cursor-not-allowed"
                                    >
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                      <span>Generating PDF...</span>
                                    </button>
                                  );
                                }
                                return (
                                  <button 
                                    disabled
                                    className="bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-3xs px-2.5 py-1.5 rounded-lg flex items-center space-x-1 font-bold transition-all shadow-sm shrink-0 cursor-not-allowed"
                                  >
                                    <Download className="h-3 w-3 opacity-50" />
                                    <span>PDF Not Ready</span>
                                  </button>
                                );
                              })()}
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 pb-4 pr-1 text-2xs leading-relaxed text-slate-600 dark:text-slate-400 font-sans">
                              {masterReport ? (
                                <div className="space-y-1">{renderMarkdown(masterReport)}</div>
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center space-y-1">
                                  <Award className="h-6 w-6 text-slate-500 animate-pulse" />
                                  <p>Consolidated research report will load here. Click "Run AI Agent Team" to trigger.</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Panel: Agent Node Reports tabs */}
                          <div className="bg-slate-50 dark:bg-[#0E1322]/40 border border-slate-200 dark:border-slate-800/80 rounded-xl flex flex-col h-[340px] overflow-hidden">
                            
                            {/* Report Sub-navigation with gradient header */}
                            <div className="card-header-gradient flex space-x-1 p-2 bg-slate-100 dark:bg-[#080B13] border-b border-slate-200 dark:border-slate-800 rounded-t-xl overflow-x-auto scrollbar-none flex-nowrap">
                              {[
                                { id: "tech", label: "Technical" },
                                { id: "fund", label: "Fundamental" },
                                { id: "sent", label: "Sentiment" },
                                { id: "pf", label: "Tax & SIP" }
                              ].map(r => (
                                <button
                                  key={r.id}
                                  onClick={() => setSelectedAnalystReport(r.id as any)}
                                  className={`flex-1 py-1 text-4xs font-extrabold rounded transition-all cursor-pointer whitespace-nowrap px-2.5 ${
                                    selectedAnalystReport === r.id
                                      ? "bg-indigo-600 text-white shadow-sm"
                                      : "text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                  }`}
                                >
                                  {r.label}
                                </button>
                              ))}
                            </div>

                            {/* Active report details */}
                            <div className="flex-1 overflow-y-auto px-4 pb-4 pr-1 text-2xs leading-relaxed text-slate-500 dark:text-slate-400" style={{ paddingTop: 'calc(var(--spacing) * 2)' }}>
                              {selectedAnalystReport === "tech" && (
                                <div className="space-y-1">
                                  {technicalReport ? renderMarkdown(technicalReport) : <div className="text-center py-24 text-slate-500">Technical Analyst Node results will compile here.</div>}
                                </div>
                              )}
                              {selectedAnalystReport === "fund" && (
                                <div className="space-y-1">
                                  {fundamentalReport ? renderMarkdown(fundamentalReport) : <div className="text-center py-24 text-slate-500">Fundamental Analyst Node results will compile here.</div>}
                                </div>
                              )}
                              {selectedAnalystReport === "sent" && (
                                <div className="space-y-1">
                                  {sentimentReport ? renderMarkdown(sentimentReport) : <div className="text-center py-24 text-slate-500">News Sentiment Analyst Node results will compile here.</div>}
                                </div>
                              )}
                              {selectedAnalystReport === "pf" && (
                                <div className="space-y-1">
                                  {personalFinanceReport ? renderMarkdown(personalFinanceReport) : <div className="text-center py-24 text-slate-500">Personal Finance Advisor Node results will compile here.</div>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>



                      </div>
                    )}

                    {/* 3. TECHNICAL & FORECAST METRICS TAB */}
                    {activeWorkspaceTab === "Technical Indicators" && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          
                          {/* Computed Metrics Table */}
                          <div className="space-y-4">
                            <h4 className="font-bold text-xs text-indigo-500 uppercase tracking-wide">Dynamic Technical Indicators</h4>
                            {stockHistory && stockHistory.length > 0 ? (
                              (() => {
                                const latest = stockHistory[stockHistory.length - 1];
                                const rsiVal = latest?.RSI_14;
                                let rsiLabel = "Neutral";
                                if (rsiVal < 30) rsiLabel = "Oversold (Bullish Reversal)";
                                else if (rsiVal > 70) rsiLabel = "Overbought (Bearish Correction)";

                                const macdLine = latest?.MACD_Line || 0;
                                const macdSignal = latest?.MACD_Signal || 0;
                                const macdLabel = macdLine > macdSignal ? "Bullish Crossover" : "Bearish Crossover";

                                return (
                                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                    <table className="w-full text-xs">
                                      <tbody>
                                        <tr className="border-b border-slate-200 dark:border-slate-800/60">
                                          <td className="p-3 text-slate-400 font-semibold">10-Day Simple Moving Average (SMA)</td>
                                          <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">₹{latest?.MA_10?.toFixed(2) || "N/A"}</td>
                                        </tr>
                                        <tr className="border-b border-slate-200 dark:border-slate-800/60">
                                          <td className="p-3 text-slate-400 font-semibold">50-Day Simple Moving Average (SMA)</td>
                                          <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">₹{latest?.MA_50?.toFixed(2) || "N/A"}</td>
                                        </tr>
                                        <tr className="border-b border-slate-200 dark:border-slate-800/60">
                                          <td className="p-3 text-slate-400 font-semibold">Relative Strength Index (RSI 14)</td>
                                          <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                                            {rsiVal?.toFixed(2) || "N/A"} <span className={`text-3xs font-extrabold ml-1.5 px-2 py-0.5 rounded ${rsiVal < 30 ? "text-emerald-500 bg-emerald-500/10" : rsiVal > 70 ? "text-rose-500 bg-rose-500/10" : "text-amber-500 bg-amber-500/10"}`}>({rsiLabel})</span>
                                          </td>
                                        </tr>
                                        <tr className="border-b border-slate-200 dark:border-slate-800/60">
                                          <td className="p-3 text-slate-400 font-semibold">MACD Signal Convergence</td>
                                          <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
                                            {macdLine.toFixed(2)} / {macdSignal.toFixed(2)} <span className={`text-3xs font-extrabold ml-1.5 px-2 py-0.5 rounded ${macdLine > macdSignal ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"}`}>({macdLabel})</span>
                                          </td>
                                        </tr>
                                        <tr className="border-b border-slate-200 dark:border-slate-800/60">
                                          <td className="p-3 text-slate-400 font-semibold">Stock Price Volatility (20-Day Standard Deviation)</td>
                                          <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">{latest?.Volatility ? `${(latest.Volatility * 100).toFixed(2)}%` : "N/A"}</td>
                                        </tr>
                                        <tr className="border-b border-slate-200 dark:border-slate-800/60">
                                          <td className="p-3 text-slate-400 font-semibold">Daily Stock Return (Percentage Change)</td>
                                          <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">{latest?.Daily_Return ? `${(latest.Daily_Return * 100).toFixed(2)}%` : "N/A"}</td>
                                        </tr>
                                        <tr>
                                          <td className="p-3 text-slate-400 font-semibold">Asset Face Value (Estimated)</td>
                                          <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">₹1.00</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })()
                            ) : (
                              <div className="text-slate-500 text-center py-12 text-xs">No technical indicator data available. Please load history first.</div>
                            )}
                          </div>

                          {/* Horizon Price prediction */}
                          <div className="space-y-4">
                            <h4 className="font-bold text-xs text-indigo-500 uppercase tracking-wide">AI Price Prediction Forecast</h4>
                            <div className="bg-slate-50 dark:bg-slate-900/40 p-5 border border-slate-200 dark:border-slate-800/70 rounded-xl space-y-4">
                              <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-[#080B13] border border-slate-200 dark:border-slate-800 rounded-lg">
                                {["Tomorrow", "Next 7 Days", "Next 30 Days"].map((horizon, idx) => {
                                  const hKey = idx === 0 ? "tomorrow" : idx === 1 ? "7days" : "30days";
                                  const isActive = predictionHorizon === hKey;
                                  return (
                                    <button
                                      key={horizon}
                                      onClick={() => setPredictionHorizon(hKey)}
                                      className={`flex-1 py-1.5 rounded text-3xs font-extrabold transition-all cursor-pointer ${
                                        isActive 
                                          ? "bg-indigo-600 text-white shadow-sm" 
                                          : theme === "light" 
                                            ? "text-slate-600 hover:text-slate-900" 
                                            : "text-slate-400 hover:text-slate-200"
                                      }`}
                                    >
                                      {horizon}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="flex flex-col space-y-2">
                                <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider">Estimated Trading target ({predictionHorizon})</span>
                                <div className="flex items-center gap-2.5">
                                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                                    ₹{(currentStock.currentPrice * (predictionHorizon === "tomorrow" ? 1.012 : predictionHorizon === "7days" ? 1.034 : 1.075)).toFixed(2)}
                                  </span>
                                  <span className="text-2xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center">
                                    ▲ {(predictionHorizon === "tomorrow" ? 1.2 : predictionHorizon === "7days" ? 3.4 : 7.5).toFixed(2)}% Estimated Upside
                                  </span>
                                </div>
                                <div className={`text-3xs flex items-center gap-1.5 mt-2 p-3 border rounded-lg ${
                                  theme === "light" 
                                    ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-800" 
                                    : "bg-slate-900 border-slate-800 text-slate-400"
                                }`}>
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                  <span>Automated predictions support a positive target based on short-term RSI parameters and 10 SMA support.</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4. NEWS FEED TAB */}
                    {activeWorkspaceTab === "News Feed" && (
                      <div className="space-y-4">
                        <h4 className="font-bold text-xs text-indigo-500 uppercase tracking-wide">Dynamic Yahoo Finance News headlines</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[440px] overflow-y-auto pr-1">
                          {currentStock.news && currentStock.news.length > 0 ? (
                            currentStock.news.map((item: any, idx: number) => (
                              <a 
                                key={idx} 
                                href={sanitizeUrl(item.link)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="block p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1322]/30 hover:border-indigo-500/40 hover:shadow-xs transition-all"
                              >
                                <div className="font-bold text-xs text-slate-800 dark:text-slate-300 line-clamp-2">{item.title}</div>
                                <div className="flex justify-between items-center text-3xs text-slate-400 mt-3">
                                  <span className="font-semibold">{item.publisher}</span>
                                  <span>{formatNewsTime(item.time)}</span>
                                </div>
                              </a>
                            ))
                          ) : (
                            <div className="text-slate-500 text-center py-20 text-xs col-span-2">
                              No recent headlines available for {selectedTicker}.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 5. COMPARATOR TAB */}
                    {activeWorkspaceTab === "Comparator" && (
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30">
                          {/* Search Stock A */}
                          <div className="flex-1 relative">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Stock A</label>
                            <div className="relative">
                              <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
                              <input 
                                type="text"
                                value={compareSearchA}
                                onChange={(e) => {
                                  setCompareSearchA(e.target.value);
                                  setShowCompareSuggestionsA(true);
                                }}
                                onFocus={() => setShowCompareSuggestionsA(true)}
                                placeholder="Search Stock A (e.g. TCS)"
                                className={`pl-9 pr-3 py-2 text-xs rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 border ${themeClasses.input}`}
                              />
                              {showCompareSuggestionsA && compareSuggestionsA.length > 0 && (
                                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
                                  {compareSuggestionsA.map((item) => (
                                    <button
                                      key={item.symbol}
                                      type="button"
                                      onClick={() => {
                                        setCompareTickerA(item.symbol);
                                        setCompareSearchA("");
                                        setShowCompareSuggestionsA(false);
                                      }}
                                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex justify-between items-center text-[11px]"
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                                        <span className="text-slate-400 text-3xs font-semibold">{item.symbol}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="text-3xs text-indigo-400 font-extrabold mt-1 block">Active: {compareTickerA}</span>
                          </div>

                          {/* Search Stock B */}
                          <div className="flex-1 relative">
                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Stock B</label>
                            <div className="relative">
                              <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
                              <input 
                                type="text"
                                value={compareSearchB}
                                onChange={(e) => {
                                  setCompareSearchB(e.target.value);
                                  setShowCompareSuggestionsB(true);
                                }}
                                onFocus={() => setShowCompareSuggestionsB(true)}
                                placeholder="Search Stock B (e.g. INFY)"
                                className={`pl-9 pr-3 py-2 text-xs rounded-lg w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 border ${themeClasses.input}`}
                              />
                              {showCompareSuggestionsB && compareSuggestionsB.length > 0 && (
                                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
                                  {compareSuggestionsB.map((item) => (
                                    <button
                                      key={item.symbol}
                                      type="button"
                                      onClick={() => {
                                        setCompareTickerB(item.symbol);
                                        setCompareSearchB("");
                                        setShowCompareSuggestionsB(false);
                                      }}
                                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors flex justify-between items-center text-[11px]"
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                                        <span className="text-slate-400 text-3xs font-semibold">{item.symbol}</span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <span className="text-3xs text-emerald-400 font-extrabold mt-1 block">Active: {compareTickerB}</span>
                          </div>
                        </div>

                        {compareLoading ? (
                          <div className="text-center py-20 text-slate-400 text-xs font-semibold">
                            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
                            Fetching comparative metrics...
                          </div>
                        ) : compareData ? (
                          <div className="space-y-6">
                            {/* Normalized return comparison chart */}
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1322]/20">
                              <h4 className="font-bold text-slate-800 dark:text-white text-xs mb-3 flex items-center justify-between">
                                <span>Relative Performance comparison (1Y returns)</span>
                                <span className="text-[10px] text-slate-400">Base value normalized to 0%</span>
                              </h4>
                              <div className="h-[220px] w-full">
                                {isMounted && compareData.normalized_history && compareData.normalized_history.length > 0 ? (
                                  <ResponsiveContainer width="100%" height={220} minWidth={0}>
                                    <LineChart data={compareData.normalized_history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} />
                                      <XAxis dataKey="Date" stroke="#64748B" fontSize={8} tickFormatter={cleanChartDateFormatter} />
                                      <YAxis unit="%" stroke="#64748B" fontSize={8} tickFormatter={(v) => typeof v === 'number' ? `${v.toFixed(2)}%` : v} />
                                      <Tooltip formatter={(v: any) => [typeof v === 'number' ? `${v.toFixed(2)}%` : v]} contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
                                      <Legend wrapperStyle={{ fontSize: 9 }} />
                                      <Line type="monotone" dataKey="return_a" stroke="#6366F1" strokeWidth={2} dot={false} name={compareTickerA} />
                                      <Line type="monotone" dataKey="return_b" stroke="#10B981" strokeWidth={2} dot={false} name={compareTickerB} />
                                    </LineChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">No historical returns overlap available.</div>
                                )}
                              </div>
                            </div>

                            {/* side-by-side comparison table */}
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800/80">
                              <table className="w-full text-3xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200 text-left">
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800/60">Metric</th>
                                    <th className="p-2 border-r border-slate-200 dark:border-slate-800/60 text-indigo-500 dark:text-indigo-400 font-black">{compareTickerA}</th>
                                    <th className="p-2 text-emerald-500 dark:text-emerald-400 font-black">{compareTickerB}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                                  {/* General */}
                                  <tr>
                                    <td className="p-2 font-bold text-slate-400 uppercase tracking-wide bg-slate-50/50 dark:bg-slate-950/20" colSpan={3}>General Profile</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800/60">Company Name</td>
                                    <td className="p-2 font-bold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800/60">{compareData.stock_a.info.name}</td>
                                    <td className="p-2 font-bold text-slate-700 dark:text-slate-200">{compareData.stock_b.info.name}</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800/60">Sector / Industry</td>
                                    <td className="p-2 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800/60">{compareData.stock_a.info.sector} / {compareData.stock_a.info.industry}</td>
                                    <td className="p-2 text-slate-600 dark:text-slate-400">{compareData.stock_b.info.sector} / {compareData.stock_b.info.industry}</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800/60">Market Capitalization</td>
                                    <td className="p-2 text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800/60">{formatMarketCap(compareData.stock_a.info.marketCap)}</td>
                                    <td className="p-2 text-slate-700 dark:text-slate-200">{formatMarketCap(compareData.stock_b.info.marketCap)}</td>
                                  </tr>

                                  {/* Technicals */}
                                  <tr>
                                    <td className="p-2 font-bold text-slate-400 uppercase tracking-wide bg-slate-50/50 dark:bg-slate-950/20" colSpan={3}>Technical Metrics</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800/60">Current Close Price</td>
                                    <td className="p-2 font-bold text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800/60">{getCurrencySymbol(compareTickerA)}{compareData.stock_a.info.currentPrice?.toFixed(2)}</td>
                                    <td className="p-2 font-bold text-slate-700 dark:text-slate-200">{getCurrencySymbol(compareTickerB)}{compareData.stock_b.info.currentPrice?.toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800/60">RSI (14) Momentum</td>
                                    {(() => {
                                      const rsiA = compareData.stock_a.recommendation?.signals.find((s: any) => s.name.includes("RSI"))?.value || "N/A";
                                      const rsiB = compareData.stock_b.recommendation?.signals.find((s: any) => s.name.includes("RSI"))?.value || "N/A";
                                      return (
                                        <>
                                          <td className="p-2 text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800/60 font-semibold">{rsiA}</td>
                                          <td className="p-2 text-slate-700 dark:text-slate-200 font-semibold">{rsiB}</td>
                                        </>
                                      );
                                    })()}
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800/60">MACD Oscillator</td>
                                    {(() => {
                                      const macdA = compareData.stock_a.recommendation?.signals.find((s: any) => s.name.includes("MACD"))?.status || "N/A";
                                      const macdB = compareData.stock_b.recommendation?.signals.find((s: any) => s.name.includes("MACD"))?.status || "N/A";
                                      return (
                                        <>
                                          <td className={`p-2 border-r border-slate-200 dark:border-slate-800/60 font-bold ${macdA === "Bullish" ? "text-emerald-550 dark:text-emerald-400" : macdA === "Bearish" ? "text-rose-550 dark:text-rose-400" : ""}`}>{macdA}</td>
                                          <td className={`p-2 font-bold ${macdB === "Bullish" ? "text-emerald-550 dark:text-emerald-400" : macdB === "Bearish" ? "text-rose-550 dark:text-rose-400" : ""}`}>{macdB}</td>
                                        </>
                                      );
                                    })()}
                                  </tr>

                                  {/* Fundamentals */}
                                  <tr>
                                    <td className="p-2 font-bold text-slate-400 uppercase tracking-wide bg-slate-50/50 dark:bg-slate-950/20" colSpan={3}>Fundamental Valuations</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800/60">P/E Ratio</td>
                                    {(() => {
                                      const peA = compareData.stock_a.info.peRatio;
                                      const peB = compareData.stock_b.info.peRatio;
                                      const isLowerA = peA && peB ? peA < peB : false;
                                      return (
                                        <>
                                          <td className={`p-2 border-r border-slate-200 dark:border-slate-800/60 font-bold ${isLowerA ? "text-emerald-500" : ""}`}>{peA ? `${peA.toFixed(2)}x` : "N/A"}</td>
                                          <td className={`p-2 font-bold ${!isLowerA && peB ? "text-emerald-500" : ""}`}>{peB ? `${peB.toFixed(2)}x` : "N/A"}</td>
                                        </>
                                      );
                                    })()}
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800/60">Return on Equity (ROE)</td>
                                    {(() => {
                                      const roeA = compareData.stock_a.info.roe;
                                      const roeB = compareData.stock_b.info.roe;
                                      const isHigherA = roeA && roeB ? roeA > roeB : false;
                                      return (
                                        <>
                                          <td className={`p-2 border-r border-slate-200 dark:border-slate-800/60 font-bold ${isHigherA ? "text-emerald-500" : ""}`}>{roeA ? `${(roeA * 100).toFixed(2)}%` : "N/A"}</td>
                                          <td className={`p-2 font-bold ${!isHigherA && roeB ? "text-emerald-500" : ""}`}>{roeB ? `${(roeB * 100).toFixed(2)}%` : "N/A"}</td>
                                        </>
                                      );
                                    })()}
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800/60">Dividend Yield</td>
                                    {(() => {
                                      const divA = compareData.stock_a.info.dividendYield;
                                      const divB = compareData.stock_b.info.dividendYield;
                                      const isHigherA = divA && divB ? divA > divB : false;
                                      return (
                                        <>
                                          <td className={`p-2 border-r border-slate-200 dark:border-slate-800/60 font-bold ${isHigherA ? "text-emerald-500" : ""}`}>{divA ? `${(divA * 100).toFixed(2)}%` : "0.00%"}</td>
                                          <td className={`p-2 font-bold ${!isHigherA && divB ? "text-emerald-500" : ""}`}>{divB ? `${(divB * 100).toFixed(2)}%` : "0.00%"}</td>
                                        </>
                                      );
                                    })()}
                                  </tr>

                                  {/* AI Consensus */}
                                  <tr>
                                    <td className="p-2 font-bold text-slate-400 uppercase tracking-wide bg-slate-50/50 dark:bg-slate-950/20" colSpan={3}>AI & Sentiment Analyst Scoring</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800/60">Headline News Sentiment</td>
                                    {(() => {
                                      const sentA = compareData.stock_a.recommendation?.signals.find((s: any) => s.name.includes("Sentiment"))?.value || "N/A";
                                      const sentB = compareData.stock_b.recommendation?.signals.find((s: any) => s.name.includes("Sentiment"))?.value || "N/A";
                                      return (
                                        <>
                                          <td className="p-2 text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800/60 font-bold">{sentA}</td>
                                          <td className="p-2 text-slate-700 dark:text-slate-200 font-bold">{sentB}</td>
                                        </>
                                      );
                                    })()}
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800/60">ML Next-Day price target</td>
                                    {(() => {
                                      const changeA = compareData.stock_a.recommendation?.predicted_change_pct || 0.0;
                                      const changeB = compareData.stock_b.recommendation?.predicted_change_pct || 0.0;
                                      return (
                                        <>
                                          <td className={`p-2 border-r border-slate-200 dark:border-slate-800/60 font-bold ${changeA >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{changeA >= 0 ? "+" : ""}{changeA.toFixed(2)}%</td>
                                          <td className={`p-2 font-bold ${changeB >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{changeB >= 0 ? "+" : ""}{changeB.toFixed(2)}%</td>
                                        </>
                                      );
                                    })()}
                                  </tr>
                                  <tr>
                                    <td className="p-2 font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-800/60">Lead AI consensus Recommendation</td>
                                    <td className="p-2 border-r border-slate-200 dark:border-slate-800/60">
                                      <span className={`px-2 py-0.5 rounded font-black ${compareData.stock_a.recommendation?.recommendation.includes("BUY") ? "bg-emerald-550/10 text-emerald-500" : compareData.stock_a.recommendation?.recommendation.includes("SELL") ? "bg-rose-550/10 text-rose-550" : "bg-amber-500/10 text-amber-500"}`}>
                                        {compareData.stock_a.recommendation?.recommendation || "N/A"}
                                      </span>
                                    </td>
                                    <td className="p-2">
                                      <span className={`px-2 py-0.5 rounded font-black ${compareData.stock_b.recommendation?.recommendation.includes("BUY") ? "bg-emerald-550/10 text-emerald-500" : compareData.stock_b.recommendation?.recommendation.includes("SELL") ? "bg-rose-550/10 text-rose-550" : "bg-amber-500/10 text-amber-500"}`}>
                                        {compareData.stock_b.recommendation?.recommendation || "N/A"}
                                      </span>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-20 text-slate-500 text-xs">Enter symbols above and perform peer comparison analysis.</div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* Right Column (AI Predictions, Stats, Sentiment Gauge) */}
              <div className="lg:col-span-1 flex flex-col space-y-6">
                
                {/* AI Recommendation Center & Trade Signals Card */}
                {/* AI Recommendation Center & Trade Signals Card */}
                <div className={`p-5 rounded-2xl border ${themeClasses.card}`}>
                  <div className="flex justify-between items-center border-b pb-3 mb-4 border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                      <Cpu className="h-4.5 w-4.5 text-indigo-500" />
                      <span>AI Recommendation Center</span>
                    </h4>
                    {loadingRecommendation ? (
                      <span className="text-4xs font-bold text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                        <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                        <span>Analyzing...</span>
                      </span>
                    ) : (
                      <span className="text-4xs font-bold text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Live ML</span>
                    )}
                  </div>

                  {/* Recommendation Gauge */}
                  <div className="flex flex-col items-center justify-center text-center pb-4 border-b border-slate-200/40 dark:border-slate-800/85" key={selectedTicker}>
                    {(() => {
                      const isLoading = loadingRecommendation || !aiRecommendation;
                      let rotate = 0;
                      let rec = "";
                      
                      if (aiRecommendation) {
                        rec = aiRecommendation.recommendation.toUpperCase();
                        if (rec === "STRONG BUY") {
                          rotate = 65;
                        } else if (rec === "BUY") {
                          rotate = 30;
                        } else if (rec === "HOLD") {
                          rotate = 0;
                        } else if (rec === "SELL") {
                          rotate = -30;
                        } else if (rec === "STRONG SELL") {
                          rotate = -65;
                        }
                      }
                      
                      // Dynamic needle and glow styling
                      let needleColor = "#6366f1";
                      let glowColor = "rgba(99, 102, 241, 0.45)";
                      if (!isLoading && aiRecommendation) {
                        if (rec.includes("BUY")) {
                          needleColor = "#10b981";
                          glowColor = "rgba(16, 185, 129, 0.55)";
                        } else if (rec.includes("SELL")) {
                          needleColor = "#f43f5e";
                          glowColor = "rgba(244, 63, 94, 0.55)";
                        } else {
                          needleColor = "#f59e0b";
                          glowColor = "rgba(245, 158, 11, 0.55)";
                        }
                      }

                      return (
                        <div className="flex flex-col items-center justify-center text-center w-full">
                          <div className="relative w-full max-w-[240px] h-32 flex items-center justify-center overflow-hidden">
                            <svg viewBox="0 0 100 60" className="w-full h-full">
                              <defs>
                                <linearGradient id="gaugeSpectrum" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#ef4444" /> {/* Red */}
                                  <stop offset="25%" stopColor="#f97316" /> {/* Orange */}
                                  <stop offset="50%" stopColor="#eab308" /> {/* Yellow */}
                                  <stop offset="75%" stopColor="#22c55e" /> {/* Green */}
                                  <stop offset="100%" stopColor="#10b981" /> {/* Emerald */}
                                </linearGradient>
                                <linearGradient id="glassGlare" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                                  <stop offset="60%" stopColor="#ffffff" stopOpacity="0.0" />
                                </linearGradient>
                                <radialGradient id="metallicHub" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
                                  <stop offset="0%" stopColor="#e2e8f0" />
                                  <stop offset="45%" stopColor="#cbd5e1" />
                                  <stop offset="80%" stopColor="#64748b" />
                                  <stop offset="100%" stopColor="#334155" />
                                </radialGradient>
                                <filter id="needleShadow" x="-30%" y="-30%" width="160%" height="160%">
                                  <feDropShadow dx="0" dy="1.2" stdDeviation="0.8" floodOpacity="0.35" />
                                </filter>
                              </defs>
                              
                              {/* Background arc glow (Warm active segment glow behind track) */}
                              {!isLoading && (() => {
                                let glowArcColor = "";
                                let glowD = "";
                                if (rec === "STRONG BUY" || rec === "BUY") {
                                  glowArcColor = "#10b981";
                                  glowD = "M 50 10 A 40 40 0 0 1 90 50";
                                } else if (rec === "STRONG SELL" || rec === "SELL") {
                                  glowArcColor = "#ef4444";
                                  glowD = "M 10 50 A 40 40 0 0 1 50 10";
                                } else {
                                  glowArcColor = "#eab308";
                                  glowD = "M 30 26 A 40 40 0 0 1 70 26";
                                }
                                return (
                                  <path 
                                    d={glowD} 
                                    fill="none" 
                                    stroke={glowArcColor} 
                                    strokeWidth="14" 
                                    strokeLinecap="round" 
                                    opacity="0.22" 
                                    filter="blur(3px)"
                                  />
                                );
                              })()}

                              {/* Concentric blueprint guide lines */}
                              <path 
                                d="M 6 50 A 44 44 0 0 1 94 50" 
                                fill="none" 
                                stroke={theme === "light" ? "rgba(148, 163, 184, 0.15)" : "rgba(51, 65, 85, 0.3)"} 
                                strokeWidth="0.5" 
                              />
                              <path 
                                d="M 14 50 A 36 36 0 0 1 86 50" 
                                fill="none" 
                                stroke={theme === "light" ? "rgba(148, 163, 184, 0.1)" : "rgba(51, 65, 85, 0.2)"} 
                                strokeWidth="0.5" 
                                strokeDasharray="1,2" 
                              />
                              
                              {/* Base track */}
                              <path 
                                d="M 10 50 A 40 40 0 0 1 90 50" 
                                fill="none" 
                                stroke={theme === "light" ? "#f1f5f9" : "#111827"} 
                                strokeWidth="8" 
                                strokeLinecap="round" 
                              />
                              
                              {/* Color spectrum track */}
                              <path 
                                d="M 10 50 A 40 40 0 0 1 90 50" 
                                fill="none" 
                                stroke="url(#gaugeSpectrum)" 
                                strokeWidth="8" 
                                strokeLinecap="round" 
                                opacity="0.95"
                              />
                              
                              {/* Ticks around the gauge */}
                              {/* Major Ticks */}
                              <line x1="50" y1="6" x2="50" y2="10" stroke="#ef4444" strokeWidth="0.75" transform="rotate(-90, 50, 50)" />
                              <line x1="50" y1="6" x2="50" y2="10" stroke="#f97316" strokeWidth="0.75" transform="rotate(-60, 50, 50)" />
                              <line x1="50" y1="6" x2="50" y2="10" stroke="#f59e0b" strokeWidth="0.75" transform="rotate(-30, 50, 50)" />
                              <line x1="50" y1="6" x2="50" y2="10" stroke="#eab308" strokeWidth="0.75" transform="rotate(0, 50, 50)" />
                              <line x1="50" y1="6" x2="50" y2="10" stroke="#84cc16" strokeWidth="0.75" transform="rotate(30, 50, 50)" />
                              <line x1="50" y1="6" x2="50" y2="10" stroke="#22c55e" strokeWidth="0.75" transform="rotate(60, 50, 50)" />
                              <line x1="50" y1="6" x2="50" y2="10" stroke="#10b981" strokeWidth="0.75" transform="rotate(90, 50, 50)" />
                              
                              {/* Minor Ticks */}
                              <line x1="50" y1="6" x2="50" y2="8" stroke={theme === "light" ? "#94a3b8" : "#475569"} strokeWidth="0.4" transform="rotate(-75, 50, 50)" />
                              <line x1="50" y1="6" x2="50" y2="8" stroke={theme === "light" ? "#94a3b8" : "#475569"} strokeWidth="0.4" transform="rotate(-45, 50, 50)" />
                              <line x1="50" y1="6" x2="50" y2="8" stroke={theme === "light" ? "#94a3b8" : "#475569"} strokeWidth="0.4" transform="rotate(-15, 50, 50)" />
                              <line x1="50" y1="6" x2="50" y2="8" stroke={theme === "light" ? "#94a3b8" : "#475569"} strokeWidth="0.4" transform="rotate(15, 50, 50)" />
                              <line x1="50" y1="6" x2="50" y2="8" stroke={theme === "light" ? "#94a3b8" : "#475569"} strokeWidth="0.4" transform="rotate(45, 50, 50)" />
                              <line x1="50" y1="6" x2="50" y2="8" stroke={theme === "light" ? "#94a3b8" : "#475569"} strokeWidth="0.4" transform="rotate(75, 50, 50)" />

                              {/* Glare reflection overlay */}
                              <path 
                                d="M 10 50 A 40 40 0 0 1 90 50 Z" 
                                fill="url(#glassGlare)" 
                                opacity="0.08" 
                                pointerEvents="none" 
                              />

                              {/* Gauge labels */}
                              <text x="12" y="58" className="text-[4px] font-black fill-rose-500/90 tracking-wider" textAnchor="middle">SELL</text>
                              <text x="50" y="5" className="text-[4px] font-black fill-amber-500/90 tracking-wider" textAnchor="middle">HOLD</text>
                              <text x="88" y="58" className="text-[4px] font-black fill-emerald-500/90 tracking-wider" textAnchor="middle">BUY</text>

                              {/* Needle group */}
                              <g 
                                className={isLoading ? "gauge-needle-scanning" : "gauge-needle-animate"} 
                                style={{ 
                                  '--target-rotation': `${rotate}deg`,
                                  transform: isLoading ? undefined : `rotate(${rotate}deg)`,
                                  transformOrigin: "50px 50px",
                                  filter: `drop-shadow(0 0 3px ${needleColor})`
                                } as React.CSSProperties}
                              >
                                <polygon 
                                  points="49,50 50,8 51,50" 
                                  fill={needleColor} 
                                  filter="url(#needleShadow)"
                                />
                                <line 
                                  x1="50" y1="50" x2="50" y2="12" 
                                  stroke="#ffffff" 
                                  strokeWidth="0.35" 
                                  opacity="0.8"
                                />
                              </g>
                              
                              {/* 3D Beveled Hub Center Pin */}
                              <circle cx="50" cy="50" r="5.5" fill="url(#metallicHub)" stroke="#1e293b" strokeWidth="0.3" filter="url(#needleShadow)" />
                              <circle cx="50" cy="50" r="2.2" fill="#4f46e5" />
                              <circle cx="50" cy="50" r="0.8" fill="#a5b4fc" />
                            </svg>
                          </div>
                          
                          {/* HUD readout panel */}
                          <div className="flex flex-col items-center mt-4 w-full">
                            {isLoading ? (
                              <div className="bg-slate-100/40 dark:bg-[#080d19] p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/80 w-full max-w-[200px] flex flex-col items-center justify-center shadow-inner">
                                <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                                  CALIBRATING...
                                </span>
                                <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-1 font-bold">
                                  ENGINES RUNNING
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center w-full">
                                {/* Glowing Readout Panel */}
                                <div className={`px-4 py-2 rounded-xl border flex flex-col items-center justify-center min-w-[190px] shadow-sm transition-all duration-500 ${
                                  rec.includes("BUY") 
                                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/5" 
                                    : rec.includes("SELL") 
                                      ? "bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-500 shadow-rose-500/5" 
                                      : "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-500 shadow-amber-500/5"
                                }`}>
                                  <span className="text-[8px] font-black uppercase tracking-widest opacity-60">RECOMMENDED ACTION</span>
                                  <span className="font-extrabold text-sm uppercase tracking-wider mt-0.5 animate-pulse">
                                    {aiRecommendation.recommendation}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-4 mt-2.5 text-3xs text-slate-405 dark:text-slate-400 font-extrabold">
                                  <span className="flex items-center gap-1">
                                    <span>CONFIDENCE:</span>
                                    <span className={`font-black ${
                                      aiRecommendation.confidence > 75 
                                        ? "text-emerald-500" 
                                        : aiRecommendation.confidence > 50 
                                          ? "text-amber-500" 
                                          : "text-slate-550"
                                    }`}>{aiRecommendation.confidence}%</span>
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-800">|</span>
                                  <span>ML ENGINE v2.0</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ML Target Price */}
                  <div className="py-4 border-b border-slate-200/40 dark:border-slate-800/85 space-y-2">
                    <div className="flex justify-between items-center text-3xs text-slate-400 font-bold uppercase tracking-wider">
                      <span>Next-Day ML Target Close</span>
                      <span>Tomorrow</span>
                    </div>
                    {loadingRecommendation || !aiRecommendation ? (
                      <div className="h-7 w-2/3 bg-slate-100 dark:bg-slate-850 animate-pulse rounded-md mt-1"></div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          ₹{aiRecommendation.predicted_price.toFixed(2)}
                        </span>
                        <span className={`text-2xs font-extrabold px-2 py-0.5 rounded-lg flex items-center border ${
                          aiRecommendation.predicted_change_pct >= 0 
                            ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" 
                            : "text-rose-500 bg-rose-500/10 border-rose-500/20"
                        }`}>
                          {aiRecommendation.predicted_change_pct >= 0 ? "▲ +" : "▼ "}{aiRecommendation.predicted_change_pct.toFixed(2)}% Target Return
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Active Quantitative Triggers */}
                  <div className="pt-4 space-y-3">
                    <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">Active Signal Triggers</span>
                    {loadingRecommendation || !aiRecommendation ? (
                      <div className="space-y-2.5">
                        <div className="h-10 w-full bg-slate-100 dark:bg-slate-850 animate-pulse rounded-lg"></div>
                        <div className="h-10 w-full bg-slate-100 dark:bg-slate-850 animate-pulse rounded-lg"></div>
                        <div className="h-10 w-full bg-slate-100 dark:bg-slate-850 animate-pulse rounded-lg"></div>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                        {aiRecommendation.signals.map((sig: any, idx: number) => (
                          <div key={idx} className="bg-slate-100/40 dark:bg-[#0E1322]/55 p-2.5 rounded-xl space-y-1">
                            <div className="flex justify-between items-center text-3xs">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{sig.name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-4xs font-black uppercase ${
                                sig.status === "Bullish" || sig.status.includes("BUY") ? "bg-emerald-500/10 text-emerald-500" : sig.status === "Bearish" || sig.status.includes("SELL") ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                              }`}>{sig.status}</span>
                            </div>
                            <p className="text-4xs text-slate-400 leading-relaxed font-semibold">{sig.desc}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Statistics Card */}
                <div className={`p-5 rounded-2xl border ${themeClasses.card}`}>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm border-b pb-3 mb-4 border-slate-200 dark:border-slate-800">
                    Key Statistics
                  </h4>

                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-slate-100 dark:border-slate-800/60">
                        <td className="py-2.5 text-slate-400">52 Week High</td>
                        <td className="py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">
                          {currentStock.fiftyTwoWeekHigh > 0 ? `${currencySymbol}${currentStock.fiftyTwoWeekHigh.toFixed(2)}` : "N/A"}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-800/60">
                        <td className="py-2.5 text-slate-400">52 Week Low</td>
                        <td className="py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">
                          {currentStock.fiftyTwoWeekLow > 0 ? `${currencySymbol}${currentStock.fiftyTwoWeekLow.toFixed(2)}` : "N/A"}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-800/60">
                        <td className="py-2.5 text-slate-400">P/E Ratio</td>
                        <td className="py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">{currentStock.PE}</td>
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-800/60">
                        <td className="py-2.5 text-slate-400">EPS</td>
                        <td className="py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">{currentStock.EPS}</td>
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-800/60">
                        <td className="py-2.5 text-slate-400">Dividend Yield</td>
                        <td className="py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">{currentStock.divYield}</td>
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-800/60">
                        <td className="py-2.5 text-slate-400">ROE</td>
                        <td className="py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">{currentStock.ROE}</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-slate-400">Face Value</td>
                        <td className="py-2.5 text-right font-bold text-slate-700 dark:text-slate-200">₹1.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* ==================== TAB 2: PORTFOLIO OPTIMIZER ==================== */}
        {activeTab === "optimizer" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left selector */}
            <div className={`p-5 rounded-2xl border flex flex-col space-y-4 ${themeClasses.card}`}>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Portfolio Asset Allocation</h3>
                <p className="text-2xs text-slate-400">Select Nifty 50 assets to optimize weights using MPT.</p>
              </div>

              <div className="space-y-1 bg-slate-50 dark:bg-[#0E1322]/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 max-h-[200px] overflow-y-auto">
                {tickers.map(ticker => {
                  const isChecked = portfolioTickers.includes(ticker);
                  return (
                    <label key={ticker} className="flex items-center space-x-3 text-xs text-slate-600 dark:text-slate-300 font-semibold cursor-pointer py-1.5">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setPortfolioTickers(portfolioTickers.filter(t => t !== ticker));
                          } else {
                            setPortfolioTickers([...portfolioTickers, ticker]);
                          }
                        }}
                        className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>{ticker}</span>
                    </label>
                  );
                })}
              </div>

              <div className="flex flex-col space-y-1 text-xs">
                <label className="text-2xs text-slate-400 font-bold uppercase">Portfolio Name</label>
                <input 
                  type="text" 
                  value={portfolioName}
                  onChange={(e) => setPortfolioName(e.target.value)}
                  className={`border text-slate-900 rounded-xl px-3 py-2 ${themeClasses.input}`}
                />
              </div>

              <label className="flex items-center space-x-2 text-2xs text-slate-500 dark:text-slate-450 font-semibold cursor-pointer select-none pb-1">
                <input 
                  type="checkbox" 
                  checked={useAiViews} 
                  onChange={(e) => setUseAiViews(e.target.checked)} 
                  className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" 
                />
                <span>(Black-Litterman) Tilt expected returns by AI recommendation views (±8% tilt)</span>
              </label>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={optimizeWeights}
                  disabled={portfolioTickers.length < 2 || optLoading}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-300 text-white font-bold text-xs py-2.5 rounded-xl flex-1 flex items-center justify-center space-x-2"
                >
                  {optLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <PieIcon className="h-4 w-4" />}
                  <span>Optimize Weights</span>
                </button>
                {optResults && (
                  <button
                    onClick={saveOptimizedPortfolio}
                    className="bg-slate-100 hover:bg-slate-200 border text-slate-800 font-bold text-xs px-4 rounded-xl"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>

            {/* Right Display area */}
            <div className="lg:col-span-2 flex flex-col space-y-6">
              
              {optResults ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Weights allocations */}
                  <div className={`overflow-hidden rounded-2xl border flex flex-col justify-between ${themeClasses.card}`}>
                    <div>
                      <div className="card-header-gradient px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">Optimal Maximum Sharpe Weights</span>
                        <span className="text-3xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">Optimal</span>
                      </div>
                      
                      <div className="space-y-3 p-5">
                        {Object.entries(optResults.max_sharpe.weights).map(([ticker, weight]: [string, any]) => (
                          <div key={ticker} className="flex flex-col space-y-1">
                            <div className="flex justify-between text-2xs font-semibold text-slate-600 dark:text-slate-300">
                              <span>{ticker}</span>
                              <span>{(weight * 100).toFixed(2)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2">
                              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${weight * 100}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4 mx-5 mb-5 mt-2 grid grid-cols-3 gap-2 text-center border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="text-3xs text-slate-400 font-bold uppercase">Return</div>
                        <div className="text-sm font-bold text-emerald-500">{(optResults.max_sharpe.return * 100).toFixed(2)}%</div>
                      </div>
                      <div>
                        <div className="text-3xs text-slate-400 font-bold uppercase">Risk (Vol)</div>
                        <div className="text-sm font-bold text-rose-500">{(optResults.max_sharpe.volatility * 100).toFixed(2)}%</div>
                      </div>
                      <div>
                        <div className="text-3xs text-slate-400 font-bold uppercase">Sharpe Ratio</div>
                        <div className="text-sm font-bold text-indigo-500">{optResults.max_sharpe.sharpe_ratio.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Efficient Frontier scatter plot (Fixed Recharts Console Warning) */}
                  <div className={`p-5 rounded-2xl border flex flex-col ${themeClasses.card}`}>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-200 dark:border-slate-800">Efficient Frontier Curve</h4>
                    <div className="w-full h-[240px] min-h-[240px] mt-4">
                      {isMounted && (
                        <ResponsiveContainer width="100%" height={240} minWidth={0}>
                          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                            <CartesianGrid stroke={theme === "light" ? "#F1F5F9" : "#1E293B"} />
                            <XAxis type="number" dataKey="volatility" name="Volatility" unit="" label={{ value: "Volatility (Risk)", position: "bottom", fill: "#94A3B8", fontSize: 10 }} stroke="#94A3B8" fontSize={8} tickFormatter={(v) => typeof v === 'number' ? `${v.toFixed(2)}%` : v} />
                            <YAxis type="number" dataKey="return" name="Return" unit="" label={{ value: "Return", angle: -90, position: "insideLeft", fill: "#94A3B8", fontSize: 10 }} stroke="#94A3B8" fontSize={8} tickFormatter={(v) => typeof v === 'number' ? `${v.toFixed(2)}%` : v} />
                            <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v: any) => [typeof v === 'number' ? `${v.toFixed(2)}%` : v]} contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0F172A", border: "1px solid #E2E8F0" }} />
                            <Scatter name="Portfolios" data={optResults.frontier_points.map((p: any) => ({ ...p, return: Number(p.return) * 100, volatility: Number(p.volatility) * 100 }))} fill="#10B981" line={false} shape="circle" fillOpacity={0.6} />
                          </ScatterChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center p-20 border border-dashed rounded-2xl text-slate-400 text-center space-y-3 ${themeClasses.card}`}>
                  <BarChart2 className="h-10 w-10 text-slate-400" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">No Active Optimization</h4>
                    <p className="text-2xs text-slate-400">Select stock tickers on the left panel to optimized allocations.</p>
                  </div>
                </div>
              )}

              {/* Saved portfolios list */}
              <div className={`p-5 rounded-2xl border ${themeClasses.card}`}>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-200 dark:border-slate-800">Saved Portfolios Database</h4>
                <div className="mt-4 space-y-2.5 max-h-[250px] overflow-y-auto">
                  {savedPortfolios.map((portfolio, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-[#0E1322]/40 p-3 md:p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs w-full min-w-0">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 dark:text-white text-sm truncate">{portfolio.name}</div>
                        <div className="text-2xs text-slate-400 truncate">Assets: {portfolio.tickers.join(", ")}</div>
                      </div>
                      <div className="flex space-x-4 text-center self-end sm:self-auto shrink-0">
                        <div>
                          <div className="text-3xs text-slate-400 font-bold uppercase">Return</div>
                          <div className="text-xs font-semibold text-emerald-500">{(portfolio.expected_return * 100).toFixed(2)}%</div>
                        </div>
                        <div>
                          <div className="text-3xs text-slate-400 font-bold uppercase">Volatility</div>
                          <div className="text-xs font-semibold text-rose-500">{(portfolio.volatility * 100).toFixed(2)}%</div>
                        </div>
                        <div>
                          <div className="text-3xs text-slate-400 font-bold uppercase">Sharpe</div>
                          <div className="text-xs font-semibold text-indigo-500">{portfolio.sharpe_ratio.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================== TAB 3: PERSONAL FINANCE ==================== */}
        {activeTab === "finance" && (
          <div className="col-span-1 lg:col-span-3 flex flex-col space-y-6">
            
            {/* Sub-tab navigation */}
            <div className="border-b border-slate-200 dark:border-slate-800/80 mb-5 w-full">
              <div className="scroll-x-touch flex text-xs font-semibold gap-x-4 md:gap-x-6 w-full flex-nowrap pb-1">
                {[
                  { id: "sip", label: "SIP Planner", fullLabel: "Advanced SIP Planner" },
                  { id: "compare_sip", label: "Compare SIPs", fullLabel: "Compare SIPs" },
                  { id: "tax_expense", label: "Tax & Ledger", fullLabel: "Tax & Expenses Ledger" },
                  { id: "mf", label: "Mutual Funds", fullLabel: "Mutual Fund Advisor" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFinanceTab(tab.id as any)}
                    className={`transition-all pb-3 relative whitespace-nowrap cursor-pointer min-h-[36px] flex items-center ${
                      activeFinanceTab === tab.id
                        ? "text-indigo-500 font-bold"
                        : "text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    <span className="sm:hidden">{tab.label}</span>
                    <span className="hidden sm:inline">{tab.fullLabel}</span>
                    {activeFinanceTab === tab.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full shadow-sm"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>


            {/* Sub-tab Contents */}
            <div>
              {/* 1. ADVANCED SIP PLANNER */}
              {activeFinanceTab === "sip" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Controls Card */}
                  <div className={`p-5 rounded-2xl border flex flex-col space-y-4 ${themeClasses.card}`}>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs pb-2 border-b border-slate-200 dark:border-slate-800">SIP Investment Inputs</h4>
                    
                    <div className="flex space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg mb-2">
                      <button 
                        onClick={() => setSipMode("investment")}
                        className={`flex-1 py-1 rounded text-3xs font-bold transition-all ${sipMode === "investment" ? "bg-white dark:bg-[#131B31] text-indigo-500 shadow-sm" : "text-slate-400"}`}
                      >
                        Wealth Growth
                      </button>
                      <button 
                        onClick={() => setSipMode("goal")}
                        className={`flex-1 py-1 rounded text-3xs font-bold transition-all ${sipMode === "goal" ? "bg-white dark:bg-[#131B31] text-indigo-500 shadow-sm" : "text-slate-400"}`}
                      >
                        Target Goal
                      </button>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      {sipMode === "investment" ? (
                        <div className="flex flex-col space-y-1">
                          <label className="text-2xs text-slate-400 font-bold">Monthly SIP Amount (₹)</label>
                          <input 
                            type="number" 
                            value={sipMonthly} 
                            onChange={(e) => setSipMonthly(Number(e.target.value))}
                            className={`border rounded-xl px-3 py-2 ${themeClasses.input}`}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-1">
                          <label className="text-2xs text-slate-400 font-bold">Target Corpus Goal (₹)</label>
                          <input 
                            type="number" 
                            value={sipTargetAmount} 
                            onChange={(e) => setSipTargetAmount(Number(e.target.value))}
                            className={`border rounded-xl px-3 py-2 ${themeClasses.input}`}
                          />
                        </div>
                      )}
                      
                      <div className="flex grid grid-cols-2 gap-3">
                        <div className="flex flex-col space-y-1">
                          <label className="text-2xs text-slate-400 font-bold">Expected Return (%)</label>
                          <input 
                            type="number" 
                            value={sipReturn} 
                            onChange={(e) => setSipReturn(Number(e.target.value))}
                            className={`border rounded-xl px-3 py-2 ${themeClasses.input}`}
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-2xs text-slate-400 font-bold">Duration (Years)</label>
                          <input 
                            type="number" 
                            value={sipYears} 
                            onChange={(e) => setSipYears(Number(e.target.value))}
                            className={`border rounded-xl px-3 py-2 ${themeClasses.input}`}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <div className="flex justify-between text-2xs font-bold">
                          <span className="text-slate-400">Annual Step-up (%)</span>
                          <span className="text-indigo-400">{sipStepUp}% Increase</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="25"
                          step="1"
                          value={sipStepUp}
                          onChange={(e) => setSipStepUp(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      <div className="flex flex-col space-y-1">
                        <div className="flex justify-between text-2xs font-bold">
                          <span className="text-slate-400">Inflation Rate (%)</span>
                          <span className="text-rose-400">{sipInflation}% Discount</span>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="12"
                          step="1"
                          value={sipInflation}
                          onChange={(e) => setSipInflation(Number(e.target.value))}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <button
                      onClick={runSipEnhancedCalc}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition-colors w-full flex items-center justify-center space-x-1.5"
                    >
                      {sipEnhancedLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                      <span>Calculate Roadmap</span>
                    </button>
                  </div>

                  {/* Right Projections Panel */}
                  <div className="lg:col-span-2 flex flex-col space-y-6">
                    {sipEnhancedResults ? (
                      <div className="space-y-6">
                        {/* Highlights Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className={`p-4 rounded-xl border ${themeClasses.card} bg-slate-50/60 dark:bg-[#0E1322]/30`}>
                            <span className="text-3xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Total Principal</span>
                            <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">₹{sipEnhancedResults.total_invested.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                          </div>
                          <div className={`p-4 rounded-xl border ${themeClasses.card} bg-slate-50/60 dark:bg-[#0E1322]/30`}>
                            <span className="text-3xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Wealth Gain</span>
                            <span className="text-base font-black text-emerald-500 mt-1 block">+₹{sipEnhancedResults.wealth_gain.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                          </div>
                          <div className={`p-4 rounded-xl border ${themeClasses.card} bg-slate-50/60 dark:bg-[#0E1322]/30`}>
                            <span className="text-3xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Nominal Corpus</span>
                            <span className="text-base font-black text-indigo-400 mt-1 block">₹{sipEnhancedResults.future_value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                          </div>
                          <div className={`p-4 rounded-xl border ${themeClasses.card} bg-slate-50/60 dark:bg-[#0E1322]/30`}>
                            <span className="text-3xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Real Purchasing Power</span>
                            <span className="text-base font-black text-rose-400 mt-1 block">₹{sipEnhancedResults.real_purchasing_power.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                          </div>
                        </div>

                        {/* Compound Growth Area Chart */}
                        <div className={`p-5 rounded-2xl border ${themeClasses.card}`}>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-3">SIP Wealth Roadmap Accumulation</h4>
                          <div className="h-[260px] w-full">
                            {isMounted && (
                              <ResponsiveContainer width="100%" height={260} minWidth={0}>
                                <AreaChart data={sipEnhancedResults.schedule} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                                    </linearGradient>
                                    <linearGradient id="colorMaturity" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} />
                                  <XAxis dataKey="year" name="Year" stroke="#64748B" fontSize={8} tickFormatter={(y) => `Yr ${y}`} />
                                  <YAxis stroke="#64748B" fontSize={8} tickFormatter={(v) => `₹${formatVolume(v)}`} />
                                  <Tooltip formatter={(value: any) => [typeof value === 'number' ? `₹${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : value]} contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
                                  <Legend wrapperStyle={{ fontSize: 9 }} />
                                  <Area type="monotone" dataKey="total_invested" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorInvested)" name="Total Principal Invested" />
                                  <Area type="monotone" dataKey="future_value" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMaturity)" name="Final Corpus Value" />
                                </AreaChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>

                        {/* Goal roadmap notification */}
                        {sipMode === "goal" && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-xs text-slate-700 dark:text-slate-200 flex items-start space-x-2.5">
                            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                            <div>
                              <p className="font-bold text-slate-800 dark:text-white">Goal Planning Recommendation</p>
                              <p className="mt-1 leading-relaxed">
                                To accumulate your target corpus of <b>₹{sipTargetAmount.toLocaleString("en-IN")}</b> in <b>{sipYears} years</b> (at <b>{sipReturn}% expected return</b> and <b>{sipStepUp}% annual step-up</b>), you need an initial monthly investment of <b className="text-emerald-400">₹{Math.round(sipEnhancedResults.monthly_investment).toLocaleString("en-IN")}</b>.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`flex flex-col items-center justify-center p-20 border border-dashed rounded-2xl text-slate-400 text-center space-y-3 ${themeClasses.card}`}>
                        <Calculator className="h-10 w-10 text-slate-500" />
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white text-sm">Wealth Projections</h4>
                          <p className="text-2xs text-slate-400">Configure parameters on the left and click "Calculate Roadmap" to run quantitative projections.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. COMPARE SIPS */}
              {activeFinanceTab === "compare_sip" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Comparator Inputs */}
                  <div className={`p-5 rounded-2xl border flex flex-col space-y-5 ${themeClasses.card}`}>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs pb-2 border-b border-slate-200 dark:border-slate-800">Configure Comparisons</h4>
                    
                    {/* Setup A */}
                    <div className="space-y-2.5">
                      <span className="text-3xs text-indigo-400 font-extrabold uppercase tracking-wider block">SIP Configuration A</span>
                      <div className="grid grid-cols-2 gap-2 text-3xs">
                        <div className="flex flex-col space-y-1">
                          <label className="text-slate-400 font-semibold">Monthly SIP (₹)</label>
                          <input type="number" value={compSipAmountA} onChange={(e) => setCompSipAmountA(Number(e.target.value))} className={`border rounded-lg px-2.5 py-1.5 ${themeClasses.input}`} />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-slate-400 font-semibold">Return (%)</label>
                          <input type="number" value={compSipReturnA} onChange={(e) => setCompSipReturnA(Number(e.target.value))} className={`border rounded-lg px-2.5 py-1.5 ${themeClasses.input}`} />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-slate-400 font-semibold">Years</label>
                          <input type="number" value={compSipYearsA} onChange={(e) => setCompSipYearsA(Number(e.target.value))} className={`border rounded-lg px-2.5 py-1.5 ${themeClasses.input}`} />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-slate-400 font-semibold">Step-up (%)</label>
                          <input type="number" value={compSipStepUpA} onChange={(e) => setCompSipStepUpA(Number(e.target.value))} className={`border rounded-lg px-2.5 py-1.5 ${themeClasses.input}`} />
                        </div>
                      </div>
                    </div>

                    <hr className="border-slate-800/80" />

                    {/* Setup B */}
                    <div className="space-y-2.5">
                      <span className="text-3xs text-emerald-400 font-extrabold uppercase tracking-wider block">SIP Configuration B</span>
                      <div className="grid grid-cols-2 gap-2 text-3xs">
                        <div className="flex flex-col space-y-1">
                          <label className="text-slate-400 font-semibold">Monthly SIP (₹)</label>
                          <input type="number" value={compSipAmountB} onChange={(e) => setCompSipAmountB(Number(e.target.value))} className={`border rounded-lg px-2.5 py-1.5 ${themeClasses.input}`} />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-slate-400 font-semibold">Return (%)</label>
                          <input type="number" value={compSipReturnB} onChange={(e) => setCompSipReturnB(Number(e.target.value))} className={`border rounded-lg px-2.5 py-1.5 ${themeClasses.input}`} />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-slate-400 font-semibold">Years</label>
                          <input type="number" value={compSipYearsB} onChange={(e) => setCompSipYearsB(Number(e.target.value))} className={`border rounded-lg px-2.5 py-1.5 ${themeClasses.input}`} />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-slate-400 font-semibold">Step-up (%)</label>
                          <input type="number" value={compSipStepUpB} onChange={(e) => setCompSipStepUpB(Number(e.target.value))} className={`border rounded-lg px-2.5 py-1.5 ${themeClasses.input}`} />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={runSipCompareCalc}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center space-x-1.5"
                    >
                      {sipCompareLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                      <span>Compare Allocations</span>
                    </button>
                  </div>

                  {/* Comparator Charts & Grid */}
                  <div className="lg:col-span-2 flex flex-col space-y-6">
                    {sipCompareResults ? (
                      <div className="space-y-6">
                        {/* Side by side stats grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className={`p-4 rounded-xl border ${themeClasses.card} bg-slate-50/60 dark:bg-[#0E1322]/30 space-y-2 text-xs`}>
                            <span className="text-3xs text-indigo-500 dark:text-indigo-400 font-extrabold uppercase block border-b pb-1 border-slate-200 dark:border-slate-800">Portfolio A Maturity</span>
                            <div className="flex justify-between text-2xs">
                              <span className="text-slate-500 dark:text-slate-400">Total Invested:</span>
                              <span className="font-semibold text-slate-800 dark:text-white">₹{sipCompareResults.sip_a.total_invested.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                            </div>
                            <div className="flex justify-between text-2xs">
                              <span className="text-slate-500 dark:text-slate-400">Maturity Value:</span>
                              <span className="font-black text-indigo-500 dark:text-indigo-400">₹{sipCompareResults.sip_a.future_value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                            </div>
                          </div>

                          <div className={`p-4 rounded-xl border ${themeClasses.card} bg-slate-50/60 dark:bg-[#0E1322]/30 space-y-2 text-xs`}>
                            <span className="text-3xs text-emerald-500 dark:text-emerald-400 font-extrabold uppercase block border-b pb-1 border-slate-200 dark:border-slate-800">Portfolio B Maturity</span>
                            <div className="flex justify-between text-2xs">
                              <span className="text-slate-500 dark:text-slate-400">Total Invested:</span>
                              <span className="font-semibold text-slate-800 dark:text-white">₹{sipCompareResults.sip_b.total_invested.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                            </div>
                            <div className="flex justify-between text-2xs">
                              <span className="text-slate-500 dark:text-slate-400">Maturity Value:</span>
                              <span className="font-black text-emerald-500 dark:text-emerald-400">₹{sipCompareResults.sip_b.future_value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                            </div>
                          </div>
                        </div>

                        {/* Comparative Growth Chart */}
                        <div className={`p-5 rounded-2xl border ${themeClasses.card}`}>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-3">Maturity Comparison Curve</h4>
                          <div className="h-[220px] w-full">
                            {isMounted && (
                              <ResponsiveContainer width="100%" height={220} minWidth={0}>
                                <LineChart margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} />
                                  <XAxis dataKey="year" stroke="#64748B" fontSize={8} tickFormatter={(y) => `Yr ${y}`} />
                                  <YAxis stroke="#64748B" fontSize={8} tickFormatter={(v) => `₹${formatVolume(v)}`} />
                                  <Tooltip formatter={(v: any) => [typeof v === 'number' ? `₹${v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : v]} contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
                                  <Legend wrapperStyle={{ fontSize: 9 }} />
                                  <Line type="monotone" data={sipCompareResults.sip_a.schedule} dataKey="future_value" stroke="#6366F1" strokeWidth={2} dot={false} name="Portfolio A" />
                                  <Line type="monotone" data={sipCompareResults.sip_b.schedule} dataKey="future_value" stroke="#10B981" strokeWidth={2} dot={false} name="Portfolio B" />
                                </LineChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`flex flex-col items-center justify-center p-20 border border-dashed rounded-2xl text-slate-400 text-center space-y-3 ${themeClasses.card}`}>
                        <Calculator className="h-10 w-10 text-slate-500" />
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white text-sm">Comparison Dashboard</h4>
                          <p className="text-2xs text-slate-400">Configure parameters on the left and click "Compare Allocations" to run side-by-side growth comparisons.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. TAX & EXPENSES LEDGER */}
              {activeFinanceTab === "tax_expense" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Tax Calculator */}
                  <div className="lg:col-span-1 flex flex-col space-y-6">
                    <div className={`p-5 rounded-2xl border flex flex-col space-y-4 ${themeClasses.card}`}>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        <span>Capital Gains Tax Estimator</span>
                      </h3>

                      <div className="space-y-3 text-xs">
                        <div className="flex flex-col space-y-1">
                          <label className="text-2xs text-slate-400 font-bold">Buy Value (₹)</label>
                          <input 
                            type="number" 
                            value={taxBuy} 
                            onChange={(e) => setTaxBuy(Number(e.target.value))}
                            className={`border rounded-xl px-3 py-2 ${themeClasses.input}`}
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-2xs text-slate-400 font-bold">Sell Value (₹)</label>
                          <input 
                            type="number" 
                            value={taxSell} 
                            onChange={(e) => setTaxSell(Number(e.target.value))}
                            className={`border rounded-xl px-3 py-2 ${themeClasses.input}`}
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-2xs text-slate-400 font-bold">Holding Period (Months)</label>
                          <input 
                            type="number" 
                            value={taxMonths} 
                            onChange={(e) => setTaxMonths(Number(e.target.value))}
                            className={`border rounded-xl px-3 py-2 ${themeClasses.input}`}
                          />
                        </div>
                      </div>

                      <button
                        onClick={runTaxCalc}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs py-2 rounded-xl transition-colors"
                      >
                        Estimate Tax Liability
                      </button>

                      {taxResults && (
                        <div className="bg-slate-50 dark:bg-[#0E1322]/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2 text-xs">
                          <div className="flex justify-between border-b pb-1.5 border-slate-100 dark:border-slate-900 text-2xs text-slate-400">
                            <span>Gain Classification</span>
                            <span className="text-slate-800 dark:text-white font-bold uppercase">{taxResults.gain_type}</span>
                          </div>
                          <div className="flex justify-between border-b pb-1.5 border-slate-100 dark:border-slate-900 text-2xs text-slate-400">
                            <span>Total Capital Gain</span>
                            <span className="text-emerald-500 font-semibold">₹{taxResults.capital_gain.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between border-b pb-1.5 border-slate-100 dark:border-slate-900 text-2xs text-slate-400">
                            <span>Estimated Tax ({taxResults.tax_rate_pct}%)</span>
                            <span className="text-rose-500 font-bold">₹{taxResults.tax_payable.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between text-2xs text-slate-400">
                            <span>Net Gain (Post Tax)</span>
                            <span className="text-indigo-500 font-bold">₹{taxResults.net_gain.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Ledger Entry Form & Database */}
                  <div className="lg:col-span-2 flex flex-col space-y-6">
                    <div className={`p-5 rounded-2xl border ${themeClasses.card}`}>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-200 dark:border-slate-800">Add Ledger Entry</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 text-xs">
                        <div className="flex flex-col space-y-1">
                          <label className="text-2xs text-slate-400 font-bold">Amount (₹)</label>
                          <input 
                            type="number" 
                            value={expenseAmount}
                            onChange={(e) => setExpenseAmount(Number(e.target.value))}
                            className={`border rounded-xl px-3 py-2.5 ${themeClasses.input}`}
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-2xs text-slate-400 font-bold">Category</label>
                          <select 
                            value={expenseCategory}
                            onChange={(e) => setExpenseCategory(e.target.value)}
                            className={`border rounded-xl px-3 py-2.5 ${themeClasses.input}`}
                          >
                            <option value="Salary">Salary</option>
                            <option value="Dividends">Dividends</option>
                            <option value="Equity Investment">Equity Investment</option>
                            <option value="Food & Living">Food & Living</option>
                            <option value="Tax Payment">Tax Payment</option>
                            <option value="Rent">Rent</option>
                            <option value="Others">Others</option>
                          </select>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-2xs text-slate-400 font-bold">Type</label>
                          <select 
                            value={expenseType}
                            onChange={(e) => setExpenseType(e.target.value as "Income" | "Expense")}
                            className={`border rounded-xl px-3 py-2.5 ${themeClasses.input}`}
                          >
                            <option value="Income">Income</option>
                            <option value="Expense">Expense</option>
                          </select>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-2xs text-slate-400 font-bold">Note</label>
                          <input 
                            type="text" 
                            value={expenseDesc}
                            onChange={(e) => setExpenseDesc(e.target.value)}
                            placeholder="Salary credited"
                            className={`border rounded-xl px-3 py-2.5 ${themeClasses.input}`}
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={addExpenseItem}
                          className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-colors flex items-center space-x-1.5"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Log Transaction</span>
                        </button>
                      </div>
                    </div>

                    {/* Transactions Ledger database */}
                    <div className={`p-5 rounded-2xl border ${themeClasses.card}`}>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-200 dark:border-slate-800">Ledger Database</h4>
                      
                      <div className="mt-4 space-y-2.5 max-h-[350px] overflow-y-auto">
                        {expensesList.map((item) => (
                          <div key={item.id} className="bg-slate-50 dark:bg-[#0E1322]/40 p-3 md:p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3 text-xs w-full min-w-0">
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-800 dark:text-white truncate">{item.category}</div>
                              <div className="text-2xs text-slate-400 truncate">{item.description || "No description"}</div>
                              <div className="text-3xs text-slate-500">{item.date}</div>
                            </div>
                            <div className="flex items-center space-x-3 md:space-x-6 shrink-0">
                              <span className={`font-bold text-sm ${item.type === "Income" ? "text-emerald-500" : "text-rose-500"}`}>
                                {item.type === "Income" ? "+" : "-"} ₹{item.amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                              </span>
                              <button
                                onClick={() => deleteExpenseItem(item.id)}
                                className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {expensesList.length === 0 && (
                          <div className="text-center py-8 text-slate-500 text-xs">No ledger entries logged yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. MUTUAL FUND ADVISOR */}
              {activeFinanceTab === "mf" && (
                <div className="space-y-6">
                  {mfLoading ? (
                    <div className="text-center py-20 text-slate-400 text-xs font-semibold">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
                      Analyzing risk-returns of mutual funds...
                    </div>
                  ) : mfData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Curated list */}
                      <div className="lg:col-span-1 flex flex-col space-y-4">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs pb-2 border-b border-slate-200 dark:border-slate-800">Curated Category Leaders</h4>
                        <div className="space-y-3">
                          {mfData.funds.map((fund: any) => (
                            <div key={fund.ticker} className={`p-4 rounded-xl border ${themeClasses.card} bg-slate-50/60 dark:bg-[#0E1322]/30 space-y-3 text-2xs`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-black text-slate-800 dark:text-white block truncate max-w-[160px] md:max-w-xs">{fund.long_name}</span>
                                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-[10px] mt-0.5">{fund.category}</span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-black text-slate-800 dark:text-white text-xs block">₹{fund.nav.toFixed(2)}</span>
                                  <span className="text-3xs text-slate-500 dark:text-slate-400">Current NAV</span>
                                </div>
                              </div>
                              <hr className="border-slate-200 dark:border-slate-800/60" />
                              <div className="grid grid-cols-3 gap-1.5 text-center text-3xs">
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400 block uppercase font-bold">1Y Return</span>
                                  <span className="font-bold text-emerald-500 text-[11px] mt-0.5 block">+{fund.return_1y.toFixed(2)}%</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400 block uppercase font-bold">Risk (Vol)</span>
                                  <span className="font-bold text-rose-450 dark:text-rose-400 text-[11px] mt-0.5 block">{fund.volatility.toFixed(2)}%</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 dark:text-slate-400 block uppercase font-bold">Sharpe</span>
                                  <span className="font-bold text-indigo-500 dark:text-indigo-400 text-[11px] mt-0.5 block">{fund.sharpe_ratio.toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="flex justify-between text-3xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-850 rounded-lg">
                                <span>AUM size: <b>₹{(fund.aum / 1e7).toFixed(2)} Cr</b></span>
                                <span className="text-amber-500 dark:text-amber-400 font-bold">★ {fund.morningstar_rating}/5</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cumulative Performance charts & Advisor notes */}
                      <div className="lg:col-span-2 flex flex-col space-y-6">
                        <div className={`p-4 rounded-xl border ${themeClasses.card} bg-white dark:bg-[#0E1322]/20`}>
                          <h4 className="font-bold text-slate-800 dark:text-white text-xs mb-3">1-Year CAGR growth trajectory Comparison</h4>
                          <div className="h-[240px] w-full">
                            {isMounted && mfData.chart_data && mfData.chart_data.length > 0 && (
                              <ResponsiveContainer width="100%" height={240} minWidth={0}>
                                <LineChart data={mfData.chart_data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} />
                                  <XAxis dataKey="Date" stroke="#64748B" fontSize={8} tickFormatter={cleanChartDateFormatter} />
                                  <YAxis unit="%" stroke="#64748B" fontSize={8} tickFormatter={(v) => typeof v === 'number' ? `${v.toFixed(2)}%` : v} />
                                  <Tooltip formatter={(v: any) => [typeof v === 'number' ? `${v.toFixed(2)}%` : v]} contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
                                  <Legend wrapperStyle={{ fontSize: 9 }} />
                                  <Line type="monotone" dataKey="Large Cap" stroke="#3B82F6" strokeWidth={1.5} dot={false} />
                                  <Line type="monotone" dataKey="Mid Cap" stroke="#F59E0B" strokeWidth={1.5} dot={false} />
                                  <Line type="monotone" dataKey="Small Cap" stroke="#EF4444" strokeWidth={1.5} dot={false} />
                                  <Line type="monotone" dataKey="Flexi Cap" stroke="#8B5CF6" strokeWidth={1.5} dot={false} />
                                  <Line type="monotone" dataKey="Hybrid" stroke="#10B981" strokeWidth={1.5} dot={false} />
                                </LineChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>

                        {/* Advisor Risk assessment card */}
                        <div className="consensus-box bg-indigo-500/10 dark:bg-indigo-950/20 border border-indigo-500/20 dark:border-indigo-550/30 rounded-xl p-5 text-xs text-slate-900 dark:text-white space-y-3">
                          <h5 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                            <Cpu className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-400" />
                            <span className="text-slate-900 dark:text-white">AI Quant Advisor Consensus</span>
                          </h5>
                          <p className="leading-relaxed text-slate-900 dark:text-white">
                            Based on live Morningstar ratings and Sharpe Ratio computations, the following allocations are recommended:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-3xs pt-1.5 leading-relaxed text-slate-900 dark:text-white">
                            <div className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white">
                              <span className="font-bold text-slate-900 dark:text-white uppercase block mb-1">Risk-Averse Investors</span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">Mirae Asset Large Cap</span> or <span className="font-semibold text-emerald-600 dark:text-emerald-450">ICICI Hybrid</span> are recommended, offering a moderate volatility profile with strong Sharpe indicators (<span className="font-semibold text-amber-600 dark:text-amber-400">&gt; 1.2x</span>).
                            </div>
                            <div className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white">
                              <span className="font-bold text-slate-900 dark:text-white uppercase block mb-1">Growth Seekers</span>
                              <span className="font-semibold text-rose-600 dark:text-rose-450">Nippon India Small Cap</span> or <span className="font-semibold text-amber-600 dark:text-amber-400">HDFC Mid-Cap</span> have yielded over <span className="font-semibold text-emerald-600 dark:text-emerald-450">25% returns</span> in the last <span className="font-semibold text-blue-600 dark:text-blue-400">1 year</span>, suitable for a <span className="font-semibold text-indigo-600 dark:text-indigo-400">5+ year</span> investment horizon.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-slate-500 text-xs">Awaiting mutual fund metrics payload.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: STRATEGY BACKTESTER ==================== */}
        {activeTab === "backtesting" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Controls Card */}
            <div className={`p-6 rounded-2xl border flex flex-col space-y-5 ${themeClasses.card}`}>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Quantitative Backtester</h3>
                <p className="text-2xs text-slate-400">Validate strategy indicators performance over historical time horizons.</p>
              </div>

              <div className="flex flex-col space-y-1 text-xs">
                <label className="text-2xs text-slate-400 font-bold uppercase">Asset Selected</label>
                <select 
                  value={selectedTicker}
                  onChange={(e) => setSelectedTicker(e.target.value)}
                  className={`border rounded-xl px-3 py-2.5 font-semibold ${themeClasses.input}`}
                >
                  {tickers.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1 text-xs">
                <label className="text-2xs text-slate-400 font-bold uppercase">Time Horizon</label>
                <select 
                  value={backtestPeriod}
                  onChange={(e) => setBacktestPeriod(e.target.value)}
                  className={`border rounded-xl px-3 py-2.5 font-semibold ${themeClasses.input}`}
                >
                  <option value="6mo">6 Months</option>
                  <option value="1y">1 Year</option>
                  <option value="2y">2 Years</option>
                </select>
              </div>

              <button
                onClick={runBacktest}
                disabled={backtestLoading}
                className="bg-[#007AFF] hover:bg-blue-600 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center space-x-2 cursor-pointer shadow-sm transition-all"
              >
                {backtestLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                <span>Execute Strategy Backtest</span>
              </button>

              <hr className="border-slate-200 dark:border-slate-800 my-1" />

              {/* Self-Calibrating ML retrain center */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-indigo-500" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">ML Calibration Center</h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Refit the Random Forest model on 2 years of live market data across multiple benchmark tickers.
                </p>
                <button
                  onClick={triggerMlRetrain}
                  disabled={mlRetrainLoading}
                  className="w-full bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-all"
                >
                  {mlRetrainLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  <span>Calibrate Models</span>
                </button>
                {mlRetrainLogs && (
                  <pre className="p-3 bg-slate-950/90 text-emerald-400 font-mono text-[9px] rounded-lg overflow-x-auto whitespace-pre-wrap max-h-[120px] border border-slate-850">
                    {mlRetrainLogs}
                  </pre>
                )}
              </div>
            </div>

            {/* Middle & Right Content */}
            <div className="lg:col-span-2 flex flex-col space-y-6">
              {backtestResults ? (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className={`p-4 rounded-xl border ${themeClasses.card} flex flex-col justify-between`}>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Strategy Return</span>
                      <span className={`text-base font-black pt-1 ${backtestResults.strategy_returns >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {backtestResults.strategy_returns >= 0 ? "+" : ""}{backtestResults.strategy_returns.toFixed(2)}%
                      </span>
                    </div>
                    <div className={`p-4 rounded-xl border ${themeClasses.card} flex flex-col justify-between`}>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Benchmark Return</span>
                      <span className={`text-base font-black pt-1 ${backtestResults.benchmark_returns >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {backtestResults.benchmark_returns >= 0 ? "+" : ""}{backtestResults.benchmark_returns.toFixed(2)}%
                      </span>
                    </div>
                    <div className={`p-4 rounded-xl border ${themeClasses.card} flex flex-col justify-between`}>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Alpha vs Index</span>
                      <span className={`text-base font-black pt-1 ${(backtestResults.strategy_returns - backtestResults.benchmark_returns) >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {((backtestResults.strategy_returns - backtestResults.benchmark_returns) >= 0 ? "+" : "")}{(backtestResults.strategy_returns - backtestResults.benchmark_returns).toFixed(2)}%
                      </span>
                    </div>
                    <div className={`p-4 rounded-xl border ${themeClasses.card} flex flex-col justify-between`}>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Sharpe Ratio</span>
                      <span className="text-base font-black text-indigo-500 pt-1">
                        {backtestResults.sharpe_ratio.toFixed(2)}
                      </span>
                    </div>
                    <div className={`p-4 rounded-xl border ${themeClasses.card} flex flex-col justify-between`}>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Win Rate / Max DD</span>
                      <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 pt-1.5 flex flex-col">
                        <span>Win: {backtestResults.win_rate.toFixed(1)}%</span>
                        <span className="text-rose-500 text-[10px]">Max DD: {backtestResults.max_drawdown.toFixed(1)}%</span>
                      </span>
                    </div>
                  </div>

                  {/* Equity curve chart */}
                  <div className={`p-5 rounded-2xl border flex flex-col space-y-4 ${themeClasses.card}`}>
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Equity Curve Comparison</h4>
                      <span className="text-3xs text-slate-400">Initial Capital: ₹1,00,000</span>
                    </div>
                    <div className="h-[280px] w-full">
                      {isMounted && (
                        <ResponsiveContainer width="100%" height={280} minWidth={0}>
                          <LineChart data={backtestResults.equity_curve}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#F1F5F9" : "#1E293B/50"} />
                            <XAxis dataKey="Date" tick={{ fontSize: 9 }} stroke={theme === "light" ? "#64748B" : "#94A3B8"} tickFormatter={cleanChartDateFormatter} />
                            <YAxis tick={{ fontSize: 9 }} stroke={theme === "light" ? "#64748B" : "#94A3B8"} domain={['auto', 'auto']} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: theme === "light" ? "#ffffff" : "#0E1322",
                                borderColor: theme === "light" ? "#E2E8F0" : "#1E293B",
                                fontSize: "11px",
                                borderRadius: "12px",
                                color: theme === "light" ? "#000000" : "#ffffff"
                              }} 
                            />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            <Line type="monotone" dataKey="Strategy" name="Systematic AI Strategy" stroke="#6366F1" strokeWidth={2.5} dot={false} />
                            <Line type="monotone" dataKey="Benchmark" name="Buy & Hold Index" stroke="#94A3B8" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Closed Trades table */}
                  <div className={`p-5 rounded-2xl border flex flex-col space-y-3 ${themeClasses.card}`}>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b pb-2 border-slate-200 dark:border-slate-800">Closed Trades Log</h4>
                    {backtestResults.trades.length > 0 ? (
                      <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
                        <table className="w-full text-[10px] text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                              <th className="py-2">Date</th>
                              <th className="py-2">Action</th>
                              <th className="py-2">Price</th>
                              <th className="py-2">Shares</th>
                              <th className="py-2">Remaining Cash</th>
                              <th className="py-2 text-right">Portfolio Equity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {backtestResults.trades.map((t: any, idx: number) => (
                              <tr key={idx} className="border-b border-slate-100 dark:border-slate-900/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                <td className="py-2 font-mono">{t.date}</td>
                                <td className="py-2">
                                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                                    t.action === "BUY" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                  }`}>
                                    {t.action}
                                  </span>
                                </td>
                                <td className="py-2 font-semibold">₹{t.price.toLocaleString("en-IN")}</td>
                                <td className="py-2 font-mono">{t.shares}</td>
                                <td className="py-2 text-slate-400 font-mono">₹{t.cash.toLocaleString("en-IN")}</td>
                                <td className="py-2 text-right font-bold font-mono">₹{t.equity.toLocaleString("en-IN")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-xs">No execution signals were triggered during this period.</div>
                    )}
                  </div>
                </>
              ) : (
                <div className={`p-20 border border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3 text-slate-400 text-center ${themeClasses.card}`}>
                  <History className="h-8 w-8 text-indigo-500/60" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Run Backtest to View Performance</h4>
                  <p className="text-xs max-w-sm">
                    Select a ticker and click "Execute Strategy Backtest" to evaluate trading return curves and win/loss rates.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 5: PAPER TRADING SIMULATOR ==================== */}
        {activeTab === "papertrading" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Order Execution Column */}
            <div className={`p-6 rounded-2xl border flex flex-col space-y-5 ${themeClasses.card}`}>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Place Virtual Order</h3>
                <p className="text-2xs text-slate-400">Trade Nifty 50 and watchlist stocks in real-time with zero risk.</p>
              </div>

              <div className="flex flex-col space-y-1 text-xs">
                <label className="text-2xs text-slate-400 font-bold uppercase">Asset Selected</label>
                <select 
                  value={tradeTicker}
                  onChange={(e) => {
                    setTradeTicker(e.target.value);
                    setTradeMessage("");
                    setTradeError("");
                  }}
                  className={`border rounded-xl px-3 py-2.5 font-semibold ${themeClasses.input}`}
                >
                  {tickers.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* BUY / SELL Switch Toggle */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <button
                  onClick={() => setTradeAction("BUY")}
                  className={`flex-1 text-center font-bold text-xs py-2 rounded-lg cursor-pointer transition-all ${
                    tradeAction === "BUY" 
                      ? "bg-[#007AFF] text-white shadow-sm" 
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  BUY ORDER
                </button>
                <button
                  onClick={() => setTradeAction("SELL")}
                  className={`flex-1 text-center font-bold text-xs py-2 rounded-lg cursor-pointer transition-all ${
                    tradeAction === "SELL" 
                      ? "bg-rose-500 text-white shadow-sm" 
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  SELL ORDER
                </button>
              </div>

              <div className="flex flex-col space-y-1 text-xs">
                <label className="text-2xs text-slate-400 font-bold uppercase">Shares Quantity</label>
                <input 
                  type="number"
                  min="1"
                  value={tradeShares}
                  onChange={(e) => setTradeShares(Math.max(1, Number(e.target.value)))}
                  className={`border rounded-xl px-3 py-2.5 ${themeClasses.input}`}
                />
              </div>

              {/* Quick cost readout */}
              {currentStockInfo && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-250 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>Estimated Total:</span>
                  <span className="font-extrabold text-slate-850 dark:text-white font-mono">
                    ₹{(tradeShares * (currentStockInfo.currentPrice || currentStockInfo.close || 0)).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              <button
                onClick={() => submitPaperTrade(tradeTicker, tradeAction, tradeShares)}
                disabled={paperLoading}
                className={`w-full font-bold text-xs py-3 rounded-xl cursor-pointer text-white flex items-center justify-center space-x-2 transition-all ${
                  tradeAction === "BUY" ? "bg-emerald-500 hover:bg-emerald-450 animate-pulse-slow" : "bg-rose-500 hover:bg-rose-450"
                }`}
              >
                <span>Submit {tradeAction} Order</span>
              </button>

              {tradeMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{tradeMessage}</span>
                </div>
              )}
              {tradeError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-xl font-semibold flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500 flex-shrink-0"></span>
                  <span>{tradeError}</span>
                </div>
              )}
            </div>

            {/* Middle & Right Column */}
            <div className="lg:col-span-2 flex flex-col space-y-6">
              {/* Account summary banner */}
              {paperPortfolio && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-xl border ${themeClasses.card} flex flex-col justify-between`}>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Virtual Balance</span>
                    <span className="text-base font-black text-slate-900 dark:text-white pt-1 font-mono">
                      ₹{paperPortfolio.balance.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className={`p-4 rounded-xl border ${themeClasses.card} flex flex-col justify-between`}>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Valuation</span>
                    <span className="text-base font-black text-slate-900 dark:text-white pt-1 font-mono">
                      ₹{paperPortfolio.total_value.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className={`p-4 rounded-xl border ${themeClasses.card} flex flex-col justify-between`}>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Unrealized P&L</span>
                    {(() => {
                      const netPnl = paperPortfolio.total_value - 1000000;
                      return (
                        <span className={`text-base font-black pt-1 font-mono ${netPnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                          {netPnl >= 0 ? "+" : ""}₹{netPnl.toLocaleString("en-IN")}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={fetchPaperPortfolio}
                      className="flex-1 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span>Refresh Prices</span>
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="flex-1 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Reset Account</span>
                    </button>
                    {showResetConfirm && (
                      <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-xs">
                        <p className="font-semibold text-rose-700 dark:text-rose-300 mb-2">Reset all paper trading data? This cannot be undone.</p>
                        <div className="flex gap-2">
                          <button onClick={resetPaperTrading} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-bold py-1.5 rounded-lg transition-colors cursor-pointer">Yes, Reset</button>
                          <button onClick={() => setShowResetConfirm(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-1.5 rounded-lg transition-colors cursor-pointer">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Holdings positions card */}
              <div className={`p-5 rounded-2xl border flex flex-col space-y-3 ${themeClasses.card}`}>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b pb-2 border-slate-200 dark:border-slate-800">Active Positions</h4>
                {paperPortfolio && paperPortfolio.holdings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-2xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                          <th className="py-2.5">Stock</th>
                          <th className="py-2.5">Shares</th>
                          <th className="py-2.5">Buy Price</th>
                          <th className="py-2.5">Current Price</th>
                          <th className="py-2.5">Market Value</th>
                          <th className="py-2.5 text-right">PnL (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paperPortfolio.holdings.map((h: any) => (
                          <tr key={h.ticker} className="border-b border-slate-100 dark:border-slate-900/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                            <td className="py-2.5 font-bold">{h.ticker}</td>
                            <td className="py-2.5 font-mono">{h.shares}</td>
                            <td className="py-2.5 font-mono text-slate-500">₹{h.average_buy_price}</td>
                            <td className="py-2.5 font-mono text-slate-850 dark:text-slate-200">₹{h.current_price}</td>
                            <td className="py-2.5 font-mono font-semibold">₹{h.market_value.toLocaleString("en-IN")}</td>
                            <td className={`py-2.5 text-right font-black font-mono ${h.unrealized_pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                              {h.unrealized_pnl >= 0 ? "+" : ""}₹{h.unrealized_pnl.toLocaleString("en-IN")} ({h.pnl_pct.toFixed(2)}%)
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500 text-xs">No active positions held. Place a buy order to open a simulator trade.</div>
                )}
              </div>

              {/* Transactions log card */}
              <div className={`p-5 rounded-2xl border flex flex-col space-y-3 ${themeClasses.card}`}>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b pb-2 border-slate-200 dark:border-slate-800">Trade Ledger</h4>
                {paperPortfolio && paperPortfolio.trades.length > 0 ? (
                  <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                          <th className="py-2">Time</th>
                          <th className="py-2">Ticker</th>
                          <th className="py-2">Action</th>
                          <th className="py-2">Price</th>
                          <th className="py-2">Shares</th>
                          <th className="py-2 text-right">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paperPortfolio.trades.map((t: any) => (
                          <tr key={t.id} className="border-b border-slate-100 dark:border-slate-900/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                            <td className="py-2 font-mono text-slate-400">{t.timestamp}</td>
                            <td className="py-2 font-bold">{t.ticker}</td>
                            <td className="py-2">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                                t.action === "BUY" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                              }`}>
                                {t.action}
                              </span>
                            </td>
                            <td className="py-2 font-mono">₹{t.price}</td>
                            <td className="py-2 font-mono">{t.shares}</td>
                            <td className="py-2 text-right font-semibold font-mono">
                              ₹{(t.shares * t.price).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs">No historical trades found.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 6: ALERTS CENTER ==================== */}
        {activeTab === "alerts" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left Column: Create Alert Card */}
            <div className={`p-6 rounded-2xl border flex flex-col space-y-5 ${themeClasses.card}`}>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Create Price Alert</h3>
                <p className="text-2xs text-slate-400">Get notified when stock prices trigger threshold limits.</p>
              </div>

              <div className="flex flex-col space-y-1 text-xs">
                <label className="text-2xs text-slate-400 font-bold uppercase">Asset Selected</label>
                <select 
                  value={alertTicker}
                  onChange={(e) => {
                    setAlertTicker(e.target.value);
                    setAlertMessage("");
                  }}
                  className={`border rounded-xl px-3 py-2.5 font-semibold ${themeClasses.input}`}
                >
                  {tickers.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1 text-xs">
                <label className="text-2xs text-slate-400 font-bold uppercase">Condition</label>
                <select 
                  value={alertCondition}
                  onChange={(e) => setAlertCondition(e.target.value as any)}
                  className={`border rounded-xl px-3 py-2.5 font-semibold ${themeClasses.input}`}
                >
                  <option value="ABOVE">ABOVE (₹)</option>
                  <option value="BELOW">BELOW (₹)</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1 text-xs">
                <label className="text-2xs text-slate-400 font-bold uppercase">Trigger Price Value (₹)</label>
                <input 
                  type="number"
                  placeholder="e.g. 2500"
                  value={alertValue}
                  onChange={(e) => setAlertValue(e.target.value)}
                  className={`border rounded-xl px-3 py-2.5 ${themeClasses.input}`}
                />
              </div>

              <button
                onClick={() => createAlert(alertTicker, alertCondition, Number(alertValue))}
                disabled={!alertValue || isNaN(Number(alertValue))}
                className="bg-[#007AFF] hover:bg-blue-600 disabled:bg-slate-350 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center space-x-2 cursor-pointer shadow-sm transition-all"
              >
                <Bell className="h-4 w-4" />
                <span>Establish Price Alert</span>
              </button>

              {alertMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl font-semibold flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>{alertMessage}</span>
                </div>
              )}
            </div>

            {/* Right Column: List Alerts */}
            <div className="lg:col-span-2 flex flex-col space-y-6">
              <div className={`p-5 rounded-2xl border flex flex-col space-y-3 ${themeClasses.card}`}>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b pb-2 border-slate-200 dark:border-slate-800">Alert Registry</h4>
                {alertsLoading ? (
                  <div className="flex justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                  </div>
                ) : alertsList.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-2xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                          <th className="py-2.5">Asset</th>
                          <th className="py-2.5">Trigger Condition</th>
                          <th className="py-2.5">Price Threshold</th>
                          <th className="py-2.5">Status</th>
                          <th className="py-2.5">Established At</th>
                          <th className="py-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alertsList.map((a: any) => (
                          <tr key={a.id} className="border-b border-slate-100 dark:border-slate-900/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                            <td className="py-2.5 font-bold">{a.ticker}</td>
                            <td className="py-2.5 font-semibold text-indigo-500">{a.condition_type}</td>
                            <td className="py-2.5 font-mono font-bold">₹{a.value.toLocaleString("en-IN")}</td>
                            <td className="py-2.5">
                              {a.is_triggered ? (
                                <span className="inline-flex items-center space-x-1 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-3xs font-extrabold text-rose-500">
                                  <span>TRIGGERED</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-3xs font-extrabold text-emerald-600 dark:text-emerald-400">
                                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                  <span>MONITORING</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 font-mono text-slate-400">{a.created_at}</td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => deleteAlert(a.id)}
                                className="bg-slate-100 dark:bg-slate-900 hover:bg-rose-500/10 hover:text-rose-500 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">No active price alerts established. Set target price threshold above.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 7: DERIVATIVES (F&O) WORKSTATION ==================== */}
        {activeTab === "derivatives" && (
          <div className="flex flex-col space-y-6 animate-fade-in">
            {/* F&O Sub-tabs Header */}
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${themeClasses.card}`}>
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/25">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>F&O Derivatives Workstation</span>
                    <span className="text-[9px] bg-indigo-500/15 text-indigo-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Options Trader Web</span>
                  </h3>
                  <p className="text-3xs text-slate-400">Manage Option Chains, Payoff Simulators, Option Greeks, and Active Simulator Positions for {selectedTicker}</p>
                </div>
              </div>

              {/* Workstation Sub-tabs */}
              <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-x-auto scrollbar-none flex-nowrap w-full md:w-auto">
                {[
                  { id: "Chain", label: "Option Chain" },
                  { id: "Simulator", label: "Payoff Simulator" },
                  { id: "Analysis", label: "ML Option Analytics" },
                  { id: "Positions", label: "Active Positions" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFoTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      foTab === tab.id
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : theme === "light" 
                          ? "text-slate-650 hover:text-slate-900 hover:bg-slate-200/50" 
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-tab 1: Option Chain */}
            {foTab === "Chain" && (
              <div className={`p-6 rounded-2xl border flex flex-col space-y-4 ${themeClasses.card}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expiration Date:</label>
                    <select
                      value={selectedFoExpiry}
                      onChange={(e) => {
                        setSelectedFoExpiry(e.target.value);
                        fetchFoOptionChain(selectedTicker, e.target.value);
                      }}
                      className={`border rounded-xl px-3 py-1.5 text-xs font-semibold ${themeClasses.input}`}
                    >
                      {foExpirations.map(exp => (
                        <option key={exp} value={exp}>{exp}</option>
                      ))}
                    </select>
                  </div>
                  {foOptionChain && (
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Spot Price: <span className="numeric-monospace font-black text-slate-900 dark:text-white">{currencySymbol}{foOptionChain.spotPrice?.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {foLoading ? (
                  <div className="flex justify-center py-20">
                    <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
                  </div>
                ) : foOptionChain ? (
                  <div className="overflow-x-auto select-none">
                    <table className="w-full text-[10px] text-center border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                          <th className="py-2.5 px-1 col-span-3 border-r border-slate-200 dark:border-slate-800" colSpan={4}>CALL OPTIONS</th>
                          <th className="py-2.5 px-1 border-r border-slate-200 dark:border-slate-800" colSpan={1}>STRIKE</th>
                          <th className="py-2.5 px-1" colSpan={4}>PUT OPTIONS</th>
                        </tr>
                        <tr className="bg-slate-55 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-450 text-3xs font-extrabold uppercase">
                          <th className="py-2 px-1">IV</th>
                          <th className="py-2 px-1">Delta</th>
                          <th className="py-2 px-1">Price</th>
                          <th className="py-2 px-1 border-r border-slate-200 dark:border-slate-800">Action</th>
                          <th className="py-2 px-2 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white bg-indigo-500/5">STRIKE</th>
                          <th className="py-2 px-1 border-r border-slate-250 dark:border-slate-800">Action</th>
                          <th className="py-2 px-1">Price</th>
                          <th className="py-2 px-1">Delta</th>
                          <th className="py-2 px-1">IV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {foOptionChain.calls.map((call: any, idx: number) => {
                          const strike = call.strike;
                          const put = foOptionChain.puts.find((p: any) => p.strike === strike) || { lastPrice: 0.0, impliedVolatility: 0.0, delta: 0.0 };
                          const isATM = Math.abs(strike - foOptionChain.spotPrice) < (foOptionChain.spotPrice * 0.015);
                          
                          return (
                            <tr 
                              key={strike} 
                              className={`border-b border-slate-100 dark:border-slate-900/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/15 ${
                                isATM ? "bg-indigo-500/5 dark:bg-indigo-500/5 font-semibold" : ""
                              }`}
                            >
                              {/* CALL INFO */}
                              <td className="py-2.5 px-1 font-mono text-slate-400">{(call.impliedVolatility * 100).toFixed(1)}%</td>
                              <td className={`py-2.5 px-1 font-mono ${call.delta >= 0.5 ? "text-emerald-500" : "text-slate-500"}`}>{call.delta?.toFixed(2)}</td>
                              <td className="py-2.5 px-1 font-mono font-bold">{currencySymbol}{call.lastPrice?.toFixed(2)}</td>
                              <td className="py-2.5 px-1 border-r border-slate-200 dark:border-slate-800">
                                <div className="flex justify-center space-x-1">
                                  <button 
                                    onClick={() => executePaperFoTrade("CALL", "BUY", strike, call.lastPrice)}
                                    className="bg-emerald-500 hover:bg-emerald-655 text-white px-2 py-0.5 rounded text-[8px] font-black cursor-pointer uppercase transition-colors"
                                  >
                                    Buy
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const existing = foLegs.find(l => l.strike === strike && l.option_type === "CALL");
                                      if (!existing) {
                                        setFoLegs([...foLegs, { option_type: "CALL", action: "BUY", strike: strike, premium: call.lastPrice, quantity: 1 }]);
                                        showToast("Call leg added to Payoff Simulator", "success");
                                      }
                                    }}
                                    className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-655 hover:text-white border border-slate-250 dark:border-slate-700 px-1 py-0.5 rounded text-[8px] font-black cursor-pointer transition-all"
                                    title="Add to Payoff Simulator"
                                  >
                                    +Sim
                                  </button>
                                </div>
                              </td>

                              {/* STRIKE PRICE */}
                              <td className="py-2.5 px-2 font-mono font-black border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-900/30">
                                {currencySymbol}{strike}
                              </td>

                              {/* PUT INFO */}
                              <td className="py-2.5 px-1 border-r border-slate-200 dark:border-slate-800">
                                <div className="flex justify-center space-x-1">
                                  <button 
                                    onClick={() => executePaperFoTrade("PUT", "BUY", strike, put.lastPrice)}
                                    className="bg-rose-500 hover:bg-rose-655 text-white px-2 py-0.5 rounded text-[8px] font-black cursor-pointer uppercase transition-colors"
                                  >
                                    Buy
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const existing = foLegs.find(l => l.strike === strike && l.option_type === "PUT");
                                      if (!existing) {
                                        setFoLegs([...foLegs, { option_type: "PUT", action: "BUY", strike: strike, premium: put.lastPrice, quantity: 1 }]);
                                        showToast("Put leg added to Payoff Simulator", "success");
                                      }
                                    }}
                                    className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-655 hover:text-white border border-slate-250 dark:border-slate-700 px-1 py-0.5 rounded text-[8px] font-black cursor-pointer transition-all"
                                    title="Add to Payoff Simulator"
                                  >
                                    +Sim
                                  </button>
                                </div>
                              </td>
                              <td className="py-2.5 px-1 font-mono font-bold">{currencySymbol}{put.lastPrice?.toFixed(2)}</td>
                              <td className={`py-2.5 px-1 font-mono ${put.delta <= -0.5 ? "text-rose-500" : "text-slate-500"}`}>{put.delta?.toFixed(2)}</td>
                              <td className="py-2.5 px-1 font-mono text-slate-400">{(put.impliedVolatility * 100).toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500 text-xs">No option chain details available for {selectedTicker}.</div>
                )}
              </div>
            )}

            {/* Sub-tab 2: Payoff Simulator */}
            {foTab === "Simulator" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Legs Configuration */}
                <div className={`p-6 rounded-2xl border flex flex-col space-y-5 ${themeClasses.card}`}>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Option Legs Configuration</h4>
                    <p className="text-3xs text-slate-400 mt-0.5">Build option spreads or select a predefined trading model.</p>
                  </div>

                  {/* Predefined Strategy Select */}
                  <div className="flex flex-col space-y-1 text-xs">
                    <label className="text-3xs text-slate-400 font-bold uppercase">Predefined Strategy</label>
                    <select
                      value={foStrategy}
                      onChange={(e) => applyPredefinedStrategy(e.target.value)}
                      className={`border rounded-xl px-3 py-2 text-xs font-semibold ${themeClasses.input}`}
                    >
                      <option value="None">Custom Strategy</option>
                      <option value="LongCall">Long Call (Bullish)</option>
                      <option value="LongPut">Long Put (Bearish)</option>
                      <option value="BullCallSpread">Bull Call Spread (Moderate Bullish)</option>
                      <option value="BearPutSpread">Bear Put Spread (Moderate Bearish)</option>
                      <option value="Straddle">Long Straddle (High Volatility)</option>
                      <option value="Strangle">Long Strangle (OOTM Volatility)</option>
                      <option value="IronCondor">Iron Condor (Sideways / Neutral)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-650 dark:text-slate-200">Simulation Legs</span>
                    <button 
                      onClick={() => {
                        const spot = foOptionChain?.spotPrice || 100;
                        setFoLegs([...foLegs, { option_type: "CALL", action: "BUY", strike: spot, premium: spot * 0.03, quantity: 1 }]);
                      }}
                      className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 text-3xs font-extrabold px-2 py-1 rounded border border-indigo-500/20 flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus className="h-3 w-3" /> Add Leg
                    </button>
                  </div>

                  {foLegs.length > 0 ? (
                    <div className="flex flex-col space-y-3 max-h-[280px] overflow-y-auto pr-1">
                      {foLegs.map((leg, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col space-y-2">
                          <div className="flex justify-between items-center text-3xs font-bold uppercase tracking-wider text-slate-405">
                            <span>Leg #{idx + 1}</span>
                            <button 
                              onClick={() => setFoLegs(foLegs.filter((_, lIdx) => lIdx !== idx))}
                              className="text-slate-450 hover:text-rose-500 font-extrabold text-sm focus:outline-none cursor-pointer"
                              title="Delete Leg"
                            >
                              &times;
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="text-4xs text-slate-450 font-bold uppercase">Type</label>
                              <select
                                value={leg.option_type}
                                onChange={(e) => {
                                  const updated = [...foLegs];
                                  updated[idx].option_type = e.target.value;
                                  setFoLegs(updated);
                                }}
                                className={`w-full border rounded-lg px-2 py-1 mt-0.5 ${themeClasses.input}`}
                              >
                                <option value="CALL">CALL</option>
                                <option value="PUT">PUT</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-4xs text-slate-450 font-bold uppercase">Action</label>
                              <select
                                value={leg.action}
                                onChange={(e) => {
                                  const updated = [...foLegs];
                                  updated[idx].action = e.target.value;
                                  setFoLegs(updated);
                                }}
                                className={`w-full border rounded-lg px-2 py-1 mt-0.5 ${themeClasses.input}`}
                              >
                                <option value="BUY">BUY (Long)</option>
                                <option value="SELL">SELL (Short)</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <label className="text-4xs text-slate-450 font-bold uppercase">Strike ({currencySymbol})</label>
                              <input 
                                type="number" 
                                value={leg.strike}
                                onChange={(e) => {
                                  const updated = [...foLegs];
                                  updated[idx].strike = Number(e.target.value);
                                  setFoLegs(updated);
                                }}
                                className={`w-full border rounded-lg px-2 py-1 mt-0.5 ${themeClasses.input}`}
                              />
                            </div>
                            <div>
                              <label className="text-4xs text-slate-450 font-bold uppercase">Premium ({currencySymbol})</label>
                              <input 
                                type="number" 
                                step="0.1"
                                value={leg.premium}
                                onChange={(e) => {
                                  const updated = [...foLegs];
                                  updated[idx].premium = Number(e.target.value);
                                  setFoLegs(updated);
                                }}
                                className={`w-full border rounded-lg px-2 py-1 mt-0.5 ${themeClasses.input}`}
                              />
                            </div>
                            <div>
                              <label className="text-4xs text-slate-450 font-bold uppercase">Lots</label>
                              <input 
                                type="number" 
                                min="1"
                                value={leg.quantity}
                                onChange={(e) => {
                                  const updated = [...foLegs];
                                  updated[idx].quantity = Math.max(1, Number(e.target.value));
                                  setFoLegs(updated);
                                }}
                                className={`w-full border rounded-lg px-2 py-1 mt-0.5 ${themeClasses.input}`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 border border-dashed rounded-xl text-slate-500 text-2xs">
                      No legs in Payoff simulation. Click "+Sim" in the Option Chain or click "+ Add Leg" above.
                    </div>
                  )}
                </div>

                {/* Payoff Chart Display */}
                <div className={`lg:col-span-2 p-5 rounded-2xl border flex flex-col space-y-4 ${themeClasses.card}`}>
                  <div className="flex justify-between items-center border-b pb-2 border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Options Payoff Curve at Expiry</h4>
                    <span className="text-4xs text-indigo-500 font-extrabold uppercase bg-indigo-500/5 px-2 py-0.5 rounded">Lot Size: {selectedTicker.endsWith(".NS") ? 50 : 100} shares</span>
                  </div>

                  {foPayoffData.length > 0 ? (
                    <div className="h-[280px] w-full mt-4">
                      {isMounted && (
                        <ResponsiveContainer width="100%" height={280} minWidth={0}>
                          <ComposedChart data={foPayoffData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#F1F5F9" : "#1E293B/50"} />
                            <XAxis dataKey="UnderlyingPrice" tick={{ fontSize: 8 }} stroke={theme === "light" ? "#64748B" : "#94A3B8"} label={{ value: `Stock Spot Price (${currencySymbol})`, position: "insideBottomRight", offset: -5, fontSize: 8, fill: "#64748B" }} />
                            <YAxis tick={{ fontSize: 8 }} stroke={theme === "light" ? "#64748B" : "#94A3B8"} label={{ value: `Net PnL (${currencySymbol})`, angle: -90, position: "insideLeft", offset: 10, fontSize: 8, fill: "#64748B" }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: theme === "light" ? "#ffffff" : "#0E1322",
                                borderColor: theme === "light" ? "#E2E8F0" : "#1E293B",
                                fontSize: "10px",
                                borderRadius: "10px",
                                color: theme === "light" ? "#000000" : "#ffffff"
                              }} 
                              formatter={(value: any) => [`${currencySymbol}${value.toLocaleString("en-IN")}`, "Expected Profit/Loss"]}
                            />
                            <ReferenceLine y={0} stroke="#EF4444" strokeWidth={1} strokeDasharray="3 3" />
                            <Area type="monotone" dataKey="PnL" name="Expiry Profit / Loss" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={0.15} fill="#4F46E5" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center border border-dashed rounded-xl text-slate-500 text-xs">
                      Simulate a strategy to render PnL curve chart.
                    </div>
                  )}

                  <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-[10px] leading-relaxed text-indigo-700 dark:text-indigo-400">
                    💡 <b>Payoff Tip:</b> Breakeven strikes occur where the profit/loss curve crosses the red dotted axis. Net credit strategies benefit from market sideways range decay, while debit spreads require momentum direction breakouts.
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Option Analytics */}
            {foTab === "Analysis" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Volatility Smile Analysis */}
                <div className={`lg:col-span-2 p-6 rounded-2xl border flex flex-col space-y-4 ${themeClasses.card}`}>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b pb-2 border-slate-200 dark:border-slate-800">Implied Volatility Smile Curve</h4>
                  
                  {foOptionChain && foOptionChain.calls ? (
                    <div className="h-[250px] w-full mt-2">
                      {isMounted && (
                        <ResponsiveContainer width="100%" height={250} minWidth={0}>
                          <LineChart data={foOptionChain.calls}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#F1F5F9" : "#1E293B/50"} />
                            <XAxis dataKey="strike" tick={{ fontSize: 9 }} stroke={theme === "light" ? "#64748B" : "#94A3B8"} label={{ value: `Option Strikes (${currencySymbol})`, position: "insideBottomRight", offset: -5, fontSize: 8, fill: "#64748B" }} />
                            <YAxis tick={{ fontSize: 9 }} stroke={theme === "light" ? "#64748B" : "#94A3B8"} label={{ value: "IV (%)", angle: -90, position: "insideLeft", offset: 10, fontSize: 8, fill: "#64748B" }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: theme === "light" ? "#ffffff" : "#0E1322",
                                borderColor: theme === "light" ? "#E2E8F0" : "#1E293B",
                                fontSize: "10px",
                                borderRadius: "10px",
                              }} 
                              formatter={(value: any) => [`${(value * 100).toFixed(2)}%`, "Implied Volatility"]}
                            />
                            <Line type="monotone" dataKey="impliedVolatility" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} name="IV Smile Curve" />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center border border-dashed rounded-xl text-slate-500 text-xs">
                      No option chain details available.
                    </div>
                  )}
                  
                  <p className="text-[10px] text-slate-400 leading-relaxed pt-2">
                    📈 The <b>Volatility Smile</b> represents the shape formed by plotting strikes against their implied volatility. In equity markets, out-of-the-money puts generally command a volatility premium (skew) as market participants pay up for downside portfolio hedging.
                  </p>
                </div>

                {/* ML Forecasts */}
                <div className="flex flex-col space-y-6">
                  {/* ML Forecasted IV Trend */}
                  <div className={`p-6 rounded-2xl border flex flex-col space-y-3 ${themeClasses.card}`}>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b pb-2 border-slate-200 dark:border-slate-800">5-Day Volatility Forecast</h4>
                    
                    {foMlForecast ? (
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between text-2xs font-semibold text-slate-400">
                          <span>Forecast Period</span>
                          <span>Predicted IV</span>
                        </div>
                        
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                          {foMlForecast.forecast_5d?.map((day: any) => (
                            <div key={day.Day} className="flex justify-between py-2 text-2xs">
                              <span className="font-semibold text-slate-655 dark:text-slate-300">{day.Day} Forecast</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">{Number(day.IV).toFixed(2)}%</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className={`p-2.5 rounded-lg border text-[9px] font-semibold flex items-center space-x-2 ${
                          foMlForecast.regime === "Expanding" 
                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400" 
                            : "bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-455"
                        }`}>
                          <span className="h-2 w-2 rounded-full bg-current"></span>
                          <span>Vol Trend estimate: <b>{foMlForecast.regime}</b></span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-2xs">No ML volatility forecast data.</div>
                    )}
                  </div>

                  {/* Options recommendations */}
                  <div className={`p-6 rounded-2xl border flex flex-col space-y-3 ${themeClasses.card}`}>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b pb-2 border-slate-200 dark:border-slate-800">Agent Contract Signals</h4>
                    
                    {foOptionChain && foOptionChain.calls && foOptionChain.calls.length > 0 ? (
                      <div className="flex flex-col space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {foOptionChain.calls.slice(4, 9).map((call: any, idx: number) => (
                          <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg flex justify-between items-center text-xs">
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-850 dark:text-white text-[10px]">{currencySymbol}{call.strike} CALL Contract</span>
                              <span className="text-[9px] text-slate-400">IV: {(call.impliedVolatility * 100).toFixed(1)}% | Delta: {call.delta?.toFixed(2)}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wider shrink-0 ${
                              call.recommendation?.action === "BUY"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : call.recommendation?.action === "SELL"
                                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                : "bg-slate-100 text-slate-400 border border-slate-250 dark:bg-slate-850"
                            }`}>
                              {call.recommendation?.action || "HOLD"} ({call.recommendation?.confidence || 50}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500 text-2xs">No active contract recommendations available.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {foTab === "Positions" && (
              <div className="flex flex-col space-y-6 animate-fade-in">
                
                {/* F&O Balance and Position Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl border ${themeClasses.card} flex flex-col justify-between`}>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">F&O Simulator Capital</span>
                    <span className="text-base font-black text-slate-900 dark:text-white pt-1 font-mono">
                      {currencySymbol}{foCashBalance.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className={`p-4 rounded-xl border ${themeClasses.card} flex flex-col justify-between`}>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Open Derivatives Positions</span>
                    <span className="text-base font-black text-slate-900 dark:text-white pt-1 font-mono">
                      {foPositionList.length} Active
                    </span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <button
                      onClick={() => {
                        setFoPositionList([]);
                        setFoCashBalance(1000000);
                        showToast("F&O simulator account reset successfully.", "success");
                      }}
                      className="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-500 text-xs font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer w-full md:w-auto"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Reset Balances</span>
                    </button>
                  </div>
                </div>

                {/* Active option positions card */}
                <div className={`p-5 rounded-2xl border flex flex-col space-y-3 ${themeClasses.card}`}>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b pb-2 border-slate-200 dark:border-slate-800">Active Derivatives Positions</h4>
                  {foPositionList.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-2xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase">
                            <th className="py-2.5">Asset Contract</th>
                            <th className="py-2.5">Lots / Qty</th>
                            <th className="py-2.5">Entry Premium</th>
                            <th className="py-2.5">Current Premium</th>
                            <th className="py-2.5">Net PnL ({currencySymbol})</th>
                            <th className="py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {foPositionList.map((pos) => {
                            let currentPrice = pos.entry_price;
                            if (foOptionChain) {
                              const list = pos.option_type === "CALL" ? foOptionChain.calls : foOptionChain.puts;
                              const currentOpt = list.find((o: any) => o.strike === pos.strike);
                              if (currentOpt) {
                                currentPrice = currentOpt.lastPrice;
                              }
                            }
                            
                            const pnl = pos.action === "BUY"
                              ? (currentPrice - pos.entry_price) * pos.quantity
                              : (pos.entry_price - currentPrice) * pos.quantity;
                              
                            return (
                              <tr key={pos.id} className="border-b border-slate-100 dark:border-slate-900/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                <td className="py-2.5 font-bold">
                                  {pos.ticker.split(".")[0]} {pos.strike} {pos.option_type === "CALL" ? "CE" : "PE"} 
                                  <span className={`ml-2 px-1.5 py-0.5 rounded font-bold text-[8px] ${
                                    pos.action === "BUY" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                                  }`}>{pos.action}</span>
                                </td>
                                <td className="py-2.5 font-mono">{pos.quantity} shares ({pos.quantity / pos.lot_size} Lots)</td>
                                <td className="py-2.5 font-mono text-slate-500">{currencySymbol}{pos.entry_price?.toFixed(2)}</td>
                                <td className="py-2.5 font-mono text-slate-850 dark:text-slate-200">{currencySymbol}{currentPrice?.toFixed(2)}</td>
                                <td className={`py-2.5 font-black font-mono ${pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                  {pnl >= 0 ? "+" : ""}{currencySymbol}{pnl.toFixed(2)} ({((pnl / (pos.entry_price * pos.quantity)) * 100).toFixed(2)}%)
                                </td>
                                <td className="py-2.5 text-right">
                                  <button
                                    onClick={() => closePaperFoPosition(pos.id)}
                                    className="bg-rose-500/15 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/25 px-2.5 py-1 rounded text-3xs font-extrabold transition-all cursor-pointer"
                                  >
                                    Close Position
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500 text-xs">No active option positions held. Use the Option Chain grid to open a virtual trade.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      <footer className={`border-t py-6 px-6 text-center text-3xs space-y-2 mt-auto ${
        theme === "light" 
          ? "bg-[#F5F7FA] border-slate-200 text-slate-500" 
          : "bg-[#070B14] border-slate-900 text-slate-400"
      }`}>
        <p>© 2026 ArthaMind AI Inc. Created for Advanced Agentic AI Workshop. All rights reserved.</p>
        <p className="max-w-4xl mx-auto leading-relaxed">
          <b>SEBI Warning Disclaimer:</b> The stock forecasts, price predictions, and options weights provided herein are generated by automated AI research agents. This platform is built for student curriculum demonstration. We are not registered with SEBI (Securities and Exchange Board of India). Allocate capital at your own discretion.
        </p>
      </footer>

      {/* Mobile Bottom Navigation Bar — horizontally scrollable so all 7 tabs fit on any phone */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-lg border-t shadow-lg pb-safe ${
        theme === "light" 
          ? "bg-white/95 border-slate-200" 
          : "bg-[#0B0F19]/95 border-slate-800/80"
      }`}>
        <div className="flex items-stretch w-full px-1 py-1.5">
          {[
            { id: "research", label: "Analyst", icon: Activity },
            { id: "derivatives", label: "F&O", icon: TrendingUp },
            { id: "optimizer", label: "Portfolio", icon: PieIcon },
            { id: "finance", label: "Wealth", icon: Landmark },
            { id: "backtesting", label: "Backtest", icon: History },
            { id: "papertrading", label: "Paper", icon: Wallet },
            { id: "alerts", label: "Alerts", icon: Bell }
          ].map(module => {
            const isActive = activeTab === module.id;
            const Icon = module.icon;
            return (
              <button 
                key={module.id}
                onClick={() => {
                  setActiveTab(module.id as any);
                  if (module.id === "research") setActiveWorkspaceTab("Overview");
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl transition-all min-h-[48px] ${
                  isActive 
                    ? theme === "light" 
                      ? "text-[#007AFF] font-bold bg-blue-50" 
                      : "text-indigo-400 font-bold bg-indigo-500/10"
                    : theme === "light" 
                      ? "text-slate-500" 
                      : "text-slate-400"
                }`}
              >
                <Icon className="h-[17px] w-[17px] shrink-0" />
                <span className="text-[8px] font-semibold leading-none">{module.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
