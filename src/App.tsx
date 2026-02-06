import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { getProfiles, swipeProfile, type Profile } from './api';
import Card from './components/Card';
import { RefreshCw } from 'lucide-react';

function App() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMore = async () => {
    setLoading(true);
    try {
      console.log("Fetching more profiles...");
      const newProfiles = await getProfiles();
      console.log("Received profiles:", newProfiles);
      if (newProfiles.length === 0) {
        console.log("No new profiles received from API");
      }

      setProfiles(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNew = newProfiles.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
    } catch (error) {
      console.error('Failed to fetch profiles', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMore();
  }, []);

  const handleSwipe = async (direction: 'left' | 'right', id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
    const action = direction === 'right' ? 'like' : 'pass';
    await swipeProfile(id, action);
    if (profiles.length <= 3) {
      fetchMore();
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-white flex items-center justify-center overflow-hidden overscroll-none touch-none">
      {/* Dynamic Background - Keep subtle */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black z-0 pointer-events-none" />

      {/* Card Stack Container - Responsive Phone Frame */}
      <div className="relative z-10 w-full h-full md:w-[400px] md:h-[800px] md:max-h-[85vh] md:rounded-[40px] md:shadow-[0_0_50px_rgba(0,0,0,0.5)] md:overflow-hidden md:border-[8px] md:border-gray-800 bg-black flex items-center justify-center">
        <AnimatePresence>
          {profiles.length > 0 ? (
            profiles.map((profile, index) => {
              if (index > 1) return null;
              const isTop = index === 0;
              return (
                <Card
                  key={profile.id}
                  profile={profile}
                  onSwipe={(dir) => handleSwipe(dir, profile.id)}
                  style={{
                    zIndex: profiles.length - index,
                    scale: isTop ? 1 : 0.95,
                    y: isTop ? 0 : 0,
                    filter: isTop ? 'none' : 'blur(4px) brightness(0.4)',
                  }}
                />
              );
            })
          ) : (
            <div className="text-center p-8 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 shadow-2xl z-20 m-4">
              {loading ? (
                <div className="flex flex-col items-center gap-4">
                  <RefreshCw className="animate-spin w-12 h-12 text-pink-500" />
                  <p className="text-gray-400 font-medium">Finding potential matches...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <p className="text-2xl font-bold mb-2 text-white">No more profiles!</p>
                  <p className="text-gray-400 mb-6">Come back later for more.</p>
                  <button
                    onClick={() => fetchMore()}
                    className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full font-bold hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:scale-105 transition active:scale-95"
                  >
                    Reload
                  </button>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
