'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './Brand.module.scss';

interface ColorInfo {
  hex: string;
  cmyk: string;
  pantone: string;
  name?: string;
}

interface BrandData {
  id: string;
  company_id: string;
  brand_guidelines?: string;
  brand_strategy?: string;
  personality?: string;
  logo_url?: string;
  logo_description?: string;
  primary_color_hex?: string;
  primary_color_cmyk?: string;
  primary_color_pantone?: string;
  secondary_color_hex?: string;
  secondary_color_cmyk?: string;
  secondary_color_pantone?: string;
  alternative_colors?: ColorInfo[];
  font_primary_name?: string;
  font_primary_example?: string;
  font_primary_url?: string;
  font_secondary_name?: string;
  font_secondary_example?: string;
  font_secondary_url?: string;
  font_tertiary_name?: string;
  font_tertiary_example?: string;
  font_tertiary_url?: string;
  photography_description?: string;
  photography_images?: Array<{url: string; description: string}>;
}

interface BrandProps {
  brandData: BrandData;
  companyName: string;
}

const Brand: React.FC<BrandProps> = ({ brandData, companyName }) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set(['overview']));
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const getGradientStyle = () => {
    const primaryColor = brandData.primary_color_hex || '#A8B5C8';
    const secondaryColor = brandData.secondary_color_hex || '#F5A623';
    return {
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
    };
  };

  const getSectionNumberStyle = () => {
    const primaryColor = brandData.primary_color_hex || '#F5A623';
    return {
      color: primaryColor
    };
  };

  const getNumberStyle = () => {
    const primaryColor = brandData.primary_color_hex || '#F5A623';
    return {
      color: primaryColor
    };
  };

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

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section');
            if (sectionId) {
              setVisibleSections(prev => new Set([...prev, sectionId]));
            }
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Start animation slightly before element is fully visible
      }
    );

    // Observe all sections
    sectionRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => {
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

  const loadFont = (fontName: string, fontUrl: string) => {
    if (!fontUrl || !fontName) return fontName;

    // Sanitize font name for CSS
    const sanitizedFontName = fontName.replace(/[^a-zA-Z0-9\s-]/g, '');
    
    // Check if font is already loaded
    const existingFont = document.querySelector(`style[data-font="${sanitizedFontName}"]`);
    if (existingFont) return sanitizedFontName;

    // Create and inject font face CSS
    const style = document.createElement('style');
    style.setAttribute('data-font', sanitizedFontName);
    
    // Handle different types of font URLs
    let fontFaceRule = '';
    
    try {
      if (fontUrl.includes('fonts.googleapis.com') || fontUrl.includes('fonts.google.com')) {
        // For Google Fonts, we need to import the URL
        fontFaceRule = `@import url('${fontUrl}');`;
      } else if (fontUrl.includes('fonts.adobe.com') || fontUrl.includes('typekit.net')) {
        // For Adobe Fonts, import the URL
        fontFaceRule = `@import url('${fontUrl}');`;
      } else if (fontUrl.startsWith('http') && (fontUrl.includes('.woff') || fontUrl.includes('.ttf') || fontUrl.includes('.otf'))) {
        // For direct font file URLs, create a font-face rule
        const fontFormat = fontUrl.includes('.woff2') ? 'woff2' : 
                          fontUrl.includes('.woff') ? 'woff' : 
                          fontUrl.includes('.ttf') ? 'truetype' :
                          fontUrl.includes('.otf') ? 'opentype' : 'woff2';
        
        fontFaceRule = `
          @font-face {
            font-family: '${sanitizedFontName}';
            src: url('${fontUrl}') format('${fontFormat}');
            font-display: swap;
            font-weight: normal;
            font-style: normal;
          }
        `;
      } else {
        // For other URLs (like external CSS files), try importing
        fontFaceRule = `@import url('${fontUrl}');`;
      }
      
      style.innerHTML = fontFaceRule;
      document.head.appendChild(style);
      
      // Wait a bit for the font to load, then return
      setTimeout(() => {
        // Force a repaint to ensure font is applied
        const fontElements = document.querySelectorAll(`[style*="font-family"][style*="${sanitizedFontName}"]`);
        fontElements.forEach(element => {
          (element as HTMLElement).style.fontFamily = (element as HTMLElement).style.fontFamily;
        });
      }, 100);
      
    } catch (error) {
      console.warn(`Failed to load font ${fontName} from ${fontUrl}:`, error);
    }
    
    return sanitizedFontName;
  };
  const hexToRgba = (hex: string, alpha: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const renderColorCircle = (hex?: string, cmyk?: string, pantone?: string, name?: string) => {
    if (!hex) return null;
    
    return (
      <div className={styles.colorItem}>
        <div className={styles.colorGroup}>
          {/* Main Color */}
          <div 
            className={styles.colorCircle}
            style={{ backgroundColor: hex }}
          />
          {/* 50% Transparent */}
          <div 
            className={styles.colorCircle}
            style={{ backgroundColor: hexToRgba(hex, 0.5) }}
          />
          {/* 25% Transparent */}
          <div 
            className={styles.colorCircle}
            style={{ backgroundColor: hexToRgba(hex, 0.25) }}
          />
        </div>
        <div className={styles.colorInfo}>
          <h4>{name || 'Color'}</h4>
          <p>Hex: {hex}</p>
          {cmyk && <p>CMYK: {cmyk}</p>}
          {pantone && <p>Pantone: {pantone}</p>}
          <div className={styles.transparencyInfo}>
            <p>50%: {hexToRgba(hex, 0.5)}</p>
            <p>25%: {hexToRgba(hex, 0.25)}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderTypography = (name?: string, example?: string, url?: string) => {
    if (!name) return null;
    
    // Load the font if URL is provided
    const fontFamily = url ? loadFont(name, url) : name;
    
    return (
      <div className={styles.fontItem}>
        <h4>{name}</h4>
        {example && (
          <div 
            className={styles.fontExample} 
            style={{ 
              fontFamily: `"${fontFamily}", "${name}", -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`,
              // Add transitions for smooth font loading
              transition: 'font-family 0.5s ease, opacity 0.3s ease'
            }}
          >
            {example}
          </div>
        )}
        {url && (
          <div className={styles.fontLinks}>
            <a href={url} target="_blank" rel="noopener noreferrer" className={styles.fontLink}>
              View Font
            </a>
            {url && (
              <span className={styles.fontStatus}>
                {url.includes('fonts.googleapis.com') ? '(Google Fonts)' :
                 url.includes('fonts.adobe.com') || url.includes('typekit.net') ? '(Adobe Fonts)' :
                 url.includes('.woff') || url.includes('.ttf') || url.includes('.otf') ? '(Web Font)' :
                 '(External)'}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.brandContainer}>
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
              style={{ maxWidth: '300px', maxHeight: '120px', width: 'auto', height: 'auto' }}
            />
          )}
        </div>
      </div>

      {/* Brand Guidelines Overview */}
      <div 
        className={`${styles.contentSection} ${visibleSections.has('overview') ? styles.visible : styles.hidden}`}
        data-section="overview"
        ref={setSectionRef('overview')}
      >
        <div className={styles.sectionHeader}>
          <h1>Brand Guidelines</h1>
          <p className={styles.sectionDescription}>
            This guide defines the visual language, design style, and 
            principles that shape a clear and consistent brand experience, 
            no matter the team or area of expertise.
          </p>
        </div>

        {brandData.brand_guidelines && (
          <div className={styles.guidelinesContent}>
            <p>{brandData.brand_guidelines}</p>
          </div>
        )}

        {/* Table of Contents */}
        <div className={styles.contents}>
          <h2>Content</h2>
          <ul className={styles.contentsList}>
            <li>
              <a href="#brand-strategy" className={styles.contentLink}>
                <span className={styles.number} style={getNumberStyle()}>01</span> Brand Strategy
              </a>
            </li>
            <li>
              <a href="#personality" className={styles.contentLink}>
                <span className={styles.number} style={getNumberStyle()}>02</span> Personality
              </a>
            </li>
            <li>
              <a href="#logo" className={styles.contentLink}>
                <span className={styles.number} style={getNumberStyle()}>03</span> Logo
              </a>
            </li>
            <li>
              <a href="#color" className={styles.contentLink}>
                <span className={styles.number} style={getNumberStyle()}>04</span> Color
              </a>
            </li>
            <li>
              <a href="#typography" className={styles.contentLink}>
                <span className={styles.number} style={getNumberStyle()}>05</span> Typography
              </a>
            </li>
            <li>
              <a href="#photography" className={styles.contentLink}>
                <span className={styles.number} style={getNumberStyle()}>06</span> Photography
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Brand Strategy */}
      <div 
        id="brand-strategy" 
        className={`${styles.contentSection} ${visibleSections.has('brand-strategy') ? styles.visible : styles.hidden}`}
        data-section="brand-strategy"
        ref={setSectionRef('brand-strategy')}
      >
        <div className={styles.sectionNumber} style={getSectionNumberStyle()}>01</div>
        <h2>Brand Strategy</h2>
        {brandData.brand_strategy && (
          <div className={styles.strategyContent}>
            <p>{brandData.brand_strategy}</p>
          </div>
        )}
      </div>

      {/* Personality */}
      <div 
        id="personality" 
        className={`${styles.contentSection} ${visibleSections.has('personality') ? styles.visible : styles.hidden}`}
        data-section="personality"
        ref={setSectionRef('personality')}
      >
        <div className={styles.sectionNumber} style={getSectionNumberStyle()}>02</div>
        <h2>Personality</h2>
        {brandData.personality && (
          <div className={styles.personalityContent}>
            <p>{brandData.personality}</p>
          </div>
        )}
      </div>

      {/* Logo */}
      <div 
        id="logo" 
        className={`${styles.contentSection} ${visibleSections.has('logo') ? styles.visible : styles.hidden}`}
        data-section="logo"
        ref={setSectionRef('logo')}
      >
        <div className={styles.sectionNumber} style={getSectionNumberStyle()}>03</div>
        <h2>Logo</h2>
        {brandData.logo_description && (
          <div className={styles.logoDescription}>
            <p>{brandData.logo_description}</p>
          </div>
        )}
        {brandData.logo_url && brandData.logo_url.trim() && (
          <div className={styles.logoShowcase}>
            <div className={styles.logoContainer}>
              <Image 
                src={brandData.logo_url} 
                alt={`${companyName} Logo`}
                width={400}
                height={200}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Color */}
      <div 
        id="color" 
        className={`${styles.contentSection} ${visibleSections.has('color') ? styles.visible : styles.hidden}`}
        data-section="color"
        ref={setSectionRef('color')}
      >
        <div className={styles.sectionNumber} style={getSectionNumberStyle()}>04</div>
        <h2>Color</h2>
        
        {/* Primary Palette */}
        <div className={styles.colorSection}>
          <h3>Primary Palette</h3>
          <div className={styles.colorGrid}>
            {renderColorCircle(
              brandData.primary_color_hex,
              brandData.primary_color_cmyk,
              brandData.primary_color_pantone,
              'Primary Color'
            )}
            {renderColorCircle(
              brandData.secondary_color_hex,
              brandData.secondary_color_cmyk,
              brandData.secondary_color_pantone,
              'Secondary Color'
            )}
          </div>
        </div>

        {/* Alternative Colors */}
        {brandData.alternative_colors && brandData.alternative_colors.length > 0 && (
          <div className={styles.colorSection}>
            <h3>Alternative Colors</h3>
            <div className={styles.colorGrid}>
              {brandData.alternative_colors.map((color, index) => (
                <div key={index}>
                  {renderColorCircle(color.hex, color.cmyk, color.pantone, color.name)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Typography */}
      <div 
        id="typography" 
        className={`${styles.contentSection} ${visibleSections.has('typography') ? styles.visible : styles.hidden}`}
        data-section="typography"
        ref={setSectionRef('typography')}
      >
        <div className={styles.sectionNumber} style={getSectionNumberStyle()}>05</div>
        <h2>Typography</h2>
        <div className={styles.typographyGrid}>
          {renderTypography(brandData.font_primary_name, brandData.font_primary_example, brandData.font_primary_url)}
          {renderTypography(brandData.font_secondary_name, brandData.font_secondary_example, brandData.font_secondary_url)}
          {renderTypography(brandData.font_tertiary_name, brandData.font_tertiary_example, brandData.font_tertiary_url)}
        </div>
      </div>

      {/* Photography */}
      <div 
        id="photography" 
        className={`${styles.contentSection} ${visibleSections.has('photography') ? styles.visible : styles.hidden}`}
        data-section="photography"
        ref={setSectionRef('photography')}
      >
        <div className={styles.sectionNumber} style={getSectionNumberStyle()}>06</div>
        <h2>Photography</h2>
        {brandData.photography_description && (
          <div className={styles.photographyDescription}>
            <p>{brandData.photography_description}</p>
          </div>
        )}
        {brandData.photography_images && brandData.photography_images.length > 0 && (
          <div className={styles.photographyGrid}>
            {brandData.photography_images.filter(image => image && image.url && image.url.trim()).map((image, index) => (
              <Image
                key={index} 
                src={image.url} 
                alt={image.description || `Photography example ${index + 1}`} 
                className={styles.photographyImage}
                width={600}
                height={400}
                style={{ cursor: 'pointer' }}
                onClick={() => openLightbox(image.url)}
              />
            ))}
          </div>
        )}
      </div>

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
              style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Brand;