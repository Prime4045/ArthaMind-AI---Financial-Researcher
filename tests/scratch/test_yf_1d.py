import yfinance as yf
ticker = "RELIANCE.NS"
df = yf.download(ticker, period="1d", interval="5m", progress=False)
print("Columns of downloaded df:", df.columns)
print("Index name:", df.index.name)
df_reset = df.reset_index()
print("Columns after reset_index:", df_reset.columns)
print("First 2 rows:")
print(df_reset.head(2))
