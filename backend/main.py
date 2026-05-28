import crewai.llms.cache as _crewai_cache
_crewai_cache.mark_cache_breakpoint = lambda msg: msg

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List
import json
import queue
import threading
import os
from dotenv import load_dotenv

from agents import profile_agent, goal_agent, investment_agent, coach_agent, llm as default_llm
from tasks import profile_task, goal_task, investment_task, coach_task
from crewai import Crew, Process, LLM

load_dotenv()

app = FastAPI(title="WealthPath AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RoadmapInput(BaseModel):
    income: float = Field(..., description="Monthly income in INR")
    expenses: float = Field(..., description="Monthly expenses in INR")
    emis: float = Field(..., description="Total monthly EMIs in INR")
    savings: float = Field(..., description="Total current savings in INR")
    age: int = Field(..., description="Current age of the user")
    occupation: str = Field(..., description="Occupation")
    retirement_age: int = Field(..., description="Target retirement age")
    risk: str = Field(..., description="Risk appetite")
    monthly_investment: float = Field(..., description="Monthly investment capacity in INR")
    goals: List[str] = Field(..., description="Selected financial goals")

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "WealthPath AI"}

def format_inr(num):
    """Always uses ₹ symbol, no decimals on whole numbers."""
    num = int(num)
    if num >= 10000000:
        val = num / 10000000
        return f"₹{val:.2f} Cr"
    elif num >= 100000:
        val = num / 100000
        return f"₹{val:.2f} Lakh"
    return f"₹{num:,}"

def calculate_corpus(monthly_sip, years, equity_return):
    """Mathematically correct SIP corpus calculation with 10% annual step-up."""
    corpus = 0.0
    sip = float(monthly_sip)
    monthly_rate = equity_return / 12
    for year in range(int(years)):
        for month in range(12):
            corpus = (corpus + sip) * (1 + monthly_rate)
        sip *= 1.10
    return int(corpus)

def execute_crew_workflow(inputs: dict, q: queue.Queue, is_stream: bool = True):
    if is_stream:
        def profile_cb(task_output):
            q.put({"status": "profile_agent_done", "message": "Profile Agent analysis completed."})
            q.put({"status": "goal_agent_active", "message": "Goal Agent is setting retirement targets..."})
        def goal_cb(task_output):
            q.put({"status": "goal_agent_done", "message": "Goal Agent calculations completed."})
            q.put({"status": "investment_agent_active", "message": "Investment Agent is searching live market rates..."})
        def investment_cb(task_output):
            q.put({"status": "investment_agent_done", "message": "Investment Agent live search completed."})
            q.put({"status": "coach_agent_active", "message": "Coach Agent is finalizing your plan..."})
        profile_task.callback = profile_cb
        goal_task.callback = goal_cb
        investment_task.callback = investment_cb
    else:
        profile_task.callback = None
        goal_task.callback = None
        investment_task.callback = None

    try:
        if is_stream:
            q.put({"status": "profile_agent_active", "message": "Profile Agent is analyzing your financial picture..."})
        crew = Crew(
            agents=[profile_agent, goal_agent, investment_agent, coach_agent],
            tasks=[profile_task, goal_task, investment_task, coach_task],
            process=Process.sequential,
            verbose=True
        )
        result = crew.kickoff(inputs=inputs)
        if is_stream:
            q.put({"status": "coach_agent_done", "message": "Coach Agent completed plain English summary."})
        result_dict = parse_crew_result(result)
        # Always override corpus with mathematically correct value
        equity_return = 0.14 if inputs.get('risk') == 'Aggressive' else 0.09 if inputs.get('risk') == 'Conservative' else 0.12
        years = min(30, max(1, inputs.get('retirement_age', 60) - inputs.get('age', 26)))
        monthly_sip = min(inputs.get('monthly_investment', 15000), max(0.0, inputs.get('income', 100000) - inputs.get('expenses', 40000) - inputs.get('emis', 10000)))
        result_dict['projected_corpus'] = calculate_corpus(monthly_sip, years, equity_return)
        if is_stream:
            q.put({"status": "completed", "data": result_dict})
        return result_dict
    except Exception as e:
        error_msg = str(e)
        print(f"Primary Groq execution failed: {error_msg}")
        if any(k in error_msg for k in ["RateLimitError", "limit", "Billing", "GroqException", "AuthenticationError"]):
            print("Activating Phase 2: Groq Fallback (Llama-3.1-8b)...")
            if is_stream:
                q.put({"status": "profile_agent_active", "message": "Switching to backup Groq engine..."})
            try:
                backup_llm = LLM(model="groq/llama-3.1-8b-instant", api_key=os.environ.get("GROQ_API_KEY"))
                profile_agent.llm = backup_llm
                goal_agent.llm = backup_llm
                investment_agent.llm = backup_llm
                coach_agent.llm = backup_llm
                crew = Crew(
                    agents=[profile_agent, goal_agent, investment_agent, coach_agent],
                    tasks=[profile_task, goal_task, investment_task, coach_task],
                    process=Process.sequential,
                    verbose=True
                )
                result = crew.kickoff(inputs=inputs)
                if is_stream:
                    q.put({"status": "coach_agent_done", "message": "Coach Agent completed."})
                result_dict = parse_crew_result(result)
                equity_return = 0.14 if inputs.get('risk') == 'Aggressive' else 0.09 if inputs.get('risk') == 'Conservative' else 0.12
                years = min(30, max(1, inputs.get('retirement_age', 60) - inputs.get('age', 26)))
                monthly_sip = min(inputs.get('monthly_investment', 15000), max(0.0, inputs.get('income', 100000) - inputs.get('expenses', 40000) - inputs.get('emis', 10000)))
                result_dict['projected_corpus'] = calculate_corpus(monthly_sip, years, equity_return)
                if is_stream:
                    q.put({"status": "completed", "data": result_dict})
                return result_dict
            except Exception as backup_err:
                print(f"Groq backup fallback failed: {backup_err}")
                return run_heuristic_fallback(inputs, q, is_stream)
        else:
            return run_heuristic_fallback(inputs, q, is_stream)

