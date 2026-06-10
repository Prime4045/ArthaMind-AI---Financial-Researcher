import math
import numpy as np

def calculate_volatility_smile(spot_price: float, strikes: list, base_iv: float = 0.20) -> dict:
    """
    Generates a realistic Implied Volatility (IV) Smile curve.
    In real trading, out-of-the-money (OTM) options trade at higher IVs than at-the-money (ATM) options.
    """
    smile = {}
    for strike in strikes:
        # Distance from ATM
        pct_distance = (strike - spot_price) / spot_price
        # Quadratic volatility smile model: IV = base_iv + a * d^2 - b * d
        # Standard skew: skew puts (negative pct_distance) slightly higher than calls
        iv = base_iv + 0.35 * (pct_distance ** 2) - 0.08 * pct_distance
        smile[float(strike)] = round(max(0.05, iv), 4)
    return smile

def predict_iv_trend(ticker: str, base_iv: float = 0.22) -> dict:
    """
    Forecasts Implied Volatility daily projections over the next 5 trading days.
    """
    # Deterministic noise based on ticker hash to ensure consistent trend path per stock
    seed = sum(ord(c) for c in ticker) % 100
    np.random.seed(seed)
    
    steps = 5
    current_iv = base_iv
    forecast = []
    
    for day in range(1, steps + 1):
        # Mean reverting walk
        drift = 0.1 * (base_iv - current_iv)
        shock = float(np.random.normal(0, 0.015))
        current_iv += drift + shock
        forecast.append({
            "Day": f"T+{day}",
            "IV": round(current_iv * 100.0, 2)
        })
        
    return {
        "ticker": ticker,
        "current_iv_pct": round(base_iv * 100.0, 2),
        "forecast_5d": forecast,
        "regime": "Expanding" if current_iv > base_iv else "Contracting"
    }

def recommend_option_trade(spot_price: float, strike: float, iv: float, theoretical_price: float, option_type: str = "CALL") -> dict:
    """
    Classifies option contracts as Overpriced, Underpriced, or Fairly Valued,
    recommending BUY/SELL actions based on divergence from theoretical price.
    """
    market_price = theoretical_price
    # Add minor spread to simulate market price vs theoretical price
    seed = int(spot_price * strike) % 100
    np.random.seed(seed)
    spread = float(np.random.normal(0, 0.03)) * theoretical_price
    market_price += spread
    market_price = max(0.1, market_price)
    
    divergence = (market_price - theoretical_price) / theoretical_price
    
    if divergence < -0.05:
        action = "BUY"
        status = "Underpriced"
        confidence = min(0.95, 0.5 + abs(divergence) * 2)
    elif divergence > 0.05:
        action = "SELL"
        status = "Overpriced"
        confidence = min(0.95, 0.5 + abs(divergence) * 2)
    else:
        action = "HOLD"
        status = "Fair Value"
        confidence = 0.50
        
    return {
        "strike": strike,
        "option_type": option_type,
        "market_price": round(market_price, 2),
        "theoretical_price": round(theoretical_price, 2),
        "divergence_pct": round(divergence * 100.0, 2),
        "status": status,
        "action": action,
        "confidence": round(confidence * 100.0, 2)
    }
