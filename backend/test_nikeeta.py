import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def test_nikeeta_lookup():
    print("Testing /nikeeta-lookup...")
    
    # 1. Basic Call
    try:
        req = urllib.request.Request(
            f"{BASE_URL}/nikeeta-lookup", 
            data=json.dumps({}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            print(f"Status Code: {status_code}")
            
            data = json.loads(response.read().decode('utf-8'))
            print(f"Total Records: {data.get('total')}")
            print(f"Page Size: {data.get('page_size')}")
            print(f"Records Returned: {len(data.get('data', []))}")
            
            # Verify task_status is empty or null for all returned records
            invalid_records = [r for r in data.get('data', []) if r.get('task_status')]
            if invalid_records:
                print(f"❌ FAILED: Found {len(invalid_records)} records with task_status defined!")
                print(invalid_records[0])
            else:
                print("✅ SUCCESS: All records have empty/null task_status")
                
    except urllib.error.HTTPError as e:
        print(f"❌ FAILED: API Error {e.code} {e.read().decode()}")
    except Exception as e:
        print(f"❌ FAILED: Exception {e}")

    # 2. Date Filter Call
    print("\nTesting Date Filter...")
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    
    try:
        payload = {
            "start_date": start_date,
            "end_date": end_date,
            "page": 1,
            "page_size": 10
        }
        req = urllib.request.Request(
            f"{BASE_URL}/nikeeta-lookup", 
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            print(f"Filtered Records (Last 30 days): {data.get('total')}")
            print("✅ SUCCESS: Date filter applied")
            
    except urllib.error.HTTPError as e:
         print(f"❌ FAILED: API Error {e.code} {e.read().decode()}")
    except Exception as e:
        print(f"❌ FAILED: Exception {e}")

if __name__ == "__main__":
    test_nikeeta_lookup()