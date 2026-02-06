import React, { useState } from 'react';
import { motion, type PanInfo, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { type Profile } from '../api';
import { ChevronUp, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface CardProps {
    profile: Profile;
    onSwipe: (direction: 'right' | 'left') => void;
    style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ profile, onSwipe, style }) => {
    const x = useMotionValue(0);
    const controls = useAnimation();
    const [showDetails, setShowDetails] = useState(false);

    // Rotation based on X movement
    const rotate = useTransform(x, [-200, 200], [-10, 10]);

    // Opacity for fading out when swiped far
    const opacity = useTransform(x, [-300, -200, 0, 200, 300], [0, 1, 1, 1, 0]);

    // Swipe indicators opacity
    const likeOpacity = useTransform(x, [20, 150], [0, 1]);
    const nopeOpacity = useTransform(x, [-20, -150], [0, 1]);

    // Hint Opacity (fade out hints when dragging)
    const cuesOpacity = useTransform(x, [-50, 0, 50], [0, 1, 0]);

    const handleDragEnd = async (_: any, info: PanInfo) => {
        const offset = info.offset;
        const velocity = info.velocity;

        // Swipe Left / Right Logic
        if (Math.abs(offset.x) > 100) {
            const direction = offset.x > 0 ? 'right' : 'left';
            onSwipe(direction);
        } else if (offset.y < -50 || velocity.y < -500) {
            // Swipe Up Logic - Show Details
            setShowDetails(true);
            controls.start({ x: 0, y: 0 });
        } else if (offset.y > 50 || velocity.y > 500) {
            // Swipe Down Logic - Hide Details
            setShowDetails(false);
            controls.start({ x: 0, y: 0 });
        } else {
            controls.start({ x: 0, y: 0 });
        }
    };

    const handleDetailsDragEnd = (_: any, info: PanInfo) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
            setShowDetails(false);
        }
    };

    // Handle generic pan to detect swipe up since drag is locked to X
    const handlePanEnd = (_: any, info: PanInfo) => {
        const { offset, velocity } = info;
        // If mostly vertical and upwards
        if (!showDetails && (offset.y < -50 || velocity.y < -500) && Math.abs(offset.x) < 100) {
            setShowDetails(true);
        }
    };

    return (
        <motion.div
            style={{ x, rotate, opacity, ...style }} // Removed 'y' to prevent vertical movement of the card
            animate={controls}
            drag={!showDetails ? "x" : false} // Only drag horizontally
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={handleDragEnd}
            onPanEnd={handlePanEnd}
            className="absolute w-full h-full rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 bg-gray-900"
        >
            {/* Full Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out"
                style={{
                    backgroundImage: `url(${profile.image_url})`,
                    transform: showDetails ? 'scale(1.1)' : 'scale(1)'
                }}
            />

            {/* Gradient Overlay - Stronger at bottom for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent via-50% to-black pointer-events-none" />

            {/* Side Swipe Cues */}
            <motion.div style={{ opacity: cuesOpacity }} className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none z-20">
                <div className="bg-black/20 backdrop-blur-sm p-1 rounded-full animate-pulse">
                    <ChevronLeft className="w-8 h-8 text-white/50" />
                </div>
            </motion.div>
            <motion.div style={{ opacity: cuesOpacity }} className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none z-20">
                <div className="bg-black/20 backdrop-blur-sm p-1 rounded-full animate-pulse">
                    <ChevronRight className="w-8 h-8 text-white/50" />
                </div>
            </motion.div>

            {/* Swipe Choice Indicators */}
            <motion.div style={{ opacity: likeOpacity }} className="absolute top-10 left-8 -rotate-12 border-4 border-green-400 rounded-xl p-2 z-20 bg-black/20 backdrop-blur-sm">
                <span className="text-4xl font-black text-green-400 uppercase tracking-widest drop-shadow-lg">LIKE</span>
            </motion.div>
            <motion.div style={{ opacity: nopeOpacity }} className="absolute top-10 right-8 rotate-12 border-4 border-red-500 rounded-xl p-2 z-20 bg-black/20 backdrop-blur-sm">
                <span className="text-4xl font-black text-red-500 uppercase tracking-widest drop-shadow-lg">NOPE</span>
            </motion.div>

            {/* Main Content Layer */}
            <div className="absolute inset-0 flex flex-col justify-end z-10 p-6 pointer-events-none">

                {/* Collapsed State Content */}
                <motion.div
                    animate={{ opacity: showDetails ? 0 : 1, y: showDetails ? -50 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-8"
                >
                    <div className="flex flex-wrap items-end gap-3 mb-4">
                        <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-[0_4px_4px_rgba(0,0,0,1)]">{profile.data.name}</h2>
                        <span className="text-2xl font-medium text-white/90 mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{profile.data.age}</span>
                    </div>

                    {/* Likes / Dislikes Preview */}
                    <div className="space-y-3 mb-2">
                        {profile.data.likes && profile.data.likes.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {profile.data.likes.slice(0, 3).map((like, i) => (
                                    <span key={i} className="px-3 py-1 bg-green-500/20 backdrop-blur-md rounded-full border border-green-500/30 text-xs font-bold text-green-100 uppercase tracking-wide shadow-sm">
                                        {like}
                                    </span>
                                ))}
                            </div>
                        )}
                        {profile.data.dislikes && profile.data.dislikes.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {profile.data.dislikes.slice(0, 3).map((dislike, i) => (
                                    <span key={i} className="px-3 py-1 bg-red-500/20 backdrop-blur-md rounded-full border border-red-500/30 text-xs font-bold text-red-100 uppercase tracking-wide shadow-sm">
                                        {dislike}
                                    </span>
                                ))}
                            </div>
                        )}
                        {!profile.data.likes && !profile.data.dislikes && (
                            <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/10 inline-block">
                                <p className="text-sm font-semibold text-white tracking-wide">
                                    {profile.data.tagline.split(' ').slice(0, 3).join(' ')}...
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-center mt-6 opacity-80 animate-bounce">
                        <ChevronUp className="w-6 h-6 text-white drop-shadow-md" />
                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-bold drop-shadow-md">Details</span>
                    </div>
                </motion.div>
            </div>

            {/* Details Overlay (Swipe Up Reveal) */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: showDetails ? '0%' : '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.2 }} // Easier to pull down
                onDragEnd={handleDetailsDragEnd}
                className="absolute inset-x-0 bottom-0 h-[90%] bg-black/85 backdrop-blur-2xl border-t border-white/10 rounded-t-[32px] p-8 z-30 flex flex-col"
                onPointerDown={(e) => e.stopPropagation()}
            >
                {/* Drag handle */}
                <div
                    className="w-16 h-2 bg-white/30 rounded-full mx-auto mb-8 cursor-pointer hover:bg-white/50 transition-colors shrink-0"
                    onClick={() => setShowDetails(false)}
                />

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Header: Name & Age - Fixed alignment */}
                    <div className="flex flex-wrap items-baseline gap-3 mb-6">
                        <h2 className="text-4xl font-bold text-white leading-tight">{profile.data.name}</h2>
                        <span className="text-2xl text-white/60 font-medium whitespace-nowrap">{profile.data.age}</span>
                    </div>

                    <p className="text-xl text-pink-400 font-medium italic mb-8 leading-relaxed">
                        "{profile.data.tagline}"
                    </p>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                <Info className="w-4 h-4" /> About Me
                            </h3>
                            <p className="text-white/90 leading-relaxed text-lg font-light">
                                {profile.data.bio}
                            </p>
                        </div>

                        {/* Likes / Dislikes here too for completeness? User removed them before. Keeping removed. */}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Card;
