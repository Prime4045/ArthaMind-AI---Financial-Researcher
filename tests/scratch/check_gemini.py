import os
import google.generativeai as genai
import dotenv

dotenv.load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
print("GEMINI_API_KEY:", api_key)

if api_key:
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content("Hello")
        print("Success! Response:")
        print(response.text)
    except Exception as e:
        print("Failed to call Gemini:")
        print(str(e))
else:
    print("No GEMINI_API_KEY found in environment.")
