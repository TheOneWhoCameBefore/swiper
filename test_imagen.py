import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

print("Testing Gemini Image Generation...")
try:
    # Try Imagen 3 model
    response = client.models.generate_images(
        model='imagen-3.0-generate-001',
        prompt='A futuristic portrait of a smiling robot, photorealistic, 8k',
        config={
            'number_of_images': 1,
        }
    )
    print("Success! Image generated.")
    # In a real scenario we'd get response.generated_images[0].image.uri or bytes
except Exception as e:
    print(f"Failed: {e}")
