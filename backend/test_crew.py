import crewai.llms.cache as _crewai_cache
# Override the function to prevent injecting the unsupported cache_breakpoint flag in Groq
_crewai_cache.mark_cache_breakpoint = lambda msg: msg

import os
import json
import sys
from dotenv import load_dotenv

# Reconfigure stdout to support UTF-8 characters like the Rupee symbol in Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from agents import profile_agent, goal_agent, investment_agent, coach_agent
from tasks import profile_task, goal_task, investment_task, coach_task
from crewai import Crew, Process

# Force loading .env from parent directory
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
load_dotenv()

def main():
    print("Testing WealthPath AI Crew...")
    
    # Verify environment variables
    print(f"GROQ_API_KEY set: {bool(os.environ.get('GROQ_API_KEY'))}")
    print(f"SERPER_API_KEY set: {bool(os.environ.get('SERPER_API_KEY'))}")
    
    inputs = {
        "income": 100000.0,
        "expenses": 40000.0,
        "emis": 10000.0,
        "savings": 300000.0,
        "age": 26,
        "occupation": "Salaried",
        "retirement_age": 45,
        "risk": "Balanced",
        "monthly_investment": 30000.0,
        "goals": "Early Retirement, Buy Home"
    }
    
    def profile_cb(task_output):
        print("\n=== PROFILE AGENT COMPLETED ===")
        print(task_output.raw[:300] + "...")

    def goal_cb(task_output):
        print("\n=== GOAL AGENT COMPLETED ===")
        print(task_output.raw[:300] + "...")

    def investment_cb(task_output):
        print("\n=== INVESTMENT AGENT COMPLETED ===")
        print(task_output.raw[:300] + "...")

    profile_task.callback = profile_cb
    goal_task.callback = goal_cb
    investment_task.callback = investment_cb

    crew = Crew(
        agents=[profile_agent, goal_agent, investment_agent, coach_agent],
        tasks=[profile_task, goal_task, investment_task, coach_task],
        process=Process.sequential,
        verbose=True
    )
    
    print("Starting Crew kickoff...")
    result = crew.kickoff(inputs=inputs)
    print("\n=== KICKOFF COMPLETED ===")
    print("Raw output:")
    print(result.raw[:1000] + "...")
    
    print("\nParsed JSON dict:")
    if hasattr(result, 'json_dict') and result.json_dict:
        print(json.dumps(result.json_dict, indent=2))
    else:
        print("No json_dict found.")

if __name__ == "__main__":
    main()
