'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './AudioPlayer.module.scss';

interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export default function AudioPlayer({ src, title = 'Call Recording', className = '' }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setError('Failed to load audio');
      setIsLoading(false);
    };
    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        await audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setError('Failed to play audio');
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadRecording = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className={`${styles.audioPlayer} ${styles.error} ${className}`}>
        <div className={styles.errorMessage}>
          <span>❌ {error}</span>
          <button onClick={downloadRecording} className={styles.downloadBtn}>
            📥 Download
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.audioPlayer} ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <div className={styles.controls}>
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className={styles.playBtn}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? '⏳' : isPlaying ? '⏸️' : '▶️'}
        </button>

        <div className={styles.progressContainer}>
          <span className={styles.time}>{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            disabled={isLoading}
            className={styles.progressBar}
            aria-label="Seek"
          />
          <span className={styles.time}>{formatTime(duration)}</span>
        </div>

        <div className={styles.volumeContainer}>
          <span className={styles.volumeIcon}>🔊</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={volume}
            onChange={handleVolumeChange}
            className={styles.volumeBar}
            aria-label="Volume"
          />
        </div>

        <button onClick={downloadRecording} className={styles.downloadBtn} aria-label="Download recording">
          📥
        </button>
      </div>
    </div>
  );
}