import json
import logging
import os
import pandas as pd
import dotenv
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import joblib

# Load environment variables
dotenv.load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load ML model
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "stock_prediction_model.pkl")
ml_model = None
if os.path.exists(MODEL_PATH):
    try:
        ml_model = joblib.load(MODEL_PATH)
        logger.info("Successfully loaded ML prediction model using joblib.")
    except Exception as e:
        logger.error(f"Failed to load ML prediction model: {str(e)}")
else:
    logger.warning(f"ML prediction model not found at {MODEL_PATH}")

class ReportGenerateRequest(BaseModel):
    ticker: str
    tech_text: str
    fund_text: str
    sent_text: str
    pf_text: str
    master_text: str

# Import Database & Core Modules
from backend.db.session import get_db, SessionLocal
from backend.db.models import init_db, StockCache, Watchlist, Expense, OptimizedPortfolio, StockInfoCache, StockHistoryCache
from backend.data.fetcher import fetch_stock_data, DEFAULT_TICKERS
from backend.data.indicators import calculate_technical_indicators
from backend.data.optimizer import optimize_portfolio
from backend.utils.calculators import calculate_sip, calculate_capital_gains_tax
from backend.utils.pdf_report import generate_pdf_report
from backend.agents.graph import run_agent_graph_stream

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI App
app = FastAPI(
    title="ArthaMind AI API",
    description="Multi-Agent AI Financial Research Assistant for Indian Stock Markets",
    version="1.0.0"
)

# CORS middleware configuration for Next.js frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auto Initialize DB tables on startup
@app.on_event("startup")
def startup_event():
    logger.info("Initializing database tables on startup...")
    init_db()
    
    # Clean up any corrupted (0-price) cached records
    try:
        db = SessionLocal()
        logger.info("Cleaning up corrupted stock info cache records...")
        records = db.query(StockInfoCache).all()
        cleaned_count = 0
        for r in records:
            try:
                info = json.loads(r.info_json)
                if info.get("currentPrice", 0.0) <= 0.0 or info.get("open", 0.0) <= 0.0:
                    db.delete(r)
                    cleaned_count += 1
            except Exception:
                db.delete(r)
                cleaned_count += 1
        if cleaned_count > 0:
            db.commit()
            logger.info(f"Deleted {cleaned_count} corrupted cache records.")
        else:
            logger.info("No corrupted cache records found.")
        db.close()
    except Exception as e:
        logger.error(f"Error cleaning up cache on startup: {e}")

    # Pre-warm cache for default tickers in a background thread so they load fast on first use
    import threading
    def prewarm_cache():
        try:
            logger.info("Pre-warming stock info cache for default tickers...")
            db = SessionLocal()
            for ticker in DEFAULT_TICKERS:
                try:
                    result = get_cached_stock_info(ticker, db)
                    if result.get("currentPrice", 0) > 0:
                        logger.info(f"Pre-warmed cache for {ticker}: price={result['currentPrice']}")
                    else:
                        logger.warning(f"Pre-warm returned 0 price for {ticker}")
                except Exception as e:
                    logger.error(f"Error pre-warming cache for {ticker}: {e}")
            db.close()
            logger.info("Cache pre-warming complete.")
        except Exception as e:
            logger.error(f"Error during cache pre-warming: {e}")
    thread = threading.Thread(target=prewarm_cache, daemon=True)
    thread.start()


@app.get("/")
def read_root():
    return {"message": "Welcome to the Automated Financial Research API", "status": "online"}

# ==================== STOCK ENDPOINTS ====================

@app.get("/api/stocks")
def get_stocks(db: Session = Depends(get_db)):
    """
    Returns the supported tickers list combined with the user's watchlist.
    """
    watchlist_items = db.query(Watchlist).all()
    user_tickers = [item.ticker for item in watchlist_items]
    
    # Merge default Nifty 50 list and user custom tickers
    all_tickers = sorted(list(set(DEFAULT_TICKERS + user_tickers)))
    return {"tickers": all_tickers}

@app.get("/api/stocks/search")
def search_stocks(q: str = Query(..., min_length=1)):
    """
    Queries Yahoo Finance Search API to find matching Indian stock symbols (.NS or .BO).
    """
    query = q.strip().upper()
    if not query:
        return {"results": []}
        
    try:
        from backend.data.fetcher import get_robust_session
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&newsCount=0"
        session = get_robust_session()
        response = session.get(url, timeout=5)
        
        if response.status_code != 200:
            logger.warning(f"Yahoo Search API returned status {response.status_code}")
            return {"results": []}
            
        data = response.json()
        quotes = data.get("quotes", [])
        
        results = []
        for quote in quotes:
            symbol = quote.get("symbol", "")
            if symbol:
                results.append({
                    "symbol": symbol,
                    "name": quote.get("longname") or quote.get("shortname") or symbol,
                    "exchange": quote.get("exchange", ""),
                    "sector": quote.get("sector", "Unknown"),
                    "industry": quote.get("industry", "Unknown")
                })
        return {"results": results[:8]}
    except Exception as e:
        logger.error(f"Error searching stocks for query '{query}': {str(e)}")
        return {"results": []}

