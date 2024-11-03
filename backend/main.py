from fastapi import FastAPI,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from dotenv import load_dotenv
import re

load_dotenv()
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

if OPENWEATHER_API_KEY:
    print(f"API Key loaded: {OPENWEATHER_API_KEY}")
else:
    print("API Key not found. Please set the OPENWEATHER_API_KEY environment variable.")

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Command(BaseModel):
    command: str

@app.get("/")
async def greet():
    return {"message": "hello world"}

def extract_city(command: str) -> str:
    # Pattern to match "weather in {city}" or "what's the weather in {city}" or similar variations
    patterns = [
        r"weather (?:in|at|for) ([a-zA-Z\s]+)(?:\?)?$",
        r"what(?:'s| is) the weather (?:in|at|for) ([a-zA-Z\s]+)(?:\?)?$"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, command.lower())
        if match:
            return match.group(1).strip()
    
    return ""

@app.post("/process-command")
async def process_command(command: Command):
    city = extract_city(command.command)
    
    if not city:
        raise HTTPException(status_code=400, detail="Could not understand the city name")
    
    try:
        # Get coordinates first
        geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={OPENWEATHER_API_KEY}"
        geo_response = requests.get(geo_url)
        geo_response.raise_for_status()  # Check for HTTP errors
        geo_data = geo_response.json()
        
        if not geo_data:
            raise HTTPException(status_code=404, detail="City not found")
        
        lat = geo_data[0]['lat']
        lon = geo_data[0]['lon']
        
        # Get weather data
        weather_url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        weather_response = requests.get(weather_url)
        print("weather_response",weather_response)
        weather_response.raise_for_status()  # Check for HTTP errors
        weather_data = weather_response.json()
        print("data ",weather_data)
        
        return {
            "weather": {
                "temperature": weather_data['main']['temp'],
                "description": weather_data['weather'][0]['description'],
                "city": geo_data[0]['name'],
                "humidity": weather_data['main']['humidity'],
                "windSpeed": weather_data['wind']['speed']
            }
        }
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail="Error fetching data from OpenWeather API")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# To run the app: use `uvicorn main:app --host 0.0.0.0 --port 8003 --reload`
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)