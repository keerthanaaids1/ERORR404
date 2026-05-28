import requests
import json

body = {
    "message": "what is ELSS tax saver",
    "history": [],
    "context": {}
}

try:
    res = requests.post("http://127.0.0.1:8000/api/chat", json=body, timeout=10.0)
    print("STATUS CODE:", res.status_code)
    with open("C:/Users/KEERTHANA M/OneDrive/Desktop/MY FOLDERS/wealthpath-ai/chat_response.json", "w", encoding="utf-8") as f:
        json.dump(res.json(), f, ensure_ascii=False, indent=2)
    print("SUCCESS: Response written to C:/Users/KEERTHANA M/OneDrive/Desktop/MY FOLDERS/wealthpath-ai/chat_response.json")
except Exception as e:
    print("TEST FAILED:", e)
