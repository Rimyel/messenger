"use client"

import * as React from "react"
import { Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from "lucide-react"

import { cn } from "@/lib/utils"
import { Slider } from "@/Components/ui/slider"
import { MessageMedia } from "@/types/chat"

const getVideoUrl = (path: string) => {
  // Получаем публичный URL для файла из storage
  const publicPath = path.replace('/storage/', '/storage/');
  return `${publicPath}`;
}

interface VideoPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  src: MessageMedia
  poster?: string
  autoPlay?: boolean
  muted?: boolean
  className?: string
}

export function VideoPlayer({ src, poster, autoPlay = false, muted = false, className, ...props }: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolume] = React.useState(1)
  const [isMuted, setIsMuted] = React.useState(muted)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isBuffering, setIsBuffering] = React.useState(false)
  const [isControlsVisible, setIsControlsVisible] = React.useState(true)
  const [isHovering, setIsHovering] = React.useState(false)
  const controlsTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current && value[0] >= 0 && value[0] <= duration) {
      const time = value[0]
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0]
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted
      videoRef.current.muted = newMutedState
      setIsMuted(newMutedState)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((error: Error) => {
        console.error(`Error attempting to enable fullscreen: ${error.message}`)
      })
    } else {
      document.exitFullscreen()
    }
  }

  const showControls = () => {
    setIsControlsVisible(true)

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }

    if (isPlaying && !isHovering) {
      controlsTimeoutRef.current = setTimeout(() => {
        setIsControlsVisible(false)
      }, 3000)
    }
  }

  React.useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onTimeUpdate = () => setCurrentTime(video.currentTime)
    const onLoadedMetadata = () => setDuration(video.duration)
    const onWaiting = () => setIsBuffering(true)
    const onPlaying = () => setIsBuffering(false)
    const onVolumeChange = () => {
      setVolume(video.volume)
      setIsMuted(video.muted)
    }
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    video.addEventListener("play", onPlay)
    video.addEventListener("pause", onPause)
    video.addEventListener("timeupdate", onTimeUpdate)
    video.addEventListener("loadedmetadata", onLoadedMetadata)
    video.addEventListener("waiting", onWaiting)
    video.addEventListener("playing", onPlaying)
    video.addEventListener("volumechange", onVolumeChange)
    document.addEventListener("fullscreenchange", onFullscreenChange)

    return () => {
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", onPause)
      video.removeEventListener("timeupdate", onTimeUpdate)
      video.removeEventListener("loadedmetadata", onLoadedMetadata)
      video.removeEventListener("waiting", onWaiting)
      video.removeEventListener("playing", onPlaying)
      video.removeEventListener("volumechange", onVolumeChange)
      document.removeEventListener("fullscreenchange", onFullscreenChange)
    }
  }, [])

  React.useEffect(() => {
    showControls()

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-lg bg-black",
        isFullscreen ? "h-screen w-screen" : "aspect-video w-full max-w-full",
        className,
      )}
      onMouseMove={showControls}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={togglePlay}
      {...props}
    >
      <video
        ref={videoRef}
        src={getVideoUrl(src.link)}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        className="h-full w-full object-contain"
      />

      {isBuffering && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      )}

      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-2 pt-10 transition-opacity duration-300",
          isControlsVisible ? "opacity-100" : "opacity-0",
        )}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="mb-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.01}
            onValueChange={handleSeek}
            className="h-1.5"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            <div className="text-xs text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <button
                onClick={toggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>

            <button
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}