import requests

BASE_URL = "http://localhost:8000"

def test_login(email, password):
    url = f"{BASE_URL}/api/auth/login"
    data = {
        "username": email,
        "password": password
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    print(f"Attempting login to {url} with {email}...")
    try:
        response = requests.post(url, data=data, headers=headers)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Login Successful!")
            print("Token:", response.json().get("access_token"))
        else:
            print("Login Failed!")
            print("Response:", response.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login("admin@insurance.com", "admin123")
