import os
import datetime
import re
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def parse_inline_markdown_to_html(text: str) -> str:
    if not text:
        return ""
    
    # Escape XML characters that break ReportLab's XML parser
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    
    # Replace bold (**bold** and __bold__) with <b>bold</b>
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'__(.*?)__', r'<b>\1</b>', text)
    
    # Replace italic (*italic* and _italic_) with <i>italic</i>
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    text = re.sub(r'_(.*?)_', r'<i>\1</i>', text)
    
    # Replace code (`code`) with font tags
    text = re.sub(r'`(.*?)`', r'<font face="Courier" color="#4F46E5"><b>\1</b></font>', text)
    
    return text

def parse_markdown_to_story(text: str, story: list, styles, body_style: ParagraphStyle, heading_style: ParagraphStyle):
    if not text:
        return
        
    lines = text.split("\n")
    
    # Heading style variants for subheaders
    h2_style = ParagraphStyle(
        'H2Custom',
        parent=heading_style,
        fontSize=12,
        leading=15,
        spaceBefore=10,
        spaceAfter=4
    )
    
    h3_style = ParagraphStyle(
        'H3Custom',
        parent=heading_style,
        fontSize=10,
        leading=13,
        spaceBefore=8,
        spaceAfter=3,
        textColor=colors.HexColor('#4F46E5')
    )
    
    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    for line in lines:
        clean_line = line.strip()
        if not clean_line:
            story.append(Spacer(1, 4))
            continue
            
        # Horizontal rule
        if clean_line in ["---", "===", "***"]:
            t = Table([['']], colWidths=[500], rowHeights=[1])
            t.setStyle(TableStyle([
                ('LINEABOVE', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
                ('BOTTOMPADDING', (0,0), (-1,-1), 0),
                ('TOPPADDING', (0,0), (-1,-1), 0),
            ]))
            story.append(t)
            story.append(Spacer(1, 4))
            continue
            
        # Headers (# Header)
        if clean_line.startswith("#"):
            match = re.match(r'^(#{1,6})\s+(.*)$', clean_line)
            if match:
                level = len(match.group(1))
                heading_text = match.group(2)
                html_text = parse_inline_markdown_to_html(heading_text)
                
                if level == 1:
                    story.append(Paragraph(html_text, heading_style))
                elif level == 2:
                    story.append(Paragraph(html_text, h2_style))
                else:
                    story.append(Paragraph(html_text, h3_style))
                continue
                
        # Bullet list items (- item)
        if clean_line.startswith("- ") or clean_line.startswith("* "):
            list_text = clean_line[2:]
            html_text = parse_inline_markdown_to_html(list_text)
            story.append(Paragraph(f"&bull; {html_text}", bullet_style))
            continue
            
        # Numbered list items (1. item)
        if re.match(r'^\d+\.\s+', clean_line):
            match = re.match(r'^(\d+)\.\s+(.*)$', clean_line)
            if match:
                num = match.group(1)
                list_text = match.group(2)
                html_text = parse_inline_markdown_to_html(list_text)
                story.append(Paragraph(f"{num}. {html_text}", bullet_style))
                continue
                
        # Normal body paragraph
        html_text = parse_inline_markdown_to_html(clean_line)
        story.append(Paragraph(html_text, body_style))

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
    parse_markdown_to_story(master_text, story, styles, body_style, heading_style)
    story.append(Spacer(1, 10))
    
    # Technical Analyst Report
    story.append(Paragraph("2. Technical Indicators Analysis", heading_style))
    parse_markdown_to_story(tech_text, story, styles, body_style, heading_style)
    story.append(Spacer(1, 10))
    
    # Fundamental Analyst Report
    story.append(Paragraph("3. Fundamental Valuation & Sector Ratios", heading_style))
    parse_markdown_to_story(fund_text, story, styles, body_style, heading_style)
    story.append(Spacer(1, 10))
    
    # News & Sentiment
    story.append(Paragraph("4. News & Market Sentiment Sentiment Scoring", heading_style))
    parse_markdown_to_story(sent_text, story, styles, body_style, heading_style)
    story.append(Spacer(1, 10))
    
    # Personal Finance Tax and SIP Calculator
    story.append(Paragraph("5. SIP & Capital Gains Tax Planning (India Rules)", heading_style))
    parse_markdown_to_story(pf_text, story, styles, body_style, heading_style)
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
