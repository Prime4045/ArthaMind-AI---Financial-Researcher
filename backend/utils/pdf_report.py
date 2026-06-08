import os
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_pdf_report(
    ticker: str, 
    tech_text: str, 
    fund_text: str, 
    sent_text: str, 
    pf_text: str, 
    master_text: str,
    output_filename: str = None
) -> str:
    """
    Generates a professional PDF report containing the AI Analyst Team findings.
    """
    if not output_filename:
        base_name = f"{ticker.replace('.', '_')}_Research_Report.pdf"
        if os.environ.get("VERCEL") or os.environ.get("NOW_REGION"):
            output_filename = os.path.join("/tmp", base_name)
        else:
            output_filename = base_name
        
    doc = SimpleDocTemplate(
        output_filename, 
        pagesize=letter,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles for Premium Fintech Look
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0F172A'), # Charcoal / Dark Slate
        spaceAfter=10
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'), # Cool Gray
        spaceAfter=20
    )
    
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1E3A8A'), # Navy Blue
        spaceBefore=12,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'), # Dark Slate Gray
        spaceAfter=8
    )
    
    disclaimer_style = ParagraphStyle(
        'SEBIDisclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#94A3B8'),
        spaceBefore=15
    )

    story = []
    
    # Title & Metadata
    story.append(Paragraph("Automated Financial Research Memorandum", title_style))
    date_str = datetime.datetime.now().strftime("%B %d, %Y")
    story.append(Paragraph(f"TICKER: {ticker}  |  DATE: {date_str}  |  CLASSIFICATION: AI-RESEARCH-PUBLIC", subtitle_style))
    story.append(Spacer(1, 10))
    
    # Table of Highlights
    data = [
        [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Summary Details</b>", body_style)],
        [Paragraph("Target Stock", body_style), Paragraph(ticker, body_style)],
        [Paragraph("Report Type", body_style), Paragraph("Multi-Agent Investment Analysis", body_style)],
        [Paragraph("Core Focus", body_style), Paragraph("NSE/BSE Indian Equities Portfolio Analysis", body_style)]
    ]
    t = Table(data, colWidths=[150, 350])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))
    
    # Executive Summary / Master report
    story.append(Paragraph("1. Executive Summary & Investment Thesis", heading_style))
    # Standard clean-up: clean Markdown headers for PDF formatting
    clean_master = master_text.replace("###", "").replace("##", "").replace("#", "")
    for paragraph in clean_master.split("\n\n"):
        if paragraph.strip():
            story.append(Paragraph(paragraph.strip(), body_style))
            
    story.append(Spacer(1, 10))
    
    # Technical Analyst Report
    story.append(Paragraph("2. Technical Indicators Analysis", heading_style))
    clean_tech = tech_text.replace("###", "").replace("##", "").replace("#", "")
    for paragraph in clean_tech.split("\n\n"):
        if paragraph.strip():
            story.append(Paragraph(paragraph.strip(), body_style))
            
    story.append(Spacer(1, 10))
    
    # Fundamental Analyst Report
    story.append(Paragraph("3. Fundamental Valuation & Sector Ratios", heading_style))
    clean_fund = fund_text.replace("###", "").replace("##", "").replace("#", "")
    for paragraph in clean_fund.split("\n\n"):
        if paragraph.strip():
            story.append(Paragraph(paragraph.strip(), body_style))
            
    story.append(Spacer(1, 10))
    
    # News & Sentiment
    story.append(Paragraph("4. News & Market Sentiment Sentiment Scoring", heading_style))
    clean_sent = sent_text.replace("###", "").replace("##", "").replace("#", "")
    for paragraph in clean_sent.split("\n\n"):
        if paragraph.strip():
            story.append(Paragraph(paragraph.strip(), body_style))
            
    story.append(Spacer(1, 10))
    
    # Personal Finance Tax and SIP Calculator
    story.append(Paragraph("5. SIP & Capital Gains Tax Planning (India Rules)", heading_style))
    clean_pf = pf_text.replace("###", "").replace("##", "").replace("#", "")
    for paragraph in clean_pf.split("\n\n"):
        if paragraph.strip():
            story.append(Paragraph(paragraph.strip(), body_style))
            
    story.append(Spacer(1, 15))
    
    # Regulatory Disclaimer
    story.append(Paragraph(
        "<b>SEBI Regulatory Disclaimer:</b> This document is an automated AI-generated research report compiled "
        "for the Advanced Agentic AI workshop. It is intended solely for educational purposes and student demonstration. "
        "The model inputs and final outputs are not registered with SEBI (Securities and Exchange Board of India) and "
        "do not constitute active financial, investment, or legal advice. Please perform independent diligence before allocating funds.",
        disclaimer_style
    ))
    
    doc.build(story)
    return output_filename

if __name__ == "__main__":
    print("Testing PDF generator...")
    generate_pdf_report(
        ticker="RELIANCE.NS",
        tech_text="Technical trends show a strong bullish breakout pattern.",
        fund_text="Valuations are healthy with ROE at 15%.",
        sent_text="Sentiment is highly positive with strong news flow.",
        pf_text="Hold for at least 12 months to qualify for 12.5% LTCG tax instead of 20% STCG.",
        master_text="We recommend a STRONG BUY on Reliance Industries Ltd.",
        output_filename="test_report.pdf"
    )
    print("PDF generated successfully.")