@app.post("/api/watchlist/add")
def add_to_watchlist(ticker: str, db: Session = Depends(get_db)):
    """
    Adds a custom ticker to the watchlist (e.g. TATASTEEL.NS)
    """
    ticker = ticker.strip().upper()
    existing = db.query(Watchlist).filter(Watchlist.ticker == ticker).first()
    if existing:
        return {"message": f"{ticker} is already in the watchlist."}
    
    # Verify the ticker works with yfinance by fetching 1 day
    try:
        test_df = fetch_stock_data(ticker, period="1d")
        if test_df.empty:
            raise HTTPException(status_code=400, detail=f"Ticker {ticker} not found or has no price data.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to verify ticker {ticker}: {str(e)}")
        
    try:
        db_item = Watchlist(ticker=ticker)
        db.add(db_item)
        db.commit()
    except Exception as e:
        db.rollback()
        return {"message": f"{ticker} is already in the watchlist."}
    
    return {"message": f"Successfully added {ticker} to watchlist."}

@app.delete("/api/watchlist/remove")
def remove_from_watchlist(ticker: str, db: Session = Depends(get_db)):
    """
    Removes a custom ticker from the watchlist.
    """
    ticker = ticker.strip().upper()
    db_item = db.query(Watchlist).filter(Watchlist.ticker == ticker).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Ticker not found in watchlist.")
        
    db.delete(db_item)
    db.commit()
    return {"message": f"Removed {ticker} from watchlist."}

@app.get("/api/stock/{ticker}/history")
def get_stock_history(ticker: str, period: str = "1y", db: Session = Depends(get_db)):
    """
    Fetches historical stock prices and computes technical indicators for rendering charts.
    Caches results in SQLite to prevent yfinance rate limits.
    """
    ticker = ticker.strip().upper()
    period = period.strip().lower()
    
    # Try fetching from DB cache first (valid if last updated is less than 12 hours ago)
    cache_record = db.query(StockHistoryCache).filter(
        StockHistoryCache.ticker == ticker,
        StockHistoryCache.period == period
    ).first()
    
    is_stale = True
    age_seconds = 999999.0
    if cache_record:
        try:
            last_updated_dt = datetime.strptime(cache_record.last_updated, "%Y-%m-%d %H:%M:%S")
            age_seconds = (datetime.now() - last_updated_dt).total_seconds()
            # 12 hours = 43200 seconds
            if age_seconds < 43200:
                is_stale = False
        except Exception as e:
            logger.warning(f"Error parsing history cache timestamp for {ticker} ({period}): {str(e)}")
            is_stale = True
            
    if not is_stale and cache_record:
        try:
            logger.info(f"Loading {ticker} ({period}) stock history from database cache (age: {age_seconds / 3600:.2f} hours).")
            data = json.loads(cache_record.history_json)
            return data
        except Exception as e:
            logger.error(f"Error parsing cached history JSON for {ticker} ({period}): {str(e)}")
            
    # If not cached or stale, download fresh data
    try:
        df = fetch_stock_data(ticker, period=period)
        if df.empty:
            raise Exception("No data returned from yfinance")
            
        # Process indicators
        indicators_df = calculate_technical_indicators(df)
        if indicators_df.empty:
            raise Exception("Calculated indicators DataFrame is empty")
            
        # Format Date column for JSON serializability
        if "Date" in indicators_df.columns:
            indicators_df["Date"] = indicators_df["Date"].apply(
                lambda x: x.strftime("%Y-%m-%d") if isinstance(x, datetime) or hasattr(x, "strftime") else str(x)
            )
            
        records = indicators_df.to_dict(orient="records")
        records_json_str = json.dumps(records)
        
        # Save to database cache
        try:
            if cache_record:
                cache_record.history_json = records_json_str
                cache_record.last_updated = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            else:
                new_cache = StockHistoryCache(
                    ticker=ticker,
                    period=period,
                    history_json=records_json_str,
                    last_updated=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                )
                db.add(new_cache)
            db.commit()
            logger.info(f"Successfully cached stock history for {ticker} ({period}).")
        except Exception as db_err:
            db.rollback()
            logger.error(f"Error saving stock history cache to DB: {str(db_err)}")
            
        return records
        
    except Exception as e:
        logger.error(f"Error fetching/calculating history for {ticker} ({period}): {str(e)}")
        # Fallback to stale cache if available
        if cache_record:
            try:
                logger.info(f"Serving stale cached stock history for {ticker} ({period}) as fallback after error.")
                return json.loads(cache_record.history_json)
            except Exception as parse_err:
                logger.error(f"Failed to parse stale history cache fallback: {str(parse_err)}")
                
        raise HTTPException(status_code=404, detail=f"No stock price history found for {ticker} ({period}) due to network or rate limiting.")

