import requests
import json
import time
import sys

# Ensure UTF-8 output encoding for Windows command line print compatibility with unicode characters (like ₹)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def test_speed_and_integrity(ticker: str):
    print(f"=== Testing Caching and Data Integrity for {ticker} ===")
    
    # --- INFO ENDPOINT ---
    url_info = f"http://127.0.0.1:8000/api/stock/{ticker}/info"
    
    print("\n[INFO] Calling info endpoint (First Call)...")
    start = time.time()
    res1 = requests.get(url_info, timeout=20)
    dur1 = time.time() - start
    print(f"Status: {res1.status_code} | Duration: {dur1:.4f} seconds")
    
    if res1.status_code == 200:
        data1 = res1.json()
        print(f"Ticker: {data1.get('symbol')} | Name: {data1.get('name')}")
        print(f"Price: Rs. {data1.get('currentPrice')} | Sector: {data1.get('sector')}")
        print(f"Open: Rs. {data1.get('open')} | High: Rs. {data1.get('high')} | Low: Rs. {data1.get('low')}")
        print(f"PE Ratio: {data1.get('peRatio')} | EPS: {data1.get('eps')} | ROE: {data1.get('roe')}")
        print(f"News count: {len(data1.get('news', []))}")
        
    print("\n[INFO] Calling info endpoint (Second Call - Cached)...")
    start = time.time()
    res2 = requests.get(url_info, timeout=20)
    dur2 = time.time() - start
    print(f"Status: {res2.status_code} | Duration: {dur2:.4f} seconds")
    
    # --- RECOMMENDATION ENDPOINT ---
    url_rec = f"http://127.0.0.1:8000/api/stock/{ticker}/recommendation"
    
    print("\n[REC] Calling recommendation endpoint (First Call - should use cache for metadata)...")
    start = time.time()
    res_rec1 = requests.get(url_rec, timeout=20)
    dur_rec1 = time.time() - start
    print(f"Status: {res_rec1.status_code} | Duration: {dur_rec1:.4f} seconds")
    
    if res_rec1.status_code == 200:
        data_rec = res_rec1.json()
        print(f"Recommendation: {data_rec.get('recommendation')} (Confidence: {data_rec.get('confidence')}%)")
        print(f"Current Price: Rs. {data_rec.get('current_price')} | Predicted Price: Rs. {data_rec.get('predicted_price')}")
        print("Active Triggers:")
        for sig in data_rec.get('signals', []):
            print(f"  - {sig.get('name')}: {sig.get('value')} ({sig.get('status')}) -> {sig.get('desc')}")

if __name__ == "__main__":
    test_speed_and_integrity("RELIANCE.NS")
