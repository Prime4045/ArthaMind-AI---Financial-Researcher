import os
import json
import logging
import requests
import yfinance as yf
import pandas as pd
from typing import Dict, Any, List

from backend.agents.prompts import (
    TECHNICAL_ANALYST_PROMPT,
    FUNDAMENTAL_ANALYST_PROMPT,
    NEWS_SENTIMENT_PROMPT,
    PERSONAL_FINANCE_PROMPT,
    RESEARCH_SPECIALIST_PROMPT
)
from backend.data.fetcher import fetch_stock_data, get_robust_session
from backend.data.indicators import calculate_technical_indicators
from backend.utils.calculators import calculate_sip, calculate_capital_gains_tax

logger = logging.getLogger(__name__)

def call_gemini(prompt: str) -> str:
    """
    Utility function to call Gemini, Groq, or xAI Grok model via HTTP.
    """
    groq_key = os.environ.get("GROQ_API_KEY")
    grok_key = os.environ.get("XAI_API_KEY") or os.environ.get("GROK_API_KEY")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    
    # If GEMINI_API_KEY starts with gsk-, treat it as Groq
    if gemini_key and gemini_key.startswith("gsk_"):
        groq_key = gemini_key
        gemini_key = None
        
    # If GEMINI_API_KEY starts with xai-, treat it as Grok
    if gemini_key and gemini_key.startswith("xai-"):
        grok_key = gemini_key
        gemini_key = None

    # 1. Groq Support
    if groq_key and not groq_key.startswith("your_") and groq_key.strip() != "":
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {groq_key}"
        }
        data = {
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2
        }
        try:
            logger.info("Calling Groq API (Llama 3.3)...")
            res = requests.post(url, headers=headers, json=data, timeout=30)
            if res.status_code == 200:
                return res.json()["choices"][0]["message"]["content"]
            else:
                err_msg = f"Groq API error (Status {res.status_code}): {res.text}"
                logger.error(err_msg)
                return f"⚠️ Groq API returned an error: {err_msg}"
        except Exception as e:
            logger.error(f"Failed to call Groq API: {str(e)}")
            return f"⚠️ Failed to call Groq API: {str(e)}"
            
    # 2. xAI Grok Support
    if grok_key and not grok_key.startswith("your_") and grok_key.strip() != "":
        # Call xAI Grok API
        url = "https://api.x.ai/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {grok_key}"
        }
        data = {
            "model": "grok-2-1212",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2
        }
        try:
            logger.info("Calling xAI Grok API...")
            res = requests.post(url, headers=headers, json=data, timeout=30)
            if res.status_code == 200:
                return res.json()["choices"][0]["message"]["content"]
            else:
                err_msg = f"Grok API error (Status {res.status_code}): {res.text}"
                logger.error(err_msg)
                return f"⚠️ Grok API returned an error: {err_msg}"
        except Exception as e:
            logger.error(f"Failed to call Grok API: {str(e)}")
            return f"⚠️ Failed to call Grok API: {str(e)}"
            
    # 3. Default/Fallback to Google Gemini API
    if not gemini_key or "your_gemini" in gemini_key or gemini_key.strip() == "":
        return ("⚠️ GEMINI_API_KEY or GROQ_API_KEY is not configured in your .env file.\n\n"
                "To enable full multi-agent reasoning, please paste a valid API key into the "
                "`.env` file in the project root:\n"
                "GROQ_API_KEY=gsk_...\n"
                "or\n"
                "GEMINI_API_KEY=AIzaSy...\n\n"
                "Once configured, restart the backend server and re-run the AI research workflow.")
                
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
    headers = {"Content-Type": "application/json"}
    data = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2}
    }
    try:
        logger.info("Calling Google Gemini API...")
        res = requests.post(url, headers=headers, json=data, timeout=30)
        if res.status_code == 200:
            res_json = res.json()
            try:
                return res_json["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as parse_err:
                logger.error(f"Error parsing Gemini response: {str(parse_err)}. Response was: {res_json}")
                return f"⚠️ Error parsing Gemini response: {str(parse_err)}"
        elif res.status_code == 429:
            res_json = res.json()
            err_msg = res_json.get("error", {}).get("message", "Quota exceeded.")
            logger.error(f"Gemini API rate limit: {err_msg}")
            return f"⚠️ Gemini API Quota Exceeded (429): {err_msg}\n\nPlease verify your API key limits in Google AI Studio."
        else:
            err_msg = f"Gemini API error (Status {res.status_code}): {res.text}"
            logger.error(err_msg)
            return f"⚠️ Gemini API returned an error: {err_msg}"
    except Exception as e:
        logger.error(f"Failed to call Gemini API: {str(e)}")
        return f"⚠️ Failed to call Gemini API: {str(e)}"

class StockResearchTeam:
    def __init__(self, ticker: str):
        self.ticker = ticker
        self.session = get_robust_session()
        self.yf_ticker = yf.Ticker(ticker, session=self.session)
        self.historical_data = pd.DataFrame()
        self.latest_info = {}
        
    def load_data(self):
        """
        Pre-loads historical stock data and yfinance info.
        """
        self.historical_data = fetch_stock_data(self.ticker, period="1y")
        try:
            self.latest_info = self.yf_ticker.info
        except Exception as e:
            logger.warning(f"Could not load yfinance info for {self.ticker}: {str(e)}")
            self.latest_info = {}

    def run_technical_analyst(self) -> str:
        """
        Runs Technical Analyst Agent.
        """
        if self.historical_data.empty:
            return "Technical Analyst: Error - No historical data available."
            
        # Compute indicators
        indicators_df = calculate_technical_indicators(self.historical_data)
        if indicators_df.empty:
            return "Technical Analyst: Error - Could not calculate technical indicators."
            
        # Take latest 10 rows for context
        latest_rows = indicators_df.tail(10)
        summary = latest_rows[["Date", "Open", "High", "Low", "Close", "MA_10", "MA_50", "RSI_14", "MACD_Line", "MACD_Signal", "Volatility"]].to_string()
        
        prompt = TECHNICAL_ANALYST_PROMPT.format(ticker=self.ticker, technical_summary=summary)
        return call_gemini(prompt)

    def run_fundamental_analyst(self) -> str:
        """
        Runs Fundamental Analyst Agent.
        """
        info = self.latest_info
        summary = {
            "Company Name": info.get("longName", self.ticker),
            "Sector": info.get("sector", "Unknown"),
            "Market Cap": info.get("marketCap", 0),
            "P/E Ratio": info.get("trailingPE", "N/A"),
            "Forward P/E": info.get("forwardPE", "N/A"),
            "P/B Ratio": info.get("priceToBook", "N/A"),
            "Debt to Equity": info.get("debtToEquity", "N/A"),
            "Return on Equity (ROE)": info.get("returnOnEquity", "N/A"),
            "Profit Margin": info.get("profitMargins", "N/A"),
            "EPS": info.get("trailingEps", "N/A"),
            "Dividend Yield": info.get("dividendYield", 0) * 100 if info.get("dividendYield") else 0.0
        }
        
        summary_str = json.dumps(summary, indent=2)
        prompt = FUNDAMENTAL_ANALYST_PROMPT.format(ticker=self.ticker, fundamental_summary=summary_str)
        return call_gemini(prompt)

    def run_news_sentiment_analyst(self) -> str:
        """
        Runs News and Sentiment Analyst Agent.
        """
        news = []
        try:
            news = self.yf_ticker.news
        except Exception as e:
            logger.warning(f"Could not load news for {self.ticker}: {str(e)}")
            
        news_items = []
        for item in news[:8]:  # Limit to top 8 news headlines
            content = item.get("content", {})
            title = content.get("title") or item.get("title") or "N/A"
            
            publisher = ""
            if content.get("provider") and isinstance(content["provider"], dict):
                publisher = content["provider"].get("displayName", "")
            if not publisher:
                publisher = item.get("publisher") or "N/A"
                
            summary = content.get("summary") or content.get("description") or item.get("summary") or "N/A"
            
            news_items.append(f"- Title: {title}\n  Publisher: {publisher}\n  Summary: {summary}")
            
        news_summary = "\n".join(news_items) if news_items else "No recent news headlines available for this stock."
        
        prompt = NEWS_SENTIMENT_PROMPT.format(ticker=self.ticker, news_summary=news_summary)
        return call_gemini(prompt)

    def run_personal_finance_advisor(self) -> str:
        """
        Runs Personal Finance Advisor Agent.
        """
        # Determine latest price for calculations
        latest_price = 1000.0  # default fallback
        if not self.historical_data.empty:
            latest_price = float(self.historical_data.iloc[-1]["Close"])
        elif self.latest_info.get("currentPrice"):
            latest_price = float(self.latest_info["currentPrice"])
            
        # 1. Calculate a standard SIP of 10,000 INR per month for 5 years
        sip_res = calculate_sip(monthly_investment=10000.0, expected_return_rate=0.12, years=5)
        sip_summary = (
            f"SIP: Monthly ₹10,000 for 5 Years at 12% Expected Return.\n"
            f"- Total Invested: ₹{sip_res['total_invested']:,.2f}\n"
            f"- Estimated Wealth Gain: ₹{sip_res['sip_wealth_gain']:,.2f}\n"
            f"- SIP Expected Future Value: ₹{sip_res['sip_future_value']:,.2f}\n"
            f"Lumpsum Alternative:\n"
            f"- Expected Future Value: ₹{sip_res['lumpsum_future_value']:,.2f}"
        )
        
        # 2. Calculate tax implications on a hypothetical trade of buy 100 shares and sell after 6 vs 18 months
        stcg = calculate_capital_gains_tax(buy_value=latest_price * 100, sell_value=latest_price * 1.2 * 100, holding_period_months=6)
        ltcg = calculate_capital_gains_tax(buy_value=latest_price * 100, sell_value=latest_price * 1.2 * 100, holding_period_months=18)
        
        tax_summary = (
            f"Short Term Capital Gains (STCG) (Held for 6 Months):\n"
            f"- Purchase: ₹{stcg['buy_value']:,.2f}, Sale: ₹{stcg['sell_value']:,.2f}\n"
            f"- Gain: ₹{stcg['capital_gain']:,.2f}\n"
            f"- Tax Payable (20%): ₹{stcg['tax_payable']:,.2f}\n"
            f"- Net Profit: ₹{stcg['net_gain']:,.2f}\n\n"
            f"Long Term Capital Gains (LTCG) (Held for 18 Months):\n"
            f"- Purchase: ₹{ltcg['buy_value']:,.2f}, Sale: ₹{ltcg['sell_value']:,.2f}\n"
            f"- Gain: ₹{ltcg['capital_gain']:,.2f}\n"
            f"- Tax Payable (12.5% after ₹1.25L Exemption): ₹{ltcg['tax_payable']:,.2f}\n"
            f"- Net Profit: ₹{ltcg['net_gain']:,.2f}"
        )
        
        prompt = PERSONAL_FINANCE_PROMPT.format(ticker=self.ticker, sip_summary=sip_summary, tax_summary=tax_summary)
        return call_gemini(prompt)

    def run_consolidator(
        self, 
        tech_report: str, 
        fund_report: str, 
        sent_report: str, 
        pf_report: str
    ) -> str:
        """
        Runs Research Specialist Agent to merge all reports.
        """
        prompt = RESEARCH_SPECIALIST_PROMPT.format(
            ticker=self.ticker,
            technical_report=tech_report,
            fundamental_report=fund_report,
            sentiment_report=sent_report,
            personal_finance_report=pf_report
        )
        return call_gemini(prompt)

def conduct_full_research(ticker: str) -> Dict[str, str]:
    """
    Helper to run full agentic loop step-by-step.
    """
    logger.info(f"Initiating full research workflow for {ticker}...")
    team = StockResearchTeam(ticker)
    team.load_data()
    
    # Run each agent individually
    tech_report = team.run_technical_analyst()
    fund_report = team.run_fundamental_analyst()
    sent_report = team.run_news_sentiment_analyst()
    pf_report = team.run_personal_finance_advisor()
    
    # Consolidate
    master_report = team.run_consolidator(tech_report, fund_report, sent_report, pf_report)
    
    return {
        "technical": tech_report,
        "fundamental": fund_report,
        "sentiment": sent_report,
        "personal_finance": pf_report,
        "master_report": master_report
    }

if __name__ == "__main__":
    import dotenv
    dotenv.load_dotenv()
    print("Testing StockResearchTeam...")
    results = conduct_full_research("RELIANCE.NS")
    print("\n--- MASTER REPORT SUMMARY ---")
    try:
        print(results["master_report"][:500])
    except UnicodeEncodeError:
        print(results["master_report"][:500].encode("ascii", errors="replace").decode("ascii"))
