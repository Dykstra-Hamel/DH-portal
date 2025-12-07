'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './AudioPlayer.module.scss';

interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export default function AudioPlayer({
  src,
  title = 'Call Recording',
  className = '',
}: AudioPlayerProps) {
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
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="35" height="35" transform="translate(0.789795 0.431396)" fill="#F8F9FA"/>
              <path d="M18.2898 20.3857V8.93115M18.2898 20.3857L22.3807 16.2948M18.2898 20.3857L14.1989 16.2948M27.2898 20.3857V26.9312H9.28979V20.3857" stroke="#006BC2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download
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
          {isLoading ? (
            '⏳'
          ) : isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38" fill="none">
              <rect width="37" height="37" transform="translate(0.5 0.191406)" fill="#F8F9FA"/>
              <path d="M19 4.69165C22.7118 4.69557 26.2708 6.17148 28.8955 8.79614C31.5202 11.4208 32.9961 14.9798 33 18.6917C33 21.4604 32.1788 24.1668 30.6406 26.469C29.1023 28.7713 26.9156 30.5666 24.3574 31.6262C21.7994 32.6857 18.9841 32.9623 16.2686 32.4221C13.553 31.8819 11.0584 30.5489 9.10059 28.5911C7.14275 26.6332 5.80978 24.1387 5.26953 21.4231C4.72937 18.7075 5.00595 15.8923 6.06543 13.3342C7.12506 10.7761 8.92037 8.58937 11.2227 7.05103C13.5248 5.51283 16.2312 4.69168 19 4.69165ZM14.7051 12.9641C14.4519 12.9641 14.2083 13.0644 14.0293 13.2434C13.8503 13.4224 13.75 13.6661 13.75 13.9192V23.4641C13.75 23.7171 13.8505 23.9599 14.0293 24.1389C14.2083 24.3179 14.4519 24.4192 14.7051 24.4192H17.0908C17.3439 24.4192 17.5866 24.3179 17.7656 24.1389C17.9446 23.9599 18.0459 23.7173 18.0459 23.4641V13.9192C18.0459 13.666 17.9446 13.4224 17.7656 13.2434C17.5866 13.0646 17.3438 12.9641 17.0908 12.9641H14.7051ZM20.9092 12.9641C20.6561 12.9641 20.4134 13.0645 20.2344 13.2434C20.0554 13.4224 19.9551 13.666 19.9551 13.9192V23.4641C19.9551 23.7172 20.0554 23.9599 20.2344 24.1389C20.4134 24.3179 20.656 24.4192 20.9092 24.4192H23.2959C23.549 24.4191 23.7918 24.3179 23.9707 24.1389C24.1496 23.9599 24.25 23.7172 24.25 23.4641V13.9192C24.25 13.666 24.1497 13.4224 23.9707 13.2434C23.7918 13.0645 23.5489 12.9642 23.2959 12.9641H20.9092Z" fill="#0087F5"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38" fill="none">
              <g clipPath="url(#clip0_1301_3822)">
                <rect width="37" height="37" transform="translate(0.789795 0.431396)" fill="#F8F9FA"/>
                <path d="M19.2898 4.9314C16.5209 4.9314 13.8141 5.75248 11.5118 7.29082C9.20953 8.82916 7.41511 11.0157 6.35549 13.5738C5.29586 16.132 5.01861 18.9469 5.55881 21.6627C6.099 24.3784 7.43237 26.873 9.39031 28.8309C11.3482 30.7888 13.8428 32.1222 16.5585 32.6624C19.2743 33.2026 22.0892 32.9253 24.6474 31.8657C27.2055 30.8061 29.392 29.0117 30.9304 26.7094C32.4687 24.4071 33.2898 21.7003 33.2898 18.9314C33.2859 15.2196 31.8096 11.6609 29.185 9.03623C26.5603 6.41157 23.0016 4.93532 19.2898 4.9314ZM24.7485 19.8172L17.7485 24.6633C17.5869 24.7751 17.3978 24.8405 17.2017 24.8525C17.0055 24.8644 16.8099 24.8225 16.6359 24.7313C16.4619 24.6401 16.3161 24.503 16.2145 24.3349C16.1128 24.1668 16.059 23.974 16.059 23.7775V14.0852C16.059 13.8888 16.1128 13.696 16.2145 13.5279C16.3161 13.3598 16.4619 13.2227 16.6359 13.1315C16.8099 13.0402 17.0055 12.9983 17.2017 13.0103C17.3978 13.0223 17.5869 13.0877 17.7485 13.1995L24.7485 18.0456C24.8917 18.1447 25.0088 18.2771 25.0897 18.4313C25.1706 18.5856 25.2129 18.7572 25.2129 18.9314C25.2129 19.1056 25.1706 19.2772 25.0897 19.4315C25.0088 19.5857 24.8917 19.7181 24.7485 19.8172Z" fill="#006BC2"/>
              </g>
              <defs>
                <clipPath id="clip0_1301_3822">
                  <rect width="37" height="37" fill="white" transform="translate(0.789795 0.431396)"/>
                </clipPath>
              </defs>
            </svg>
          )}
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

        <button
          onClick={downloadRecording}
          className={styles.downloadBtn}
          aria-label="Download recording"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="35" height="35" transform="translate(0.789795 0.431396)" fill="#F8F9FA"/>
            <path d="M18.2898 20.3857V8.93115M18.2898 20.3857L22.3807 16.2948M18.2898 20.3857L14.1989 16.2948M27.2898 20.3857V26.9312H9.28979V20.3857" stroke="#006BC2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
