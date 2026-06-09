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
    import concurrent.futures
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
    
    # Start all analyst executions concurrently
    state.add_log("Starting parallel execution of research analyst agents (Technical, Fundamental, Sentiment, Personal Finance)...")
    
    # Node 2: Technical Analyst
    yield {"status": "running_technical", "logs": state.logs, "state": state.__dict__}
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        future_tech = executor.submit(team.run_technical_analyst)
        future_fund = executor.submit(team.run_fundamental_analyst)
        future_sent = executor.submit(team.run_news_sentiment_analyst)
        future_pf = executor.submit(team.run_personal_finance_advisor)
        
        # 1. Technical Analyst
        try:
            state.technical = future_tech.result()
            state.add_log("Technical Analyst Agent finished report generation.")
        except Exception as e:
            logger.error(f"Technical Analyst Agent crashed: {e}")
            state.technical = f"Technical Analyst Error: {str(e)}"
            state.add_log(f"⚠️ Technical Analyst Agent failed: {str(e)}")
        yield {"status": "technical_done", "logs": state.logs, "state": state.__dict__}
        
        # 2. Fundamental Analyst
        state.add_log("Fundamental Analyst Agent is reviewing valuation multiples and balance sheet strength...")
        yield {"status": "running_fundamental", "logs": state.logs, "state": state.__dict__}
        try:
            state.fundamental = future_fund.result()
            state.add_log("Fundamental Analyst Agent finished report generation.")
        except Exception as e:
            logger.error(f"Fundamental Analyst Agent crashed: {e}")
            state.fundamental = f"Fundamental Analyst Error: {str(e)}"
            state.add_log(f"⚠️ Fundamental Analyst Agent failed: {str(e)}")
        yield {"status": "fundamental_done", "logs": state.logs, "state": state.__dict__}
        
        # 3. News & Sentiment Analyst
        state.add_log("News Sentiment Analyst Agent is evaluating news headlines and market mood...")
        yield {"status": "running_sentiment", "logs": state.logs, "state": state.__dict__}
        try:
            state.sentiment = future_sent.result()
            state.add_log("News Sentiment Analyst Agent finished report generation.")
        except Exception as e:
            logger.error(f"News Sentiment Analyst Agent crashed: {e}")
            state.sentiment = f"News Sentiment Analyst Error: {str(e)}"
            state.add_log(f"⚠️ News Sentiment Analyst Agent failed: {str(e)}")
        yield {"status": "sentiment_done", "logs": state.logs, "state": state.__dict__}
        
        # 4. Personal Finance Advisor
        state.add_log("Personal Finance Advisor Agent is running SIP simulations and capital gains tax calculations...")
        yield {"status": "running_personal_finance", "logs": state.logs, "state": state.__dict__}
        try:
            state.personal_finance = future_pf.result()
            state.add_log("Personal Finance Advisor Agent finished report generation.")
        except Exception as e:
            logger.error(f"Personal Finance Advisor Agent crashed: {e}")
            state.personal_finance = f"Personal Finance Advisor Error: {str(e)}"
            state.add_log(f"⚠️ Personal Finance Advisor Agent failed: {str(e)}")
        yield {"status": "personal_finance_done", "logs": state.logs, "state": state.__dict__}
        
    # Node 6: Consolidator / Lead Research Specialist
    state.add_log("Lead Research Specialist Agent is compiling final memorandum and SEBI disclaimers...")
    yield {"status": "running_consolidator", "logs": state.logs, "state": state.__dict__}
    state.master_report = team.run_consolidator(
        state.technical, state.fundamental, state.sentiment, state.personal_finance
    )
    state.add_log("Master Research Report successfully compiled and finalized.")
    yield {"status": "completed", "logs": state.logs, "state": state.__dict__}
