// Axios removed in favor of native fetch for lighter bundle

const API_URL = '/api'; // Relative path for proxy

// --- Session Management ---
// Generate a random session ID if one doesn't exist to track swipes per user.
function getSessionId(): string {
    let sessionId = localStorage.getItem('swiper_session_id');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('swiper_session_id', sessionId);
    }
    return sessionId;
}

export interface Profile {
    id: string;
    data: {
        name: string;
        age: number;
        tagline: string;
        bio: string;
        likes?: string[];
        dislikes?: string[];
        image_prompt?: string;
    };
    image_url: string;
}

export async function getProfiles(): Promise<Profile[]> {
    const sessionId = getSessionId();
    // Pass session_id to backend to filter out already swiped profiles
    const response = await fetch(`${API_URL}/profiles?session_id=${sessionId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch profiles');
    }
    return response.json();
}

export async function swipeProfile(id: string, action: 'like' | 'pass'): Promise<void> {
    const sessionId = getSessionId();
    const response = await fetch(`${API_URL}/swipe`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            id,
            action,
            session_id: sessionId
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to swipe profile');
    }
}
