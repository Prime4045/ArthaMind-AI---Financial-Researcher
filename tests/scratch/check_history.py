import yfinance as yf
import requests

def get_robust_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    })
    return session

def test_ticker(ticker):
    print(f"=== Testing {ticker} ===")
    session = get_robust_session()
    try:
        df = yf.download(ticker, period="1mo", session=session)
        print(f"yfinance download successful: {len(df)} rows downloaded.")
        if not df.empty:
            print("Columns:", df.columns)
            print(df.head(2))
    except Exception as e:
        print(f"Download failed: {str(e)}")

if __name__ == "__main__":
    test_ticker("TCS.NS")
    test_ticker("RELIANCE.NS")
