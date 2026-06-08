from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from backend.db.session import Base, engine

class StockCache(Base):
    """
    Caches historical stock price rows to prevent repeated yfinance downloads
    """
    __tablename__ = "stock_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    date = Column(String, index=True)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)

class Watchlist(Base):
    """
    User watchlist tickers
    """
    __tablename__ = "watchlist"
    
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, unique=True, index=True)

class Expense(Base):
    """
    Personal Finance Tracker items
    """
    __tablename__ = "expense"
    
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)  # e.g., 'Salary', 'Investment', 'Rent', 'Food'
    type = Column(String, nullable=False)      # 'Income' or 'Expense'
    date = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d"))
    description = Column(String)

class OptimizedPortfolio(Base):
    """
    Saves user-optimized portfolios
    """
    __tablename__ = "optimized_portfolio"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="My Optimized Portfolio")
    created_at = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    tickers = Column(String)                   # Comma-separated list: "RELIANCE.NS,TCS.NS"
    weights = Column(String)                   # JSON string of mappings: '{"RELIANCE.NS": 0.6, "TCS.NS": 0.4}'
    expected_return = Column(Float)
    volatility = Column(Float)
    sharpe_ratio = Column(Float)

class StockInfoCache(Base):
    """
    Caches stock metadata (info and news) to prevent slow yfinance scraper calls
    """
    __tablename__ = "stock_info_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, unique=True, index=True)
    info_json = Column(String)  # JSON serialized dict
    news_json = Column(String)  # JSON serialized list
    last_updated = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

class StockHistoryCache(Base):
    """
    Caches calculated historical indicators data to prevent repeated yfinance calls
    """
    __tablename__ = "stock_history_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    period = Column(String, index=True)
    history_json = Column(String)  # JSON serialized list of dicts
    last_updated = Column(String, default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

def init_db():
    """
    Creates all database tables
    """
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    print("Initializing SQLite tables...")
    init_db()
    print("Tables initialized successfully.")
