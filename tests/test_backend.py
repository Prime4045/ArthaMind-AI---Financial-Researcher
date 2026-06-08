import os
import sys
import pandas as pd

# Add the workspace root to sys.path so we can import backend packages
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.data.fetcher import fetch_stock_data
from backend.data.indicators import calculate_technical_indicators
from backend.data.optimizer import optimize_portfolio
from backend.utils.calculators import calculate_sip, calculate_capital_gains_tax
from backend.utils.pdf_report import generate_pdf_report

def run_tests():
    print("==================================================")
    print("STARTING BACKEND QUANTITATIVE TESTS")
    print("==================================================")
    
    # 1. Test Fetcher
    print("\n[1/5] Testing robust yfinance data fetcher...")
    try:
        df = fetch_stock_data("RELIANCE.NS", period="3mo")
        if df.empty:
            print("FAIL: Reliance stock data is empty.")
            return False
        print(f"PASS: Retrieved {len(df)} price rows for Reliance.")
    except Exception as e:
        print(f"FAIL: Reliance data fetch raised exception: {str(e)}")
        return False
        
    # 2. Test Technical Indicators
    print("\n[2/5] Testing technical indicators generation...")
    try:
        ind_df = calculate_technical_indicators(df)
        if ind_df.empty:
            print("FAIL: Technical indicators dataframe is empty.")
            return False
        required_cols = ["MA_10", "MA_50", "RSI_14", "MACD_Line", "Volatility"]
        for col in required_cols:
            if col not in ind_df.columns:
                print(f"FAIL: Missing technical indicator column: {col}")
                return False
        print("PASS: Successfully computed technical indicators (MA_10, MA_50, RSI_14, MACD, Volatility).")
    except Exception as e:
        print(f"FAIL: Technical indicator calculation raised exception: {str(e)}")
        return False
        
    # 3. Test Portfolio Optimization
    print("\n[3/5] Testing Modern Portfolio Theory (MPT) Sharpe Ratio Optimization...")
    try:
        # Fetch mock second stock to run optimization
        df2 = fetch_stock_data("TCS.NS", period="3mo")
        combined_df = pd.concat([df, df2], ignore_index=True)
        opt_results = optimize_portfolio(combined_df, num_portfolios=200)
        
        if "max_sharpe" not in opt_results or "min_volatility" not in opt_results:
            print("FAIL: Missing max_sharpe or min_volatility in optimization outputs.")
            return False
            
        print(f"PASS: Calculated Sharpe Ratio. Max Sharpe allocation: {opt_results['max_sharpe']['weights']}")
    except Exception as e:
        print(f"FAIL: Portfolio optimization raised exception: {str(e)}")
        return False
        
    # 4. Test Personal Finance Calculators
    print("\n[4/5] Testing SIP & Capital Gains Tax calculators...")
    try:
        sip = calculate_sip(10000, 0.12, 5)
        tax = calculate_capital_gains_tax(100000, 120000, 18) # LTCG
        
        if sip["sip_future_value"] <= sip["total_invested"]:
            print("FAIL: SIP Future Value calculation is incorrect.")
            return False
        if tax["tax_payable"] != 0.0:  # Exemption limit 1.25L makes 20k gain tax-free
            print(f"FAIL: Capital Gains Tax calculation is incorrect. Expected 0.0 tax, got {tax['tax_payable']}.")
            
        print("PASS: SIP projections and Indian Equity Capital Gains Tax computed correctly.")
    except Exception as e:
        print(f"FAIL: Personal finance calculators raised exception: {str(e)}")
        return False
        
    # 5. Test PDF Exporter
    print("\n[5/5] Testing PDF Report Exporter...")
    try:
        pdf_file = generate_pdf_report(
            ticker="RELIANCE.NS",
            tech_text="Reliance is in a bullish phase with RSI at 62.",
            fund_text="Reliance trailing P/E is 28.5, which is standard for the oil-to-retail conglomerate.",
            sent_text="News sentiment is positive on recent retail expansion announcements.",
            pf_text="Hold Reliance for >12 months to qualify for 12.5% LTCG tax.",
            master_text="We recommend a BUY rating on Reliance Industries with a 12-month target of ₹3,100.",
            output_filename="RELIANCE_Test_Report.pdf"
        )
        if not os.path.exists(pdf_file):
            print("FAIL: PDF report was not generated.")
            return False
        print(f"PASS: Successfully compiled PDF report: {pdf_file}")
        # Clean up test file
        if os.path.exists(pdf_file):
            os.remove(pdf_file)
    except Exception as e:
        print(f"FAIL: PDF compilation raised exception: {str(e)}")
        return False
        
    print("\n==================================================")
    print("ALL QUANTITATIVE BACKEND TESTS PASSED SUCCESSFULLY!")
    print("==================================================")
    return True

if __name__ == "__main__":
    run_tests()