def parse_crew_result(result) -> dict:
    result_dict = {}
    if hasattr(result, 'json_dict') and result.json_dict:
        result_dict = result.json_dict
    elif hasattr(result, 'raw') and result.raw:
        try:
            raw_str = result.raw.strip()
            if raw_str.startswith("```json"):
                raw_str = raw_str[7:]
            if raw_str.endswith("```"):
                raw_str = raw_str[:-3]
            result_dict = json.loads(raw_str.strip())
        except Exception:
            result_dict = {"error": "Could not parse JSON", "raw": result.raw}
    return result_dict

def run_heuristic_fallback(inputs: dict, q: queue.Queue, is_stream: bool):
    print("Activating Phase 3: Programmatic Heuristic Fallback...")
    if is_stream:
        q.put({"status": "profile_agent_active", "message": "Using local fallback engine..."})

    income = inputs.get("income", 100000.0)
    expenses = inputs.get("expenses", 40000.0)
    emis = inputs.get("emis", 10000.0)
    age = inputs.get("age", 26)
    retirement_age = inputs.get("retirement_age", 45)
    risk = inputs.get("risk", "Balanced")
    monthly_investment = inputs.get("monthly_investment", 30000.0)

    monthly_surplus = income - expenses - emis
    health_score_val = math_health_score(income, expenses, emis)
    years_to_retire = min(30, max(1, retirement_age - age))
    equity_return = 0.14 if risk == 'Aggressive' else 0.09 if risk == 'Conservative' else 0.12
    inflation_rate = 0.06

    future_annual_expenses = (expenses * 12) * ((1 + inflation_rate) ** years_to_retire)
    target_corpus = int(future_annual_expenses * 25)

    n_months = years_to_retire * 12
    monthly_rate = equity_return / 12
    accum_factor = ((((1 + monthly_rate) ** n_months) - 1) / monthly_rate) * (1 + monthly_rate)
    calculated_sip = int(target_corpus / accum_factor)
    recommended_sip = min(monthly_investment, max(0.0, monthly_surplus))

    # Use mathematically correct corpus
    final_corpus = calculate_corpus(recommended_sip, years_to_retire, equity_return)
    emergency_fund_size = int(expenses * 6)

    data = {
        "health_score": health_score_val,
        "monthly_sip": int(recommended_sip),
        "emergency_fund": emergency_fund_size,
        "projected_corpus": final_corpus,
        "retirement_age": retirement_age,
        "milestones": [
            {"title": "Build Emergency Fund", "timeframe": "Month 1",
             "description": f"Accumulate liquid emergency cash of {format_inr(emergency_fund_size)} in a liquid mutual fund like ICICI Liquid Fund."},
            {"title": "Start SIP Allocation", "timeframe": "Month 3",
             "description": f"Deploy a monthly systematic plan of {format_inr(int(recommended_sip))} in Nifty 50 Index Fund and Parag Parikh Flexi Cap."},
            {"title": "Increase SIP by 10%", "timeframe": "Month 6",
             "description": "Step up your monthly SIP by 10% to accelerate compounding as your salary grows."},
            {"title": "Add ELSS Tax Savers", "timeframe": "Year 2",
             "description": "Invest up to ₹1.5 Lakhs annually in ELSS funds like Quant Tax Plan to save tax under Section 80C."},
            {"title": "Review & Rebalance", "timeframe": "Year 5",
             "description": "Assess your portfolio. Rebalance from equities toward safer debt instruments as you approach retirement age."}
        ],
        "investments": [
            {"category": "Mid Cap & Flexi Cap Mutual Funds", "percentage": 35,
             "details": "Parag Parikh Flexi Cap Fund (Growth, 14-16% CAGR)"},
            {"category": "Small Cap Mutual Funds", "percentage": 25,
             "details": "Nippon India Small Cap Fund (High volatility growth, 18-20% CAGR)"},
            {"category": "Nifty 50 Index ETFs (Large Cap)", "percentage": 20,
             "details": "UTI Nifty 50 Index Fund or Nippon India Nifty 50 BeES ETF (Stable, 12% CAGR)"},
            {"category": "Gold & Silver ETFs", "percentage": 10,
             "details": "Nippon India Gold BeES & HDFC Silver ETF (Inflation hedge, 8-10% CAGR)"},
            {"category": "Liquid Emergency Fund", "percentage": 10,
             "details": "ICICI Prudential Liquid Fund or high-yield savings (Liquidity, ~6.5% interest)"}
        ],
        "monthly_actions": [
            {"day": "Day 1-5", "action": "Open a demat and mutual fund account on Groww or Zerodha Coin.", "amount": "N/A"},
            {"day": "Day 10", "action": "Transfer 30% of emergency fund target to a liquid fund.", "amount": format_inr(int(emergency_fund_size * 0.3))},
            {"day": "Day 15", "action": "Set up auto-debit mandate for your monthly SIP.", "amount": format_inr(int(recommended_sip))},
            {"day": "Day 20", "action": "Register on EPFO portal or check NPS options via your employer.", "amount": "N/A"},
            {"day": "Day 25", "action": "Audit all subscriptions and cut unnecessary expenses to free cash.", "amount": "N/A"},
            {"day": "Day 30", "action": "Schedule a monthly net-worth check and confirm SIP executed correctly.", "amount": "N/A"}
        ],
        "coach_summary": f"You have a solid start with a health score of {health_score_val}/100. Retiring by age {retirement_age} is 100% achievable. By investing {format_inr(int(recommended_sip))} every month and stepping it up 10% each year as your salary grows, your money compounds at {int(equity_return*100)}% annually. After {years_to_retire} years, your corpus grows to {format_inr(final_corpus)}. Start with the emergency fund first, then automate your SIP. The earlier you start, the harder compounding works for you."
    }

    if is_stream:
        q.put({"status": "completed", "data": data})
    return data

