import math

# Cumulative distribution function of the standard normal distribution
def norm_cdf(x: float) -> float:
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

# Probability density function of the standard normal distribution
def norm_pdf(x: float) -> float:
    return math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)

# Black-Scholes-Merton pricing model
def black_scholes_price(S: float, K: float, T: float, r: float, sigma: float, option_type: str = "CALL") -> float:
    if S <= 0 or K <= 0 or T <= 0 or sigma <= 0:
        return 0.0
    
    d1 = (math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    
    if option_type.upper() == "CALL":
        price = S * norm_cdf(d1) - K * math.exp(-r * T) * norm_cdf(d2)
    else:
        price = K * math.exp(-r * T) * norm_cdf(-d2) - S * norm_cdf(-d1)
        
    return max(0.01, price)

# Options Greeks calculator
def calculate_greeks(S: float, K: float, T: float, r: float, sigma: float, option_type: str = "CALL") -> dict:
    if S <= 0 or K <= 0 or T <= 0 or sigma <= 0:
        return {"delta": 0.0, "gamma": 0.0, "theta": 0.0, "vega": 0.0, "rho": 0.0}
    
    d1 = (math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    
    # Delta
    if option_type.upper() == "CALL":
        delta = norm_cdf(d1)
    else:
        delta = norm_cdf(d1) - 1.0
        
    # Gamma
    gamma = norm_pdf(d1) / (S * sigma * math.sqrt(T))
    
    # Vega (divided by 100 to show price change per 1% change in IV)
    vega = S * math.sqrt(T) * norm_pdf(d1) / 100.0
    
    # Theta (divided by 365 to show daily decay rate)
    term1 = -(S * norm_pdf(d1) * sigma) / (2.0 * math.sqrt(T))
    if option_type.upper() == "CALL":
        term2 = -r * K * math.exp(-r * T) * norm_cdf(d2)
        theta = (term1 + term2) / 365.0
    else:
        term2 = r * K * math.exp(-r * T) * norm_cdf(-d2)
        theta = (term1 + term2) / 365.0
        
    # Rho (divided by 100 to show price change per 1% change in rate)
    if option_type.upper() == "CALL":
        rho = K * T * math.exp(-r * T) * norm_cdf(d2) / 100.0
    else:
        rho = -K * T * math.exp(-r * T) * norm_cdf(-d2) / 100.0
        
    return {
        "delta": round(delta, 4),
        "gamma": round(gamma, 6),
        "theta": round(theta, 4),
        "vega": round(vega, 4),
        "rho": round(rho, 4)
    }

# Implied Volatility Solver (Newton-Raphson method)
def solve_implied_volatility(market_price: float, S: float, K: float, T: float, r: float, option_type: str = "CALL") -> float:
    # Initial guess (standard assumption)
    sigma = 0.25
    max_iterations = 100
    precision = 1.0e-5
    
    for i in range(max_iterations):
        price = black_scholes_price(S, K, T, r, sigma, option_type)
        diff = market_price - price
        
        if abs(diff) < precision:
            return round(sigma, 4)
            
        greeks = calculate_greeks(S, K, T, r, sigma, option_type)
        vega = greeks["vega"] * 100.0  # Convert back to unscaled vega for Newton-Raphson
        
        # Avoid division by zero
        if abs(vega) < 1.0e-6:
            # Fall back to bisection/grid search if vega is too small
            break
            
        sigma = sigma + diff / vega
        
        # Keep volatility bounded
        if sigma <= 0.01:
            sigma = 0.01
        elif sigma > 3.0:
            sigma = 3.0
            
    return round(sigma, 4)
