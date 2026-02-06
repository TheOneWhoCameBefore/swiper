import os
import json
import uuid
import random
import urllib.parse
import re
from google import genai
from dotenv import load_dotenv

load_dotenv()

# We use the new google-genai SDK 
# Client configuration
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MODEL_ID = "gemma-3-27b-it"

# --- BROAD SEED LISTS ---
# These are open-ended to give the LLM maximum creative freedom
DOMAINS = [
    "Corporate Life", "The Great Outdoors", "Culinary Arts", "Underground Subculture", 
    "Academia", "The Gig Economy", "Wellness & Spirituality", "Niche Tech", 
    "Creative Arts", "Service Industry", "Local Politics", "DIY & Crafts",
    "Time Travel Ethics", "Competitive Dog Grooming", "Liminal Spaces", "Amateur Geology",
    "Cryptozoology", "Vintage Fashion", "Urban Farming", "SoundCloud Rapping",
    "Professional Cuddling", "Ghost Hunting", "Ventriloquism", "Extreme Ironing",
    "Taxidermy", "Mycology", "Experimental Noise Music", "Medieval Reenactment",
    "Influencer House Drama", "Tiny House Living", "Van Life", "Doomsday Prepping",
    "Competitive Eating", "Parkour", "Urban Exploring", "Fan Fiction Writing",
    "Forensic Accounting", "Dairy Farming", "Puppetry", "Modular Synthesis", 
    "EFY Counselor Chic", "The Multi-Level Marketing (MLM) Grind", "Post-Mission Re-entry", 
    "South Provo Skate Park Culture", "Vance Hall Corporate Ambition", "The BYU Creamery Supply Chain", 
    "Maple Syrup Geopolitics", "Tim Hortons Drive-Thru Etiquette", "Junior B Hockey Enforcer History", 
    "The Strategic Reserve of Poutine", "Niche Board Game Rules Lawyering", 
    "Aggressive Thrift Store Flipping", "Competitive Soda Mixing (Dirty Sodas)", 
    "Unsolicited LinkedIn Networking"
]

CORE_TRAITS = [
    "Aggressively Optimistic", "Terminally Chill", "Suspiciously Specific", "Hopeless Romantic", 
    "Brutally Honest", "High Maintenance", "Chaotic Good", "Socially Awkward", 
    "Overly Competitive", "Philosophical", "Nostalgic", "Literal-minded",
    "Aggressively Wholesome", "Chronically Online", "Vaguely Threatening", "Uncomfortably Intense",
    "Painfully Hip", "Delightfully Tacky", "Spiritually Bypassing", "Main Character Energy",
    "Golden Retriever Energy", "Black Cat Energy", "Neurospicy", "Goblincore",
    "Cottagecore", "Dark Academia", "Himbo", "Girlboss",
    "Cryptobro", "Horse Girl", "Disney Adult", "iPad Kid Grown Up",
    "Old Soul", "Tech Pessimist", "Radical Softness", "Menace to Society", "Engagement-Hungry", 
    "Aggressively Modest", "NCMO (Non-Committal Make Out) Professional", 
    "Theologically Confident", "Frontrunner Dependent", "RM (Returned Missionary) Energy",
    "Weaponized Politeness", "Metric System Supremacist", "Mid-Winter Shorts Wearer", 
    "Apologetic to a Fault"
]

INTERESTS = [
    "Obscure History", "Trash TV", "Fermentation", "Vintage Tech", "Urban Exploration", 
    "Extreme Couponing", "Cryptids", "Foraging", "Competitive Gaming", "Upcycling", 
    "Astrology", "True Crime", "Public Transit", "Insects", "Mid-century Furniture",
    "Collecting Spoons", "Cloud Watching", "Wikipedia Editing", "Geoguessr",
    "Sourdough Baking", "Mechanical Keyboards", "Fountain Pens", "Moss",
    "Train Spotting", "Dumpster Diving", "Bad Movies", "Conspiracy Theories",
    "Pottery", "Beekeeping", "Lockpicking", "Origami",
    "Dungeons & Dragons", "Analog Photography", "Synthesizers", "Birdwatching",
    "Tarot Reading", "Genealogy", "Horology (Watch Making)", "Perfume Making",
    "Hammocking at Rock Canyon", "CougarTail Consumption Metrics", 
    "Finding the best 'Dirty Soda' Combo", "Planning a Wedding in 3 Weeks", 
    "Disk Golfing at Slate Canyon", "Analyzing Twilight Imperium 4th Edition Factions",
    "Going to Eagle Mountain for the vibe", "Hiking Timp", "Skiing Sundance",
    "Pothole Identification", "Loonie/Toonie Collection", "Moose Safety", 
    "Predicting the exact moment the ice breaks"
]

# --- NAME SEEDS ---
NORMAL_NAME_ORIGINS = [
    "Modern American", "Utah County", "Classic British", "French", "Italian", "Spanish", 
    "Nature-based", "Hipster", "Germanic", "Scandinavian", "Biblical",
    "Greek Mythology", "Roman", "Slavic", "Japanese", "Korean",
    "Botanical", "Victorian", "Irish", "Arabic", "Portuguese", "Apostle-Adjacent"
]

CHAOS_NAME_ORIGINS = [
    "Cyberpunk/Sci-Fi", "Ancient Sumerian", "Space Opera", "Medieval Fantasy", 
    "Eldritch Horror", "Techno-Barbarian", "Cryptid", "Robot", "Glitch", "80s Action Hero",
    "Furniture Item", "Pharmaceutical Drug", "Unix Command", "IKEA Product", "Pokemon", 
    "Tragedeigh-style (Adding a lot of extra Y’s and H’s)"
]

