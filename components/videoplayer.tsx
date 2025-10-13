'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Settings, Maximize2, Minimize2, Volume2, VolumeX, Subtitles } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'motion/react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
  onRef?: (ref: React.RefObject<HTMLVideoElement | null>) => void;
  chapters?: string;
  thumbnails?: string;
  subtitles?: string;
}

const parseTimeToSeconds = (timeString: string): number => {
  const parts = timeString.split(':');
  const hours = parseInt(parts[0]);
  const minutes = parseInt(parts[1]);
  const seconds = parseFloat(parts[2]);
  return hours * 3600 + minutes * 60 + seconds;
};

export function VideoPlayer({
  src,
  poster,
  title,
  className,
  onRef,
  chapters,
  thumbnails,
  subtitles,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [chaptersList, setChaptersList] = useState<Array<{start: number, end: number, title: string}>>([]);
  const [currentChapter, setCurrentChapter] = useState<string>('');
  const [showThumbnail, setShowThumbnail] = useState(false);
  const [thumbnailTime, setThumbnailTime] = useState(0);
  const [thumbnailPosition, setThumbnailPosition] = useState(0);
  const [thumbnailData, setThumbnailData] = useState<Array<{start: number, end: number, url: string, coords: string}>>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [subtitleTrack, setSubtitleTrack] = useState<TextTrack | null>(null);
  const [captionMode, setCaptionMode] = useState<'off' | 'english'>('english');
  const [manualSubtitles, setManualSubtitles] = useState<Array<{start: number, end: number, text: string}>>([]);
  const [isMouseActive, setIsMouseActive] = useState(true);
  const [mouseTimeout, setMouseTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (onRef) {
      onRef(videoRef);
    }
  }, [onRef]);

  // Add fullscreen event listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Load chapters if provided
  useEffect(() => {
    if (chapters) {
      parseChapters(chapters);
    }
  }, [chapters]);

  // Ensure chapters are available even before video loads
  useEffect(() => {
    if (chapters && chaptersList.length === 0) {
      parseChapters(chapters);
    }
  }, [chapters, chaptersList.length]);

  // Load thumbnails if provided
  useEffect(() => {
    if (thumbnails) {
      parseThumbnails(thumbnails);
    }
  }, [thumbnails]);

  // Test VTT file loading and manual parsing
  useEffect(() => {
    if (subtitles) {
      fetch(subtitles)
        .then(response => response.text())
        .then(text => {
          // Manually parse VTT and create cues
          const lines = text.split('\n');
          const cues: Array<{start: number, end: number, text: string}> = [];
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('-->')) {
              const timeRange = line.split(' --> ');
              if (timeRange.length === 2) {
                const startTime = parseTimeToSeconds(timeRange[0].trim());
                const endTime = parseTimeToSeconds(timeRange[1].trim());
                
                // Get the subtitle text from the next line
                if (i + 1 < lines.length) {
                  const subtitleText = lines[i + 1].trim();
                  if (subtitleText && !subtitleText.includes('-->')) {
                    cues.push({ start: startTime, end: endTime, text: subtitleText });
                  }
                }
              }
            }
          }
          
          // Store parsed cues for manual display
          if (cues.length > 0) {
            setManualSubtitles(cues);
          }
        })
        .catch(error => {
          console.error('Error loading VTT file:', error);
        });
    }
  }, [subtitles, parseTimeToSeconds]);

  // Ensure subtitle track is properly set up
  useEffect(() => {
    if (videoRef.current && subtitles && videoRef.current.textTracks.length > 0) {
      // Find the subtitle track (not the chapters track)
      const subtitleTrack = Array.from(videoRef.current.textTracks).find(track => track.kind === 'subtitles');
      
      if (subtitleTrack) {
        subtitleTrack.mode = captionMode === 'off' ? 'hidden' : 'showing';
        setSubtitleTrack(subtitleTrack);
        
        // Remove existing listener and add new one
        subtitleTrack.removeEventListener('cuechange', handleSubtitleCueChange);
        subtitleTrack.addEventListener('cuechange', handleSubtitleCueChange);

        return () => {
          subtitleTrack.removeEventListener('cuechange', handleSubtitleCueChange);
        };
      }
    }
  }, [subtitles, captionMode]);

  // Mouse activity handling
  const handleMouseMove = React.useCallback(() => {
    setIsMouseActive(true);
    
    // Clear existing timeout
    if (mouseTimeout) {
      clearTimeout(mouseTimeout);
    }
    
    // Set new timeout to hide controls after 3 seconds (only if video is playing)
    const timeout = setTimeout(() => {
      if (isPlaying) {
        setIsMouseActive(false);
      }
    }, 3000);
    
    setMouseTimeout(timeout);
  }, [mouseTimeout, isPlaying]);

  const handleMouseLeave = () => {
    // Only hide controls on mouse leave if video is playing
    if (isPlaying) {
      setIsMouseActive(false);
    }
    if (mouseTimeout) {
      clearTimeout(mouseTimeout);
    }
  };

  // Always show controls when video is paused or hasn't started
  const shouldShowControls = isMouseActive || !isPlaying;

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else {
        setIsMuted(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleSubtitleCueChange = React.useCallback(() => {
    if (subtitleTrack && subtitleTrack.activeCues && subtitleTrack.activeCues.length > 0) {
      const cue = subtitleTrack.activeCues[0] as VTTCue;
      setCurrentSubtitle(cue.text);
    } else {
      setCurrentSubtitle('');
    }
  }, [subtitleTrack]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setDuration(total);
      setProgress((current / total) * 100);
      
      // Update current chapter
      const chapter = getCurrentChapter(current);
      
      if (chapter !== currentChapter) {
        setCurrentChapter(chapter);
      }
      
      // Update manual subtitle
      if (manualSubtitles.length > 0) {
        const currentSubtitle = manualSubtitles.find(sub => 
          current >= sub.start && current <= sub.end
        );
        if (currentSubtitle) {
          setCurrentSubtitle(currentSubtitle.text);
        } else {
          setCurrentSubtitle('');
        }
      }
    }
  };

  const handleCaptionModeChange = (mode: 'off' | 'english') => {
    setCaptionMode(mode);
    if (subtitleTrack) {
      subtitleTrack.mode = mode === 'off' ? 'hidden' : 'showing';
    }
    setShowSettings(false);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      
      // Set up subtitle track
      if (subtitles && videoRef.current.textTracks.length > 0) {
        // Find the subtitle track (not the chapters track)
        const subtitleTrack = Array.from(videoRef.current.textTracks).find(track => track.kind === 'subtitles');
        
        if (subtitleTrack) {
          subtitleTrack.mode = captionMode === 'off' ? 'hidden' : 'showing';
          setSubtitleTrack(subtitleTrack);
          
          // Listen for subtitle cues
          subtitleTrack.addEventListener('cuechange', handleSubtitleCueChange);
        }
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const parseChapters = async (chaptersUrl: string) => {
    try {
      const response = await fetch(chaptersUrl);
      const text = await response.text();
      const lines = text.split('\n');
      const chapters: Array<{start: number, end: number, title: string}> = [];
      
      let i = 0;
      while (i < lines.length) {
        const line = lines[i].trim();
        
        // Skip empty lines and WEBVTT header
        if (!line || line === 'WEBVTT' || line.startsWith('NOTE')) {
          i++;
          continue;
        }
        
        // Check if this line contains a time range
        if (line.includes('-->')) {
          const timeRange = line.split(' --> ');
          if (timeRange.length === 2) {
            const startTime = parseTimeToSeconds(timeRange[0].trim());
            const endTime = parseTimeToSeconds(timeRange[1].trim());
            
            // Look for the title in the next few lines
            let title = '';
            let j = i + 1;
            while (j < lines.length && j < i + 5) { // Look up to 5 lines ahead
              const nextLine = lines[j].trim();
              if (nextLine && !nextLine.includes('-->') && !nextLine.match(/^\d+$/)) {
                title = nextLine;
                break;
              }
              j++;
            }
            
            if (title) {
              chapters.push({ start: startTime, end: endTime, title });
            }
          }
        }
        
        i++;
      }
      
      // Sort chapters by start time and fix overlapping ranges
      chapters.sort((a, b) => a.start - b.start);
      
      // If chapters have overlapping end times, adjust them
      for (let i = 0; i < chapters.length - 1; i++) {
        if (chapters[i].end > chapters[i + 1].start) {
          chapters[i].end = chapters[i + 1].start;
        }
      }
      
      // Ensure the last chapter has a proper end time if not specified
      if (chapters.length > 0 && chapters[chapters.length - 1].end <= chapters[chapters.length - 1].start) {
        chapters[chapters.length - 1].end = chapters[chapters.length - 1].start + 60; // Add 1 minute if no end time
      }
      
      setChaptersList(chapters);
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  };

  const parseThumbnails = async (thumbnailsUrl: string) => {
    try {
      const response = await fetch(thumbnailsUrl);
      const text = await response.text();
      const lines = text.split('\n');
      const thumbnails: Array<{start: number, end: number, url: string, coords: string}> = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('-->')) {
          const timeRange = line.split(' --> ');
          const startTime = parseTimeToSeconds(timeRange[0]);
          const endTime = parseTimeToSeconds(timeRange[1]);
          
          // Get the thumbnail data from the next line
          if (i + 1 < lines.length) {
            const thumbnailLine = lines[i + 1].trim();
            if (thumbnailLine && !thumbnailLine.includes('-->')) {
              // Extract the base URL and coordinates
              const parts = thumbnailLine.split('#xywh=');
              const baseUrl = parts[0];
              const coords = parts[1] || '';
              
              thumbnails.push({ 
                start: startTime, 
                end: endTime, 
                url: baseUrl,
                coords: coords
              });
            }
          }
        }
      }
      
      setThumbnailData(thumbnails);
    } catch (error) {
      console.error('Error loading thumbnails:', error);
    }
  };



  const getCurrentChapter = (currentTime: number): string => {
    // If no chapters loaded, return empty
    if (chaptersList.length === 0) {
      return '';
    }
    
    // For overlapping chapters, find the most specific one (smallest time range)
    let bestChapter = null;
    let smallestRange = Infinity;
    
    for (const chapter of chaptersList) {
      if (currentTime >= chapter.start && currentTime <= chapter.end) {
        const range = chapter.end - chapter.start;
        if (range < smallestRange) {
          smallestRange = range;
          bestChapter = chapter;
        }
      }
    }
    
    if (bestChapter) {
      return bestChapter.title;
    }
    
    // If no exact match, find the closest chapter
    // Find the next chapter that starts after current time
    const nextChapter = chaptersList.find(ch => ch.start > currentTime);
    if (nextChapter) {
      // Return the previous chapter if we're between chapters
      const currentIndex = chaptersList.findIndex(ch => ch === nextChapter);
      if (currentIndex > 0) {
        return chaptersList[currentIndex - 1].title;
      }
    } else {
      // If we're past all chapters, return the last chapter
      return chaptersList[chaptersList.length - 1].title;
    }
    
    // If we're before the first chapter, return the first chapter
    if (currentTime < chaptersList[0].start) {
      return chaptersList[0].title;
    }
    
    return '';
  };

  const getThumbnailForTime = (time: number): {url: string, coords: string} | null => {
    const thumbnail = thumbnailData.find(t => time >= t.start && time <= t.end);
    return thumbnail ? { url: thumbnail.url, coords: thumbnail.coords } : null;
  };

  const getFullThumbnailUrl = (relativeUrl: string): string => {
    // Extract the base URL from the thumbnails prop
    const baseUrl = thumbnails?.split('/').slice(0, -1).join('/') || '';
    return `${baseUrl}/${relativeUrl}`;
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (thumbnails && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = clickX / width;
      const time = percentage * duration;
      
      setThumbnailTime(time);
      setThumbnailPosition(percentage * 100);
      setShowThumbnail(true);
    }
  };

  const handleProgressMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (thumbnails && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = clickX / width;
      const time = percentage * duration;
      
      setThumbnailTime(time);
      setThumbnailPosition(percentage * 100);
    }
  };

  const handleProgressLeave = () => {
    setShowThumbnail(false);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = clickX / width;
      const newTime = percentage * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress(percentage * 100);
    }
  };

  return (
    <div 
      className={cn(
        "w-full aspect-video",
        "bg-black border-black rounded-2xl overflow-hidden shadow-xl",
        "relative",
        className
      )} 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        playsInline
      >
        <source src={src} type="video/mp4" />
        {chapters && (
          <track 
            kind="chapters" 
            src={chapters} 
            label="Chapters" 
            default
          />
        )}
        {thumbnails && (
          <track 
            kind="metadata" 
            src={thumbnails} 
            label="Thumbnails"
          />
        )}
        {subtitles && (
          <track 
            kind="subtitles" 
            src={subtitles} 
            label="English" 
            srcLang="en"
            default
          />
        )}
      </video>

      {/* Title - animates up */}
      <AnimatePresence>
        {title && shouldShowControls && (
          <motion.div 
            className="absolute top-4 left-8 bg-white shadow-2xl border-black px-4 py-2 rounded-2xl"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h1 className="text-sm font-bold">{title}</h1>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Current Chapter Title - animates left */}
      <AnimatePresence>
        {currentChapter && shouldShowControls && (
          <motion.div 
            className="absolute top-20 left-8 rounded-2xl bg-white border-2 border-black px-4 py-2 opacity-90 shadow-lg"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <h1 className="text-sm font-bold">{currentChapter}</h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtitle Display - animates down when controls are hidden */}
      <AnimatePresence>
        {currentSubtitle && captionMode !== 'off' && (
          <motion.div 
            className="absolute left-0 right-0 bottom-0 flex justify-center items-center px-4 z-10"
            style={{ 
              marginBottom: shouldShowControls ? '6rem' : '2rem'
            }}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
          >
            <div className="inline-block rounded-2xl bg-white/50 bg-opacity-75 text-black px-4 py-2 border-2 border-black max-w-4xl text-center">
              <h1 className="text-sm">{currentSubtitle}</h1>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      

      

      
      {/* Custom Control Bar - animates down */}
      <AnimatePresence>
        {shouldShowControls && (
          <motion.div 
            className="absolute bottom-0 left-0 right-0 p-5 pr-10 pl-10 rounded-2xl"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="bg-white p-3 border-2 border-black rounded-2xl">
              <div className="flex items-center justify-between">
                {/* Play/Pause Button */}
                <button 
                  onClick={togglePlay}
                  className="bg-white border-2 border-black p-2 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 text-black" />
                  ) : (
                    <Play className="w-4 h-4 text-black" />
                  )}
                </button>
                
                {/* Progress Bar with Time */}
                <div className="flex-1 mx-4 flex items-center gap-2">
                  {/* Current Time */}
                  <span className="text-black font-mono text-sm">
                    {formatTime(currentTime)}
                  </span>
                  
                  {/* Progress Bar */}
                  <div className="flex-1">
                    <div 
                      className="w-full bg-gray-300 border-2 border-black h-4 cursor-pointer relative"
                      onClick={handleProgressClick}
                      onMouseEnter={handleProgressHover}
                      onMouseMove={handleProgressMove}
                      onMouseLeave={handleProgressLeave}
                    >
                      <div 
                        className="bg-green-400 h-full" 
                        style={{ width: `${progress}%` }}
                      ></div>
                      
                      {/* Chapter Markers */}
                      {chaptersList.length > 0 && chaptersList.map((chapter, index) => {
                        // Skip the first marker (start of first chapter)
                        if (index === 0) return null;
                        
                        // Use a fallback duration if video hasn't loaded yet
                        const effectiveDuration = duration || chaptersList[chaptersList.length - 1]?.end || 1;
                        const chapterStartPercent = (chapter.start / effectiveDuration) * 100;
                        
                        return (
                          <div
                            key={index}
                            className="absolute top-0 bottom-0 w-0.5 bg-black"
                            style={{ 
                              left: `${chapterStartPercent}%`,
                              transform: 'translateX(-50%)'
                            }}
                          />
                        );
                      })}
                      
                      {/* Thumbnail Preview */}
                      {showThumbnail && thumbnails && (
                        <div 
                          className="absolute bottom-full mb-2 transform -translate-x-1/2 z-50"
                          style={{ left: `${thumbnailPosition}%` }}
                        >
                          <div className="bg-white border-2 border-black p-1 rounded-2xl w-40">
                            {(() => {
                              const thumbnail = getThumbnailForTime(thumbnailTime);
                              const chapterAtTime = getCurrentChapter(thumbnailTime);
                              
                              if (thumbnail) {
                                const fullImageUrl = getFullThumbnailUrl(thumbnail.url);
                                
                                // Parse coordinates: x,y,width,height
                                const [x, y, width, height] = thumbnail.coords.split(',').map(Number);
                                
                                return (
                                  <>
                                    <div className="relative w-full h-24 bg-gray-20 rounded-2xl overflow-hidden">
                                      <div className="w-40 h-20 rounded-2xl relative overflow-hidden"
                                      style={{
                                        backgroundImage: `url(${fullImageUrl})`,
                                        backgroundPosition: `-${x}px -${y-3}px`,
                                        backgroundSize: `auto`,
                                        backgroundRepeat: 'no-repeat'
                                      }} />
                                      </div>
                                    <div className="text-center mt-1 space-y-1">
                                      <div className="text-black font-mono text-xs">
                                        {formatTime(thumbnailTime)}
                                      </div>
                                      {chapterAtTime && (
                                        <div className="text-black font-mono text-xs  px-1 py-0.5 w-full">
                                          <div className="text-xs leading-tight break-words" style={{ minHeight: '1.5rem' }} title={chapterAtTime}>
                                            {chapterAtTime}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                );
                              }
                              
                              return (
                                <div className="w-40 h-24 bg-gray-200 flex items-center justify-center">
                                  <span className="text-black font-mono text-xs">No thumbnail</span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Total Time */}
                  <span className="text-black font-mono text-sm">
                    {formatTime(duration)}
                  </span>
                </div>
                
                {/* Settings Button */}
                <div className="relative">
                  <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="bg-white border-2 border-black p-2 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-black" />
                  </button>
                  
                  {/* Settings Popover */}
                  {showSettings && (
                    <div className="absolute bottom-12 right-0 mb-2 bg-white border-2 border-black p-3 min-w-[200px] z-[2000]">
                      {/* Volume Control */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-black font-mono text-sm">Volume</span>
                          <button 
                            onClick={toggleMute}
                            className="bg-white border-2 border-black p-1 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            {isMuted || volume === 0 ? (
                              <VolumeX className="w-3 h-3 text-black" />
                            ) : (
                              <Volume2 className="w-3 h-3 text-black" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-gray-300 border-2 border-black cursor-pointer"
                          />
                          <span className="text-black font-mono text-xs w-8">
                            {Math.round((isMuted ? 0 : volume) * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Captions */}
                      {subtitles && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-mono text-sm">Captions</span>
                            <Subtitles className="w-3 h-3 text-black" />
                          </div>
                          <div className="space-y-1">
                            <button 
                              onClick={() => handleCaptionModeChange('off')}
                              className={`w-full text-left border-2 border-black p-1 transition-colors cursor-pointer ${
                                captionMode === 'off' 
                                  ? 'bg-black text-white' 
                                  : 'bg-white text-black hover:bg-gray-100'
                              }`}
                            >
                              <span className="font-mono text-xs">Off</span>
                            </button>
                            <button 
                              onClick={() => handleCaptionModeChange('english')}
                              className={`w-full text-left border-2 border-black p-1 transition-colors cursor-pointer ${
                                captionMode === 'english' 
                                  ? 'bg-black text-white' 
                                  : 'bg-white text-black hover:bg-gray-100'
                              }`}
                            >
                              <span className="font-mono text-xs">English</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Fullscreen Button */}
                <button 
                  onClick={toggleFullscreen}
                  className="bg-white border-2 border-black p-2 hover:bg-gray-100 transition-colors cursor-pointer ml-2"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4 text-black" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-black" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
