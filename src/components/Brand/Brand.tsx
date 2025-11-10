'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './Brand.module.scss';
import { Toast } from '@/components/Common/Toast/Toast';
import { BrandData, ColorInfo, LogoInfo } from '@/types/branding';

interface BrandProps {
  brandData: BrandData;
  companyName: string;
}

const Brand: React.FC<BrandProps> = ({ brandData, companyName }) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [primaryFontLoaded, setPrimaryFontLoaded] = useState<string | null>(null);
  const [secondaryFontLoaded, setSecondaryFontLoaded] = useState<string | null>(null);
  const [tertiaryFontLoaded, setTertiaryFontLoaded] = useState<string | null>(null);
  const [fontLoading, setFontLoading] = useState<boolean>(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const getGradientStyle = () => {
    const primaryColor = brandData.primary_color_hex || '#A8B5C8';
    const secondaryColor = brandData.secondary_color_hex || '#F5A623';
    return {
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
    };
  };

  const getSectionNumberStyle = () => {
    const primaryColor = brandData.primary_color_hex || '#F5A623';
    return {
      color: primaryColor,
    };
  };

  const getNumberStyle = () => {
    const primaryColor = brandData.primary_color_hex || '#F5A623';
    return {
      color: primaryColor,
    };
  };

  const getDownloadButtonStyle = () => {
    const primaryColor = brandData.primary_color_hex || '#000000';
    return {
      backgroundColor: `${primaryColor}CC`, // 80% opacity
    };
  };

  // Helper functions to determine if sections have content
  const hasStrategyContent = () => {
    return !!(brandData.brand_strategy && brandData.brand_strategy.trim());
  };

  const hasPersonalityContent = () => {
    return !!(brandData.personality && brandData.personality.trim());
  };

  const hasLogoContent = () => {
    return !!(
      (brandData.logo_description && brandData.logo_description.trim()) ||
      (brandData.logo_url && brandData.logo_url.trim()) ||
      (brandData.alternate_logos && brandData.alternate_logos.length > 0)
    );
  };

  const hasColorContent = () => {
    return !!(
      brandData.primary_color_hex ||
      brandData.secondary_color_hex ||
      (brandData.alternative_colors && brandData.alternative_colors.length > 0)
    );
  };

  const hasTypographyContent = () => {
    return !!(
      brandData.font_primary_name ||
      brandData.font_secondary_name ||
      brandData.font_tertiary_name
    );
  };

  const hasPhotographyContent = () => {
    return !!(
      (brandData.photography_description && brandData.photography_description.trim()) ||
      (brandData.photography_images && brandData.photography_images.length > 0) ||
      (brandData.photography_google_drive_link && brandData.photography_google_drive_link.trim())
    );
  };

  const hasGuidelinesContent = () => {
    return !!(brandData.brand_guidelines && brandData.brand_guidelines.trim());
  };

  // Build dynamic section list with their numbers
  const getVisibleSections = () => {
    const sections = [];
    let sectionNumber = 1;

    if (hasStrategyContent()) {
      sections.push({ id: 'brand-strategy', title: 'Brand Strategy', number: sectionNumber++ });
    }
    if (hasPersonalityContent()) {
      sections.push({ id: 'personality', title: 'Personality', number: sectionNumber++ });
    }
    if (hasLogoContent()) {
      sections.push({ id: 'logo', title: 'Logo', number: sectionNumber++ });
    }
    if (hasColorContent()) {
      sections.push({ id: 'color', title: 'Color', number: sectionNumber++ });
    }
    if (hasTypographyContent()) {
      sections.push({ id: 'typography', title: 'Typography', number: sectionNumber++ });
    }
    if (hasPhotographyContent()) {
      sections.push({ id: 'photography', title: 'Photography', number: sectionNumber++ });
    }

    return sections;
  };

  const getBrandContainerFontStyle = () => {
    if (primaryFontLoaded) {
      return {
        fontFamily: `"${primaryFontLoaded}", var(--font-satoshi)`,
      };
    }
    return {};
  };

  // Load all brand fonts when component mounts
  useEffect(() => {
    const loadFonts = async () => {
      setFontLoading(true);

      const fontPromises = [];

      // Load primary font
      if (brandData.font_primary_name && brandData.font_primary_url) {
        fontPromises.push(
          loadFont(brandData.font_primary_name, brandData.font_primary_url)
            .then(fontFamily => {
              if (fontFamily) {
                setPrimaryFontLoaded(fontFamily);
              }
            })
            .catch(error => {
              console.warn('Failed to load primary font:', error);
            })
        );
      }

      // Load secondary font
      if (brandData.font_secondary_name && brandData.font_secondary_url) {
        fontPromises.push(
          loadFont(brandData.font_secondary_name, brandData.font_secondary_url)
            .then(fontFamily => {
              if (fontFamily) {
                setSecondaryFontLoaded(fontFamily);
              }
            })
            .catch(error => {
              console.warn('Failed to load secondary font:', error);
            })
        );
      }

      // Load tertiary font
      if (brandData.font_tertiary_name && brandData.font_tertiary_url) {
        fontPromises.push(
          loadFont(brandData.font_tertiary_name, brandData.font_tertiary_url)
            .then(fontFamily => {
              if (fontFamily) {
                setTertiaryFontLoaded(fontFamily);
              }
            })
            .catch(error => {
              console.warn('Failed to load tertiary font:', error);
            })
        );
      }

      // Wait for all fonts to load
      await Promise.all(fontPromises);
      setFontLoading(false);
    };

    loadFonts();
  }, [
    brandData.font_primary_name,
    brandData.font_primary_url,
    brandData.font_secondary_name,
    brandData.font_secondary_url,
    brandData.font_tertiary_name,
    brandData.font_tertiary_url,
  ]);

  const openLightbox = (imageUrl: string) => {
    setLightboxImage(imageUrl);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    document.body.style.overflow = 'unset'; // Restore scrolling
  };

  const handleLightboxClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeLightbox();
    }
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1] || `photography-${index + 1}.jpg`;

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = decodeURIComponent(filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleLogoDownload = async (logoUrl: string, logoName?: string) => {
    try {
      // Extract filename from URL
      const urlParts = logoUrl.split('/');
      const urlFilename = urlParts[urlParts.length - 1];

      // Use logo name if provided, otherwise use filename from URL
      const filename = logoName
        ? `${logoName.toLowerCase().replace(/\s+/g, '-')}.${urlFilename.split('.').pop() || 'png'}`
        : urlFilename || 'logo.png';

      const response = await fetch(logoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = decodeURIComponent(filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Logo download failed:', error);
    }
  };

  const copyColorToClipboard = async (value: string, colorId: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedColor(colorId);
      setToastMessage(`Copied ${value} to clipboard`);
      setToastVisible(true);
      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedColor(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy color:', error);
      setToastMessage('Failed to copy color');
      setToastVisible(true);
    }
  };

  // Close lightbox on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      }
    };

    if (lightboxImage) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset'; // Cleanup on unmount
    };
  }, [lightboxImage]);

  // Simple intersection observer for opacity animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -10% 0px',
      }
    );

    // Observe all sections
    const observeElements = () => {
      sectionRefs.current.forEach(element => {
        if (element) observer.observe(element);
      });
    };

    const timeoutId = setTimeout(observeElements, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  const setSectionRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) {
      sectionRefs.current.set(id, el);
    } else {
      sectionRefs.current.delete(id);
    }
  };

  const loadFont = async (fontName: string, fontUrl: string): Promise<string | null> => {
    if (!fontUrl || !fontName) return null;

    // Sanitize font name for CSS
    const sanitizedFontName = fontName.replace(/[^a-zA-Z0-9\s-]/g, '');

    // Check if font is already loaded
    const existingFont = document.querySelector(
      `style[data-font="${sanitizedFontName}"]`
    );
    if (existingFont) return sanitizedFontName;

    try {
      // Use the modern Font Loading API when available
      if ('fonts' in document && document.fonts.load) {
        // For direct font file URLs, create a font-face rule
        if (fontUrl.startsWith('http') && 
            (fontUrl.includes('.woff') || fontUrl.includes('.ttf') || fontUrl.includes('.otf'))) {
          
          const fontFormat = fontUrl.includes('.woff2') ? 'woff2'
            : fontUrl.includes('.woff') ? 'woff'
            : fontUrl.includes('.ttf') ? 'truetype'
            : fontUrl.includes('.otf') ? 'opentype'
            : 'woff2';

          const fontFaceRule = `
            @font-face {
              font-family: '${sanitizedFontName}';
              src: url('${fontUrl}') format('${fontFormat}');
              font-display: swap;
              font-weight: normal;
              font-style: normal;
            }
          `;

          const style = document.createElement('style');
          style.setAttribute('data-font', sanitizedFontName);
          style.innerHTML = fontFaceRule;
          document.head.appendChild(style);

          // Wait for font to load using Font Loading API
          await document.fonts.load(`normal 400 16px "${sanitizedFontName}"`);
          return sanitizedFontName;
        } else if (fontUrl.includes('fonts.googleapis.com') || fontUrl.includes('fonts.google.com')) {
          // For Google Fonts, use link element for better performance
          const existingLink = document.querySelector(`link[href*="${fontUrl}"]`);
          if (!existingLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = fontUrl;
            link.setAttribute('data-font', sanitizedFontName);
            document.head.appendChild(link);

            // Wait for stylesheet to load
            await new Promise((resolve) => {
              link.onload = resolve;
              link.onerror = resolve; // Don't fail completely if font doesn't load
              setTimeout(resolve, 2000); // Fallback timeout
            });
          }
          return sanitizedFontName;
        } else {
          // Fallback for other URL types
          const style = document.createElement('style');
          style.setAttribute('data-font', sanitizedFontName);
          style.innerHTML = `@import url('${fontUrl}');`;
          document.head.appendChild(style);

          // Short delay for import to process
          await new Promise(resolve => setTimeout(resolve, 500));
          return sanitizedFontName;
        }
      } else {
        // Fallback for older browsers - load synchronously but with minimal delay
        const style = document.createElement('style');
        style.setAttribute('data-font', sanitizedFontName);
        
        let fontFaceRule = '';
        if (fontUrl.includes('fonts.googleapis.com')) {
          fontFaceRule = `@import url('${fontUrl}');`;
        } else if (fontUrl.includes('.woff') || fontUrl.includes('.ttf') || fontUrl.includes('.otf')) {
          const fontFormat = fontUrl.includes('.woff2') ? 'woff2' : 'woff';
          fontFaceRule = `
            @font-face {
              font-family: '${sanitizedFontName}';
              src: url('${fontUrl}') format('${fontFormat}');
              font-display: swap;
            }
          `;
        } else {
          fontFaceRule = `@import url('${fontUrl}');`;
        }
        
        style.innerHTML = fontFaceRule;
        document.head.appendChild(style);
        return sanitizedFontName;
      }
    } catch (error) {
      console.warn(`Failed to load font ${fontName} from ${fontUrl}:`, error);
      return null;
    }
  };
  const hexToRgba = (hex: string, alpha: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const renderColorCircle = (
    hex?: string,
    cmyk?: string,
    pantone?: string,
    name?: string,
    colorId?: string
  ) => {
    if (!hex) return null;

    const uniqueId = colorId || `color-${hex}`;

    return (
      <div className={styles.colorItem}>
        <div className={styles.colorGroup}>
          {/* Main Color - clickable */}
          <div
            className={`${styles.colorCircle} ${styles.clickable}`}
            style={{ backgroundColor: hex }}
            onClick={() => copyColorToClipboard(hex, `${uniqueId}-hex`)}
            title="Click to copy hex value"
          />
          {/* 50% Transparent - clickable */}
          <div
            className={`${styles.colorCircle} ${styles.clickable}`}
            style={{ backgroundColor: hexToRgba(hex, 0.5) }}
            onClick={() => copyColorToClipboard(hexToRgba(hex, 0.5), `${uniqueId}-50`)}
            title="Click to copy 50% transparency value"
          />
          {/* 25% Transparent - clickable */}
          <div
            className={`${styles.colorCircle} ${styles.clickable}`}
            style={{ backgroundColor: hexToRgba(hex, 0.25) }}
            onClick={() => copyColorToClipboard(hexToRgba(hex, 0.25), `${uniqueId}-25`)}
            title="Click to copy 25% transparency value"
          />
        </div>
        <div className={styles.colorInfo}>
          <h4>{name || 'Color'}</h4>
          <p
            className={styles.clickableText}
            onClick={() => copyColorToClipboard(hex, `${uniqueId}-hex-text`)}
            title="Click to copy"
          >
            Hex: <span className={styles.colorValue}>{hex}</span>
            {copiedColor === `${uniqueId}-hex-text` && (
              <span className={styles.copiedIndicator}>✓ Copied!</span>
            )}
          </p>
          {cmyk && (
            <p
              className={styles.clickableText}
              onClick={() => copyColorToClipboard(cmyk, `${uniqueId}-cmyk`)}
              title="Click to copy"
            >
              CMYK: <span className={styles.colorValue}>{cmyk}</span>
              {copiedColor === `${uniqueId}-cmyk` && (
                <span className={styles.copiedIndicator}>✓ Copied!</span>
              )}
            </p>
          )}
          {pantone && (
            <p
              className={styles.clickableText}
              onClick={() => copyColorToClipboard(pantone, `${uniqueId}-pantone`)}
              title="Click to copy"
            >
              Pantone: <span className={styles.colorValue}>{pantone}</span>
              {copiedColor === `${uniqueId}-pantone` && (
                <span className={styles.copiedIndicator}>✓ Copied!</span>
              )}
            </p>
          )}
          <div className={styles.transparencyInfo}>
            <p
              className={styles.clickableText}
              onClick={() => copyColorToClipboard(hexToRgba(hex, 0.5), `${uniqueId}-50-text`)}
              title="Click to copy"
            >
              50%: <span className={styles.colorValue}>{hexToRgba(hex, 0.5)}</span>
              {copiedColor === `${uniqueId}-50-text` && (
                <span className={styles.copiedIndicator}>✓</span>
              )}
            </p>
            <p
              className={styles.clickableText}
              onClick={() => copyColorToClipboard(hexToRgba(hex, 0.25), `${uniqueId}-25-text`)}
              title="Click to copy"
            >
              25%: <span className={styles.colorValue}>{hexToRgba(hex, 0.25)}</span>
              {copiedColor === `${uniqueId}-25-text` && (
                <span className={styles.copiedIndicator}>✓</span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderTypography = (
    name?: string,
    example?: string,
    url?: string,
    googleUrl?: string,
    loadedFontFamily?: string | null
  ) => {
    if (!name) return null;

    // Use the loaded font family from state, or fallback to the font name
    const fontFamily = loadedFontFamily || name;

    // Use Google Font URL for "View Font" link if available, otherwise use direct URL
    const viewFontUrl = googleUrl || url;

    return (
      <div className={styles.fontItem}>
        <h4>{name}</h4>
        {example && (
          <div
            className={styles.fontExample}
            style={{
              fontFamily: `"${fontFamily}", "${name}", -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`,
              // Add transitions for smooth font loading
              transition: 'font-family 0.5s ease, opacity 0.3s ease',
            }}
          >
            {example}
          </div>
        )}
        {viewFontUrl && (
          <div className={styles.fontLinks}>
            <a
              href={viewFontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.fontLink}
            >
              View Font
            </a>
            {viewFontUrl && (
              <span className={styles.fontStatus}>
                {viewFontUrl.includes('fonts.google.com')
                  ? '(Google Fonts)'
                  : viewFontUrl.includes('fonts.googleapis.com')
                    ? '(Google Fonts)'
                    : viewFontUrl.includes('fonts.adobe.com') ||
                        viewFontUrl.includes('typekit.net')
                      ? '(Adobe Fonts)'
                      : viewFontUrl.includes('.woff') ||
                          viewFontUrl.includes('.ttf') ||
                          viewFontUrl.includes('.otf')
                        ? '(Web Font)'
                        : '(External)'}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.brandContainer} style={getBrandContainerFontStyle()}>
      {/* Font Loading Indicator */}
      {fontLoading && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          fontSize: '14px',
          zIndex: 1000
        }}>
          Loading custom font...
        </div>
      )}
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroGradient} style={getGradientStyle()}>
          {brandData.logo_url && brandData.logo_url.trim() && (
            <Image
              src={brandData.logo_url}
              alt={`${companyName} Logo`}
              className={styles.heroLogo}
              width={300}
              height={120}
              style={{
                maxWidth: '300px',
                maxHeight: '120px',
                width: 'auto',
                height: 'auto',
              }}
            />
          )}
        </div>
      </div>

      {/* Brand Guidelines Overview - Only show if has guidelines or other sections */}
      {(hasGuidelinesContent() || getVisibleSections().length > 0) && (
        <div
          className={styles.contentSection}
          data-section="overview"
          ref={setSectionRef('overview')}
        >
          {hasGuidelinesContent() && (
            <div className={styles.sectionHeader}>
              <h1>Brand Guidelines</h1>
              <p className={styles.sectionDescription}>
                This guide defines the visual language, design style, and principles
                that shape a clear and consistent brand experience, no matter the
                team or area of expertise.
              </p>
            </div>
          )}

          {brandData.brand_guidelines && (
            <div className={styles.guidelinesContent}>
              <p>{brandData.brand_guidelines}</p>
            </div>
          )}

          {/* Table of Contents - Only show if there are sections with content */}
          {getVisibleSections().length > 0 && (
            <div className={styles.contents}>
              <h2>Content</h2>
              <ul className={styles.contentsList}>
                {getVisibleSections().map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className={styles.contentLink}>
                      <span className={styles.number} style={getNumberStyle()}>
                        {String(section.number).padStart(2, '0')}
                      </span>{' '}
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Brand Strategy - Only show if has content */}
      {hasStrategyContent() && (
        <div
          id="brand-strategy"
          className={styles.contentSection}
          data-section="brand-strategy"
          ref={setSectionRef('brand-strategy')}
        >
          <div className={styles.sectionNumber} style={getSectionNumberStyle()}>
            {String(getVisibleSections().find(s => s.id === 'brand-strategy')?.number || 1).padStart(2, '0')}
          </div>
          <h2>Brand Strategy</h2>
          <div className={styles.strategyContent}>
            <p>{brandData.brand_strategy}</p>
          </div>
        </div>
      )}

      {/* Personality - Only show if has content */}
      {hasPersonalityContent() && (
        <div
          id="personality"
          className={styles.contentSection}
          data-section="personality"
          ref={setSectionRef('personality')}
        >
          <div className={styles.sectionNumber} style={getSectionNumberStyle()}>
            {String(getVisibleSections().find(s => s.id === 'personality')?.number || 1).padStart(2, '0')}
          </div>
          <h2>Personality</h2>
          <div className={styles.personalityContent}>
            <p>{brandData.personality}</p>
          </div>
        </div>
      )}

      {/* Logo - Only show if has content */}
      {hasLogoContent() && (
        <div
          id="logo"
          className={styles.contentSection}
          data-section="logo"
          ref={setSectionRef('logo')}
        >
          <div className={styles.sectionNumber} style={getSectionNumberStyle()}>
            {String(getVisibleSections().find(s => s.id === 'logo')?.number || 1).padStart(2, '0')}
          </div>
          <h2>Logo</h2>
          {brandData.logo_description && (
            <div className={styles.logoDescription}>
              <p>{brandData.logo_description}</p>
            </div>
          )}
          {brandData.logo_url && brandData.logo_url.trim() && (
            <div className={styles.logoShowcase}>
              <div className={styles.logoWrapper}>
                <div className={styles.logoContainer}>
                  <Image
                    src={brandData.logo_url}
                    alt={`${companyName} Logo`}
                    width={400}
                    height={200}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>
                <button
                  className={styles.downloadButton}
                  style={getDownloadButtonStyle()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogoDownload(brandData.logo_url!, 'primary-logo');
                  }}
                  title="Download logo"
                  type="button"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Alternate Logos */}
          {brandData.alternate_logos && brandData.alternate_logos.length > 0 && (
            <div className={styles.alternateLogosSection}>
              <h3>Alternate Logos</h3>
              <div className={styles.alternateLogosGrid}>
                {brandData.alternate_logos.map((logo, index) => (
                  <div key={index} className={styles.alternateLogoItem}>
                    {logo.name && (
                      <h4 className={styles.alternateLogoName}>{logo.name}</h4>
                    )}
                    {logo.url && logo.url.trim() && (
                      <div className={styles.logoWrapper}>
                        <div className={styles.logoContainer}>
                          <Image
                            src={logo.url}
                            alt={logo.name || `Alternate Logo ${index + 1}`}
                            width={300}
                            height={150}
                            style={{ maxWidth: '100%', height: 'auto' }}
                          />
                        </div>
                        <button
                          className={styles.downloadButton}
                          style={getDownloadButtonStyle()}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLogoDownload(logo.url, logo.name || `alternate-logo-${index + 1}`);
                          }}
                          title="Download logo"
                          type="button"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {logo.description && (
                      <p className={styles.alternateLogoDescription}>
                        {logo.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Color - Only show if has content */}
      {hasColorContent() && (
        <div
          id="color"
          className={styles.contentSection}
          data-section="color"
          ref={setSectionRef('color')}
        >
          <div className={styles.sectionNumber} style={getSectionNumberStyle()}>
            {String(getVisibleSections().find(s => s.id === 'color')?.number || 1).padStart(2, '0')}
          </div>
          <h2>Color</h2>

          {/* Primary Palette */}
          {(brandData.primary_color_hex || brandData.secondary_color_hex) && (
            <div className={styles.colorSection}>
              <h3>Primary Palette</h3>
              <div className={styles.colorGrid}>
                {renderColorCircle(
                  brandData.primary_color_hex,
                  brandData.primary_color_cmyk,
                  brandData.primary_color_pantone,
                  'Primary Color',
                  'primary'
                )}
                {renderColorCircle(
                  brandData.secondary_color_hex,
                  brandData.secondary_color_cmyk,
                  brandData.secondary_color_pantone,
                  'Secondary Color',
                  'secondary'
                )}
              </div>
            </div>
          )}

          {/* Alternative Colors */}
          {brandData.alternative_colors &&
            brandData.alternative_colors.length > 0 && (
              <div className={styles.colorSection}>
                <h3>Alternative Colors</h3>
                <div className={styles.colorGrid}>
                  {brandData.alternative_colors.map((color, index) => (
                    <div key={index}>
                      {renderColorCircle(
                        color.hex,
                        color.cmyk,
                        color.pantone,
                        color.name,
                        `alt-${index}`
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Typography - Only show if has content */}
      {hasTypographyContent() && (
        <div
          id="typography"
          className={styles.contentSection}
          data-section="typography"
          ref={setSectionRef('typography')}
        >
          <div className={styles.sectionNumber} style={getSectionNumberStyle()}>
            {String(getVisibleSections().find(s => s.id === 'typography')?.number || 1).padStart(2, '0')}
          </div>
          <h2>Typography</h2>
          <div className={styles.typographyGrid}>
            {renderTypography(
              brandData.font_primary_name,
              brandData.font_primary_example,
              brandData.font_primary_url,
              brandData.font_primary_google_url,
              primaryFontLoaded
            )}
            {renderTypography(
              brandData.font_secondary_name,
              brandData.font_secondary_example,
              brandData.font_secondary_url,
              brandData.font_secondary_google_url,
              secondaryFontLoaded
            )}
            {renderTypography(
              brandData.font_tertiary_name,
              brandData.font_tertiary_example,
              brandData.font_tertiary_url,
              brandData.font_tertiary_google_url,
              tertiaryFontLoaded
            )}
          </div>
        </div>
      )}

      {/* Photography - Only show if has content */}
      {hasPhotographyContent() && (
        <div
          id="photography"
          className={styles.contentSection}
          data-section="photography"
          ref={setSectionRef('photography')}
        >
          <div className={styles.sectionNumber} style={getSectionNumberStyle()}>
            {String(getVisibleSections().find(s => s.id === 'photography')?.number || 1).padStart(2, '0')}
          </div>
          <h2>Photography</h2>
          {brandData.photography_description && (
            <div className={styles.photographyDescription}>
              <p>{brandData.photography_description}</p>
            </div>
          )}
          {brandData.photography_images &&
            brandData.photography_images.length > 0 && (
              <div className={styles.photographyGrid}>
                {brandData.photography_images
                  .filter(imageUrl => imageUrl && imageUrl.trim())
                  .map((imageUrl, index) => (
                    <div key={index} className={styles.photographyImageWrapper}>
                      <Image
                        src={imageUrl}
                        alt={`Photography example ${index + 1}`}
                        className={styles.photographyImage}
                        width={600}
                        height={400}
                        style={{ cursor: 'pointer' }}
                        onClick={() => openLightbox(imageUrl)}
                      />
                      <button
                        className={styles.downloadButton}
                        style={getDownloadButtonStyle()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(imageUrl, index);
                        }}
                        title="Download image"
                        type="button"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                    </div>
                  ))}
              </div>
            )}
          {brandData.photography_google_drive_link && (
            <div className={styles.driveLink}>
              <a
                href={brandData.photography_google_drive_link}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.photographyLink}
                style={{ color: brandData.primary_color_hex || '#F5A623' }}
              >
                <img
                  src="/google-drive.svg"
                  alt="Google Drive"
                  className={styles.driveIcon}
                  width="20"
                  height="20"
                />
                <span>View All Photos</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className={styles.lightbox} onClick={handleLightboxClick}>
          <div className={styles.lightboxContent}>
            <button className={styles.lightboxClose} onClick={closeLightbox}>
              ×
            </button>
            <Image
              src={lightboxImage}
              alt="Photography enlarged"
              className={styles.lightboxImage}
              width={1200}
              height={800}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
              }}
            />
          </div>
        </div>
      )}

      {/* Toast notification */}
      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        type="success"
        duration={2000}
      />
    </div>
  );
};

export default Brand;
