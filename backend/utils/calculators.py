from typing import Dict, Any, List

def calculate_sip(
    monthly_investment: float, 
    expected_return_rate: float, 
    years: int
) -> Dict[str, Any]:
    """
    Calculates the accumulated value of a Systematic Investment Plan (SIP).
    - monthly_investment: Amount invested per month (INR)
    - expected_return_rate: Expected annual return rate (e.g., 0.12 for 12%)
    - years: Investment duration in years
    """
    n = years * 12  # total number of months
    i = expected_return_rate / 12  # monthly interest rate
    
    if i > 0:
        future_value = monthly_investment * (((1 + i)**n - 1) / i) * (1 + i)
    else:
        future_value = monthly_investment * n
        
    total_invested = monthly_investment * n
    wealth_gain = future_value - total_invested
    
    lumpsum_future_value = total_invested * ((1 + expected_return_rate) ** years)
    lumpsum_wealth_gain = lumpsum_future_value - total_invested
    
    return {
        "monthly_investment": monthly_investment,
        "expected_return_rate_pct": expected_return_rate * 100,
        "years": years,
        "total_invested": float(total_invested),
        "sip_future_value": float(future_value),
        "sip_wealth_gain": float(wealth_gain),
        "lumpsum_future_value": float(lumpsum_future_value),
        "lumpsum_wealth_gain": float(lumpsum_wealth_gain)
    }

def calculate_sip_enhanced(
    monthly_investment: float,
    expected_return_rate: float,
    years: int,
    step_up_pct: float = 0.0,
    inflation_rate: float = 0.0,
    mode: str = "investment",
    target_amount: float = 0.0
) -> Dict[str, Any]:
    """
    Advanced SIP calculator supporting:
    - Annual Step-up percentage
    - Inflation adjustment (purchasing power discount)
    - Goal-based calculations (target amount back-calculation)
    """
    monthly_rate = expected_return_rate / 12
    
    # Helper to calculate future value with P = 1.0 (to solve for P in goal mode)
    def run_compounding(initial_p: float) -> tuple:
        total_invested = 0.0
        future_value = 0.0
        current_sip = initial_p
        schedule = []
        
        for year in range(1, years + 1):
            yearly_invested = 0.0
            for month in range(12):
                future_value = (future_value + current_sip) * (1 + monthly_rate)
                yearly_invested += current_sip
                
            total_invested += yearly_invested
            schedule.append({
                "year": year,
                "monthly_sip": float(current_sip),
                "total_invested": float(total_invested),
                "future_value": float(future_value),
                "wealth_gain": float(future_value - total_invested)
            })
            current_sip = current_sip * (1 + step_up_pct / 100)
            
        return future_value, total_invested, schedule

    # If goal mode, solve for P
    if mode == "goal" and target_amount > 0:
        fv_for_one, _, _ = run_compounding(1.0)
        if fv_for_one > 0:
            resolved_p = target_amount / fv_for_one
        else:
            resolved_p = 0.0
        monthly_investment = resolved_p
    else:
        resolved_p = monthly_investment

    # Run actual compounding with resolved initial SIP
    future_value, total_invested, schedule = run_compounding(resolved_p)
    
    # Calculate inflation-adjusted purchasing power
    inflation_factor = (1 + inflation_rate / 100) ** years
    real_purchasing_power = future_value / inflation_factor if inflation_factor > 0 else future_value
    
    # Standard lumpsum comparison
    lumpsum_val = total_invested * ((1 + expected_return_rate) ** years)
    
    return {
        "monthly_investment": float(monthly_investment),
        "expected_return_rate_pct": expected_return_rate * 100,
        "years": years,
        "step_up_pct": step_up_pct,
        "inflation_rate": inflation_rate,
        "mode": mode,
        "target_amount": float(target_amount),
        "total_invested": float(total_invested),
        "future_value": float(future_value),
        "wealth_gain": float(future_value - total_invested),
        "real_purchasing_power": float(real_purchasing_power),
        "lumpsum_compare_value": float(lumpsum_val),
        "schedule": schedule
    }

def calculate_capital_gains_tax(
    buy_value: float,
    sell_value: float,
    holding_period_months: int
) -> Dict[str, Any]:
    """
    Estimates Short Term (STCG) vs Long Term (LTCG) Capital Gains tax for Indian equity.
    Based on Union Budget 2024 rules:
    - Holding period <= 12 months: STCG at 20%
    - Holding period > 12 months: LTCG at 12.5% (with standard 1.25L exemption overall, computed here per-transaction for simplicity)
    """
    capital_gain = sell_value - buy_value
    
    if capital_gain <= 0:
        return {
            "buy_value": buy_value,
            "sell_value": sell_value,
            "capital_gain": float(capital_gain),
            "holding_period_months": holding_period_months,
            "gain_type": "None",
            "tax_rate_pct": 0.0,
            "tax_payable": 0.0,
            "net_gain": float(capital_gain)
        }
        
    if holding_period_months <= 12:
        gain_type = "STCG"
        tax_rate = 0.20
        tax_payable = capital_gain * tax_rate
    else:
        gain_type = "LTCG"
        tax_rate = 0.125
        taxable_gain = max(0.0, capital_gain - 125000)
        tax_payable = taxable_gain * tax_rate
        
    net_gain = capital_gain - tax_payable
    
    return {
        "buy_value": buy_value,
        "sell_value": sell_value,
        "capital_gain": float(capital_gain),
        "holding_period_months": holding_period_months,
        "gain_type": gain_type,
        "tax_rate_pct": tax_rate * 100,
        "tax_payable": float(tax_payable),
        "net_gain": float(net_gain)
    }

if __name__ == "__main__":
    print("Testing Enhanced SIP calculator (Step-up and Goal planning):")
    res = calculate_sip_enhanced(monthly_investment=10000, expected_return_rate=0.12, years=10, step_up_pct=10, inflation_rate=6)
    print(f"SIP future value with 10% Step-up: INR {res['future_value']:,.2f}")
    print(f"Inflation-adjusted value: INR {res['real_purchasing_power']:,.2f}")
    
    goal_res = calculate_sip_enhanced(monthly_investment=0, expected_return_rate=0.12, years=15, step_up_pct=5, mode="goal", target_amount=10000000)
    print(f"Required initial SIP to reach INR 1 Crore in 15 years: INR {goal_res['monthly_investment']:,.2f}")
