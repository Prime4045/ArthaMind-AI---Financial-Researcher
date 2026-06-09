import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any

def optimize_portfolio(
    price_df: pd.DataFrame, 
    num_portfolios: int = 2000, 
    risk_free_rate: float = 0.065, # 6.5% standard Indian RBI repo/risk-free rate
    ai_views: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Optimizes a portfolio of stocks using Modern Portfolio Theory (MPT).
    Assumes price_df contains columns 'Date', 'Close', 'Stock'
    """
    # Pivot dataframe to get wide format: Date index, Tickers as columns
    pivot_df = price_df.pivot_table(index="Date", columns="Stock", values="Close")
    
    # Calculate daily returns
    returns_df = pivot_df.pct_change().dropna()
    
    # Get tickers list
    tickers = list(returns_df.columns)
    num_assets = len(tickers)
    
    if num_assets < 2:
        raise ValueError("Portfolio optimization requires at least 2 tickers.")
        
    # Annualize returns (approx 252 trading days per year)
    mean_daily_returns = returns_df.mean()
    annual_returns = mean_daily_returns * 252
    
    # Apply Black-Litterman style expected return adjustments (tilting expected returns by AI views)
    if ai_views:
        for ticker, tilt in ai_views.items():
            if ticker in annual_returns:
                annual_returns[ticker] += tilt
    
    # Annualize covariance matrix
    cov_matrix = returns_df.cov() * 252
    
    # Arrays to store simulation details
    all_weights = np.zeros((num_portfolios, num_assets))
    ret_arr = np.zeros(num_portfolios)
    vol_arr = np.zeros(num_portfolios)
    sharpe_arr = np.zeros(num_portfolios)
    
    # Seed for reproducibility
    np.random.seed(42)
    
    for i in range(num_portfolios):
        # Generate random weights
        weights = np.random.random(num_assets)
        weights /= np.sum(weights)
        
        # Save weights
        all_weights[i, :] = weights
        
        # Portfolio Expected Return
        p_ret = np.sum(annual_returns * weights)
        ret_arr[i] = p_ret
        
        # Portfolio Expected Volatility
        p_vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
        vol_arr[i] = p_vol
        
        # Sharpe Ratio
        p_sharpe = (p_ret - risk_free_rate) / p_vol
        sharpe_arr[i] = p_sharpe
        
    # Locate indices for max Sharpe and min Volatility
    max_sharpe_idx = sharpe_arr.argmax()
    min_vol_idx = vol_arr.argmin()
    
    # Helper to construct result dictionary
    def get_portfolio_info(idx: int) -> Dict[str, Any]:
        return {
            "return": float(ret_arr[idx]),
            "volatility": float(vol_arr[idx]),
            "sharpe_ratio": float(sharpe_arr[idx]),
            "weights": {tickers[j]: float(all_weights[idx, j]) for j in range(num_assets)}
        }
        
    # Generate points for the Efficient Frontier scatter plot (sub-sampled to keep API payload small)
    step = max(1, num_portfolios // 200) # Keep ~200 points for visualization
    frontier_points = []
    for k in range(0, num_portfolios, step):
        frontier_points.append({
            "return": float(ret_arr[k]),
            "volatility": float(vol_arr[k]),
            "sharpe_ratio": float(sharpe_arr[k])
        })
        
    return {
        "tickers": tickers,
        "max_sharpe": get_portfolio_info(max_sharpe_idx),
        "min_volatility": get_portfolio_info(min_vol_idx),
        "frontier_points": frontier_points
    }

if __name__ == "__main__":
    print("Testing portfolio optimizer...")
    # Generate mock daily price paths for 3 stocks
    np.random.seed(42)
    dates = pd.date_range(start="2024-01-01", periods=100)
    
    stock_a = 100 * np.cumprod(1 + np.random.normal(0.001, 0.01, size=100))
    stock_b = 150 * np.cumprod(1 + np.random.normal(0.0015, 0.012, size=100))
    stock_c = 200 * np.cumprod(1 + np.random.normal(0.0005, 0.008, size=100))
    
    df_a = pd.DataFrame({"Date": dates, "Close": stock_a, "Stock": "A"})
    df_b = pd.DataFrame({"Date": dates, "Close": stock_b, "Stock": "B"})
    df_c = pd.DataFrame({"Date": dates, "Close": stock_c, "Stock": "C"})
    
    combined = pd.concat([df_a, df_b, df_c], ignore_index=True)
    
    results = optimize_portfolio(combined, num_portfolios=500)
    print("Max Sharpe portfolio weights:", results["max_sharpe"]["weights"])
    print("Min Volatility portfolio weights:", results["min_volatility"]["weights"])
