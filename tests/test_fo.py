import unittest
from backend.fo.fo_engine import black_scholes_price, calculate_greeks, solve_implied_volatility
from backend.fo.fo_ml_predictor import calculate_volatility_smile, predict_iv_trend, recommend_option_trade

class TestFoDerivativesEngine(unittest.TestCase):
    
    def test_black_scholes_pricing(self):
        # Test Call pricing
        # S=100, K=100, T=1 (year), r=5%, sigma=20%
        call_price = black_scholes_price(100.0, 100.0, 1.0, 0.05, 0.20, "CALL")
        self.assertGreater(call_price, 0.0)
        self.assertAlmostEqual(call_price, 10.45, delta=0.1) # Theoretical call price is ~10.45
        
        # Test Put pricing
        put_price = black_scholes_price(100.0, 100.0, 1.0, 0.05, 0.20, "PUT")
        self.assertGreater(put_price, 0.0)
        self.assertAlmostEqual(put_price, 5.57, delta=0.1) # Theoretical put price is ~5.57
        
    def test_options_greeks(self):
        # Test Call Greeks
        greeks = calculate_greeks(100.0, 100.0, 1.0, 0.05, 0.20, "CALL")
        self.assertIn("delta", greeks)
        self.assertIn("gamma", greeks)
        self.assertIn("theta", greeks)
        self.assertIn("vega", greeks)
        
        # Delta bound
        self.assertTrue(0.0 <= greeks["delta"] <= 1.0)
        # Gamma must be positive
        self.assertGreater(greeks["gamma"], 0.0)
        
        # Test Put Greeks
        p_greeks = calculate_greeks(100.0, 100.0, 1.0, 0.05, 0.20, "PUT")
        self.assertTrue(-1.0 <= p_greeks["delta"] <= 0.0)
        
    def test_implied_volatility_solver(self):
        # Theoretical Call price with IV=20% is ~10.45
        S, K, T, r = 100.0, 100.0, 1.0, 0.05
        market_price = 10.45
        solved_iv = solve_implied_volatility(market_price, S, K, T, r, "CALL")
        self.assertAlmostEqual(solved_iv, 0.20, delta=0.02)
        
    def test_volatility_smile(self):
        strikes = [90, 100, 110]
        smile = calculate_volatility_smile(100.0, strikes, 0.20)
        # In equity markets, OTM Put strikes (e.g. 90) have significantly higher IV than ATM strikes (e.g. 100)
        self.assertGreater(smile[90.0], smile[100.0])
        
    def test_iv_trend(self):
        trend = predict_iv_trend("RELIANCE.NS", 0.22)
        self.assertEqual(trend["ticker"], "RELIANCE.NS")
        self.assertEqual(len(trend["forecast_5d"]), 5)
        
    def test_trade_recommendation(self):
        rec = recommend_option_trade(100.0, 100.0, 0.20, 10.45, "CALL")
        self.assertIn(rec["action"], ["BUY", "SELL", "HOLD"])
        self.assertIn(rec["status"], ["Underpriced", "Overpriced", "Fair Value"])
        self.assertTrue(50.0 <= rec["confidence"] <= 100.0)

if __name__ == "__main__":
    unittest.main()
