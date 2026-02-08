import requests
import sys

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin"
VIEWER_EMAIL = "viewer@example.com"
VIEWER_PASSWORD = "viewer"

def get_token(email, password):
    response = requests.post(
        f"{BASE_URL}/login",
        data={"username": email, "password": password}
    )
    if response.status_code != 200:
        print(f"Failed to login as {email}: {response.text}")
        return None
    return response.json()["access_token"]

def test_reports():
    print("Testing Monthly Reports API...")

    # 1. Login as Admin
    admin_token = get_token(ADMIN_EMAIL, ADMIN_PASSWORD)
    if not admin_token:
        sys.exit(1)
    
    # 2. Test GET /reports/monthly (Success)
    print("\n[Test 1] Admin Access: ", end="")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/reports/monthly", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print("PASS")
        print(f"   Stats: {data['stats']}")
        print(f"   Categories: {len(data['category_breakdown'])}")
    else:
        print(f"FAIL ({response.status_code})")
        print(response.text)

    # 3. Login as Viewer
    viewer_token = get_token(VIEWER_EMAIL, VIEWER_PASSWORD)
    if not viewer_token:
        sys.exit(1)

    # 4. Test GET /reports/monthly (Forbidden)
    print("\n[Test 2] Viewer Access (Should Fail): ", end="")
    headers = {"Authorization": f"Bearer {viewer_token}"}
    response = requests.get(f"{BASE_URL}/reports/monthly", headers=headers)
    
    if response.status_code == 403:
        print("PASS (403 Forbidden)")
    else:
        print(f"FAIL (Got {response.status_code}, expected 403)")

if __name__ == "__main__":
    try:
        # Simple check if server is up
        requests.get(f"{BASE_URL}/docs")
        test_reports()
    except requests.exceptions.ConnectionError:
        print("Error: Backend server is not running. Please start it with 'docker compose up'.")
