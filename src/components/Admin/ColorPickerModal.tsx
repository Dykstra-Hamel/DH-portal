'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, Palette } from 'lucide-react';
import styles from './ColorPickerModal.module.scss';

interface ColorPickerModalProps {
  onClose: () => void;
  onSelectColor: (color: string, colorName?: string) => void;
}

// Color conversion utilities
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToHex = (h: number, s: number, l: number): string => {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export default function ColorPickerModal({ onClose, onSelectColor }: ColorPickerModalProps) {
  const [baseColor, setBaseColor] = useState('#3B82F6');
  const [shadeCount, setShadeCount] = useState(5);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [colorName, setColorName] = useState('');

  // Generate shades of a color
  const generateShades = (hex: string, count: number): string[] => {
    const rgb = hexToRgb(hex);
    if (!rgb) return [];

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const shades: string[] = [];

    // Generate lighter to darker shades
    for (let i = 0; i < count; i++) {
      const lightness = 95 - (i * 80) / (count - 1); // Range from 95% to 15%
      shades.push(hslToHex(hsl.h, hsl.s, lightness));
    }

    return shades;
  };

  // Generate complementary color (opposite on color wheel)
  const getComplementary = (hex: string): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const complementaryHue = (hsl.h + 180) % 360;
    return hslToHex(complementaryHue, hsl.s, hsl.l);
  };

  // Generate analogous colors (adjacent on color wheel)
  const getAnalogous = (hex: string): string[] => {
    const rgb = hexToRgb(hex);
    if (!rgb) return [];

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return [
      hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
      hex,
      hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
    ];
  };

  // Generate triadic colors (120° apart on color wheel)
  const getTriadic = (hex: string): string[] => {
    const rgb = hexToRgb(hex);
    if (!rgb) return [];

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return [
      hex,
      hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
      hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
    ];
  };

  // Generate split-complementary colors
  const getSplitComplementary = (hex: string): string[] => {
    const rgb = hexToRgb(hex);
    if (!rgb) return [];

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const complementary = (hsl.h + 180) % 360;
    return [
      hex,
      hslToHex((complementary - 30 + 360) % 360, hsl.s, hsl.l),
      hslToHex((complementary + 30) % 360, hsl.s, hsl.l),
    ];
  };

  const copyToClipboard = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const handleAddColor = (color: string) => {
    onSelectColor(color, colorName || undefined);
    setColorName('');
  };

  const shades = generateShades(baseColor, shadeCount);
  const complementary = getComplementary(baseColor);
  const analogous = getAnalogous(baseColor);
  const triadic = getTriadic(baseColor);
  const splitComplementary = getSplitComplementary(baseColor);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2>
              <Palette size={24} />
              Color Picker & Palette Generator
            </h2>
            <p>Generate color palettes and find complementary colors</p>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Base Color Picker */}
          <div className={styles.section}>
            <h3>Base Color</h3>
            <div className={styles.baseColorPicker}>
              <div className={styles.colorInputRow}>
                <div
                  className={styles.colorPreview}
                  style={{ backgroundColor: baseColor }}
                />
                <input
                  type="color"
                  value={baseColor}
                  onChange={e => setBaseColor(e.target.value)}
                  className={styles.colorInput}
                />
                <input
                  type="text"
                  value={baseColor}
                  onChange={e => setBaseColor(e.target.value)}
                  placeholder="#3B82F6"
                  className={styles.hexInput}
                />
                <button
                  onClick={() => copyToClipboard(baseColor)}
                  className={styles.copyButton}
                >
                  {copiedColor === baseColor ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Shades Generator */}
          <div className={styles.section}>
            <h3>Shades ({shadeCount})</h3>
            <div className={styles.sliderContainer}>
              <input
                type="range"
                min="3"
                max="10"
                value={shadeCount}
                onChange={e => setShadeCount(Number(e.target.value))}
                className={styles.slider}
              />
              <span className={styles.sliderLabel}>{shadeCount} shades</span>
            </div>
            <div className={styles.colorGrid}>
              {shades.map((shade, index) => (
                <div key={index} className={styles.colorCard}>
                  <div
                    className={styles.colorSwatch}
                    style={{ backgroundColor: shade }}
                    onClick={() => copyToClipboard(shade)}
                    title="Click to copy"
                  />
                  <div className={styles.colorInfo}>
                    <code className={styles.colorCode}>{shade}</code>
                    <div className={styles.colorActions}>
                      <button
                        onClick={() => copyToClipboard(shade)}
                        className={styles.iconButton}
                        title="Copy to clipboard"
                      >
                        {copiedColor === shade ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complementary */}
          <div className={styles.section}>
            <h3>Complementary Color</h3>
            <p className={styles.sectionDescription}>Opposite on the color wheel</p>
            <div className={styles.colorGrid}>
              {[baseColor, complementary].map((color, index) => (
                <div key={index} className={styles.colorCard}>
                  <div
                    className={styles.colorSwatch}
                    style={{ backgroundColor: color }}
                    onClick={() => copyToClipboard(color)}
                    title="Click to copy"
                  />
                  <div className={styles.colorInfo}>
                    <code className={styles.colorCode}>{color}</code>
                    <div className={styles.colorActions}>
                      <button
                        onClick={() => copyToClipboard(color)}
                        className={styles.iconButton}
                        title="Copy to clipboard"
                      >
                        {copiedColor === color ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analogous */}
          <div className={styles.section}>
            <h3>Analogous Colors</h3>
            <p className={styles.sectionDescription}>Adjacent on the color wheel</p>
            <div className={styles.colorGrid}>
              {analogous.map((color, index) => (
                <div key={index} className={styles.colorCard}>
                  <div
                    className={styles.colorSwatch}
                    style={{ backgroundColor: color }}
                    onClick={() => copyToClipboard(color)}
                    title="Click to copy"
                  />
                  <div className={styles.colorInfo}>
                    <code className={styles.colorCode}>{color}</code>
                    <div className={styles.colorActions}>
                      <button
                        onClick={() => copyToClipboard(color)}
                        className={styles.iconButton}
                        title="Copy to clipboard"
                      >
                        {copiedColor === color ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Triadic */}
          <div className={styles.section}>
            <h3>Triadic Colors</h3>
            <p className={styles.sectionDescription}>Evenly spaced on the color wheel (120° apart)</p>
            <div className={styles.colorGrid}>
              {triadic.map((color, index) => (
                <div key={index} className={styles.colorCard}>
                  <div
                    className={styles.colorSwatch}
                    style={{ backgroundColor: color }}
                    onClick={() => copyToClipboard(color)}
                    title="Click to copy"
                  />
                  <div className={styles.colorInfo}>
                    <code className={styles.colorCode}>{color}</code>
                    <div className={styles.colorActions}>
                      <button
                        onClick={() => copyToClipboard(color)}
                        className={styles.iconButton}
                        title="Copy to clipboard"
                      >
                        {copiedColor === color ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Split-Complementary */}
          <div className={styles.section}>
            <h3>Split-Complementary</h3>
            <p className={styles.sectionDescription}>Base color with two adjacent to complementary</p>
            <div className={styles.colorGrid}>
              {splitComplementary.map((color, index) => (
                <div key={index} className={styles.colorCard}>
                  <div
                    className={styles.colorSwatch}
                    style={{ backgroundColor: color }}
                    onClick={() => copyToClipboard(color)}
                    title="Click to copy"
                  />
                  <div className={styles.colorInfo}>
                    <code className={styles.colorCode}>{color}</code>
                    <div className={styles.colorActions}>
                      <button
                        onClick={() => copyToClipboard(color)}
                        className={styles.iconButton}
                        title="Copy to clipboard"
                      >
                        {copiedColor === color ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add to Brand */}
          <div className={styles.section}>
            <h3>Add Color to Brand</h3>
            <div className={styles.addColorForm}>
              <input
                type="text"
                value={colorName}
                onChange={e => setColorName(e.target.value)}
                placeholder="Color name (optional)"
                className={styles.nameInput}
              />
              <button
                onClick={() => handleAddColor(baseColor)}
                className={styles.addButton}
              >
                Add Base Color to Brand
              </button>
            </div>
            <p className={styles.helpText}>
              Click any color&apos;s copy button to copy to clipboard, or add the base color directly to your brand colors
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
