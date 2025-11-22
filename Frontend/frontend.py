import requests

email = input("Enter email: ")
fname = input("Enter firstname: ")
lname = input("Enter lastname: ")
passwd = input("Enter password: ")

url = "http://127.0.0.1:8000/users/register"

payload = {
    "EmailID": email,
    "FirstName": fname,
    "LastName": lname,
    "Password": passwd
}

response = requests.post(url, json=payload)

print("Status Code:", response.status_code)
print("Response:", response.json())