import string

# --- PROMPT A: REALISTIC (95%) ---
PROMPT_NORMAL = """
You are a witty ghostwriter for a dating app.
Task: Create a **realistic**, charming, and funny profile based on these seed traits.

NAME GENERATION CONSTRAINT:
- Origin/Vibe: {name_origin}
- Must Start With Letter: {name_letter}
- Instruction: Create a normal or unique name fitting this vibe and letter.

SEEDS:
- Domain: {domain}
- Core Trait: {trait}
- Interest: {interest}

Structure:
{{
  "name": "Generated Name",
  "age": (18-25),
  "tagline": "A punchy, relatable hook.",
  "bio": "2-3 sentences. Witty and grounded. Show, don't tell.",
  "likes": ["Example A", "Example B", "Example C"], // Max 1-3 words each, related to domain, trait, and/or intrest
  "dislikes": ["Example X", "Example Y", "Example Z"], // Max 1-3 words each, related to domain, trait, and/or intrest
  "image_prompt": "A description for a **realistic portrait photo**. Cinematic lighting, shallow depth of field. Matches the Domain."
}}
Return ONLY RAW JSON.
"""

# --- PROMPT B: CHAOS (5%) ---
PROMPT_CHAOS = """
You are a surrealist first person writer.
Task: Take these seed traits and twist them into a **bizarre**, unhinged, and hilarious character.

NAME GENERATION CONSTRAINT:
- Origin/Vibe: {name_origin}
- Must Start With Letter: {name_letter}
- Instruction: Invent a strange or unexpected name fitting this vibe and letter.

SEEDS:
- Domain: {domain}
- Core Trait: {trait}
- Interest: {interest}

Structure:
{{
  "name": "Generated Name",
  "age": (18-999),
  "tagline": "A confusing or concerning hook.",
  "bio": "2-3 sentences. Absurdist humor. Unexpected logic.",
  "likes": ["Chaos Example A", "Chaos Example B"], 
  // CONSTRAINT: Abstract concepts or impossible things. Related to the bio and tagline.
  "dislikes": ["Order Example X", "Order Example Y"], 
  // CONSTRAINT: Mundane human things or specific laws of physics. Related to the bio and tagline.
  "image_prompt": "A description for a **surreal but realistic portrait photo**. Strange, unique high-fashion or avant-garde photography style."
}}
Return ONLY RAW JSON.
"""

def generate_profile_data():
    domain = random.choice(DOMAINS)
    trait = random.choice(CORE_TRAITS)
    interest = random.choice(INTERESTS)
    name_letter = random.choice(string.ascii_uppercase)
    
    # 2% Chance of Chaos
    if random.random() < 0.05:
        name_origin = random.choice(CHAOS_NAME_ORIGINS)
        prompt = PROMPT_CHAOS.format(name_origin=name_origin, name_letter=name_letter, domain=domain, trait=trait, interest=interest)
    else:
        name_origin = random.choice(NORMAL_NAME_ORIGINS)
        prompt = PROMPT_NORMAL.format(name_origin=name_origin, name_letter=name_letter, domain=domain, trait=trait, interest=interest)
    
    try:
        response = client.models.generate_content(
            model=MODEL_ID, 
            contents=prompt,
            config={
                "temperature": 1.1 
            }
        )
        
        # Parse JSON
        text = response.text
        
        # Robust Regex Extraction: Find the first JSON object block {}
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            text = match.group(0)
        else:
            # If no brackets found, it might be raw or bad. Let json.loads try, or fail.
            print(f"Warning: No JSON brackets found in response: {text[:50]}...")
        
        data = json.loads(text)
        
        if not isinstance(data, dict):
            raise ValueError(f"Parsed JSON is not a dictionary. Got {type(data)}")
            
        return data
    except Exception as e:
        print(f"Error generating text: {e}")
        import traceback
        traceback.print_exc()
        print(f"Raw response was: {response.text if 'response' in locals() else 'No response'}")
        # Fallback profile if AI fails
        return {
            "name": "Glitchy Gary",
            "age": 99,
            "tagline": "I broke the AI.",
            "bio": "Something went wrong generating me. Swipe left.",
            "image_prompt": "A glitch art portrait of a robot"
        }

def generate_image_url(prompt):
    # Use Pollinations.ai for image generation
    # Documentation: https://pollinations.ai/
    # Endpoint: https://gen.pollinations.ai/image/
    
    # URL encode the prompt
    encoded_prompt = urllib.parse.quote(prompt)
    
    # Get API key from env
    api_key = os.getenv("POLLINATIONS_API_KEY")
    
    # Construct URL using the 'gen' endpoint as requested
    base_url = "https://gen.pollinations.ai/image"
    
    # Base params
    params = [
        f"model=flux",
        f"nologo=true",
        f"private=true",
        f"width=512",
        f"height=768"
    ]

    
    if api_key:
        params.append(f"key={api_key}")
        
    query_string = "&".join(params)
    full_url = f"{base_url}/{encoded_prompt}?{query_string}"
    
    return full_url

def create_full_profile():
    # 1. Generate text
    data = generate_profile_data()
    
    # 2. Generate Image URL
    image_prompt = data.get("image_prompt", f"A photo of {data.get('name')}")
    image_url = generate_image_url(image_prompt)
    
    # 3. Add ID
    profile_id = str(uuid.uuid4())
    
    return {
        "id": profile_id,
        "data": json.dumps(data),
        "image_url": image_url
    }

if __name__ == "__main__":
    print(json.dumps(create_full_profile(), indent=2))