def get_ticker_name_from_search(ticker: str) -> Dict[str, str]:
    try:
        from backend.data.fetcher import get_robust_session
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={ticker}&newsCount=0"
        session = get_robust_session()
        response = session.get(url, timeout=3)
        if response.status_code == 200:
            data = response.json()
            quotes = data.get("quotes", [])
            for q in quotes:
                if q.get("symbol", "").upper() == ticker.upper():
                    return {
                        "name": q.get("longname") or q.get("shortname") or ticker,
                        "sector": q.get("sector") or "Unknown",
                        "industry": q.get("industry") or "Unknown"
                    }
    except Exception as e:
        logger.warning(f"Error resolving name from Yahoo Search for {ticker}: {e}")
    return {"name": ticker, "sector": "Unknown", "industry": "Unknown"}

def get_cached_stock_info(ticker: str, db: Session) -> Dict[str, Any]:
    ticker = ticker.strip().upper()
    
    # Check if there is a cached record
    cache_record = db.query(StockInfoCache).filter(StockInfoCache.ticker == ticker).first()
    
    is_stale = True
    age_seconds = 999999.0
    if cache_record:
        # Check cache age (12 hours)
        try:
            last_updated_dt = datetime.strptime(cache_record.last_updated, "%Y-%m-%d %H:%M:%S")
            age_seconds = (datetime.now() - last_updated_dt).total_seconds()
            # 12 hours = 43200 seconds
            if age_seconds < 43200:
                is_stale = False
        except Exception as e:
            logger.warning(f"Error parsing cache timestamp for {ticker}: {str(e)}")
            is_stale = True

    if not is_stale and cache_record:
        # Serve from cache
        try:
            info = json.loads(cache_record.info_json)
            news = json.loads(cache_record.news_json)
            info["news"] = news
            logger.info(f"Serving cached info for {ticker} (age: {age_seconds / 3600:.2f} hours)")
            return info
        except Exception as e:
            logger.error(f"Error parsing cached JSON for {ticker}: {str(e)}")
            # Fall back to fetching from yfinance if JSON parsing fails

    # If stale or missing, fetch from yfinance
    logger.info(f"Fetching fresh stock info for {ticker} from yfinance...")
    try:
        import yfinance as yf
        from backend.data.fetcher import get_robust_session
        session = get_robust_session()
        yf_ticker = yf.Ticker(ticker, session=session)
        
        # Try fetching .info with error handling to avoid breaking on rate limit / scraper block
        info = {}
        try:
            info = yf_ticker.info
            if not info or not isinstance(info, dict):
                info = {}
        except Exception as info_err:
            logger.warning(f"Could not load .info for {ticker}: {str(info_err)}")
            info = {}

        # Fetch fast_info as a highly reliable fallback for price/volume/marketcap
        fast_info = {}
        try:
            fi = yf_ticker.fast_info
            fast_info = {
                "currentPrice": fi.get("lastPrice"),
                "open": fi.get("open"),
                "close": fi.get("previousClose") or fi.get("regularMarketPreviousClose"),
                "high": fi.get("dayHigh"),
                "low": fi.get("dayLow"),
                "volume": fi.get("lastVolume") or fi.get("tenDayAverageVolume"),
                "marketCap": fi.get("marketCap"),
                "fiftyTwoWeekHigh": fi.get("yearHigh"),
                "fiftyTwoWeekLow": fi.get("yearLow"),
            }
        except Exception as fi_err:
            logger.warning(f"Could not load .fast_info for {ticker}: {str(fi_err)}")
        
        # Parse news
        raw_news = []
        try:
            raw_news = yf_ticker.news
        except Exception as e:
            logger.warning(f"Could not load news for {ticker}: {str(e)}")
            
        news_list = []
        if isinstance(raw_news, list):
            for item in raw_news[:5]:
                if not isinstance(item, dict):
                    continue
                content = item.get("content", {})
                title = content.get("title") or item.get("title") or ""
                
                publisher = ""
                if content.get("provider") and isinstance(content["provider"], dict):
                    publisher = content["provider"].get("displayName", "")
                if not publisher:
                    publisher = item.get("publisher") or ""
                    
                link = ""
                if content.get("clickThroughUrl") and isinstance(content["clickThroughUrl"], dict):
                    link = content["clickThroughUrl"].get("url", "")
                elif content.get("canonicalUrl") and isinstance(content["canonicalUrl"], dict):
                    link = content["canonicalUrl"].get("url", "")
                if not link:
                    link = item.get("link") or ""
                    
                pub_date = content.get("pubDate") or content.get("displayTime")
                time_val = 0
                if pub_date:
                    try:
                        clean_date = pub_date.replace("Z", "").split("+")[0]
                        dt = datetime.strptime(clean_date, "%Y-%m-%dT%H:%M:%S")
                        time_val = int(dt.timestamp())
                    except Exception:
                        pass
                if not time_val:
                    time_val = item.get("providerPublishTime") or 0
                    
                news_list.append({
                    "title": title,
                    "publisher": publisher,
                    "link": link,
                    "time": time_val
                })
            
        # Resolve current price using robust fallbacks (info first, then fast_info)
        current_price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("navPrice") or fast_info.get("currentPrice") or 0.0
        if current_price == 0.0:
            current_price = info.get("previousClose") or info.get("regularMarketPreviousClose") or fast_info.get("close") or 0.0
        if current_price == 0.0:
            try:
                hist_df = fetch_stock_data(ticker, period="1d")
                if not hist_df.empty:
                    current_price = float(hist_df.iloc[-1]["Close"])
            except Exception:
                pass

        # If name or metadata is missing, fallback to search API lookup
        search_details = {}
        if not info.get("longName") and not info.get("shortName"):
            search_details = get_ticker_name_from_search(ticker)

        name = info.get("longName") or info.get("shortName") or search_details.get("name") or ticker
        sector = info.get("sector") or search_details.get("sector") or "Unknown"
        industry = info.get("industry") or search_details.get("industry") or "Unknown"

        info_data = {
            "symbol": ticker,
            "name": name,
            "description": info.get("longBusinessSummary") or f"Business profile details for {name} ({ticker}).",
            "open": info.get("open") or info.get("regularMarketOpen") or fast_info.get("open") or current_price,
            "close": info.get("previousClose") or info.get("regularMarketPreviousClose") or fast_info.get("close") or current_price,
            "high": info.get("dayHigh") or info.get("regularMarketDayHigh") or fast_info.get("high") or current_price,
            "low": info.get("dayLow") or info.get("regularMarketDayLow") or fast_info.get("low") or current_price,
            "volume": info.get("volume") or info.get("regularMarketVolume") or fast_info.get("volume") or 0,
            "marketCap": info.get("marketCap") or fast_info.get("marketCap") or 0,
            "peRatio": info.get("trailingPE") or info.get("forwardPE") or 0.0,
            "eps": info.get("trailingEps") or 0.0,
            "dividendYield": info.get("dividendYield") or 0.0,
            "roe": info.get("returnOnEquity") or 0.0,
            "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh") or fast_info.get("fiftyTwoWeekHigh") or current_price,
            "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow") or fast_info.get("fiftyTwoWeekLow") or current_price,
            "sector": sector,
            "industry": industry,
            "website": info.get("website") or "",
            "currentPrice": current_price,
        }
        
        # Save to DB cache ONLY if we got a valid price (currentPrice > 0.0)
        if current_price > 0.0:
            try:
                # Prepare data to save (exclude news list from info_json)
                info_json_str = json.dumps(info_data)
                news_json_str = json.dumps(news_list)
                
                if cache_record:
                    cache_record.info_json = info_json_str
                    cache_record.news_json = news_json_str
                    cache_record.last_updated = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                else:
                    new_cache = StockInfoCache(
                        ticker=ticker,
                        info_json=info_json_str,
                        news_json=news_json_str,
                        last_updated=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    )
                    db.add(new_cache)
                db.commit()
                logger.info(f"Successfully cached stock info for {ticker}.")
            except Exception as db_err:
                db.rollback()
                logger.error(f"Error saving stock info cache to DB for {ticker}: {str(db_err)}")
        else:
            logger.warning(f"Did not cache stock info for {ticker} because resolved currentPrice was 0.0.")
            
        # Add news back to return dictionary
        info_data["news"] = news_list
        return info_data

    except Exception as e:
        logger.exception(f"Error fetching info for {ticker} from yfinance: {str(e)}")
        # Stale cache fallback: If cache_record exists (even if stale), return it on error
        if cache_record:
            try:
                info = json.loads(cache_record.info_json)
                news = json.loads(cache_record.news_json)
                info["news"] = news
                logger.info(f"Serving stale cached info for {ticker} as fallback after error.")
                return info
            except Exception as parse_err:
                logger.error(f"Failed to parse stale cache fallback for {ticker}: {str(parse_err)}")
                
        # Return fallback structure
        return {
            "symbol": ticker,
            "name": ticker,
            "description": f"No online details available for {ticker}. Please check connection or ticker symbol.",
            "open": 0.0, "close": 0.0, "high": 0.0, "low": 0.0, "volume": 0, "marketCap": 0,
            "peRatio": 0.0, "eps": 0.0, "dividendYield": 0.0, "roe": 0.0,
            "fiftyTwoWeekHigh": 0.0, "fiftyTwoWeekLow": 0.0, "sector": "Unknown", "industry": "Unknown",
            "website": "", "currentPrice": 0.0, "news": []
        }

