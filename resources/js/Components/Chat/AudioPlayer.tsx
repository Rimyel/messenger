import { FC, useState, useRef } from "react";
import { Download, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
    src: string;
    filename: string;
    fileSize: number;
    isOwn?: boolean;
}

const AudioPlayer: FC<AudioPlayerProps> = ({
    src,
    filename,
    fileSize,
    isOwn,
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <div
            className={cn(
                "flex items-center gap-2 p-2 rounded-lg",
                "transition-colors",
                {
                    "hover:bg-white/10": isOwn,
                    "hover:bg-black/10": !isOwn,
                }
            )}
        >
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />
            <button
                onClick={handlePlayPause}
                className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    "bg-primary text-primary-foreground",
                    "hover:bg-primary/90 transition-colors"
                )}
            >
                {isPlaying ? (
                    <Pause className="h-4 w-4" />
                ) : (
                    <Play className="h-4 w-4" />
                )}
            </button>

            <div className="flex-1 min-w-0">
                <div className="truncate text-sm">{filename}</div>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 h-1 bg-black/10 rounded-full overflow-hidden">
                        <div
                            className="absolute h-full bg-white/30"
                            style={{
                                width: `${(currentTime / duration) * 100}%`,
                            }}
                        />
                    </div>
                    <span className="text-xs opacity-70">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>
                <div className="text-xs opacity-70">
                    {(fileSize / 1024 / 1024).toFixed(2)} MB
                </div>
            </div>

            <a
                href={src}
                download={filename}
                className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
            >
                <Download className="h-4 w-4" />
            </a>
        </div>
    );
};

export default AudioPlayer;
