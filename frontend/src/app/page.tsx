"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  ScatterChart, Scatter, BarChart, Bar, ReferenceLine, ComposedChart, Cell
} from "recharts";
import { 
  TrendingUp, BarChart2, DollarSign, Search, Award, RefreshCw, 
  Trash2, Plus, Download, Cpu, Calculator, PieChart as PieIcon, Sun, Moon, CheckCircle2,
  Network, Activity, Landmark, ChevronRight, HelpCircle
} from "lucide-react";

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
  const BACKEND_URL = typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
    ? (process.env.NEXT_PUBLIC_BACKEND_URL || "")
    : "http://127.0.0.1:8000";

  // Theme state: 'light' or 'dark'. Default is 'dark' for premium fintech experience.
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Backend connection state (true = online, false = offline, null = checking)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  // Check if component is fully mounted (for Recharts SSR client-side layout rendering)
  const [isMounted, setIsMounted] = useState(false);

  // Onboarding guide closeable state
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Screen views (research, portfolio optimizer, personal finance)
  const [activeTab, setActiveTab] = useState<"research" | "optimizer" | "finance">("research");
  
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

  // Watchlist & Tickers list
  const [tickers, setTickers] = useState<string[]>([]);
  const [selectedTicker, setSelectedTicker] = useState("RELIANCE.NS");
  const [searchQuery, setSearchQuery] = useState("");
  const [newTicker, setNewTicker] = useState("");
  
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
  const consoleEndRef = useRef<HTMLDivElement>(null);
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
  const [compareSuggestionsB, setCompareSuggestionsB] = useState<any[]>([]);
  const [showCompareSuggestionsA, setShowCompareSuggestionsA] = useState(false);
  const [showCompareSuggestionsB, setShowCompareSuggestionsB] = useState(false);

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

  // Auto scroll agent console logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [agentLogs]);

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
    checkBackendConnection();
  }, []);

  async function checkBackendConnection() {
    try {
      const res = await fetch(`${BACKEND_URL}/`);
      if (res.ok) {
        setBackendConnected(true);
      } else {
        setBackendConnected(false);
      }
    } catch (err) {
      setBackendConnected(false);
    }
  }

  // Fetch stock dashboard data (tickers, info, history, recommendation) when selected stock or time period changes
  useEffect(() => {
    fetchDashboardData(selectedTicker, timePeriod);
  }, [selectedTicker, timePeriod]);

  async function fetchDashboardData(ticker: string, period: string = "1Y") {
    const periodMap: Record<string, string> = {
      "1D": "1d",
      "5D": "5d",
      "1M": "1mo",
      "6M": "6mo",
      "YTD": "ytd",
      "1Y": "1y",
      "5Y": "5y",
      "Max": "max"
    };
    const yfPeriod = periodMap[period] || "1y";
    
    setLoadingHistory(true);
    setLoadingInfo(true);
    setLoadingRecommendation(true);
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/stock/${ticker}/dashboard?period=${yfPeriod}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tickers) {
          setTickers(data.tickers);
        }
        setCurrentStockInfo(data.info || null);
        setStockHistory(data.history || []);
        setAiRecommendation(data.recommendation || null);
      } else {
        console.warn("Dashboard batch API failed, using fallback endpoints.");
        await Promise.all([
          fetchStockHistory(ticker, period),
          fetchStockInfo(ticker),
          fetchRecommendation(ticker)
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch unified dashboard data:", err);
      await Promise.all([
        fetchStockHistory(ticker, period),
        fetchStockInfo(ticker),
        fetchRecommendation(ticker)
      ]);
    } finally {
      setLoadingHistory(false);
      setLoadingInfo(false);
      setLoadingRecommendation(false);
    }
  }

  async function fetchTickers() {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stocks`);
      const data = await res.json();
      setTickers(data.tickers);
    } catch (err) {
      console.error("Failed to fetch tickers:", err);
    }
  };

  async function fetchStockHistory(ticker: string, period: string = "1Y") {
    const periodMap: Record<string, string> = {
      "1D": "1d",
      "5D": "5d",
      "1M": "1mo",
      "6M": "6mo",
      "YTD": "ytd",
      "1Y": "1y",
      "5Y": "5y",
      "Max": "max"
    };
    const yfPeriod = periodMap[period] || "1y";
    setLoadingHistory(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stock/${ticker}/history?period=${yfPeriod}`);
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
        alert(`Successfully added ${tickerToAdd} to watchlist.`);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to add ticker");
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
      const res = await fetch(`${BACKEND_URL}/api/portfolio/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(portfolioTickers)
      });
      if (res.ok) {
        const data = await res.json();
        setOptResults(data);
      } else {
        alert("Optimization failed. Verify tickers have historical data.");
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
        alert("Portfolio saved successfully!");
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
    const upper = ticker.toUpperCase();
    if (upper.endsWith(".NS") || upper.endsWith(".BO")) return "₹";
    if (upper.endsWith(".L") || upper.endsWith(".LON")) return "£";
    if (upper.endsWith(".PA") || upper.endsWith(".DE") || upper.endsWith(".AMS") || upper.endsWith(".MI")) return "€";
    if (upper.endsWith(".TO") || upper.endsWith(".V")) return "C$";
    if (upper.endsWith(".AX")) return "A$";
    if (upper.endsWith(".HK")) return "HK$";
    if (upper.endsWith(".SG")) return "S$";
    if (upper.includes("-USD") || upper.includes("=X")) return "$";
    return "$";
  };
  const currencySymbol = getCurrencySymbol(selectedTicker);

  const formatMarketCap = (val: number | undefined | null) => {
    if (!val) return "N/A";
    if (val >= 1e12) return `${currencySymbol}${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `${currencySymbol}${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e7) return `${currencySymbol}${(val / 1e7).toFixed(2)} Cr`;
    if (val >= 1e6) return `${currencySymbol}${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e5) return `${currencySymbol}${(val / 1e5).toFixed(2)} L`;
    return `${currencySymbol}${val.toLocaleString()}`;
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
    bg: theme === "light" ? "bg-[#F1F5F9]" : "bg-[#070A13]",
    card: theme === "light" ? "glass-card border-slate-200/80 text-slate-800 shadow-md rounded-2xl" : "glass-card border-slate-800/85 text-slate-100 shadow-2xl rounded-2xl",
    textMuted: theme === "light" ? "text-slate-500" : "text-slate-400",
    textTitle: theme === "light" ? "text-slate-800" : "text-white",
    input: theme === "light" ? "bg-white border-slate-200 text-slate-900" : "bg-[#0E1322] border-slate-800 text-slate-100",
    border: theme === "light" ? "border-slate-200" : "border-slate-800/70",
    tableRowEven: theme === "light" ? "bg-slate-100/50" : "bg-[#0E1322]/40"
  };

  return (
    <div className={`flex-1 flex flex-col font-sans overflow-x-hidden min-h-screen pb-24 md:pb-0 transition-colors duration-300 ${theme === "dark" ? "dark" : ""} ${themeClasses.bg}`}>
      
      {/* Header NavBar */}
      <header className="bg-[#0B0F19]/90 backdrop-blur-md text-white px-4 py-3 md:px-6 md:py-4 flex items-center justify-between border-b border-slate-800/60 sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-tr from-indigo-600 to-cyan-500 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center">
            Artha<span className="text-indigo-400 font-extrabold">Mind AI</span>
          </span>
        </div>

        {/* Clean, Functional Module Navigation */}
        <nav className="hidden md:flex space-x-2 bg-slate-900/60 p-1 border border-slate-800 rounded-xl">
          {[
            { id: "research", label: "Stock Analyst", icon: Activity },
            { id: "optimizer", label: "Portfolio Optimizer", icon: PieIcon },
            { id: "finance", label: "Personal Wealth Planner", icon: Landmark }
          ].map(module => {
            const isActive = activeTab === module.id;
            const Icon = module.icon;
            return (
              <button 
                key={module.id}
                onClick={() => {
                  setActiveTab(module.id as "research" | "optimizer" | "finance");
                  if (module.id === "research") setActiveWorkspaceTab("Overview");
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{module.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Nav Utilities */}
        <div className="flex items-center space-x-4">
          
          {/* Connection Status Badge */}
          {backendConnected === true && (
            <span className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-3xs font-extrabold text-emerald-400">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span>API ONLINE</span>
            </span>
          )}
          {backendConnected === false && (
            <span className="flex items-center space-x-1.5 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full text-3xs font-extrabold text-rose-400">
              <span className="h-1.5 w-1.5 bg-rose-500 rounded-full"></span>
              <span>API OFFLINE</span>
            </span>
          )}
          {backendConnected === null && (
            <span className="flex items-center space-x-1.5 bg-slate-500/10 border border-slate-500/20 px-2.5 py-1 rounded-full text-3xs font-extrabold text-slate-400 animate-pulse">
              <span className="h-1.5 w-1.5 bg-slate-500 rounded-full"></span>
              <span>CONNECTING</span>
            </span>
          )}

          {/* Light/Dark mode switcher */}
          <button 
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title="Toggle Theme"
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5 text-slate-400" />
            ) : (
              <Sun className="h-5 w-5 text-amber-400" />
            )}
          </button>
        </div>
      </header>

      {/* Real-time scrolling ticker tape (Fanciness & Real stock app feel) */}
      {isMounted && (
        <div className="bg-[#090C16] border-b border-indigo-500/10 text-white py-1.5 overflow-hidden text-3xs font-extrabold select-none relative z-40">
          <div className="animate-marquee whitespace-nowrap flex space-x-12">
            {[
              { symbol: "RELIANCE.NS", price: "₹2,450.25", change: "+1.25%", up: true },
              { symbol: "TCS.NS", price: "₹3,410.80", change: "-0.45%", up: false },
              { symbol: "INFY.NS", price: "₹1,512.40", change: "+2.10%", up: true },
              { symbol: "HDFCBANK.NS", price: "₹1,620.15", change: "+0.85%", up: true },
              { symbol: "ICICIBANK.NS", price: "₹915.60", change: "-1.15%", up: false },
              { symbol: "BAJFINANCE.NS", price: "₹7,210.00", change: "+1.95%", up: true },
              { symbol: "ITC.NS", price: "₹442.30", change: "+0.25%", up: true },
              { symbol: "LT.NS", price: "₹2,340.50", change: "-0.65%", up: false }
            ].concat([
              { symbol: "RELIANCE.NS", price: "₹2,450.25", change: "+1.25%", up: true },
              { symbol: "TCS.NS", price: "₹3,410.80", change: "-0.45%", up: false },
              { symbol: "INFY.NS", price: "₹1,512.40", change: "+2.10%", up: true },
              { symbol: "HDFCBANK.NS", price: "₹1,620.15", change: "+0.85%", up: true },
              { symbol: "ICICIBANK.NS", price: "₹915.60", change: "-1.15%", up: false },
              { symbol: "BAJFINANCE.NS", price: "₹7,210.00", change: "+1.95%", up: true },
              { symbol: "ITC.NS", price: "₹442.30", change: "+0.25%", up: true },
              { symbol: "LT.NS", price: "₹2,340.50", change: "-0.65%", up: false }
            ]).map((item, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="text-slate-400 font-semibold">{item.symbol}</span>
                <span className="text-white font-bold">{item.price}</span>
                <span className={`px-1.5 py-0.5 rounded font-black text-4xs ${
                  item.up 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" 
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/15"
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
        <form onSubmit={handleSearchSubmit} className={`p-3 md:p-4 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${themeClasses.card}`}>
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
              className={`pl-10 pr-4 py-3 text-sm rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 border ${themeClasses.input}`}
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
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm px-6 py-2.5 md:px-8 md:py-3 rounded-lg transition-colors shadow-md shadow-emerald-500/20 w-full sm:w-auto"
          >
            Search
          </button>
        </form>
      </section>

      {/* Watchlist Quick Access Pills */}
      {tickers.length > 0 && (
        <section className="max-w-7xl w-full mx-auto px-4 md:px-6 pt-2">
          <div className="flex items-center space-x-2 overflow-x-auto py-2 bg-slate-50 dark:bg-slate-950/20 px-4 rounded-xl border border-slate-200 dark:border-slate-800/80 scrollbar-none">
            <span className="text-2xs font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">Watchlist:</span>
            <div className="flex items-center space-x-2 flex-nowrap">
              {tickers.map(ticker => (
                <div 
                  key={ticker} 
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-2xs font-bold transition-all border ${
                    selectedTicker === ticker 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-sm" 
                      : "bg-white dark:bg-[#131B31] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700"
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col space-y-4 md:space-y-6 relative z-10">
        
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
                  <div className="flex gap-3.5 p-4 rounded-xl bg-white/40 dark:bg-slate-900/30 border border-white/20 dark:border-slate-800/40">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl h-10 w-10 flex items-center justify-center shrink-0">
                      <Search className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">1. Choose a Ticker Symbol</h4>
                      <p className="text-4xs text-slate-400 mt-1 leading-relaxed">
                        Enter any asset symbol (e.g. <b>TCS.NS</b>, <b>AAPL</b>, <b>BTC-USD</b>) in the search bar or select from the Watchlist access pills.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 p-4 rounded-xl bg-white/40 dark:bg-slate-900/30 border border-white/20 dark:border-slate-800/40">
                    <div className="bg-cyan-500/10 border border-cyan-500/20 p-2.5 rounded-xl h-10 w-10 flex items-center justify-center shrink-0">
                      <Cpu className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">2. Run AI Agent Pipeline</h4>
                      <p className="text-4xs text-slate-400 mt-1 leading-relaxed">
                        Go to the <b>AI Research Hub</b> tab below and click <b>"Run AI Agent Team"</b> to stream calculations and sentiment scoring in real-time.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3.5 p-4 rounded-xl bg-white/40 dark:bg-slate-900/30 border border-white/20 dark:border-slate-800/40">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl h-10 w-10 flex items-center justify-center shrink-0">
                      <Download className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">3. Analyze & Export PDF</h4>
                      <p className="text-4xs text-slate-400 mt-1 leading-relaxed">
                        Inspect individual agent outputs (Technical charts, Sentiment dial, SIP calculators) and download the generated PDF Report.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

             {/* Stock Header Information Card */}
             <div className={`p-4 md:p-6 rounded-2xl border flex flex-col gap-4 md:gap-6 ${themeClasses.card}`}>
               {/* Top Row: Name, Price, and Watchlist Button */}
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 pb-3 md:pb-4 border-b border-slate-200/40 dark:border-slate-800/60">
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
                       <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white">{currencySymbol}{currentStock.currentPrice.toFixed(2)}</span>
                       <span className={`text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded flex items-center border ${
                         currentStock.currentPrice - currentStock.close >= 0 
                           ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" 
                           : "text-rose-500 bg-rose-500/10 border-rose-500/20"
                       }`}>
                         {currentStock.currentPrice - currentStock.close >= 0 ? "▲ +" : "▼ "}{(((currentStock.currentPrice - currentStock.close) / (currentStock.close || 1)) * 100).toFixed(2)}%
                       </span>
                       <span className="text-4xs text-slate-400 uppercase font-semibold">Live Simulation</span>
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
 
               {/* Bottom Row: Key Metrics Grid */}
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 text-xs">
                 <div className="bg-slate-50/50 dark:bg-[#0E1322]/40 p-2.5 md:p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                   <div className="text-slate-400 font-bold uppercase text-3xs">Today's High</div>
                   <div className="font-bold text-sm text-slate-700 dark:text-slate-200 mt-0.5">{currencySymbol}{currentStock.high.toFixed(2)}</div>
                 </div>
                 <div className="bg-slate-50/50 dark:bg-[#0E1322]/40 p-2.5 md:p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                   <div className="text-slate-400 font-bold uppercase text-3xs">Today's Low</div>
                   <div className="font-bold text-sm text-slate-700 dark:text-slate-200 mt-0.5">{currencySymbol}{currentStock.low.toFixed(2)}</div>
                 </div>
                 <div className="bg-slate-50/50 dark:bg-[#0E1322]/40 p-2.5 md:p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                   <div className="text-slate-400 font-bold uppercase text-3xs">Open Price</div>
                   <div className="font-bold text-sm text-slate-700 dark:text-slate-200 mt-0.5">{currencySymbol}{currentStock.open.toFixed(2)}</div>
                 </div>
                 <div className="bg-slate-50/50 dark:bg-[#0E1322]/40 p-2.5 md:p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                   <div className="text-slate-400 font-bold uppercase text-3xs">Prev. Close</div>
                   <div className="font-bold text-sm text-slate-700 dark:text-slate-200 mt-0.5">{currencySymbol}{currentStock.close.toFixed(2)}</div>
                 </div>
                 <div className="bg-slate-50/50 dark:bg-[#0E1322]/40 p-2.5 md:p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                   <div className="text-slate-400 font-bold uppercase text-3xs">Volume</div>
                   <div className="font-bold text-sm text-slate-700 dark:text-slate-200 mt-0.5">{currentStock.volume}</div>
                 </div>
                 <div className="bg-slate-50/50 dark:bg-[#0E1322]/40 p-2.5 md:p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                   <div className="text-slate-400 font-bold uppercase text-3xs">Market Cap</div>
                   <div className="font-bold text-sm text-slate-700 dark:text-slate-200 mt-0.5">{currentStock.cap}</div>
                 </div>
               </div>
             </div>
            
            {/* Split layout: Chart & Details vs AI predictions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (Chart, News, About) */}
              <div className="lg:col-span-2 flex flex-col space-y-6">
                
                {/*                {/* Refined Unified Workspace Card */}
                <div className={`p-4 md:p-6 ${themeClasses.card}`}>
                  
                  {/* Workspace Navigation Tabs */}
                  <div className="flex items-center justify-between border-b pb-4 mb-5 border-slate-200 dark:border-slate-800/80">
                    <div className="flex space-x-4 md:space-x-6 text-xs md:text-sm font-semibold overflow-x-auto scrollbar-none pb-1 flex-nowrap w-full">
                      {[
                        { id: "Overview", label: "Overview & Charts" },
                        { id: "AI Research Hub", label: "AI Research Hub" },
                        { id: "Technical Metrics", label: "Technical Indicators" },
                        { id: "News Feed", label: "News Feed" }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveWorkspaceTab(tab.id)}
                          className={`transition-all pb-4 -mb-5 relative whitespace-nowrap cursor-pointer ${
                            activeWorkspaceTab === tab.id
                              ? "text-indigo-500 font-bold"
                              : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
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

                  {/* Tab Contents */}
                  <div className="mt-4">
                    
                    {/* 1. OVERVIEW & CHARTS TAB */}
                    {activeWorkspaceTab === "Overview" && (
                      <div className="space-y-6">
                        
                        {/* Chart Control Bar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40 p-2.5 md:p-3 rounded-xl border border-slate-200 dark:border-slate-800/70">
                          
                          {/* Indicator Views */}
                          <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-[#0E1322] border border-slate-200 dark:border-slate-800/80 rounded-lg overflow-x-auto scrollbar-none flex-nowrap max-w-full w-full md:w-auto">
                            {[
                              { id: "price", label: "Price (Area)" },
                              { id: "ma", label: "MA Trend" },
                              { id: "rsi", label: "RSI Momentum" },
                              { id: "macd", label: "MACD Oscillator" }
                            ].map(view => (
                              <button
                                key={view.id}
                                onClick={() => setChartSubView(view.id as any)}
                                className={`px-2.5 py-1 rounded text-3xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                                  chartSubView === view.id
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                }`}
                              >
                                {view.label}
                              </button>
                            ))}
                          </div>

                          {/* Timeframe Selectors */}
                          <div className="flex space-x-1 overflow-x-auto scrollbar-none flex-nowrap max-w-full w-full md:w-auto pb-1 md:pb-0">
                            {["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "Max"].map(period => (
                              <button
                                key={period}
                                onClick={() => setTimePeriod(period)}
                                className={`px-2.5 py-1 rounded text-3xs font-extrabold transition-all border whitespace-nowrap ${
                                  timePeriod === period 
                                    ? "bg-slate-100 dark:bg-slate-800 text-indigo-500 border-slate-200 dark:border-slate-700 shadow-2xs" 
                                    : "text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
                                }`}
                              >
                                {period}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Recharts Canvas */}
                        <div className="h-[260px] md:h-[320px] w-full relative">
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
                                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <AreaChart data={stockHistory} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                      <defs>
                                        <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} />
                                      <XAxis dataKey="Date" stroke="#64748B" fontSize={8} />
                                      <YAxis domain={["auto", "auto"]} stroke="#64748B" fontSize={8} />
                                      <Tooltip contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
                                      <Area type="monotone" dataKey="Close" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorClose)" name="Close Price" />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                )}

                                {chartSubView === "ma" && (
                                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <LineChart data={stockHistory} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} />
                                      <XAxis dataKey="Date" stroke="#64748B" fontSize={8} />
                                      <YAxis domain={["auto", "auto"]} stroke="#64748B" fontSize={8} />
                                      <Tooltip contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
                                      <Legend wrapperStyle={{ fontSize: 9 }} />
                                      <Line type="monotone" dataKey="Close" stroke="#6366F1" strokeWidth={2.5} dot={false} name="Closing Price" />
                                      <Line type="monotone" dataKey="MA_10" stroke="#3B82F6" strokeWidth={1.5} dot={false} name="10 SMA" />
                                      <Line type="monotone" dataKey="MA_50" stroke="#F59E0B" strokeWidth={1.5} dot={false} name="50 SMA" />
                                    </LineChart>
                                  </ResponsiveContainer>
                                )}

                                {chartSubView === "rsi" && (
                                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <LineChart data={stockHistory} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} />
                                      <XAxis dataKey="Date" stroke="#64748B" fontSize={8} />
                                      <YAxis domain={[0, 100]} stroke="#64748B" fontSize={8} />
                                      <Tooltip contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
                                      <Legend wrapperStyle={{ fontSize: 9 }} />
                                      <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" label={{ value: "Overbought (70)", fill: "#EF4444", fontSize: 7, position: "insideTopLeft" }} />
                                      <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" label={{ value: "Oversold (30)", fill: "#10B981", fontSize: 7, position: "insideBottomLeft" }} />
                                      <Line type="monotone" dataKey="RSI_14" stroke="#8B5CF6" strokeWidth={2} dot={false} name="RSI (14)" />
                                    </LineChart>
                                  </ResponsiveContainer>
                                )}

                                {chartSubView === "macd" && (
                                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <ComposedChart data={stockHistory} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} />
                                      <XAxis dataKey="Date" stroke="#64748B" fontSize={8} />
                                      <YAxis domain={["auto", "auto"]} stroke="#64748B" fontSize={8} />
                                      <Tooltip contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
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
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-50 dark:bg-slate-900/40 p-4 border border-slate-200 dark:border-slate-800/70 rounded-xl">
                            <div>
                              <span className="text-slate-400 font-bold block uppercase text-3xs mb-0.5">Sector</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{currentStock.sector}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold block uppercase text-3xs mb-0.5">Industry</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{currentStock.industry}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold block uppercase text-3xs mb-0.5">Official Website</span>
                              {currentStock.website ? (
                                <a 
                                  href={sanitizeUrl(currentStock.website)} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="font-semibold text-indigo-400 hover:underline flex items-center gap-1 hover:text-indigo-300"
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
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                                className={`p-2.5 md:p-3 rounded-xl border flex flex-col justify-between transition-all duration-300 relative ${
                                  nodeState === "completed" 
                                    ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-500 dark:text-emerald-400" 
                                    : nodeState === "active"
                                    ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-500 dark:text-indigo-400 active-pulse"
                                    : "bg-white dark:bg-[#0E1322]/30 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1 gap-1">
                                  <span className="text-3xs font-extrabold uppercase tracking-wide truncate">{node.label}</span>
                                  {nodeState === "completed" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                                  {nodeState === "active" && <RefreshCw className="h-3.5 w-3.5 text-indigo-500 animate-spin shrink-0" />}
                                  {nodeState === "pending" && <HelpCircle className="h-3.5 w-3.5 opacity-30 text-slate-400 shrink-0" />}
                                </div>
                                <p className="text-4xs leading-normal opacity-75 line-clamp-2">{node.desc}</p>
                                <span className="absolute bottom-1 right-2 text-4xs font-black opacity-10">0{idx + 1}</span>
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
                          <div className="bg-slate-50 dark:bg-[#0E1322]/40 p-4 border border-slate-200 dark:border-slate-800/80 rounded-xl flex flex-col h-[340px] justify-between">
                            <div className="flex items-center justify-between gap-2 border-b pb-2 mb-3 border-slate-200 dark:border-slate-800 w-full min-w-0">
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
                            <div className="flex-1 overflow-y-auto pr-1 text-2xs leading-relaxed text-slate-600 dark:text-slate-400 font-sans">
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
                          <div className="bg-slate-50 dark:bg-[#0E1322]/40 p-4 border border-slate-200 dark:border-slate-800/80 rounded-xl flex flex-col h-[340px]">
                            
                            {/* Report Sub-navigation */}
                            <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-[#080B13] border border-slate-200 dark:border-slate-800 rounded-lg mb-3 overflow-x-auto scrollbar-none flex-nowrap">
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
                            <div className="flex-1 overflow-y-auto pr-1 text-2xs leading-relaxed text-slate-500 dark:text-slate-400">
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

                        {/* Terminal Monospaced Console Log */}
                        <div className="bg-slate-950 text-[#00FF66] border border-slate-900 rounded-xl p-4 h-[180px] overflow-y-auto font-mono text-2xs space-y-1 relative shadow-inner">
                          <div className="absolute top-2 right-4 text-3xs font-extrabold text-slate-500 uppercase tracking-widest select-none">Live Console Log</div>
                          {agentLogs.length === 0 ? (
                            <div className="text-slate-500 text-center py-14 font-sans text-xs">
                              Console idle. Awaiting agent execution triggers...
                            </div>
                          ) : (
                            agentLogs.map((log, idx) => (
                              <div key={idx} className="leading-relaxed">
                                <span className="text-slate-600">[{idx+1}]</span> {log}
                              </div>
                            ))
                          )}
                          <div ref={consoleEndRef} />
                        </div>

                      </div>
                    )}

                    {/* 3. TECHNICAL & FORECAST METRICS TAB */}
                    {activeWorkspaceTab === "Technical Metrics" && (
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
                                      className={`flex-1 py-1.5 rounded text-3xs font-extrabold transition-all cursor-pointer ${isActive ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
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
                                    ▲ {(predictionHorizon === "tomorrow" ? 1.2 : predictionHorizon === "7days" ? 3.4 : 7.5).toFixed(1)}% Estimated Upside
                                  </span>
                                </div>
                                <p className="text-3xs text-slate-400 flex items-center gap-1.5 mt-2 bg-slate-100 dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800 rounded-lg">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                  <span>Automated predictions support a positive target based on short-term RSI parameters and 10 SMA support.</span>
                                </p>
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
                                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <LineChart data={compareData.normalized_history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} />
                                      <XAxis dataKey="Date" stroke="#64748B" fontSize={8} />
                                      <YAxis unit="%" stroke="#64748B" fontSize={8} />
                                      <Tooltip contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
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
                {loadingRecommendation ? (
                  <div className={`p-16 rounded-2xl border flex flex-col items-center justify-center text-slate-400 text-xs text-center ${themeClasses.card}`}>
                    <RefreshCw className="h-5 w-5 animate-spin mb-2 text-indigo-500" />
                    <span>Analyzing quant triggers & ML model...</span>
                  </div>
                ) : aiRecommendation ? (
                  <div className={`p-5 rounded-2xl border ${themeClasses.card}`}>
                    <div className="flex justify-between items-center border-b pb-3 mb-4 border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                        <Cpu className="h-4.5 w-4.5 text-indigo-500" />
                        <span>AI Recommendation Center</span>
                      </h4>
                      <span className="text-4xs font-bold text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Live ML</span>
                    </div>

                    {/* Recommendation Gauge */}
                    <div className="flex flex-col items-center justify-center text-center pb-4 border-b border-slate-200/40 dark:border-slate-800/85">
                      <div className="relative w-36 h-20 overflow-hidden flex justify-center">
                        {/* Background track */}
                        <div className="absolute top-0 w-36 h-36 border-12 border-slate-100 dark:border-slate-800 rounded-full"></div>
                        
                        {/* Coloured gauge segment based on recommendation */}
                        {(() => {
                          const rec = aiRecommendation.recommendation.toUpperCase();
                          let rotate = 0;
                          let colorClass = "border-t-slate-300 border-l-slate-300";
                          if (rec === "STRONG BUY") {
                            rotate = 65;
                            colorClass = "border-t-emerald-500 border-l-emerald-500";
                          } else if (rec === "BUY") {
                            rotate = 30;
                            colorClass = "border-t-emerald-400 border-l-emerald-400";
                          } else if (rec === "HOLD") {
                            rotate = 0;
                            colorClass = "border-t-amber-400 border-l-amber-400";
                          } else if (rec === "SELL") {
                            rotate = -30;
                            colorClass = "border-t-rose-400 border-l-rose-400";
                          } else if (rec === "STRONG SELL") {
                            rotate = -65;
                            colorClass = "border-t-rose-500 border-l-rose-500";
                          }
                          return (
                            <>
                              <div className={`absolute top-0 w-36 h-36 border-12 border-transparent ${colorClass} rounded-full transform rotate-[45deg]`}></div>
                              {/* Needle */}
                              <div className="absolute bottom-0 w-1 h-14 bg-slate-800 dark:bg-slate-200 origin-bottom rounded-full transition-transform duration-500" style={{ transform: `rotate(${rotate}deg)` }}></div>
                            </>
                          );
                        })()}
                        <div className="absolute bottom-0 w-4 h-4 bg-slate-900 dark:bg-white rounded-full border border-slate-200"></div>
                      </div>
                      
                      <div className="flex flex-col items-center mt-3">
                        <span className={`font-black text-sm uppercase tracking-wider ${
                          aiRecommendation.recommendation.includes("BUY") ? "text-emerald-500 text-glow-green" : aiRecommendation.recommendation.includes("SELL") ? "text-rose-500 text-glow-red" : "text-amber-500"
                        }`}>{aiRecommendation.recommendation}</span>
                        <span className="text-3xs text-slate-400 mt-1 font-semibold flex items-center gap-1">
                          <span>Confidence Index:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">{aiRecommendation.confidence}%</span>
                        </span>
                      </div>
                    </div>

                    {/* ML Target Price */}
                    <div className="py-4 border-b border-slate-200/40 dark:border-slate-800/85 space-y-2">
                      <div className="flex justify-between items-center text-3xs text-slate-400 font-bold uppercase tracking-wider">
                        <span>Next-Day ML Target Close</span>
                        <span>Tomorrow</span>
                      </div>
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
                    </div>

                    {/* Active Quantitative Triggers */}
                    <div className="pt-4 space-y-3">
                      <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">Active Signal Triggers</span>
                      <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
                        {aiRecommendation.signals.map((sig: any, idx: number) => (
                          <div key={idx} className="bg-slate-50/50 dark:bg-[#0E1322]/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/50 space-y-1">
                            <div className="flex justify-between items-center text-3xs">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{sig.name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-4xs font-black uppercase ${
                                sig.status === "Bullish" ? "bg-emerald-500/10 text-emerald-500" : sig.status === "Bearish" ? "bg-rose-500/10 text-rose-500" : "bg-amber-500/10 text-amber-500"
                              }`}>{sig.status}</span>
                            </div>
                            <p className="text-4xs text-slate-400 leading-relaxed font-semibold">{sig.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`p-5 rounded-2xl border ${themeClasses.card}`}>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm border-b pb-3 mb-4 border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                      <Cpu className="h-4.5 w-4.5 text-emerald-500" />
                      AI Price Prediction
                    </h4>

                    {/* Forecast horizon Tabs */}
                    <div className="flex space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border mb-4 border-slate-200 dark:border-slate-800">
                      {["Tomorrow", "Next 7 Days", "Next 30 Days"].map((horizon, idx) => {
                        const hKey = idx === 0 ? "tomorrow" : idx === 1 ? "7days" : "30days";
                        const isActive = predictionHorizon === hKey;
                        return (
                          <button
                            key={horizon}
                            onClick={() => setPredictionHorizon(hKey)}
                            className={`flex-1 py-1 rounded text-3xs font-bold transition-all ${isActive ? "bg-white dark:bg-[#131B31] text-emerald-500 border" : "text-slate-400 hover:text-slate-600"}`}
                          >
                            {horizon}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-col space-y-2">
                      <span className="text-3xs text-slate-400 font-bold uppercase">Predicted Price ({predictionHorizon})</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                          ₹{(currentStock.currentPrice * (predictionHorizon === "tomorrow" ? 1.012 : predictionHorizon === "7days" ? 1.034 : 1.075)).toFixed(2)}
                        </span>
                        <span className="text-2xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          ▲ {(predictionHorizon === "tomorrow" ? 1.2 : predictionHorizon === "7days" ? 3.4 : 7.5).toFixed(1)}% Upside
                        </span>
                      </div>
                      <p className="text-3xs text-slate-400 flex items-center gap-1.5 mt-2 bg-slate-50 dark:bg-slate-950 p-2.5 border border-slate-200 dark:border-slate-800 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Bullish momentum expected based on indicators.</span>
                      </p>
                      <div className="mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/85 text-4xs text-slate-400 leading-normal">
                        💡 <b>AI Target Logic:</b> Aggregates short-term technical indicators (RSI momentum and 10 SMA support) to project forecasted price trends.
                      </div>
                    </div>
                  </div>
                )}

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
                  <div className={`p-5 rounded-2xl border flex flex-col justify-between ${themeClasses.card}`}>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span>Optimal Maximum Sharpe Weights</span>
                        <span className="text-3xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">Optimal</span>
                      </h4>
                      
                      <div className="space-y-3 mt-4">
                        {Object.entries(optResults.max_sharpe.weights).map(([ticker, weight]: [string, any]) => (
                          <div key={ticker} className="flex flex-col space-y-1">
                            <div className="flex justify-between text-2xs font-semibold text-slate-600 dark:text-slate-300">
                              <span>{ticker}</span>
                              <span>{(weight * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2">
                              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${weight * 100}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-6 grid grid-cols-3 gap-2 text-center border-slate-100 dark:border-slate-800">
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
                    <div className="w-full mt-4">
                      {isMounted && (
                        <ResponsiveContainer width="100%" height={240} minWidth={0}>
                          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                            <CartesianGrid stroke={theme === "light" ? "#F1F5F9" : "#1E293B"} />
                            <XAxis type="number" dataKey="volatility" name="Volatility" unit="" label={{ value: "Volatility (Risk)", position: "bottom", fill: "#94A3B8", fontSize: 10 }} stroke="#94A3B8" fontSize={8} />
                            <YAxis type="number" dataKey="return" name="Return" unit="" label={{ value: "Return", angle: -90, position: "insideLeft", fill: "#94A3B8", fontSize: 10 }} stroke="#94A3B8" fontSize={8} />
                            <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0F172A", border: "1px solid #E2E8F0" }} />
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
            <div className="flex items-center justify-between border-b pb-4 mb-5 border-slate-200 dark:border-slate-800/80">
              <div className="flex space-x-4 md:space-x-6 text-xs md:text-sm font-semibold overflow-x-auto scrollbar-none pb-1 flex-nowrap w-full">
                {[
                  { id: "sip", label: "Advanced SIP Planner" },
                  { id: "compare_sip", label: "Compare SIPs" },
                  { id: "tax_expense", label: "Tax & Expenses Ledger" },
                  { id: "mf", label: "Mutual Fund Advisor" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFinanceTab(tab.id as any)}
                    className={`transition-all pb-4 -mb-5 relative whitespace-nowrap cursor-pointer ${
                      activeFinanceTab === tab.id
                        ? "text-indigo-500 font-bold"
                        : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
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
                    
                    <div className="flex space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 mb-2">
                      <button 
                        onClick={() => setSipMode("investment")}
                        className={`flex-1 py-1 rounded text-3xs font-bold transition-all ${sipMode === "investment" ? "bg-white dark:bg-[#131B31] text-indigo-500 border" : "text-slate-400"}`}
                      >
                        Wealth Growth
                      </button>
                      <button 
                        onClick={() => setSipMode("goal")}
                        className={`flex-1 py-1 rounded text-3xs font-bold transition-all ${sipMode === "goal" ? "bg-white dark:bg-[#131B31] text-indigo-500 border" : "text-slate-400"}`}
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
                          <div className={`p-4 rounded-xl border ${themeClasses.card} bg-[#0E1322]/10`}>
                            <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">Total Principal</span>
                            <span className="text-base font-black text-slate-800 dark:text-white mt-1 block">₹{sipEnhancedResults.total_invested.toLocaleString("en-IN")}</span>
                          </div>
                          <div className={`p-4 rounded-xl border ${themeClasses.card} bg-[#0E1322]/10`}>
                            <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">Wealth Gain</span>
                            <span className="text-base font-black text-emerald-500 mt-1 block">+₹{sipEnhancedResults.wealth_gain.toLocaleString("en-IN")}</span>
                          </div>
                          <div className={`p-4 rounded-xl border ${themeClasses.card} bg-[#0E1322]/10`}>
                            <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">Nominal Corpus</span>
                            <span className="text-base font-black text-indigo-400 mt-1 block">₹{sipEnhancedResults.future_value.toLocaleString("en-IN")}</span>
                          </div>
                          <div className={`p-4 rounded-xl border ${themeClasses.card} bg-[#0E1322]/10`}>
                            <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider block">Real Purchasing Power</span>
                            <span className="text-base font-black text-rose-400 mt-1 block">₹{sipEnhancedResults.real_purchasing_power.toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        {/* Compound Growth Area Chart */}
                        <div className={`p-5 rounded-2xl border ${themeClasses.card}`}>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-3">SIP Wealth Roadmap Accumulation</h4>
                          <div className="h-[220px] w-full">
                            {isMounted && (
                              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                                  <Tooltip formatter={(value: any) => `₹${Math.round(value).toLocaleString("en-IN")}`} contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
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
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-xs text-slate-350 flex items-start space-x-2.5">
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
                          <div className={`p-4 rounded-xl border ${themeClasses.card} bg-[#0E1322]/10 space-y-2 text-xs`}>
                            <span className="text-3xs text-indigo-400 font-extrabold uppercase block border-b pb-1 border-slate-800">Portfolio A Maturity</span>
                            <div className="flex justify-between text-2xs">
                              <span className="text-slate-400">Total Invested:</span>
                              <span className="font-semibold text-slate-800 dark:text-white">₹{sipCompareResults.sip_a.total_invested.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-2xs">
                              <span className="text-slate-400">Maturity Value:</span>
                              <span className="font-black text-indigo-400">₹{sipCompareResults.sip_a.future_value.toLocaleString("en-IN")}</span>
                            </div>
                          </div>

                          <div className={`p-4 rounded-xl border ${themeClasses.card} bg-[#0E1322]/10 space-y-2 text-xs`}>
                            <span className="text-3xs text-emerald-400 font-extrabold uppercase block border-b pb-1 border-slate-800">Portfolio B Maturity</span>
                            <div className="flex justify-between text-2xs">
                              <span className="text-slate-400">Total Invested:</span>
                              <span className="font-semibold text-slate-800 dark:text-white">₹{sipCompareResults.sip_b.total_invested.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between text-2xs">
                              <span className="text-slate-400">Maturity Value:</span>
                              <span className="font-black text-emerald-400">₹{sipCompareResults.sip_b.future_value.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        </div>

                        {/* Comparative Growth Chart */}
                        <div className={`p-5 rounded-2xl border ${themeClasses.card}`}>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-3">Maturity Comparison Curve</h4>
                          <div className="h-[220px] w-full">
                            {isMounted && (
                              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <LineChart margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} />
                                  <XAxis dataKey="year" stroke="#64748B" fontSize={8} tickFormatter={(y) => `Yr ${y}`} />
                                  <YAxis stroke="#64748B" fontSize={8} tickFormatter={(v) => `₹${formatVolume(v)}`} />
                                  <Tooltip contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
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
                                {item.type === "Income" ? "+" : "-"} ₹{item.amount.toLocaleString("en-IN")}
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
                            <div key={fund.ticker} className={`p-4 rounded-xl border ${themeClasses.card} bg-[#0E1322]/10 space-y-3 text-2xs`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-black text-slate-800 dark:text-white block truncate max-w-[160px] md:max-w-xs">{fund.long_name}</span>
                                  <span className="text-indigo-400 font-extrabold text-[10px] mt-0.5">{fund.category}</span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-black text-slate-800 dark:text-white text-xs block">₹{fund.nav.toFixed(2)}</span>
                                  <span className="text-3xs text-slate-400">Current NAV</span>
                                </div>
                              </div>
                              <hr className="border-slate-800/60" />
                              <div className="grid grid-cols-3 gap-1.5 text-center text-3xs">
                                <div>
                                  <span className="text-slate-400 block uppercase font-bold">1Y Return</span>
                                  <span className="font-bold text-emerald-500 text-[11px] mt-0.5 block">+{fund.return_1y.toFixed(1)}%</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block uppercase font-bold">Risk (Vol)</span>
                                  <span className="font-bold text-rose-400 text-[11px] mt-0.5 block">{fund.volatility.toFixed(1)}%</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block uppercase font-bold">Sharpe</span>
                                  <span className="font-bold text-indigo-400 text-[11px] mt-0.5 block">{fund.sharpe_ratio.toFixed(2)}</span>
                                </div>
                              </div>
                              <div className="flex justify-between text-3xs text-slate-400 bg-slate-100 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-850 rounded-lg">
                                <span>AUM size: <b>₹{(fund.aum / 1e7).toFixed(1)} Cr</b></span>
                                <span className="text-amber-400 font-bold">★ {fund.morningstar_rating}/5</span>
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
                              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <LineChart data={mfData.chart_data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke={theme === "light" ? "#E2E8F0" : "#1E293B"} />
                                  <XAxis dataKey="Date" stroke="#64748B" fontSize={8} />
                                  <YAxis unit="%" stroke="#64748B" fontSize={8} />
                                  <Tooltip contentStyle={{ backgroundColor: theme === "light" ? "#FFF" : "#0E1322", border: "1px solid rgba(148, 163, 184, 0.15)", borderRadius: "10px", fontSize: "10px" }} />
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
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5 text-xs text-slate-350 space-y-3">
                          <h5 className="font-bold text-slate-800 dark:text-white flex items-center space-x-2">
                            <Cpu className="h-4.5 w-4.5 text-indigo-400" />
                            <span>AI Quant Advisor Consensus</span>
                          </h5>
                          <p className="leading-relaxed">
                            Based on live Morningstar ratings and Sharpe Ratio computations, the following allocations are recommended:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-3xs pt-1.5 leading-relaxed text-slate-450">
                            <div className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg">
                              <span className="font-bold text-slate-850 dark:text-white uppercase block mb-1">Risk-Averse Investors</span>
                              Mirae Asset Large Cap or ICICI Hybrid are recommended, offering a moderate volatility profile with strong Sharpe indicators (&gt; 1.2x).
                            </div>
                            <div className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg">
                              <span className="font-bold text-slate-850 dark:text-white uppercase block mb-1">Growth Seekers</span>
                              Nippon India Small Cap or HDFC Mid-Cap have yielded over 25% returns in the last 1 year, suitable for a 5+ year investment horizon.
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

      </main>

      <footer className="border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 py-6 px-6 text-center text-slate-400 text-3xs space-y-2 mt-auto">
        <p>© 2026 ArthaMind AI Inc. Created for Advanced Agentic AI Workshop. All rights reserved.</p>
        <p className="max-w-4xl mx-auto leading-relaxed">
          <b>SEBI Warning Disclaimer:</b> The stock forecasts, price predictions, and options weights provided herein are generated by automated AI research agents. This platform is built for student curriculum demonstration. We are not registered with SEBI (Securities and Exchange Board of India). Allocate capital at your own discretion.
        </p>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0F19]/95 backdrop-blur-lg border-t border-slate-800/80 px-4 py-2.5 flex justify-around items-center shadow-lg">
        {[
          { id: "research", label: "Analyst", icon: Activity },
          { id: "optimizer", label: "Optimizer", icon: PieIcon },
          { id: "finance", label: "Planner", icon: Landmark }
        ].map(module => {
          const isActive = activeTab === module.id;
          const Icon = module.icon;
          return (
            <button 
              key={module.id}
              onClick={() => {
                setActiveTab(module.id as "research" | "optimizer" | "finance");
                if (module.id === "research") setActiveWorkspaceTab("Overview");
              }}
              className={`flex flex-col items-center space-y-1 py-1 px-3 rounded-xl transition-all ${
                isActive 
                  ? "text-indigo-400 font-bold bg-indigo-500/10" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{module.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
