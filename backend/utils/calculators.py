from typing import Dict, Any

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
    
    # Formula: M = P * [ ((1 + i)^n - 1) / i ] * (1 + i)
    # where P is monthly investment, i is monthly rate, n is total months
    if i > 0:
        future_value = monthly_investment * (((1 + i)**n - 1) / i) * (1 + i)
    else:
        future_value = monthly_investment * n
        
    total_invested = monthly_investment * n
    wealth_gain = future_value - total_invested
    
    # Compare with a Lumpsum investment of the same total amount invested at day 1
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
        
    # Determine gain type (equity holding threshold is 12 months)
    if holding_period_months <= 12:
        gain_type = "STCG"
        tax_rate = 0.20  # 20%
        tax_payable = capital_gain * tax_rate
    else:
        gain_type = "LTCG"
        tax_rate = 0.125  # 12.5%
        # standard exemption is 1.25L (125,000 INR)
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
    print("Testing SIP calculator:")
    sip_res = calculate_sip(monthly_investment=10000, expected_return_rate=0.12, years=10)
    print(f"SIP future value: ₹{sip_res['sip_future_value']:,.2f}")
    
    print("\nTesting Capital Gains Tax calculator:")
    stcg_res = calculate_capital_gains_tax(buy_value=500000, sell_value=700000, holding_period_months=6)
    print(f"STCG Tax: ₹{stcg_res['tax_payable']:,.2f} on Gain: ₹{stcg_res['capital_gain']:,.2f}")
    
    ltcg_res = calculate_capital_gains_tax(buy_value=500000, sell_value=700000, holding_period_months=18)
    print(f"LTCG Tax: ₹{ltcg_res['tax_payable']:,.2f} on Gain: ₹{ltcg_res['capital_gain']:,.2f}")