def math_health_score(income, expenses, emis):
    if income <= 0:
        return 10
    surplus = income - expenses - emis
    savings_rate = max(0.0, surplus / income)
    debt_ratio = emis / income
    score = int((savings_rate * 70) + (max(0.0, 1.0 - debt_ratio) * 30))
    return min(100, max(10, score))

@app.post("/api/generate-roadmap")
def generate_roadmap(data: RoadmapInput):
    inputs = {
        "income": data.income, "expenses": data.expenses, "emis": data.emis,
        "savings": data.savings, "age": data.age, "occupation": data.occupation,
        "retirement_age": data.retirement_age, "risk": data.risk,
        "monthly_investment": data.monthly_investment, "goals": ", ".join(data.goals)
    }
    dummy_q = queue.Queue()
    return execute_crew_workflow(inputs, dummy_q, is_stream=False)

@app.post("/api/generate-roadmap-stream")
def generate_roadmap_stream(data: RoadmapInput):
    q = queue.Queue()
    inputs = {
        "income": data.income, "expenses": data.expenses, "emis": data.emis,
        "savings": data.savings, "age": data.age, "occupation": data.occupation,
        "retirement_age": data.retirement_age, "risk": data.risk,
        "monthly_investment": data.monthly_investment, "goals": data.goals
    }
    threading.Thread(target=execute_crew_workflow, args=(inputs, q, True), daemon=True).start()

    def event_generator():
        while True:
            try:
                item = q.get(timeout=180.0)
                yield f"data: {json.dumps(item)}\n\n"
                if item["status"] in ["completed", "error"]:
                    break
            except queue.Empty:
                yield f"data: {json.dumps({'status': 'error', 'message': 'Generation timed out'})}\n\n"
                break

    return StreamingResponse(event_generator(), media_type="text/event-stream")