@app.get("/api/stock/{ticker}/info")
def get_stock_info(ticker: str, db: Session = Depends(get_db)):
    """
    Fetches real-time stock details, business summary, financial metrics, and recent news.
    Caches results in SQLite to prevent yfinance rate limits.
    """
    return get_cached_stock_info(ticker, db)

@app.get("/api/stock/{ticker}/recommendation")
def get_stock_recommendation(ticker: str, db: Session = Depends(get_db)):
    """
    Combines technical indicators, news sentiment, and the Random Forest ML model
    to generate buy/sell/hold recommendations and live next-day price forecasts.
    """
    ticker = ticker.strip().upper()
    cached_info = get_cached_stock_info(ticker, db)
    
    # Fetch historical stock price data (try cache first, then yfinance)
    cached_rows = db.query(StockCache).filter(StockCache.ticker == ticker).order_by(StockCache.date.asc()).all()
    
    if cached_rows and len(cached_rows) > 50:
        df = pd.DataFrame([{
            "Date": row.date,
            "Open": row.open,
            "High": row.high,
            "Low": row.low,
            "Close": row.close,
            "Volume": row.volume,
            "Stock": row.ticker
        } for row in cached_rows])
    else:
        df = fetch_stock_data(ticker, period="1y")
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No price history found for {ticker} to calculate signals.")
            
        # Clean MultiIndex columns if present
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
            
    # Calculate indicators
    indicators_df = calculate_technical_indicators(df)
    if indicators_df.empty:
        raise HTTPException(status_code=500, detail="Could not calculate indicators for recommendation.")
        
    latest_row = indicators_df.iloc[-1]
    current_price = float(latest_row["Close"])
    
    # 1. Machine Learning Next-Day Forecast (Random Forest Regressor)
    predicted_close = current_price
    ml_status = "Neutral"
    ml_score = 0
    ml_desc = "ML prediction model is not loaded."
    ml_change_pct = 0.0  # Initialize before conditional block
    
    if ml_model is not None:
        try:
            features_dict = {
                "Open": [float(latest_row["Open"])],
                "High": [float(latest_row["High"])],
                "Low": [float(latest_row["Low"])],
                "Volume": [float(latest_row["Volume"])],
                "MA_10": [float(latest_row["MA_10"])],
                "MA_50": [float(latest_row["MA_50"])],
                "Daily_Return": [float(latest_row["Daily_Return"])],
                "Volatility": [float(latest_row["Volatility"])],
                "Price_Range": [float(latest_row["Price_Range"])],
                "Open_Close_Diff": [float(latest_row["Open_Close_Diff"])]
            }
            X_pred = pd.DataFrame(features_dict)
            raw_predicted = float(ml_model.predict(X_pred)[0])
            ml_change_pct = ((raw_predicted - current_price) / current_price) * 100
            
            # Sanity check: The ML model is trained on Indian NSE stocks with prices in INR (₹).
            # For global assets with very different price scales, the prediction may be nonsensical.
            # If the predicted change is beyond ±12%, it's likely an out-of-distribution prediction.
            # In that case, use the daily return trend as a better proxy.
            if abs(ml_change_pct) > 12.0:
                # Use today's daily return as a proxy instead of the raw ML prediction
                daily_ret = float(latest_row["Daily_Return"]) * 100
                ml_desc = f"ML model prediction for {ticker} is out-of-range ({ml_change_pct:+.1f}%). Using today's momentum instead."
                predicted_close = current_price * (1 + daily_ret / 100)
                ml_change_pct = daily_ret
            else:
                predicted_close = raw_predicted
            
            if ml_change_pct > 1.5:
                ml_status = "Bullish"
                ml_score = 2
                ml_desc = f"ML Regressor estimates positive next-day target ({ml_change_pct:+.2f}%)."
            elif ml_change_pct > 0.2:
                ml_status = "Bullish"
                ml_score = 1
                ml_desc = f"ML Regressor estimates mild positive next-day target ({ml_change_pct:+.2f}%)."
            elif ml_change_pct < -1.5:
                ml_status = "Bearish"
                ml_score = -2
                ml_desc = f"ML Regressor estimates negative next-day target ({ml_change_pct:.2f}%)."
            elif ml_change_pct < -0.2:
                ml_status = "Bearish"
                ml_score = -1
                ml_desc = f"ML Regressor estimates mild negative next-day target ({ml_change_pct:.2f}%)."
            else:
                ml_status = "Neutral"
                ml_score = 0
                ml_desc = f"ML Regressor estimates stable next-day price ({ml_change_pct:+.2f}%)."
        except Exception as e:
            logger.error(f"Error predicting next close for {ticker}: {str(e)}")
            ml_desc = f"ML model unavailable for {ticker}: {str(e)}"
            
    # 2. RSI Indicator
    rsi_val = float(latest_row["RSI_14"])
    rsi_status = "Neutral"
    rsi_score = 0
    if rsi_val < 30:
        rsi_status = "Bullish"
        rsi_score = 2
        rsi_desc = f"RSI is oversold at {rsi_val:.1f}, indicating a strong bullish reversal signal."
    elif rsi_val < 45:
        rsi_status = "Bullish"
        rsi_score = 1
        rsi_desc = f"RSI is moderately low at {rsi_val:.1f}, favoring bullish accumulation."
    elif rsi_val > 70:
        rsi_status = "Bearish"
        rsi_score = -2
        rsi_desc = f"RSI is overbought at {rsi_val:.1f}, indicating high correction risk."
    elif rsi_val > 55:
        rsi_status = "Bearish"
        rsi_score = -1
        rsi_desc = f"RSI is moderately high at {rsi_val:.1f}, indicating momentum cooling."
    else:
        rsi_desc = f"RSI is stable at {rsi_val:.1f}, indicating neutral price range consolidation."
        
    # 3. Simple Moving Averages
    ma10 = float(latest_row["MA_10"])
    ma50 = float(latest_row["MA_50"])
    ma_status = "Neutral"
    ma_score = 0
    # When MA values are filled with Close (short period / insufficient data), they equal current_price.
    # In that case, treat as neutral to avoid false bearish signals.
    ma_is_valid = abs(ma10 - current_price) > 0.001 or abs(ma50 - current_price) > 0.001
    if not ma_is_valid:
        ma_desc = "Moving averages unavailable (insufficient history for SMA calculation). Signal is neutral."
    elif current_price > ma10 > ma50:
        ma_status = "Bullish"
        ma_score = 2
        ma_desc = f"Strong bullish trend: price ({current_price:.2f}) above 10-day SMA ({ma10:.2f}) and 50-day SMA ({ma50:.2f})."
    elif current_price < ma10 < ma50:
        ma_status = "Bearish"
        ma_score = -2
        ma_desc = f"Strong bearish trend: price ({current_price:.2f}) below 10-day SMA ({ma10:.2f}) and 50-day SMA ({ma50:.2f})."
    elif abs(current_price - ma10) / (current_price or 1) < 0.001:
        ma_status = "Neutral"
        ma_score = 0
        ma_desc = f"Price ({current_price:.2f}) is consolidating close to the 10-day SMA ({ma10:.2f})."
    elif current_price > ma10:
        ma_status = "Bullish"
        ma_score = 1
        ma_desc = f"Short-term bullish breakout. Price ({current_price:.2f}) is above the 10-day SMA ({ma10:.2f})."
    else:
        ma_status = "Bearish"
        ma_score = -1
        ma_desc = f"Short-term bearish pressure. Price ({current_price:.2f}) is below the 10-day SMA ({ma10:.2f})."
        
    # 4. MACD Oscillator
    macd_line = float(latest_row["MACD_Line"])
    macd_signal = float(latest_row["MACD_Signal"])
    macd_status = "Neutral"
    macd_score = 0
    # When both MACD values are 0 (fillna default from insufficient data), treat as neutral.
    macd_is_valid = abs(macd_line) > 1e-6 or abs(macd_signal) > 1e-6
    if not macd_is_valid:
        macd_desc = "MACD unavailable (insufficient price history). Signal is neutral."
    elif abs(macd_line - macd_signal) < 1e-4:
        macd_status = "Neutral"
        macd_score = 0
        macd_desc = f"MACD line ({macd_line:.4f}) is inline with signal line ({macd_signal:.4f}), indicating flat momentum."
    elif macd_line > macd_signal:
        macd_status = "Bullish"
        macd_score = 1
        macd_desc = f"MACD line ({macd_line:.4f}) is above signal line ({macd_signal:.4f}), showing bullish momentum."
    else:
        macd_status = "Bearish"
        macd_score = -1
        macd_desc = f"MACD line ({macd_line:.4f}) is below signal line ({macd_signal:.4f}), showing bearish momentum."
        
    # 5. News Headline Sentiment Polarity
    news_sentiment_score = 0.0
    sentiment_status = "Neutral"
    sentiment_score = 0
    sentiment_desc = "No news sentiment data available."
    
    try:
        news = cached_info.get("news", [])
        
        pos_words = {"grow", "rise", "surge", "gain", "buy", "bull", "profit", "positive", "up", "deal", "expand", "record", "beat", "win", "high"}
        neg_words = {"fall", "drop", "plunge", "lose", "sell", "bear", "loss", "negative", "down", "debt", "slump", "fail", "miss", "lower", "cut"}
        
        score_sum = 0
        headline_count = 0
        
        for item in news[:5]:
            title = item.get("title", "").lower()
            headline_count += 1
            words = set(title.split())
            pos_matches = len(words.intersection(pos_words))
            neg_matches = len(words.intersection(neg_words))
            score_sum += (pos_matches - neg_matches)
            
        if headline_count > 0:
            news_sentiment_score = score_sum / headline_count
            
        if news_sentiment_score > 0.15:
            sentiment_status = "Bullish"
            sentiment_score = 1
            sentiment_desc = f"Market news sentiment is positive (+{news_sentiment_score:.2f}) based on headline keyword polarity."
        elif news_sentiment_score < -0.15:
            sentiment_status = "Bearish"
            sentiment_score = -1
            sentiment_desc = f"Market news sentiment is negative ({news_sentiment_score:.2f}) based on headline keyword polarity."
        else:
            sentiment_desc = f"Market news sentiment is neutral ({news_sentiment_score:.2f}) with mixed headlines."
    except Exception as e:
        logger.warning(f"Could not calculate news sentiment for {ticker}: {str(e)}")
        sentiment_desc = "Failed to evaluate news headline sentiment."
        
    # 6. Fundamental P/E Valuation Multiples
    pe_val = None
    pe_status = "Neutral"
    pe_score = 0
    pe_desc = "P/E ratio information is not available for this asset."
    try:
        raw_pe = cached_info.get("peRatio")
        if raw_pe and raw_pe > 0.0:
            pe_val = float(raw_pe)
            if pe_val < 15:
                pe_status = "Bullish"
                pe_score = 1
                pe_desc = f"Trading at a low P/E of {pe_val:.1f}, indicating potential value buy."
            elif pe_val > 50:
                pe_status = "Bearish"
                pe_score = -1
                pe_desc = f"Trading at a high P/E of {pe_val:.1f}, indicating possible overvaluation."
            else:
                pe_desc = f"Trading at a moderate P/E of {pe_val:.1f}, inline with market averages."
    except Exception:
        pass

    # 7. ROE (Return on Equity) Signal
    roe_val = cached_info.get("roe") or 0.0
    roe_status = "Neutral"
    roe_score = 0
    roe_desc = "ROE data not available for this asset."
    try:
        if roe_val and roe_val != 0.0:
            roe_pct = float(roe_val) * 100
            if roe_pct > 20:
                roe_status = "Bullish"
                roe_score = 1
                roe_desc = f"Strong ROE of {roe_pct:.1f}% shows high profitability and efficient capital use."
            elif roe_pct > 10:
                roe_desc = f"Moderate ROE of {roe_pct:.1f}% — acceptable capital efficiency."
            elif roe_pct < 0:
                roe_status = "Bearish"
                roe_score = -1
                roe_desc = f"Negative ROE of {roe_pct:.1f}% signals net losses and financial weakness."
            else:
                roe_desc = f"Low ROE of {roe_pct:.1f}% suggests below-average capital efficiency."
    except Exception:
        pass
        
    # 8. Aggregate Buy/Sell/Hold Score
    total_score = rsi_score + ma_score + macd_score + ml_score + sentiment_score + pe_score + roe_score
    
    if total_score >= 4:
        recommendation = "STRONG BUY"
    elif total_score >= 2:
        recommendation = "BUY"
    elif total_score <= -4:
        recommendation = "STRONG SELL"
    elif total_score <= -2:
        recommendation = "SELL"
    else:
        recommendation = "HOLD"
        
    # Confidence (capped between 45% and 95%)
    max_score = 12.0  # Updated max after adding ROE signal
    confidence = int((abs(total_score) / max_score) * 100)
    confidence = max(45, min(95, confidence))
    
    signals = [
        {"name": "ML Price Forecast", "value": f"{ml_change_pct:+.2f}%" if ml_model else "N/A", "status": ml_status, "desc": ml_desc},
        {"name": "Relative Strength Index (RSI 14)", "value": f"{rsi_val:.1f}", "status": rsi_status, "desc": rsi_desc},
        {"name": "Simple Moving Averages (10/50 SMA)", "value": f"{ma10:.2f}", "status": ma_status, "desc": ma_desc},
        {"name": "MACD Oscillator", "value": f"{(macd_line-macd_signal):.4f}", "status": macd_status, "desc": macd_desc},
        {"name": "Headline News Sentiment", "value": f"Score: {news_sentiment_score:+.2f}" if news_sentiment_score else "N/A", "status": sentiment_status, "desc": sentiment_desc}
    ]
    if pe_val:
        signals.append({"name": "Valuation Multiples (P/E)", "value": f"{pe_val:.1f}x", "status": pe_status, "desc": pe_desc})
    if roe_val and roe_val != 0.0:
        signals.append({"name": "Return on Equity (ROE)", "value": f"{float(roe_val)*100:.1f}%", "status": roe_status, "desc": roe_desc})
        
    return {
        "symbol": ticker,
        "recommendation": recommendation,
        "confidence": confidence,
        "predicted_price": predicted_close,
        "predicted_change_pct": ((predicted_close - current_price) / current_price) * 100,
        "current_price": current_price,
        "signals": signals
    }

