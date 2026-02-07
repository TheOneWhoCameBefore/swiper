import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_ID = "gemma-3-27b-it";

// --- BROAD SEED LISTS ---
const DOMAINS = [
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
];

const CORE_TRAITS = [
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
];

const INTERESTS = [
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
];

const NORMAL_NAME_ORIGINS = [
    "Modern American", "Utah County", "Classic British", "French", "Italian", "Spanish",
    "Nature-based", "Hipster", "Germanic", "Scandinavian", "Biblical",
    "Greek Mythology", "Roman", "Slavic", "Japanese", "Korean",
    "Botanical", "Victorian", "Irish", "Arabic", "Portuguese", "Apostle-Adjacent"
];

const CHAOS_NAME_ORIGINS = [
    "Cyberpunk/Sci-Fi", "Ancient Sumerian", "Space Opera", "Medieval Fantasy",
    "Eldritch Horror", "Techno-Barbarian", "Cryptid", "Robot", "Glitch", "80s Action Hero",
    "Furniture Item", "Pharmaceutical Drug", "Unix Command", "IKEA Product", "Pokemon",
    "Tragedeigh-style (Adding a lot of extra Y’s and H’s)"
];

const PROMPT_NORMAL = `
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
`;

const PROMPT_CHAOS = `
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
`;

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function generateProfileData(): Promise<any> {
    const domain = getRandomElement(DOMAINS);
    const trait = getRandomElement(CORE_TRAITS);
    const interest = getRandomElement(INTERESTS);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const nameLetter = chars.charAt(Math.floor(Math.random() * chars.length));

    let promptTemplate = "";
    let nameOrigin = "";

    // 5% Chaos
    if (Math.random() < 0.05) {
        nameOrigin = getRandomElement(CHAOS_NAME_ORIGINS);
        promptTemplate = PROMPT_CHAOS;
    } else {
        nameOrigin = getRandomElement(NORMAL_NAME_ORIGINS);
        promptTemplate = PROMPT_NORMAL;
    }

    const prompt = promptTemplate
        .replace("{name_origin}", nameOrigin)
        .replace("{name_letter}", nameLetter)
        .replace("{domain}", domain)
        .replace("{trait}", trait)
        .replace("{interest}", interest);

    try {
        const model = genAI.getGenerativeModel({
            model: MODEL_ID,
            generationConfig: { temperature: 1.1 }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            text = jsonMatch[0];
        }

        const data = JSON.parse(text);

        if (typeof data !== 'object' || data === null) {
            throw new Error("Parsed JSON is not an object");
        }

        return data;

    } catch (error) {
        console.error("Error generating text:", error);
        return {
            name: "Glitchy Gary",
            age: 99,
            tagline: "I broke the AI.",
            bio: "Something went wrong generating me. Swipe left.",
            likes: ["Errors", "Bugs"],
            dislikes: ["Success", "Uptime"],
            image_prompt: "A glitch art portrait of a robot"
        };
    }
}

function generateImageUrl(prompt: string): string {
    const encodedPrompt = encodeURIComponent(prompt);
    const apiKey = process.env.POLLINATIONS_API_KEY;
    const baseUrl = "https://gen.pollinations.ai/image";

    const params = new URLSearchParams({
        model: "flux",
        nologo: "true",
        private: "true",
        width: "512",
        height: "768"
    });

    if (apiKey) {
        params.append("key", apiKey);
    }

    return `${baseUrl}/${encodedPrompt}?${params.toString()}`;
}

export async function createFullProfile() {
    const data = await generateProfileData();
    const imagePrompt = data.image_prompt || `A photo of ${data.name}`;
    const imageUrl = generateImageUrl(imagePrompt);

    return {
        id: crypto.randomUUID(),
        data: JSON.stringify(data),
        image_url: imageUrl
    };
}
