from crewai import Task
from pydantic import BaseModel, Field
from typing import List
from agents import profile_agent, goal_agent, investment_agent, coach_agent

# Define structured schemas for CrewAI output verification
class Milestone(BaseModel):
    title: str = Field(..., description="Milestone title (e.g., 'Build Emergency Fund', 'Start SIP', 'Increase SIP', 'Add ELSS', 'Review & Rebalance')")
    timeframe: str = Field(..., description="Timeframe for the milestone (e.g., 'Month 1', 'Month 3', 'Month 6', 'Year 2', 'Year 5')")
    description: str = Field(..., description="Detailed explanation of what the user needs to do during this timeframe.")

class InvestmentAllocation(BaseModel):
    category: str = Field(..., description="Investment category (must be exactly 'Mutual Funds', 'Emergency Fund', 'ELSS', or 'FD')")
    percentage: int = Field(..., description="Allocation percentage (integer 0-100). The sum of all allocations MUST equal exactly 100.")
    details: str = Field(..., description="Recommended funds or rates with details (e.g., 'Quant Active Fund & Parag Parikh Flexi Cap', 'HDFC liquid fund earning 6.5%', 'SBI Tax Saver ELSS Fund')")

class ActionItem(BaseModel):
    day: str = Field(..., description="Timeline of the action in the first month (e.g., 'Day 1-5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Day 30')")
    action: str = Field(..., description="Specific action the user must take (e.g., 'Open an account with a discount broker like Zerodha or Groww', 'Set up automated mandate for SIP')")
    amount: str = Field(..., description="Associated amount in INR, or 'N/A' if it is a process-oriented action")

class RoadmapOutput(BaseModel):
    health_score: int = Field(..., description="Financial health score (1 to 100) indicating current stability based on savings rate and debt-to-income ratio.")
    monthly_sip: int = Field(..., description="Recommended monthly Systematic Investment Plan amount in INR (e.g., 25000)")
    emergency_fund: int = Field(..., description="Target size of the emergency fund in INR (e.g., 150000)")
    projected_corpus: int = Field(..., description="Projected retirement corpus in INR at the retirement age (e.g., 50000000)")
    retirement_age: int = Field(..., description="Target retirement age as selected by user")
    milestones: List[Milestone] = Field(..., description="List of EXACTLY 5 key milestones in the financial roadmap timeline.")
    investments: List[InvestmentAllocation] = Field(..., description="Asset allocation breakdown (Mutual Funds, Emergency Fund, ELSS, FD) totaling 100%.")
    monthly_actions: List[ActionItem] = Field(..., description="EXACTLY 6 actionable steps the user should complete during the first month.")
    coach_summary: str = Field(..., description="A plain-English summary written in an encouraging, non-jargon tone, explaining the strategy and highlighting crucial numbers.")

# Define the Tasks
profile_task = Task(
    description=(
        "Analyze the following financial details for the user:\n"
        "- Monthly Income: ₹{income}\n"
        "- Monthly Expenses: ₹{expenses}\n"
        "- Total EMIs: ₹{emis}\n"
        "- Current Savings: ₹{savings}\n"
        "- Age: {age}\n"
        "- Occupation: {occupation}\n\n"
        "Calculate:\n"
        "1. Monthly surplus: (Income - Expenses - EMIs)\n"
        "2. Savings rate: (Surplus / Income) * 100\n"
        "3. Debt-to-income ratio: (EMIs / Income) * 100\n"
        "4. Financial health score out of 100 based on savings rate (positive weight), debt-to-income ratio (negative weight), and age.\n"
        "Write a detailed financial analysis summarizing these calculations."
    ),
    expected_output="A detailed financial profile analysis including surplus, savings rate, debt-to-income ratio, and preliminary health score.",
    agent=profile_agent
)

goal_task = Task(
    description=(
        "Based on the profile analysis and the user's retirement goals:\n"
        "- Target Retirement Age: {retirement_age}\n"
        "- Risk Appetite: {risk}\n"
        "- Monthly Investment Capacity: ₹{monthly_investment}\n"
        "- Selected Goals: {goals}\n"
        "- Current Age: {age}\n\n"
        "Calculate:\n"
        "1. The target early retirement corpus needed in INR, considering inflation (assume 6% inflation, and safe withdrawal rate of 4% on the corpus). Use standard inflation-adjusted retirement equations.\n"
        "2. The monthly SIP required to achieve this corpus from the current age of {age} to target retirement age of {retirement_age}. Assume average equity returns of 12% for Balanced/Aggressive risk appetite, or 9% for Conservative risk appetite.\n"
        "3. Compare the required monthly SIP against their current monthly surplus and investment capacity to evaluate feasibility. Suggest adjustments if needed."
    ),
    expected_output="A detailed retirement goal calculation including target corpus, monthly SIP required, timeline, and feasibility analysis.",
    agent=goal_agent
)

investment_task = Task(
    description=(
        "Search the web for live Indian financial market data for 2026.\n"
        "Find:\n"
        "1. Top-performing mutual funds for SIPs (e.g., Flexi cap, Large & Mid cap, Index funds) suited for risk appetite: {risk}.\n"
        "2. Current ELSS tax saver mutual funds (since user is an Indian earner subject to tax saving requirements under Section 80C).\n"
        "3. Current Fixed Deposit (FD) rates in leading Indian banks.\n\n"
        "Recommend a detailed allocation split for the user's monthly investment capacity (₹{monthly_investment}) across the following categories:\n"
        "- Mutual Funds (equity)\n"
        "- Emergency Fund\n"
        "- ELSS (Tax saving)\n"
        "- FD (Fixed Deposit / debt)\n\n"
        "Ensure the recommended funds are specific, actual funds with recent returns/details. Make sure the total percentage allocation across these four categories sums up to exactly 100%."
    ),
    expected_output="A detailed investment recommendation with live fund names, returns, interest rates, and allocation percentages.",
    agent=investment_agent
)

coach_task = Task(
    description=(
        "Combine all findings from the previous profile, goal, and investment analyses into a single, cohesive, friendly early retirement roadmap.\n"
        "Convert all technical jargon to simple plain English.\n"
        "Format the entire output as a structured JSON object adhering to the RoadmapOutput schema.\n\n"
        "Requirements:\n"
        "- health_score: final score (1-100)\n"
        "- monthly_sip: recommended monthly SIP in INR\n"
        "- emergency_fund: target emergency fund size in INR\n"
        "- projected_corpus: projected corpus at retirement in INR\n"
        "- retirement_age: the target retirement age {retirement_age}\n"
        "- milestones: exactly 5 milestone cards with title, timeframe, and description.\n"
        "- investments: asset allocations (Mutual Funds, Emergency Fund, ELSS, FD) with actual details and percentages summing to exactly 100%.\n"
        "- monthly_actions: exactly 6 daily/weekly actions for this month (e.g. Day 1-5, Day 10, Day 15, Day 20, Day 25, Day 30).\n"
        "- coach_summary: encouraging summary paragraphs, highlighting key figures like current health score, necessary SIP, and the retirement age.\n"
    ),
    expected_output="A JSON object matching the RoadmapOutput schema containing the complete early retirement roadmap.",
    agent=coach_agent,
    output_json=RoadmapOutput
)