# ==================== PORTFOLIO OPTIMIZATION ====================

@app.post("/api/portfolio/optimize")
def post_optimize_portfolio(tickers: List[str], db: Session = Depends(get_db)):
    """
    Executes Modern Portfolio Theory (MPT) optimization on the list of tickers.
    """
    if len(tickers) < 2:
        raise HTTPException(status_code=400, detail="Optimization requires at least two stock tickers.")
        
    # Fetch historical data for all stocks
    all_data = []
    for ticker in tickers:
        df = fetch_stock_data(ticker, period="2y")
        if not df.empty:
            all_data.append(df)
            
    if not all_data:
        raise HTTPException(status_code=400, detail="Could not retrieve historical data for any selected tickers.")
        
    combined_df = pd.concat(all_data, ignore_index=True)
    
    try:
        results = optimize_portfolio(combined_df)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating portfolio optimization: {str(e)}")

@app.post("/api/portfolio/save")
def save_portfolio(name: str, tickers: List[str], weights: Dict[str, float], expected_return: float, volatility: float, sharpe_ratio: float, db: Session = Depends(get_db)):
    """
    Saves optimized portfolio allocations.
    """
    portfolio = OptimizedPortfolio(
        name=name,
        tickers=",".join(tickers),
        weights=json.dumps(weights),
        expected_return=expected_return,
        volatility=volatility,
        sharpe_ratio=sharpe_ratio
    )
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    return {"message": "Portfolio saved successfully.", "portfolio_id": portfolio.id}

