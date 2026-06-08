# Automated Financial Research Platform (EquityPulse AI)

An AI-powered multi-agent financial research assistant and portfolio optimizer designed for Indian stock markets. Built as a Track B (Advanced level) project for the Agentic AI Workshop.

---

## Technical Stack & Architecture

This application uses a modular, professional microservices layout:

```
├── backend/
│   ├── main.py            # FastAPI Application Entrypoint & SSE Streaming
│   ├── db/
│   │   ├── session.py     # SQLite session connection
│   │   └── models.py      # Database schema (Stock Cache, Watchlist, Expenses, Portfolios)
│   ├── data/
│   │   ├── fetcher.py     # Robust yfinance price downloads (custom user-agents)
│   │   ├── indicators.py  # Technical analysis indicator generator (MA, RSI, MACD, Vol)
│   │   └── optimizer.py   # Modern Portfolio Theory (Sharpe Ratio efficient frontier)
│   ├── agents/
│   │   ├── prompts.py     # System instructions for the 5-Agent team
│   │   ├── analysts.py    # Individual Analyst Agent execution calls
│   │   └── graph.py       # Custom State Graph orchestrator
│   └── utils/
│       ├── calculators.py # SIP and Capital Gains Tax estimators
│       └── pdf_report.py  # PDF document generation with ReportLab
├── docs/                  # Documentation & Guides
│   └── Financial_Research.md # Choice of Challenge level details
├── frontend/              # Next.js 16 Web Dashboard Application
│   ├── src/app/
│   │   ├── page.tsx       # Main Single Page App dashboard UI
│   │   └── globals.css    # Tailwind CSS imports
│   └── package.json       # Frontend dependencies (lucide-react, recharts)
├── tests/                 # Quantitative tests and scratch scripts
│   ├── test_backend.py    # Main backend test suite
│   └── scratch/           # Miscellaneous development test scripts
└── requirements.txt       # Python backend dependencies
```

*   **Frontend**: Next.js (React), Tailwind CSS, Recharts (Stock interactive charts), Lucide Icons.
*   **Backend**: FastAPI, Python 3.11, SQLite + SQLAlchemy ORM, Uvicorn server.
*   **AI Engine**: xAI Grok (grok-2-1212) API (also supports Groq Llama 3.3 or Google Gemini) used in a custom 5-Agent State Graph.
*   **Quantitative Engine**: Pandas, Numpy, Scikit-Learn for indicators and Sharpe Ratio calculations.

---

## Features Implemented

1.  **AI Research Agent Team**:
    *   **Technical Analyst Agent**: Analyzes stock trends, moving averages (MA_10, MA_50), RSI_14 momentum, MACD crossovers, and stock price volatility.
    *   **Fundamental Analyst Agent**: Reviews P/E ratios, forward P/E, P/B, Debt-to-Equity, ROE, EPS growth, and compares performance with sector metrics.
    *   **Sentiment Analyst Agent**: Performs sentiment scoring (-1.0 to +1.0) on current news items fetched via yfinance.
    *   **Personal Finance Agent**: Compares Systematic Investment Plan (SIP) vs Lumpsum and estimates Indian Capital Gains Tax (STCG vs LTCG).
    *   **Research Specialist (Consolidator) Agent**: Merges all findings into a professional Investment Memorandum.
2.  **Real-Time State Graph Tracing**:
    *   Streams active agent status and terminal logs directly to the frontend using Server-Sent Events (SSE) so users see what the agents are thinking in real-time.
3.  **Modern Portfolio Theory (MPT) Optimizer**:
    *   Runs Monte Carlo simulations on user-selected stocks to calculate the **Max Sharpe Ratio** and **Min Volatility** portfolios.
    *   Displays interactive scatter charts of the **Efficient Frontier** and weight distribution.
4.  **Personal Finance Calculations**:
    *   SIP vs Lumpsum growth visualizer.
    *   Indian Capital Gains Tax estimator (20% STCG for equity held <= 12 months, 12.5% LTCG for > 12 months with a ₹1.25L exemption, as per Union Budget 2024).
    *   Transaction and Expense tracker ledger.
5.  **PDF Report Exporter**:
    *   Exports clean PDF research memorandums styled with a dark slate layout, tables, and headers.
6.  **SEBI Regulatory Compliance**:
    *   Explicit disclaimers included in the UI, PDF, and console reports highlighting the educational nature of the app.

---

## Setup & Running Instructions

### 1. Backend Setup (FastAPI)
1.  Navigate to the project directory:
    ```powershell
    cd "Financial Research Automation"
    ```
2.  Activate the virtual environment:
    ```powershell
    .\venv\Scripts\activate
    ```
3.  Set your Grok/xAI API Key in the environment (or create a `.env` file from `.env.example`):
    ```powershell
    $env:XAI_API_KEY="your_xai_api_key_here"
    ```
    *(Alternatively, you can set `GROK_API_KEY`, `GROQ_API_KEY` or `GEMINI_API_KEY`)*
4.  Start the FastAPI backend server:
    ```powershell
    python run_backend.py
    ```
    *The API will start running on `http://127.0.0.1:8000`.*

### 2. Frontend Setup (Next.js)
1.  Open a new terminal and navigate to the `frontend/` directory:
    ```powershell
    cd "Financial Research Automation/frontend"
    ```
2.  Start the Next.js development server:
    ```powershell
    npm run dev
    ```
    *The web application will open on `http://localhost:3000`.*

---

## Security Audit (Snyk Clean)

This repository has been audited for security vulnerabilities:
*   **Scan Tool**: Snyk Static Application Security Testing (SAST).
*   **Result**: **0 Vulnerabilities found**. Path traversal risks in PDF exports were successfully resolved by sanitizing filenames using `os.path.basename` and restricting downloads to `.pdf` formats.

---

## SEBI Disclaimer Notice

*Disclaimer: This project is built for the Advanced Agentic AI workshop demonstration purposes. The recommendations, ratings, next-day price predictions, and sentiment scores generated by AI agents do not represent active financial advice or professional trading recommendations. We are not registered with SEBI (Securities and Exchange Board of India). Allocate capital at your own risk.*
