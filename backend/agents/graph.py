import logging
from typing import Dict, Any, Generator
from backend.agents.analysts import StockResearchTeam

logger = logging.getLogger(__name__)

class FinancialResearchState:
    """
    State representing the agentic workflow.
    """
    def __init__(self, ticker: str):
        self.ticker = ticker
        self.technical = ""
        self.fundamental = ""
        self.sentiment = ""
        self.personal_finance = ""
        self.master_report = ""
        self.logs = []
        
    def add_log(self, message: str):
        logger.info(message)
        self.logs.append(message)

def run_agent_graph_stream(ticker: str) -> Generator[Dict[str, Any], None, None]:
    """
    Runs the multi-agent graph and yields the execution state of the graph
    at each node transition. Enables real-time tracing in the UI.
    """
    state = FinancialResearchState(ticker)
    
    state.add_log(f"Initializing Research Team for {ticker}...")
    yield {"status": "loading_data", "logs": state.logs, "state": state.__dict__}
    
    # Node 1: Preload Data
    team = StockResearchTeam(ticker)
    try:
        team.load_data()
        state.add_log("Successfully fetched stock historical data and key financial statistics.")
    except Exception as e:
        state.add_log(f"Warning: Failed to fetch some stock data. Fallback active. Error: {str(e)}")
        
    yield {"status": "data_loaded", "logs": state.logs, "state": state.__dict__}
    
    # Node 2: Technical Analyst
    state.add_log("Technical Analyst Agent is analyzing price charts and momentum indicators...")
    yield {"status": "running_technical", "logs": state.logs, "state": state.__dict__}
    state.technical = team.run_technical_analyst()
    state.add_log("Technical Analyst Agent finished report generation.")
    yield {"status": "technical_done", "logs": state.logs, "state": state.__dict__}
    
    # Node 3: Fundamental Analyst
    state.add_log("Fundamental Analyst Agent is reviewing valuation multiples and balance sheet strength...")
    yield {"status": "running_fundamental", "logs": state.logs, "state": state.__dict__}
    state.fundamental = team.run_fundamental_analyst()
    state.add_log("Fundamental Analyst Agent finished report generation.")
    yield {"status": "fundamental_done", "logs": state.logs, "state": state.__dict__}
    
    # Node 4: News & Sentiment Analyst
    state.add_log("News Sentiment Analyst Agent is evaluating news headlines and market mood...")
    yield {"status": "running_sentiment", "logs": state.logs, "state": state.__dict__}
    state.sentiment = team.run_news_sentiment_analyst()
    state.add_log("News Sentiment Analyst Agent finished report generation.")
    yield {"status": "sentiment_done", "logs": state.logs, "state": state.__dict__}
    
    # Node 5: Personal Finance Advisor
    state.add_log("Personal Finance Advisor Agent is running SIP simulations and capital gains tax calculations...")
    yield {"status": "running_personal_finance", "logs": state.logs, "state": state.__dict__}
    state.personal_finance = team.run_personal_finance_advisor()
    state.add_log("Personal Finance Advisor Agent finished report generation.")
    yield {"status": "personal_finance_done", "logs": state.logs, "state": state.__dict__}
    
    # Node 6: Consolidator / Lead Research Specialist
    state.add_log("Lead Research Specialist Agent is compiling final memorandum and SEBI disclaimers...")
    yield {"status": "running_consolidator", "logs": state.logs, "state": state.__dict__}
    state.master_report = team.run_consolidator(
        state.technical, state.fundamental, state.sentiment, state.personal_finance
    )
    state.add_log("Master Research Report successfully compiled and finalized.")
    yield {"status": "completed", "logs": state.logs, "state": state.__dict__}