@app.get("/api/portfolio/list")
def list_portfolios(db: Session = Depends(get_db)):
    """
    Lists saved portfolios.
    """
    portfolios = db.query(OptimizedPortfolio).all()
    results = []
    for p in portfolios:
        results.append({
            "id": p.id,
            "name": p.name,
            "created_at": p.created_at,
            "tickers": p.tickers.split(","),
            "weights": json.loads(p.weights),
            "expected_return": p.expected_return,
            "volatility": p.volatility,
            "sharpe_ratio": p.sharpe_ratio
        })
    return results

# ==================== PERSONAL FINANCE ====================

@app.post("/api/personal-finance/sip")
def post_calculate_sip(monthly_investment: float, expected_return: float, years: int):
    """
    Calculates monthly SIP growth vs Lumpsum alternative.
    """
    return calculate_sip(monthly_investment, expected_return / 100, years)

@app.post("/api/personal-finance/tax")
def post_calculate_tax(buy_value: float, sell_value: float, holding_period_months: int):
    """
    Calculates Capital Gains Tax (LTCG/STCG) for Indian equity assets.
    """
    return calculate_capital_gains_tax(buy_value, sell_value, holding_period_months)

@app.get("/api/personal-finance/expenses")
def get_expenses(db: Session = Depends(get_db)):
    """
    Returns saved transactions.
    """
    expenses = db.query(Expense).all()
    return expenses

