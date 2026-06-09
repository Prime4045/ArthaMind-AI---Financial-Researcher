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

def run_agent_graph_stream(ticker: str, db: Any = None) -> Generator[Dict[str, Any], None, None]:
    """
    Runs the multi-agent graph and yields the execution state of the graph
    at each node transition. Enables real-time tracing in the UI.
    Optimised using concurrent.futures.as_completed (DSA) and ResearchReportCache.
    """
    import concurrent.futures
    from datetime import datetime, timedelta
    from backend.db.session import SessionLocal
    from backend.db.models import ResearchReportCache
    
    own_db = False
    if db is None:
        db = SessionLocal()
        own_db = True
        
    ticker = ticker.strip().upper()
    state = FinancialResearchState(ticker)
    
    # 1. DSA Memoization Check: Check cache to see if report was generated in last 12 hours
    cached_report = None
    try:
        cached_report = db.query(ResearchReportCache).filter(ResearchReportCache.ticker == ticker).first()
    except Exception as cache_err:
        logger.error(f"Error querying research report cache: {cache_err}")
        
    is_cache_valid = False
    if cached_report:
        try:
            last_updated_dt = datetime.strptime(cached_report.last_updated, "%Y-%m-%d %H:%M:%S")
            # Valid for 12 hours to capture daily market cycles
            if (datetime.now() - last_updated_dt) < timedelta(hours=12):
                is_cache_valid = True
        except Exception as parse_err:
            logger.warning(f"Error parsing research report cache timestamp: {parse_err}")
            
    if is_cache_valid and cached_report:
        state.add_log(f"Initializing Research Team for {ticker}...")
        yield {"status": "loading_data", "logs": state.logs, "state": state.__dict__}
        
        state.add_log("Loading cached research report from database (Instant Cache-Hit)...")
        yield {"status": "data_loaded", "logs": state.logs, "state": state.__dict__}
        
        state.technical = cached_report.technical
        state.fundamental = cached_report.fundamental
        state.sentiment = cached_report.sentiment
        state.personal_finance = cached_report.personal_finance
        state.master_report = cached_report.master_report
        
        state.add_log("Technical Analyst Agent report loaded from cache.")
        state.add_log("Fundamental Analyst Agent report loaded from cache.")
        state.add_log("News Sentiment Analyst Agent report loaded from cache.")
        state.add_log("Personal Finance Advisor Agent report loaded from cache.")
        state.add_log("Lead Research Specialist Agent master report loaded from cache.")
        state.add_log("Master Research Report successfully finalized.")
        
        yield {"status": "completed", "logs": state.logs, "state": state.__dict__}
        if own_db:
            db.close()
        return

    # Node 1: Preload Data
    state.add_log(f"Initializing Research Team for {ticker}...")
    yield {"status": "loading_data", "logs": state.logs, "state": state.__dict__}
    
    team = StockResearchTeam(ticker)
    try:
        team.load_data()
        state.add_log("Successfully fetched stock historical data and key financial statistics.")
    except Exception as e:
        state.add_log(f"Warning: Failed to fetch some stock data. Fallback active. Error: {str(e)}")
        
    yield {"status": "data_loaded", "logs": state.logs, "state": state.__dict__}
    
    # Start all analyst executions concurrently
    state.add_log("Starting parallel execution of research analyst agents (Technical, Fundamental, Sentiment, Personal Finance)...")
    
    # Yield initial progress
    yield {"status": "running_technical", "logs": state.logs, "state": state.__dict__}
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        future_tech = executor.submit(team.run_technical_analyst)
        future_fund = executor.submit(team.run_fundamental_analyst)
        future_sent = executor.submit(team.run_news_sentiment_analyst)
        future_pf = executor.submit(team.run_personal_finance_advisor)
        
        future_to_agent = {
            future_tech: ("technical", "Technical Analyst Agent"),
            future_fund: ("fundamental", "Fundamental Analyst Agent"),
            future_sent: ("sentiment", "News Sentiment Analyst Agent"),
            future_pf: ("personal_finance", "Personal Finance Advisor Agent")
        }
        
        # DSA Concurrency Optimization: Stream updates as soon as any agent thread completes
        for future in concurrent.futures.as_completed(future_to_agent):
            attr, agent_name = future_to_agent[future]
            try:
                result = future.result()
                setattr(state, attr, result)
                state.add_log(f"{agent_name} finished report generation.")
            except Exception as e:
                logger.error(f"{agent_name} crashed: {e}")
                setattr(state, attr, f"{agent_name} Error: {str(e)}")
                state.add_log(f"⚠️ {agent_name} failed: {str(e)}")
            yield {"status": f"{attr}_done", "logs": state.logs, "state": state.__dict__}
            
    # Node 6: Consolidator / Lead Research Specialist
    state.add_log("Lead Research Specialist Agent is compiling final memorandum and SEBI disclaimers...")
    yield {"status": "running_consolidator", "logs": state.logs, "state": state.__dict__}
    try:
        state.master_report = team.run_consolidator(
            state.technical, state.fundamental, state.sentiment, state.personal_finance
        )
        state.add_log("Master Research Report successfully compiled and finalized.")
    except Exception as e:
        logger.error(f"Lead Research Specialist crashed: {e}")
        state.master_report = f"Lead Research Specialist Error: {str(e)}"
        state.add_log(f"⚠️ Lead Research Specialist failed: {str(e)}")
        
    # Write report results to cache for future daily cache-hits
    try:
        existing = db.query(ResearchReportCache).filter(ResearchReportCache.ticker == ticker).first()
        if existing:
            existing.technical = state.technical
            existing.fundamental = state.fundamental
            existing.sentiment = state.sentiment
            existing.personal_finance = state.personal_finance
            existing.master_report = state.master_report
            existing.last_updated = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        else:
            new_cache = ResearchReportCache(
                ticker=ticker,
                technical=state.technical,
                fundamental=state.fundamental,
                sentiment=state.sentiment,
                personal_finance=state.personal_finance,
                master_report=state.master_report,
                last_updated=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
            db.add(new_cache)
        db.commit()
    except Exception as save_err:
        logger.error(f"Error saving report to cache: {save_err}")
        db.rollback()
        
    yield {"status": "completed", "logs": state.logs, "state": state.__dict__}
    
    if own_db:
        db.close()