import requests

class ChatPayload(BaseModel):
    message: str
    history: List[dict] = []
    context: dict = {}

@app.post("/api/chat")
def chat_with_groq(payload: ChatPayload):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return {"response": "I'm sorry, the Groq API key is not configured on the backend server."}

    system_instruction = (
        "You are the WealthPath AI Financial Coach. You help the user understand their early retirement roadmap "
        "and discuss doubts about mutual funds, SIPs, SWPs, STPs, ETFs, inflation, and step-ups. "
        "Here is the context of the user's roadmap: \n"
        f"{json.dumps(payload.context, indent=2)}\n"
        "Keep your advice clear, direct, and focused on helping them succeed. Avoid overly long disclaimers. "
        "Respond in markdown format. Explain details simply."
    )

    messages = [
        {"role": "system", "content": system_instruction}
    ]
    
    # Filter and strictly alternate user/assistant roles, starting with user
    has_user_message = False
    for h in payload.history:
        role = "user" if h.get("role") == "user" else "assistant"
        if role == "user":
            has_user_message = True
        if not has_user_message:
            continue  # Skip initial model greeting to start conversation with user
        text = h.get("text", "")
        if text:
            messages.append({
                "role": role,
                "content": text
            })

    # Append current user query
    messages.append({
        "role": "user",
        "content": payload.message
    })

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    body = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0.3
    }

    try:
        res = requests.post(url, headers=headers, json=body, timeout=30.0)
        res_json = res.json()
        if "choices" in res_json and len(res_json["choices"]) > 0:
            text_response = res_json["choices"][0]["message"]["content"]
            return {"response": text_response}
        else:
            print("Groq response error:", res_json)
            error_msg = res_json.get("error", {}).get("message", "Unknown error")
            
            # If rate limited on the 70b model, fallback to 8b
            if any(k in error_msg.lower() for k in ["rate_limit", "limit", "quota", "tpd", "tpm", "rpm"]):
                print("Chat hitting rate limit on 70B model. Retrying with backup llama-3.1-8b-instant...")
                body["model"] = "llama-3.1-8b-instant"
                res2 = requests.post(url, headers=headers, json=body, timeout=30.0)
                res2_json = res2.json()
                if "choices" in res2_json and len(res2_json["choices"]) > 0:
                    return {"response": res2_json["choices"][0]["message"]["content"]}
                else:
                    error_msg = res2_json.get("error", {}).get("message", "Unknown error")
                    
            return {"response": f"I'm sorry, I encountered an issue processing your request via Groq: {error_msg}. Please try again."}
    except Exception as e:
        print("Groq API call failed, retrying with backup llama-3.1-8b-instant due to exception:", e)
        try:
            body["model"] = "llama-3.1-8b-instant"
            res2 = requests.post(url, headers=headers, json=body, timeout=30.0)
            res2_json = res2.json()
            if "choices" in res2_json and len(res2_json["choices"]) > 0:
                return {"response": res2_json["choices"][0]["message"]["content"]}
        except Exception as e2:
            print("Fallback to llama-3.1-8b-instant failed:", e2)
        return {"response": f"Error calling Groq API: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