@app.post("/api/personal-finance/expenses/add")
def add_expense(amount: float, category: str, type: str, description: str = "", db: Session = Depends(get_db)):
    """
    Adds income/expense items to the tracker database.
    """
    if type not in ["Income", "Expense"]:
        raise HTTPException(status_code=400, detail="Type must be either Income or Expense.")
    item = Expense(
        amount=amount,
        category=category,
        type=type,
        description=description
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"message": "Transaction added successfully.", "item": item}

@app.delete("/api/personal-finance/expenses/{item_id}")
def delete_expense(item_id: int, db: Session = Depends(get_db)):
    """
    Deletes transaction row.
    """
    item = db.query(Expense).filter(Expense.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Transaction item not found.")
    db.delete(item)
    db.commit()
    return {"message": "Transaction deleted successfully."}

# ==================== AGENT WORKFLOW & SSE STREAMING ====================

@app.get("/api/stock/{ticker}/research/stream")
def stream_research(ticker: str):
    """
    Server-Sent Events (SSE) streaming endpoint that runs the multi-agent graph
    and streams back log events and final outputs in real-time.
    """
    ticker = ticker.strip().upper()
    
    def event_generator():
        # Iterate over the graph state changes
        for event in run_agent_graph_stream(ticker):
            # yield matching EventSource syntax
            yield f"data: {json.dumps(event)}\n\n"
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

# ==================== PDF REPORT EXPORT ====================

@app.post("/api/report/generate")
def post_generate_report(req: ReportGenerateRequest):
    """
    Generates a PDF report dynamically and saves it locally. Returns filename.
    """
    ticker = req.ticker.strip().upper()
    try:
        filename = generate_pdf_report(
            ticker=ticker,
            tech_text=req.tech_text,
            fund_text=req.fund_text,
            sent_text=req.sent_text,
            pf_text=req.pf_text,
            master_text=req.master_text
        )
        return {"filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

@app.get("/api/report/download/{filename}")
def download_report(filename: str):
    """
    Downloads the compiled PDF file report.
    """
    # Sanitize the filename to prevent directory path traversal
    safe_filename = os.path.basename(filename)
    
    # Restrict file downloads to only PDF reports generated by the platform
    if not safe_filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Access denied. Only PDF reports can be downloaded.")
        
    if os.environ.get("VERCEL") or os.environ.get("NOW_REGION"):
        file_path = os.path.join("/tmp", safe_filename)
    else:
        file_path = os.path.abspath(safe_filename)
        
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF report file not found.")
        
    return FileResponse(file_path, media_type="application/pdf", filename=safe_filename)
