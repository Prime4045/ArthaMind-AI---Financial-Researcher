import yfinance as yf
import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Standard Nifty 50 Tickers for the application
DEFAULT_TICKERS = [
    "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS",
    "SBIN.NS", "ITC.NS", "LT.NS", "BAJFINANCE.NS", "HINDUNILVR.NS"
]

def get_robust_session() -> requests.Session:
    """
    Creates a requests session with custom headers and retry logic
    to prevent Yahoo Finance from blocking requests.
    """
    session = requests.Session()
    # Yahoo Finance requires a realistic user agent
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    })
    
    # Retry strategy for robust network calls
    retries = Retry(
        total=5,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
        raise_on_status=False
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

def _clean_fetched_df(df: pd.DataFrame, ticker: str) -> pd.DataFrame:
    df = df.copy()
    # Clean MultiIndex columns if present
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
        
    df = df.reset_index()
    
    # Rename Datetime to Date so downstream code can use it uniformly
    if "Datetime" in df.columns:
        df = df.rename(columns={"Datetime": "Date"})
        
    # Standardize column casing (ensure Open, High, Low, Close, Volume)
    rename_cols = {}
    for col in df.columns:
        if col.lower() in ["open", "high", "low", "close", "volume"]:
            cap_col = col.lower().capitalize()
            if col != cap_col:
                rename_cols[col] = cap_col
    if rename_cols:
        df = df.rename(columns=rename_cols)
        
    if "Close" in df.columns:
        df = df.dropna(subset=["Close"])
        
    df["Stock"] = ticker
    return df

def fetch_stock_data(ticker: str, period: str = "5y", interval: str = None) -> pd.DataFrame:
    """
    Downloads historical data for a ticker with custom session headers.
    """
    # Auto-select interval for short periods if not specified
    if interval is None:
        if period == "1d":
            interval = "5m"
        elif period == "5d":
            interval = "15m"
        else:
            interval = "1d"
            
    logger.info(f"Downloading data for {ticker} (Period: {period}, Interval: {interval})...")
    
    # Tier 1: yf.download with custom session headers
    try:
        session = get_robust_session()
        df = yf.download(ticker, period=period, interval=interval, session=session, progress=False, auto_adjust=True)
        if not df.empty:
            logger.info(f"Successfully downloaded via yf.download (session) for {ticker}.")
            return _clean_fetched_df(df, ticker)
    except Exception as e:
        logger.warning(f"yf.download (session) failed for {ticker}: {e}")
        
    # Tier 2: yf.Ticker.history with custom session headers
    try:
        session = get_robust_session()
        yt = yf.Ticker(ticker, session=session)
        df = yt.history(period=period, interval=interval)
        if not df.empty:
            logger.info(f"Successfully downloaded via yf.Ticker.history (session) for {ticker}.")
            return _clean_fetched_df(df, ticker)
    except Exception as e:
        logger.warning(f"yf.Ticker.history (session) failed for {ticker}: {e}")

    # Tier 3: yf.download with DEFAULT session (no headers)
    try:
        df = yf.download(ticker, period=period, interval=interval, progress=False, auto_adjust=True)
        if not df.empty:
            logger.info(f"Successfully downloaded via yf.download (default) for {ticker}.")
            return _clean_fetched_df(df, ticker)
    except Exception as e:
        logger.warning(f"yf.download (default) failed for {ticker}: {e}")

    # Tier 4: yf.Ticker.history with DEFAULT session (no headers)
    try:
        yt = yf.Ticker(ticker)
        df = yt.history(period=period, interval=interval)
        if not df.empty:
            logger.info(f"Successfully downloaded via yf.Ticker.history (default) for {ticker}.")
            return _clean_fetched_df(df, ticker)
    except Exception as e:
        logger.error(f"All yfinance fetching attempts failed for {ticker}: {e}")

    return pd.DataFrame()

def fetch_multiple_stocks(tickers: list = None, period: str = "5y") -> pd.DataFrame:
    """
    Downloads historical data for multiple tickers and combines them.
    """
    if tickers is None:
        tickers = DEFAULT_TICKERS
        
    all_data = []
    for ticker in tickers:
        df = fetch_stock_data(ticker, period=period)
        if not df.empty:
            all_data.append(df)
            
    if not all_data:
        logger.error("No data could be retrieved for any tickers.")
        return pd.DataFrame()
        
    combined_df = pd.concat(all_data, ignore_index=True)
    return combined_df

if __name__ == "__main__":
    # Quick test execution
    print("Testing robust fetcher...")
    test_df = fetch_stock_data("RELIANCE.NS", period="1mo")
    print(test_df.head())
