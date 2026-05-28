import requests
import json
import sys

# Reconfigure stdout to support UTF-8 characters like the Rupee symbol in Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("Testing streaming endpoint `/api/generate-roadmap-stream`...")
    data = {
        "income": 100000.0,
        "expenses": 40000.0,
        "emis": 10000.0,
        "savings": 300000.0,
        "age": 26,
        "occupation": "Salaried",
        "retirement_age": 45,
        "risk": "Balanced",
        "monthly_investment": 30000.0,
        "goals": ["Early Retirement", "Buy Home"]
    }

    try:
        r = requests.post("http://127.0.0.1:8000/api/generate-roadmap-stream", json=data, stream=True, timeout=120)
        print(f"Response status code: {r.status_code}")
        
        for line in r.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith("data: "):
                    val = json.loads(decoded_line[6:])
                    status = val.get("status")
                    msg = val.get("message")
                    
                    if status == "completed":
                        print("\n[SUCCESS] Completed! Received roadmap data:")
                        print(json.dumps(val.get("data"), indent=2))
                    elif status == "error":
                        print(f"\n[ERROR] Generation failed: {msg}")
                    else:
                        print(f"Event: [{status}] -> {msg}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    main()
