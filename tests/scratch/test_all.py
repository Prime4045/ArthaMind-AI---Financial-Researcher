import requests
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def test_history_period(ticker, period):
    url = f"http://127.0.0.1:8000/api/stock/{ticker}/history?period={period}"
    start = time.time()
    res = requests.get(url, timeout=10)
    dur = time.time() - start
    print(f"[{period}] Status: {res.status_code} | Duration: {dur:.4f}s")
    if res.status_code == 200:
        data = res.json()
        print(f"  Rows returned: {len(data)}")
        if len(data) > 0:
            last = data[-1]
            print(f"  Last Date: {last.get('Date')} | Close: Rs. {last.get('Close')}")
            print(f"  MA_10: {last.get('MA_10')} | MA_50: {last.get('MA_50')}")
    else:
        print("  Error:", res.text)

if __name__ == "__main__":
    print("=== Testing Stock History Caching and Indicator Calculations ===")
    
    # Test short periods that previously caused empty DataFrames due to dropna()
    test_history_period("TCS.NS", "1d")
    test_history_period("TCS.NS", "5d")
    test_history_period("TCS.NS", "1mo")
    
    # Test longer period to ensure caching works
    print("\nFirst Call for 1y (Cold):")
    test_history_period("TCS.NS", "1y")
    
    print("\nSecond Call for 1y (Hot - Cached):")
    test_history_period("TCS.NS", "1y")
