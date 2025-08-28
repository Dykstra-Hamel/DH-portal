/**
 * DH Widget - Styling and CSS Management
 * Contains CSS injection, color management, and dynamic styling functions
 */

// Create CSS styles with full color palette
const createStyles = (
  colors = {
    primary: '#3b82f6',
    secondary: '#1e293b',
    background: '#ffffff',
    text: '#374151',
  }
) => {
  // Convert hex to RGB for rgba usage
  const hexToRgb = hex => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 123, b: 255 }; // fallback to blue
  };

  // Generate darker shade for hover effects
  const darkenColor = (hex, percent = 20) => {
    const rgb = hexToRgb(hex);
    const factor = (100 - percent) / 100;
    const r = Math.round(rgb.r * factor);
    const g = Math.round(rgb.g * factor);
    const b = Math.round(rgb.b * factor);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Generate lighter shade for backgrounds
  const lightenColor = (hex, opacity = 0.1) => {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  };

  // Extract colors with fallbacks
  const primaryColor = colors.primary || '#3b82f6';
  const secondaryColor = colors.secondary || '#1e293b';
  const backgroundColor = colors.background || '#ffffff';
  const textColor = colors.text || '#374151';

  const primaryDark = darkenColor(primaryColor);
  const secondaryDark = darkenColor(secondaryColor);
  const primaryLight = lightenColor(primaryColor);
  const secondaryLight = lightenColor(secondaryColor);
  const primaryRgb = hexToRgb(primaryColor);
  const primaryFocus = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.1)`;

  // Get font configuration from widget config
  const fontName = widgetState.widgetConfig?.fonts?.primary?.name || 'Outfit';
  const fontUrl =
    widgetState.widgetConfig?.fonts?.primary?.url ||
    'https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap';

  const styleElement = document.createElement('style');
  styleElement.id = 'dh-widget-styles';
  styleElement.textContent = `
  @import url('${fontUrl}');

/* Global font family for all widget elements */
.dh-form-widget, .dh-form-widget * {
  font-family: "${fontName}", sans-serif !important;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

img {
  animation: fadeIn 2s ease forwards;
}

.dh-pest-bg-image {
  animation: fadeIn 2s ease forwards;
}

.dh-form-widget { 
  margin: 0 auto; 
  background: ${backgroundColor}; 
  border-radius: 26px; 
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1); 
  overflow: visible; 
  color: ${textColor};
  position: relative;
}
.dh-widget-close-icon {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 100;
  cursor: pointer;
  pointer-events: auto;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;
}

.dh-widget-close-icon svg, .dh-widget-close-icon svg path {
  transition: all 0.2s ease;
}
.dh-widget-close-icon:hover svg {
  scale: 1.08;
}

.dh-widget-close-icon:hover svg path {
  fill: #515151;
}

.dh-widget-close-icon:hover svg path:not(:first-of-type) {
  stroke: white;
}

.dh-widget-close-icon svg {
  width: 27px;
  height: 27px;
}
.dh-global-back-button {
  position: absolute;
  justify-content: center;
  align-items: center;
  top: 67px;
  left: 0px;
  z-index: 90;
  background: #E3E3E3;
  color: #4A4A4A;
  border: none;
  padding: 10px 16px;
  border-radius: 0 60px 60px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: '${fontName}', sans-serif;
  font-size: 12px;
  line-height: 20px;
  font-weight: 700;
  transition: background-color 0.2s ease, transform 0.2s ease;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.dh-global-back-button:hover {
  background: #B0B0B0;
}

.dh-global-back-button svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.dh-global-back-button:hover svg {
  transform: translateX(-2px);
}
.dh-global-back-button.hidden {
  display: none;
}
.dh-form-content { 
  padding: 24px; 
  border-radius: 26px; 
  background: ${backgroundColor};
} 
.dh-form-step {
  height: 100%;
  display: none;
  opacity: 0;
  transition: opacity 0.3s ease;
} 
.dh-form-step.welcome { 
  display: none;
  padding: 0;
  opacity: 1;
} 
.dh-form-step.active { 
  display: flex; 
  opacity: 1;
}

.dh-form-step.fade-in {
  animation: fadeIn 0.4s ease forwards;
}

.dh-form-step.fade-out {
  animation: fadeOut 0.3s ease forwards;
} 

.dh-form-step-content {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    padding: 0;
    border-bottom: none;
  }

#dh-step-plan-comparison .dh-form-step-content {
 flex-wrap: wrap;
}

#dh-step-plan-comparison .dh-pest-hero {
  width: 386px;
  flex-shrink: 0;
}


/* Google Reviews Display Styles */
.dh-reviews-container {
  margin: 0 0 24px 0;
  font-family: "${fontName}", sans-serif;
  min-height: 24px; /* Reserve space to prevent layout shift */
}

.dh-reviews-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.dh-star-rating {
  display: flex;
  align-items: center;
  gap: 2px;
}

.dh-star {
  width: 20px;
  height: 18px;
  flex-shrink: 0;
}

.dh-star path {
  fill: #F68C1A;
  transition: fill 0.2s ease;
}

.dh-reviews-count {
  font-size: 16px;
  font-weight: 500;
  color: ${secondaryColor};
  margin-left: 4px;
}

/* Loading States */
.dh-reviews-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dh-reviews-skeleton {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.6;
}

.dh-skeleton-stars {
  display: flex;
  align-items: center;
  gap: 2px;
}

.dh-skeleton-stars::before {
  content: '★★★★★';
  color: #E5E5E5;
  font-size: 16px;
  animation: dh-pulse 1.5s ease-in-out infinite;
}

.dh-skeleton-text {
  background: #E5E5E5;
  height: 16px;
  width: 120px;
  border-radius: 4px;
  animation: dh-pulse 1.5s ease-in-out infinite;
}

@keyframes dh-pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.9;
  }
}

.dh-plan-faqs-container {
  width: 100%;
  margin: 22px;
  padding: 31px;
  background: rgba(69, 69, 69, 0.05);
  border-radius: 16px;
}

.dh-form-content-area {
    flex: 1;
    align-items: center;
    padding: 37px 40px;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 2;
  }

.dh-price-frequency {
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: 24px;
  color: #515151;
}

.dh-price-suffix {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

}

.dh-form-step h3 { 
  margin: 0 0 12px 0; 
  font-size: 18px; 
  color: ${secondaryColor}; 
} 

h3.dh-how-we-do-it-title, .dh-safety-text {
  font-size: 28px;
  line-height: 30px;
  font-weight: 700;
  color: #4E4E4E;
}

.dh-how-we-do-it-text {
    margin-right: 35px;
    line-height: 24px;
  }

.dh-how-we-do-it-content {
   display: flex;
   margin-top: 46px;
  }

.dh-subspecies-section {
  margin-top: 20px;
}

#subspecies-heading {
  margin-bottom: 15px;
}

.dh-subspecies-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(3, auto);
  gap: 4px 20px;
  grid-auto-flow: column;
}

.dh-subspecies-grid .dh-subspecies-item {
  display: flex;
  align-items: flex-start;
  font-size: 16px;
  color: #4E4E4E;
}

.dh-subspecies-grid .dh-subspecies-item:before {
  content: "•";
  margin-right: 8px;
  color: #4E4E4E;
  font-weight: bold;
}

.dh-interior-image {
 width: 244px;
 height: auto;
 object-fit: cover;
 border-radius: 16px;
 opacity: 0;
 transition: opacity 0.5s ease;
}

.dh-safety-message {
 display: flex;
 align-items: center;
 margin: 20px 0 40px 0;
}

#safety-message-text {
  margin: 0;
}

.dh-form-group { 
  max-width: 515px;
  width: 100%;
  margin: 0 auto 20px;
} 
.dh-form-label { 
  display: block; 
  font-weight: 500; 
  color: #4E4E4E; 
  margin-bottom: 6px; 
  font-family: "${fontName}", sans-serif;
  font-size: 20px;
  line-height: 30px;
} 
.dh-address-form-label {
  display: block;
  margin-bottom: 24px;
  color: #4E4E4E;
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  line-height: 30px;
}
.dh-form-input { 
  width: 100%; 
  padding: 12px 16px; 
  border: 1px solid #d1d5db; 
  border-radius: 8px; 
  outline: none; 
  font-size: 16px; 
  font-family: "${fontName}", sans-serif; 
  box-sizing: border-box; 
  background: ${backgroundColor};
  color: ${textColor};
} 
.dh-form-input:focus { 
  border-color: ${primaryColor}; 
  box-shadow: 0 0 0 3px ${primaryFocus}; 
}

select.dh-form-input {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 15px center;
  background-size: 20px;
}

/* Style date inputs with dropdown arrow */
.dh-form-input[type="date"] {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 15px center;
  background-size: 20px;
}

/* Hide default calendar icon for date inputs - we use custom SVG */
.dh-form-input[type="date"]::-webkit-calendar-picker-indicator {
  opacity: 0;
  cursor: pointer;
  width: 20px;
  height: 20px;
}

/* Make calendar icons clickable */
.dh-input-icon[data-type="calendar"] {
  pointer-events: auto;
  cursor: pointer;
}

.dh-input-icon[data-type="calendar"]:hover {
  color: #16a34a;
}

.dh-input-icon svg {
  display: block;
}

.dh-floating-input .dh-form-input:focus ~ .dh-input-icon {
  color: #16a34a;
}

#dh-step-contact .dh-form-row .dh-form-group {
  width: 100%;
}

/* Floating Label Styles */
.dh-floating-input {
  position: relative;
  display: flex;
  align-items: center;
}

.dh-floating-label {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  font-size: 16px;
  color: #9ca3af;
  background: white;
  padding: 0 4px;
  pointer-events: none;
  transition: all 0.2s ease-out;
  z-index: 1;
}

/* Floating state - when focused or has content (NOT for select elements) */
.dh-floating-input .dh-form-input:not(select):focus + .dh-floating-label,
.dh-floating-input .dh-form-input:not(select):not(:placeholder-shown) + .dh-floating-label {
  top: 14px;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 500;
  color: #16a34a;
  left: 12px;
}

/* Select elements - ensure default state */
.dh-floating-input select.dh-form-input:not(:focus):not(.dh-has-value) + .dh-floating-label {
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  font-weight: normal;
  color: #9ca3af;
  left: 12px;
}

/* Select elements - only float on focus or when they have a value (class-based) */
.dh-floating-input select.dh-form-input:focus + .dh-floating-label,
.dh-floating-input select.dh-form-input.dh-has-value + .dh-floating-label {
  top: 14px;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 500;
  color: #16a34a;
  left: 12px;
}

/* Date inputs should NOT auto-float - only when focused or have actual values */
.dh-floating-input input[type="date"]:not(:focus):invalid + .dh-floating-label {
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  font-weight: normal;
  color: #9ca3af;
}

/* Date inputs with actual values selected (valid) should float */
.dh-floating-input input[type="date"]:valid + .dh-floating-label,
.dh-floating-input input[type="date"]:focus + .dh-floating-label {
  top: 14px;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 500;
  color: #16a34a;
  left: 12px;
}

.dh-input-with-icon .dh-form-input:not(select):focus + .dh-floating-label,
.dh-input-with-icon .dh-form-input:not(select):not(:placeholder-shown) + .dh-floating-label,
.dh-input-with-icon input[type="date"]:valid + .dh-floating-label,
.dh-input-with-icon input[type="date"]:focus + .dh-floating-label {
  left: 56px;
}

/* Select elements with icons - default state */
.dh-input-with-icon select.dh-form-input:not(:focus):not(.dh-has-value) + .dh-floating-label {
  left: 56px;
}

/* Select elements with icons - floating state */
.dh-input-with-icon select.dh-form-input:focus + .dh-floating-label,
.dh-input-with-icon select.dh-form-input.dh-has-value + .dh-floating-label {
  left: 56px;
}

.dh-floating-input .dh-form-input {
  padding: 20px 16px 8px 16px;
  font-size: 16px;
  line-height: 1.5;
}

.dh-input-with-icon .dh-form-input {
  padding-left: 60px;
}

.dh-floating-label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: ${backgroundColor};
  padding: 0 4px;
  color: #9ca3af;
  font-size: 16px;
  font-weight: 400;
  pointer-events: none;
  transition: all 0.2s ease-in-out;
  z-index: 1;
  font-family: "${fontName}", sans-serif;
}

.dh-input-with-icon .dh-floating-label {
  left: 60px;
}

/* Floating state - when focused or has content */
.dh-floating-input .dh-form-input:focus + .dh-floating-label,
.dh-floating-input .dh-form-input:not(:placeholder-shown) + .dh-floating-label {
  top: 14px;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 500;
  color: ${primaryColor};
  left: 12px;
  background: transparent;
}

.dh-input-with-icon .dh-form-input:focus + .dh-floating-label,
.dh-input-with-icon .dh-form-input:not(:placeholder-shown) + .dh-floating-label {
  left: 56px;
}

/* Focused input border */
.dh-floating-input .dh-form-input:focus {
  border-color: ${primaryColor};
  box-shadow: 0 0 0 2px ${primaryFocus};
}

/* Input icon styles */
.dh-input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  z-index: 2;
  pointer-events: none;
  padding-right: 12px;
}

/* Full-height border separator for inputs with icons */
.dh-input-with-icon::before {
  content: '';
  position: absolute;
  left: 48px;
  top: 0;
  bottom: 0;
  width: 1px;
  background-color: #e5e7eb;
  z-index: 1;
}

/* Make calendar icons clickable */
.dh-input-icon[data-type="calendar"] {
  pointer-events: auto;
  cursor: pointer;
}

.dh-input-icon[data-type="calendar"]:hover {
  color: ${primaryColor};
}

.dh-input-icon svg {
  display: block;
}

.dh-floating-input .dh-form-input:focus ~ .dh-input-icon {
  color: ${primaryColor};
}

/* Textarea specific styles */
.dh-floating-input textarea.dh-form-input {
  resize: vertical;
  min-height: 80px;
  padding-top: 24px;
  padding-bottom: 12px;
}

.dh-floating-input textarea.dh-form-input + .dh-floating-label {
  top: 24px;
}

.dh-floating-input textarea.dh-form-input:focus + .dh-floating-label,
.dh-floating-input textarea.dh-form-input:not(:placeholder-shown) + .dh-floating-label {
  top: 8px;
}
.dh-prefilled-field { 
  background: #f0f9ff !important;
  border-color: #3b82f6 !important;
  position: relative;
}
.dh-prefilled-field::after {
  content: "✓";
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #10b981;
  font-weight: bold;
  pointer-events: none;
}
.dh-form-row {
  width: 515px;
  max-width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 13px;
  margin: 0 auto;
}
.dh-form-row .dh-form-group {
  width: 100%;
}

/* Address Autocomplete Styles */
.dh-address-autocomplete {
  position: relative;
  width: 100%;
}

.dh-address-search-field {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  font-size: 16px;
  font-family: "${fontName}", sans-serif;
  box-sizing: border-box;
  background: ${backgroundColor};
  color: ${textColor};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.dh-address-search-field:focus {
  border-color: ${primaryColor};
  box-shadow: 0 0 0 3px ${primaryFocus};
}

.dh-address-suggestions {
  position: relative;
  top: 100%;
  left: 0;
  right: 0;
  background: ${backgroundColor};
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 8px 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: none;
}

.dh-address-suggestion {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  font-family: "${fontName}", sans-serif;
  font-size: 14px;
  color: ${textColor};
  transition: background-color 0.2s ease;
}

.dh-address-suggestion:hover {
  background-color: #f9fafb;
}

.dh-address-suggestion.selected {
  background-color: ${primaryLight};
  color: ${primaryColor};
}

.dh-address-suggestion:last-child {
  border-bottom: none;
}

/* Removed duplicate address components - using improved versions below */

/* Change Address Button */
.dh-change-address-btn {
  background: none;
  border: 1px solid ${primaryColor};
  color: ${primaryColor};
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-family: "${fontName}", sans-serif;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.dh-change-address-btn:hover {
  background: ${primaryColor};
  color: white;
}

/* Address Image Loading and Error States */
.dh-image-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 120px;
  background: #f9fafb;
  border-radius: 8px;
  color: #6b7280;
}

.dh-image-loading .dh-loading-spinner {
  width: 24px;
  height: 24px;
  margin-bottom: 8px;
}

.dh-image-loading p {
  margin: 0;
  font-size: 14px;
  font-family: "${fontName}", sans-serif;
}

.dh-image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 120px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
  font-family: "${fontName}", sans-serif;
  text-align: center;
}

.dh-address-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
  opacity: 0;
  transition: opacity 0.5s ease;
}

/* Address Search Mode vs Display Mode */
#address-search-mode {
  height: 100%;
  display: flex;
  flex-direction: column;
}

#address-display-mode {
  display: none;
}

#address-display-mode.active {
  display: block;
}

#address-search-mode.hidden {
  display: none;
}

/* Service Area Check Button */
#check-service-area-btn {
  opacity: 0.6;
}

#check-service-area-btn:enabled {
  opacity: 1;
}

#check-service-area-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Selected Address Card Styling */
.dh-selected-address-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
}

/* Improved Address Imagery/Street View Styling */
.dh-address-imagery {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 16px auto 20px;
  position: relative;
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  width: 515px;
  max-width: 100%;
  height: 200px;
}

.dh-address-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  transition: opacity 0.3s ease;
}

/* Improved Loading States */
.dh-image-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #64748b;
  width: 100%;
}

.dh-image-loading .dh-loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid ${primaryColor};
  border-radius: 50%;
  animation: dh-spin 1s linear infinite;
  margin-bottom: 8px;
}

.dh-image-loading p {
  margin: 8px 0 0 0;
  font-size: 14px;
  font-family: "${fontName}", sans-serif;
}

/* Improved Error States */
.dh-image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #6b7280;
  text-align: center;
  width: 100%;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.dh-image-error p {
  margin: 0;
  font-size: 14px;
  font-family: "${fontName}", sans-serif;
}

/* Address Form Specific Improvements */
.dh-address-search-field {
  font-size: 16px;
  padding: 16px;
  border: 2px solid #d1d5db;
  border-radius: 12px;
  transition: all 0.3s ease;
  width: 100%;
  box-sizing: border-box;
  background: ${backgroundColor};
  color: ${textColor};
  font-family: "${fontName}", sans-serif;
}

.dh-address-search-field:focus {
  border-color: ${primaryColor};
  box-shadow: 0 0 0 4px ${primaryFocus};
  outline: none;
}

/* Enhanced Floating Label for Address Fields - moved above to replace incomplete rule */

/* Improved Change Address Button */
.dh-change-address-btn {
  background: transparent;
  color: ${primaryColor};
  border: 1px solid ${primaryColor};
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-block;
  font-family: "${fontName}", sans-serif;
}

.dh-change-address-btn:hover {
  background: ${primaryColor};
  color: white;
}

/* Address Display Header */
.dh-address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background: ${backgroundColor};
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.dh-address-header p {
  margin: 0;
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  color: ${textColor};
  font-weight: 500;
}

/* Address Formatted Display */
.dh-address-formatted {
  font-size: 16px;
  font-weight: 600;
  color: ${secondaryColor};
  margin-bottom: 8px;
  line-height: 1.4;
  font-family: "${fontName}", sans-serif;
}

/* Urgency Step Styling */
.dh-urgency-selection {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 24px 0;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.dh-urgency-option {
  padding: 20px 24px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  background: ${backgroundColor};
  color: ${textColor};
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.dh-urgency-option:hover {
  border-color: ${primaryColor};
  background: ${primaryLight};
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dh-urgency-option.selected {
  border-color: ${primaryColor};
  background: ${primaryColor};
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dh-urgency-option.selected::after {
  content: '✓';
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  font-weight: bold;
}

/* Enhanced Urgency Loading */
.dh-urgency-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: none;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  z-index: 10;
}

.dh-urgency-loading .dh-loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid ${primaryColor};
  border-radius: 50%;
  animation: dh-spin 1s linear infinite;
}

/* Responsive Urgency Options */
@media (max-width: 600px) {
  .dh-urgency-selection {
    gap: 12px;
    margin: 20px 0;
  }
  
  .dh-urgency-option {
    padding: 16px 20px;
    font-size: 15px;
  }
}

/* Out of Service Step Styling */
.dh-form-out-of-service {
  text-align: center;
  padding: 40px 0;
  margin: 0 auto;
}

.dh-form-out-of-service h3 {
  font-family: "${fontName}", sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: ${secondaryColor};
  margin: 0 0 16px 0;
  line-height: 1.3;
}

.dh-form-out-of-service p {
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: ${textColor};
  line-height: 1.5;
  margin: 0 0 24px 0;
}

/* Specific styling for out of service step heading */
#dh-step-out-of-service .dh-step-heading {
  margin-bottom: 40px;
}

/* Responsive styling for out-of-service */
@media (max-width: 600px) {
  .dh-form-out-of-service {
    padding: 30px 20px;
  }
  
  .dh-form-out-of-service h3 {
    font-size: 20px;
  }
  
  .dh-form-out-of-service p {
    font-size: 15px;
  }
}

/* Spinning Animation for Loading */
@keyframes dh-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Initial Offer Step Styling */
.dh-offer-options {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin: 24px 0;
}

.dh-offer-options p {
  margin: 0;
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: ${textColor};
}

.dh-offer-btn {
  padding: 16px 24px;
  border: 2px solid;
  border-radius: 8px;
  font-family: "${fontName}", sans-serif;
  font-weight: 600;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  outline: none;
  text-decoration: none;
  display: inline-block;
  min-width: 160px;
  box-sizing: border-box;
}

.dh-offer-btn-primary {
  background: ${primaryColor};
  color: white;
  border-color: ${primaryColor};
}

.dh-offer-btn-primary:hover {
  background: ${primaryDark};
  border-color: ${primaryDark};
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dh-offer-btn-secondary {
  background: ${backgroundColor};
  color: ${primaryColor};
  border-color: ${primaryColor};
}

.dh-offer-btn-secondary:hover {
  background: ${primaryFocus};
  color: ${primaryColor};
  transform: translateY(-1px);
}

.dh-offer-btn-tertiary {
  background: transparent;
  color: #6b7280;
  border-color: #d1d5db;
}

.dh-offer-btn-tertiary:hover {
  background: #f9fafb;
  color: #374151;
  border-color: #9ca3af;
}

@media (max-width: 480px) {

  .dh-pest-logo img {
    width: 119px !important;
  }

  .dh-safety-message {
    flex-direction: row-reverse;
    margin: 0;
  }

  .dh-how-we-do-it-text {
   margin-right: 0;
  }

  #how-we-do-it-interior-image, .dh-plan-image-actual img {
    width: 100vw !important;
    height: 240px !important;
    max-width: unset !important;
    object-fit: cover;
    object-position: top;
    opacity: 0;
    transition: opacity 0.5s ease;
    border-radius: 0;
    margin-left: calc(-50vw + 50%);
    margin-right: calc(-50vw + 50%);
    border-radius: 0 !important;
  }
  
  .dh-offer-options {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  
  .dh-offer-btn {
    width: 100%;
    max-width: 280px;
  }
  
  .dh-address-imagery {
    width: 100%;
    height: 160px;
    margin: 12px auto 16px;
  }
  
  .dh-address-search-field {
    padding: 14px;
    font-size: 16px;
  }
  
  .dh-selected-address-card {
    padding: 16px;
    margin: 12px 0;
  }

  .dh-form-button-group {
    width: 100%;
    padding: 40px 0 0 0 !important;
  }


  .dh-form-btn:not(.plan-no-thanks) {
  width: 100%;
  }
}
.dh-form-checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: ${textColor};
  cursor: pointer;
  margin-bottom: 40px;
}
.dh-form-checkbox {
  width: 18px !important;
  height: 18px !important;
  margin: 0 !important;
  flex-shrink: 0;
  margin-top: 2px !important;
  cursor: pointer;
} 
.dh-form-select { 
  width: 100%; 
  padding: 12px 16px; 
  border: 1px solid #d1d5db; 
  border-radius: 8px; 
  outline: none; 
  font-size: 14px; 
  font-family: "${fontName}", sans-serif; 
  background: ${backgroundColor}; 
  box-sizing: border-box; 
  color: ${textColor};
} 
.dh-form-select:focus { 
  border-color: ${primaryColor}; 
  box-shadow: 0 0 0 3px ${primaryFocus}; 
} 
.dh-form-radio-group { 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
} 
.dh-form-radio-option { 
  display: flex; 
  align-items: center; 
  padding: 12px; 
  border: 1px solid #d1d5db; 
  border-radius: 8px; 
  cursor: pointer; 
  transition: all 0.2s ease; 
} 
.dh-form-radio-option:hover { 
  background: #f9fafb; 
} 
.dh-form-radio-option.selected { 
  border-color: ${primaryColor}; 
  background: ${primaryLight}; 
} 
.dh-form-radio-option input { 
  margin-right: 8px; 
} 
.dh-form-button-group { 
  display: flex; 
  position: relative;
  gap: 12px; 
  margin-top: auto; 
  justify-content: center;
  align-items: center;
  padding: 24px 20px 20px 20px;
  border-radius: 0 0 26px 26px;
} 
#dh-step-exit-survey .dh-form-button-group { 
  background: none;
} 
.dh-form-btn { 
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 30px; 
  gap: 25px;
  border: 2px solid #fff; 
  border-radius: 60px; 
  cursor: pointer; 
  font-size: 18px;
  line-height: 18px;
  font-family: "${fontName}", sans-serif;
  font-weight: 700; 
  transition: all 0.2s ease;
  }

.dh-form-btn:not(.plan-no-thanks) {
  min-width: 241px;
}

.dh-form-btn:active {
  transform: translateY(0);
  transition: all 0.1s ease;
} 
.dh-form-btn-primary { 
  background: ${primaryColor}; 
  color: white;
} 
.dh-form-btn-primary:hover { 
  border-color: ${primaryColor};
} 
.dh-form-btn-secondary { 
  background: ${secondaryColor}; 
  color: #fff;  
} 

.dh-form-btn-secondary:hover {
  border-color: ${secondaryColor};
}

.dh-form-btn-back { 
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #CBCBCB; 
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 18px;
} 
.dh-form-btn-back svg { 
  transition: transform 0.2s ease;
} 
.dh-form-btn-back:hover svg { 
  transform: translateX(-2px);
} 
.dh-form-btn-back#no-thanks:hover svg { 
  transform: none;
} 
.form-submit-step-back {
  position: absolute;
  left: 20px;
  bottom: 20px;
  background: transparent;
}
.dh-form-btn.submitting {
  position: relative;
  pointer-events: none;
}
.dh-form-btn.submitting::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  margin: auto;
  border: 2px solid transparent;
  border-top-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  top: 0;
  right: 12px;
  bottom: 0;
}
  .dh-form-btn.plan-no-thanks {
    background: #bfbfbf20;
    color: #515151;
  }

  .dh-form-btn.plan-no-thanks svg {
    display: none;
  }
  .dh-form-btn.plan-no-thanks:hover {
    opacity: 0.8;
  }
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Animation keyframes for smooth transitions */
@keyframes fadeIn {
  from { 
    opacity: 0; 
  }
  to { 
    opacity: 1; 
  }
}

@keyframes fadeOut {
  from { 
    opacity: 1; 
  }
  to { 
    opacity: 0; 
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideOutDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(30px);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scaleOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.dh-pest-selection {
  gap: 32px;
  padding: 0 0 20px 0;
  flex-flow: row wrap;
  justify-content: center;
}
.dh-pest-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}
.dh-pest-icon {
  width: 103px;
  height: 103px;
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px #BFBFBF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.dh-pest-icon svg {
  width: 60px;
  height: 60px;
  fill: #4E4E4E;
  opacity: 0.66;
}
.dh-pest-icon svg path {
  fill: #4E4E4E;
}
.dh-pest-label {
  text-align: center;
  margin-top: 8px;
  width: 100%;
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 18px;
}
.dh-pest-option:hover .dh-pest-icon {
  box-shadow: inset 0 0 0 2px #515151;
}

.dh-pest-option:hover .dh-pest-icon svg {
  opacity: 1;
}

.dh-pest-option.selected .dh-pest-icon {
  box-shadow: inset 0 0 0 2px ${primaryColor};
  color: white;
}

/* Keep only these styles that are still used by other steps */
.dh-address-pest-icon {
  display: block;
  margin: 0 auto 20px;
  width: 80px;
  height: 80px;
}
.dh-address-pest-icon svg {
  width: 100%;
  height: 100%;
}
.dh-address-pest-icon svg path {
  fill: ${primaryColor};
}
.dh-step-instruction {
  color: #4E4E4E;
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  font-weight: 500;
  margin: 20px 0;
}
.dh-plan-loading {
  text-align: center;
  padding: 40px 20px;
  color: ${textColor};
}
.dh-pest-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.dh-pest-loading.show {
  opacity: 1;
}
  border-radius: 20px;
}
.dh-pest-loading .dh-loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid ${primaryColor};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0;
}

/* New Pest Step Layout with Hero Image */
.dh-pest-step-container {
  display: flex;
  width: 100%;
  min-height: 100%;
  position: relative;
  overflow: visible;
}

.dh-pest-content {
  flex: 1;
  padding: 40px 70px;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
  text-align: center;
  align-items: center;
}

.dh-pest-logo {
  margin-bottom: 40px;
}

.dh-pest-logo img {
  max-height: 99px;
  max-width: 224px;
  height: auto;
  width: auto;
}

.dh-pest-time-badge {
  display: inline-block;
  margin-bottom: 24px;
}

.dh-pest-time-badge span {
  color: ${secondaryColor};
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  font-weight: 700;
}

.dh-pest-heading {
  color: #515151;
  font-family: "${fontName}", sans-serif;
  font-size: 46px;
  font-weight: 700;
  line-height: 46px;
  letter-spacing: -0.46px;
  margin: 0 0 24px 0;
}

.dh-pest-instruction {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  margin: 0 0 40px 0;
}

.dh-pest-selection {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}

.dh-pest-option:hover .dh-pest-icon svg path {
  fill: #515151;
}

.dh-pest-option:active .dh-pest-icon svg path {
  fill: ${primaryColor};
}

.dh-pest-option:active .dh-pest-label {
  color: ${primaryColor};
}

.dh-pest-option:active .dh-pest-icon {
  box-shadow: inset 0 0 0 2px ${primaryColor};
  scale: 1.05;

}

.dh-pest-option.selected .dh-pest-icon svg path {
  fill: white;
}

.dh-pest-option.selected .dh-pest-label {
  color: white;
}



.dh-pest-icon svg {
  width: 69px;
  height: 69px;
  fill: #6b7280;
  transition: fill 0.2s ease;
}

.dh-pest-label {
  text-align: center;
  color: #374151;
  font-family: "${fontName}", sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 120%;
  margin: 0;
  transition: color 0.2s ease;
}

.dh-pest-hero {
  width: 386px;
  max-height: 889px;;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dh-pest-hero:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 1) 80%
  );
  z-index: 2;
}

.dh-pest-hero:not(.step1):before {
    background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 1) 100%
  );
}

.dh-pest-bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 80%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #f3f4f6;
  border-radius: 0 26px 26px 0;
  z-index: 1;
}

/* Specific styling for confirm-address background */
#confirm-address-bg-image {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.dh-pest-bg-image:not(.step1) {
height: 100%;
}

.dh-pest-hero-image {
  position: fixed;
  bottom: 0;
  z-index: 2;
  max-width: 453px;
  max-height: 889px;
  object-fit: contain;
  border-radius: 0 26px 26px 0;
  transition: opacity 0.5s ease;
}

/* Tablet Responsive - 1024px and below */
@media (max-width: 1024px) {
  .dh-modal-overlay {
    padding: 0 !important;
  }

  .dh-modal-content {
    overflow-y: scroll !important;
    border-radius: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-height: 100vh !important;
    max-width: 100vw !important;
  }

  .dh-form-step-content {
    flex-direction: column;
    flex-wrap: nowrap !important;;
  }

  .dh-pest-hero {
    width: 100%;
    min-height: unset;
  }

  .dh-pest-hero-image {
    display: none !important;
  }

  .dh-pest-bg-image {
    border-radius: 0 !important;;
  }

  .dh-pest-hero:before {
  background: linear-gradient(
    to top,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 1) 100%
  ) !important;
  }

  #dh-form-container {
    width: 100%;
  }
  
  .dh-pest-step-container {
    width: 100%;
    flex-direction: column;
    overflow: visible;
  }

  .dh-how-we-do-it-content {
    flex-direction: column-reverse;
    align-items: center;
    margin-top: 0;
  }
  
  .dh-how-we-do-it-text {
    margin-top: 48px;
  }

  .dh-pest-bg-image {
    position: relative;
    width: 100%;
    min-height: 240px;
    border-radius: 0 0 26px 26px;
    z-index: 1;
    background-position: top;
  }
  
  .dh-pest-bg-image:not(.step1) {
    height: 200px;
  }
  
  /* Confirm address mobile image styles */
  #dh-step-confirm-address .dh-pest-hero {
    display: none;
  }
  
  #dh-step-confirm-address .dh-mobile-bg-image {
    display: block;
    margin: 24px 0;
  }

  .dh-plan-content-grid {
    display: flex !important;
    flex-direction: column !important;
  }

  .dh-plan-visual {
    order: -1;
    margin: auto;
  }

  #dh-step-plan-comparison .dh-pest-hero {
    display: none;
  }

  .dh-widget-close-icon:not(:hover) svg path {
  stroke: #B2B2B2;
  }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .dh-pest-step-container,
  .dh-form-step-content {
    flex-direction: column;
    min-height: auto;
  }
  
  .dh-pest-content,
  .dh-form-content-area {
    padding: 20px;
  }
  
  .dh-pest-heading {
    font-size: 30px;
    line-height: 32px;
  }
  
  .dh-pest-selection {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  
  /* Global elements mobile responsive */
  .dh-global-back-button {
    top: 20px;
    padding: 12px 18px;
    font-size: 0;
  }
  
  .dh-global-back-button svg {
    width: 16px;
    height: 14px;
  }
  
  .dh-widget-close-icon {
    top: 24px;
    right: 20px;
    width: 26px;
    height: 26px;
  }
  
  .dh-widget-close-icon svg {
    width: 26px;
    height: 26px;
  }

  .dh-plan-faqs-container {
    max-width: 100%;
    width: unset;
    margin: 0 0 50px 0; 
    border-radius: 0;
  }
}

/* Mobile background image for confirm address step */
.dh-mobile-bg-image {
  display: none;
  width: 100%;
  max-width: 512px;
  height: auto;
  object-fit: cover;
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.5s ease;
}
  
  /* Mobile responsive styles for reviews display */
  .dh-reviews-container {
    margin: 0 0 20px 0;
    min-height: 22px;
  }
  
  .dh-reviews-display {
    gap: 6px;
  }
  
  .dh-reviews-count {
    font-size: 14px;
    margin-left: 3px;
    position: relative;
    top: 2px;
  }
  
  .dh-skeleton-stars::before {
    font-size: 14px;
  }
  
  .dh-skeleton-text {
    height: 14px;
    width: 100px;
  }
}


@media (max-width: 480px) {

  .dh-pest-logo {
    margin-bottom: 24px;
  }

  .dh-pest-logo img {
    max-height: 53px;
    max-width: 119px;
  }
  
  .dh-pest-heading {
    font-size: 32px;
    line-height: 32px;
    letter-spacing: -0.3px;
  }

  .dh-pet-safety-image {
    width: 144px;
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  .dh-safety-text {
    font-size: 22px;
    line-height: 26px;
  }

  .dh-subspecies-grid {
    gap: 2px 20px;
  }

  .dh-form-btn {
    width: 100%;
  }

  .dh-plan-visual {
    width: 100vw;
    max-width: unset !important;
    margin-left: calc(-50vw + 50%);
    margin-right: calc(-50vw + 50%);
  }

  .dh-plan-visual img {
    border-radius: 0 !important;
  }

  .dh-plan-image-container {
    border-radius: 0 !important;
  }
}


.dh-urgency-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.dh-urgency-loading.show {
  opacity: 1;
}
  border-radius: 20px;
}
.dh-urgency-loading .dh-loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid ${primaryColor};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0;
}
.dh-quote-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.dh-quote-loading.show {
  opacity: 1;
}
  border-radius: 20px;
}
.dh-quote-loading .dh-loading-spinner {
  width: 64px;
  height: 64px;
  border: 6px solid #e5e7eb;
  border-top: 6px solid ${primaryColor};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0;
}
.dh-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid ${primaryColor};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px auto;
}

/* Button widget styles */
.dh-widget-button {
  background: ${primaryColor};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: "${fontName}", sans-serif;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dh-widget-button:hover {
  background: ${primaryDark};
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.dh-widget-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Modal styles */
.dh-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(48, 48, 48, 0.82);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 999999;
  padding: 20px;
  box-sizing: border-box;
  opacity: 0;
  overflow: auto;
  transition: opacity 0.3s ease, backdrop-filter 0.3s ease;
}

.dh-modal-overlay.show {
  opacity: 1;
}

.dh-modal-overlay.hide {
  opacity: 0;
}

.dh-modal-content {
  border-radius: 26px;
  margin: auto;
  max-width: 1078px;
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  background: white;
  font-family: "${fontName}", sans-serif;
  display: flex;
  flex-direction: column;
  transform: scale(0.95);
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
  overflow: visible;
}

.dh-modal-overlay.show .dh-modal-content {
  transform: scale(1);
  opacity: 1;
}

.dh-modal-overlay.hide .dh-modal-content {
  transform: scale(0.95);
  opacity: 0;
}

/* Welcome Screen Styles */
.dh-welcome-screen {
  position: relative;
  min-height: 500px;
  border-radius: 26px;
  overflow: visible;
  background: white;
}

.dh-welcome-content {
  width: 100%;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 500px;
  box-sizing: border-box;
  z-index: 10;
  position: relative;
}

.dh-welcome-hero {
  position: absolute;
  bottom: 0;
  right: -40px;
  width: 350px;
  height: 450px;
  background-size: contain;
  background-position: bottom right;
  background-repeat: no-repeat;
  border-radius: 0 0 16px 0;
  z-index: 1;
}

.dh-welcome-svg-background {
  display: block;
  position: absolute;
  bottom: 0;
  right: 0;
  width: 500px;
  height: 500px;
  z-index: 0;
  pointer-events: none;
  border-radius: 26px;
  opacity: 0.53;
  background: radial-gradient(59.99% 58.34% at 70.4% 74.11%, ${primaryColor} 0%, rgba(255, 255, 255, 0.90) 100%);
}

.dh-welcome-svg-background img {
  display: block;
  position: relative;
  width: 100%;
  height: auto;
  pointer-events: none;
}

/* Progress bar styles removed - no longer needed */

.dh-welcome-title {
  font-size: 65px;
  font-weight: 700;
  color: ${secondaryColor};
  margin: 0 0 20px 0;
  line-height: 1.2;
}

.dh-welcome-description {
  font-size: 30px;
  color: #2B2B2B;
  font-weight: 500;
  margin: 0 0 32px 0;
  line-height: 103%;
  max-width: 75%;
}

.dh-welcome-benefits {
  list-style: none;
  padding: 0;
  margin: 0 0 40px 0;
}

.dh-welcome-benefits li {
  display: flex;
  align-items: center;
  padding: 8px 0;
  font-size: 16px;
  color: #374151;
}

.dh-benefit-icon {
  margin-right: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.dh-benefit-icon svg {
  width: 20px;
  height: 20px;
  max-width: 100%;
  max-height: 100%;
}

.dh-benefit-text {
  flex: 1;
}

.dh-welcome-button {
  background: ${secondaryColor};
  color: white;
  border: none;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 8px;
  outline: none;
}

.dh-welcome-button:hover {
  background: ${secondaryDark};
  transform: translateY(1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
.dh-welcome-button:focus {
  outline: none;
}

.dh-button-arrow {
  transition: all 0.2s;
}

.dh-button-arrow svg, .dh-form-btn svg {
  display: block;
  position: relative;
}

.dh-welcome-button:hover .dh-button-arrow {
  transform: translateX(2px);
}

.dh-step-heading {
  color: #515151;
  text-align: center;
  font-size: 46px;
  font-weight: 700;
  line-height: 46px;
  margin: 0 0 20px 0;
}

.dh-terms-disclaimer {
  color: #4E4E4E;
  font-size: 11px;
  font-style: normal;
  font-weight: 500;
  line-height: 103%;
  margin-top: 16px;
}

.dh-modal-body {
  flex: 1;
  overflow-y: visible;
  padding: 0;
  min-height: 0;
}

.dh-modal-close {
  display: none;
  position: absolute;
  top: -10px;
  right: -10px;
  background: #fff;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  color: #374151;
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  border: 2px solid #e5e7eb;
}

.dh-modal-close:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.dh-modal-body .dh-form-widget {
  margin: 0;
  min-height: 100%;
  display: flex;
  box-shadow: none;
  border-radius: 26px;
  padding: 0;
}

#dh-form-container {
  display: flex;
  width: 100%;
}

.dh-modal-body .dh-form-content {
  height: 100%;
  width: 100%;
  padding: 0;
  margin: 0;
}

/* Progress styles removed */

/* Mobile modal adjustments */
@media (max-width: 768px) {
  .dh-modal-overlay {
    padding: 10px;
  }
  
  .dh-modal-content {
    min-height: 95vh;
    width: 95%;
  }
  
  .dh-modal-close {
    top: 8px;
    right: 8px;
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
  
  /* Progress styles removed */
  
  .dh-widget-button {
    padding: 14px 28px;
    font-size: 16px;
    width: 100%;
    max-width: 300px;
  }

  .dh-pest-logo {
    margin-bottom: 24px;
  }

  .dh-step-heading {
    font-size: 30px;
    line-height: 32px;
  }

  .dh-step-instruction {
    margin: 0 0 20px 0;
  }

  #safety-message-text {
    font-size: 22px;
    line-height: 26px;
  }

  .dh-pet-safety-image {
    width: 144px;  
  }

  .dh-subspecies-grid {
    margin-bottom: 48px;
  }

  .dh-welcome-screen {
    min-height: auto;
  }
  
  .dh-welcome-content {
    padding: 40px 30px;
    padding-right: 230px;
    min-height: 400px;
  }
  
  .dh-welcome-title {
    font-size: 28px;
  }
  /* Progress styles removed */
}

/* Plan Comparison Styles - Exact Copy from Original */
.dh-plan-tabs {
  display: flex;
  justify-content: center;
  gap: 0;
  margin: 24px 0;
  border-bottom: 1px solid #cccccc;
  overflow: hidden;
}
.dh-plan-tab {
  flex: 1;
  text-align: center;
  padding: 16px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.dh-plan-tab.active {
  color: ${secondaryColor};
  z-index: 1;
}
.dh-plan-tab-label {
  color: #4E4E4E;
  text-align: center;
  font-family: "${fontName}", sans-serif;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  line-height: 30px;
  letter-spacing: 2.4px;
  opacity: 0.5;
}
.dh-plan-tab-name {
  color: #4E4E4E;
  text-align: center;
  font-family: "${fontName}", sans-serif;
  font-size: 20px;
  font-weight: 400;
  line-height: 24px;
}
.dh-plan-tab.active .dh-plan-tab-label {
  opacity: 1;
}
.dh-plan-tab.active .dh-plan-tab-name {
  font-weight: 600;
  color: ${secondaryColor};
}

/* Plan Content Area */
.dh-plan-content {
  margin: 32px 0;
  min-height: 400px;
}

@media (max-width: 768px) {
  .dh-plan-details {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

/* Plan Main Content */
.dh-plan-main {
  padding: 0;
}
.dh-form-step h3.dh-plan-title {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 30px;
  font-style: normal;
  font-weight: 700;
  line-height: 24px;
}
.dh-plan-description {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
}

.dh-plan-included h4 {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 33px;
  margin-bottom: 5px;
}
.dh-plan-features-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.dh-plan-feature {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  line-height: 19px;
  font-weight: 600;
  margin-bottom: 16px;
}

.dh-feature-checkmark svg {
  display: block;
}

.dh-feature-checkmark path {
  stroke: ${primaryColor};
}

.dh-plan-price-label {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 26px;
  font-weight: 500;
  line-height: 30px;
}

.dh-plan-recommendation-badge {
  margin-bottom: 7px;
  line-height: 10px;
}

.dh-plan-pricing {
  grid-column: span 2;
  margin-left: 15px;
}
  
.dh-plan-price-detail {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 20px;
  font-weight: 400;
  line-height: 25px;
  margin: 8px 0 4px 0;
}
.dh-plan-price-disclaimer {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 13px;
  font-style: normal;
  font-weight: 700;
  line-height: 18px;
  margin-top: 20px;
  }
.dh-plan-price-frequency {
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  margin-top: 10px;
  font-weight: 500;
  line-height: 24px;
}

.dh-plan-coverage-icons {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 12px;
  margin: 24px 0;
  grid-column: 1 / -1;
}

.dh-coverage-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${textColor};
}

.dh-coverage-checkmark {
  color: #10b981;
  font-weight: bold;
  font-size: 14px;
}

/* Plan Visual/Image Area */
.dh-plan-visual {
  position: relative;
}
.dh-plan-image-container {
  height: 100%;
  border-radius: 12px;
}
.dh-plan-image-actual {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
}

/* Plan Actions */
.dh-plan-actions {
  margin: 32px 0 0 0;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}
@media (max-width: 768px) {
  .dh-plan-actions {
    flex-direction: column;
  }
}

.dh-form-btn.plan-no-thanks:hover {
  opacity: 0.8;
}

/* FAQ Accordion Styles */
.dh-plan-faqs {
  padding: 20px 0 0 0;
}
.dh-form-step h3.dh-faqs-title {
  color: #515151;
  text-align: center;
  font-family: "${fontName}", sans-serif;
  font-size: 30px;
  font-weight: 700;
  line-height: 103%;
}
.dh-faqs-container {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.dh-faq-item:not(:last-of-type) {
  border-bottom: 1px solid #e5e7eb;
}

.dh-faq-item {
  overflow: hidden;
  transition: all 0.2s ease;
}


.dh-plan-selection-label {
color: ${primaryColor};
font-family: "Source Sans 3";
font-size: 12px;
font-style: normal;
font-weight: 600;
line-height: 28px;
}

.dh-plan-selection-dropdown {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  padding: 10px;
  min-width: 333px;
  width: 50%;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 22px;
  padding-right: 30px;
  border-radius: 4px;
  border: 1px solid #BFBFBF;
  font-weight: 700;
  font-size: 16px;
  color: #515151;
}

.dh-plan-selection-section {
  display: flex;
  flex-direction: column;
}

.dh-faq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.dh-faq-header:hover .dh-faq-question {
  font-weight: 700;
}

.dh-faq-question {
  font-size: 17px;
  font-weight: 600;
  color: ${textColor};
  margin: 0;
  flex: 1;
  padding-right: 16px;
  text-align: left;
  transition: all 0.2s ease;
}

.dh-faq-icon {
  font-size: 20px;
  font-weight: 300;
  color: ${primaryColor};
  transition: transform 0.2s ease;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dh-faq-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  background: transparent;
}
.dh-faq-answer {
  padding: 0 0 16px 0;
}
.dh-faq-answer p {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}
@media (max-width: 768px) {
  .dh-plan-faqs {
    margin: 32px 0 0 0;
    padding: 0;
  }
  .dh-faqs-title {
    font-size: 18px;
    margin: 0 0 20px 0;
  }
  .dh-faq-header {
    padding: 14px 16px;
  }
  .dh-faq-question {
    font-size: 15px;
    padding-right: 12px;
  }
  .dh-faq-answer {
    padding: 0 16px 14px 16px;
  }

  .dh-plan-pricing {
    margin-left: 0;
  }
}

/* Mobile Styles */
@media (max-width: 650px) {

  .dh-plan-main {
    order: 2;
  }

  .dh-plan-coverage-icons {
    order: 3;
  }
}

@media (max-width: 480px) {
  .dh-plan-title {
    font-size: 26px;
  }

  .dh-plan-description {
    font-size: 18px;
  
  }

  .dh-plan-included h4 {
    text-align: center;
    font-size: 16px;
  }

  .dh-plan-tabs {
    justify-content: flex-start;
    overflow-x: auto;
  }

  #comparison-plan-content {
    padding: 0;
  }
  
  .dh-plan-content {
    margin: 24px 0;
  }

  .dh-reviews-container {
    margin: 0;
  }

  .dh-plan-details {
    gap: 0;
  }

  .dh-form-step h3.dh-plan-title {
    font-size: 30px;
  }
}

/* Exit Survey Styles */
.dh-exit-survey-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
}

/* New Feedback Options Styles */
.dh-feedback-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 30px 0;
  width: 100%;
  max-width: 400px;
}

.dh-feedback-option {
  position: relative;
  cursor: pointer;
}

.dh-feedback-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.dh-feedback-button {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
  transition: all 0.2s ease;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.dh-feedback-button:hover {
  border-color: #ccc;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dh-feedback-radio:checked + .dh-feedback-button {
  border-color: var(--primary-color, #27ae60);
  background: rgba(39, 174, 96, 0.05);
  box-shadow: 0 2px 8px rgba(39, 174, 96, 0.15);
}

.dh-feedback-emoji {
  font-size: 24px;
  line-height: 1;
}

.dh-feedback-text {
  flex: 1;
  text-align: left;
}

/* Textarea Styles */
.dh-textarea-container {
  width: 100%;
}

.dh-form-textarea {
  width: 100%;
  padding: 16px;
  border: 2px solid #e5e5e5;
  border-radius: 12px;
  font-size: 16px;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.dh-form-textarea:focus {
  outline: none;
  border-color: var(--primary-color, #27ae60);
  box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1);
}

.dh-form-textarea::placeholder {
  color: #999;
}
.dh-survey-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${backgroundColor};
}
.dh-survey-option:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}
.dh-survey-option.selected {
  border-color: ${primaryColor};
  background: ${primaryFocus};
}
.dh-survey-emoji {
  font-size: 24px;
  flex-shrink: 0;
}
.dh-survey-text {
  font-size: 16px;
  font-weight: 500;
  color: ${textColor};
}

/* Success/completion step styles */
.dh-form-success { 
  text-align: center; 
  padding: 40px 20px; 
} 
.dh-form-success h3 { 
  color: #059669; 
  margin: 0 0 12px 0; 
} 
.dh-form-success p { 
  color: #6b7280; 
  margin: 0; 
}

#dh-step-decline-complete .dh-form-success {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Plan content grid layout */
.dh-plan-content-grid {
  display: grid;
  grid-template-columns: 1fr 247px;
  gap: 20px 30px;
  align-items: start;
}

.dh-recommendation-text {
  color: ${primaryColor};
  font-size: 10px;
  line-height: 10px;
  font-style: normal;
  font-weight: 600;
  letter-spacing: 1.9px;
  margin-bottom: 7px;
  text-transform: uppercase;
}


.dh-plan-info {
  /* Content takes up remaining space */
}

.dh-plan-visual {
  height: 100%;
  /* Image on the right side */
}

.dh-plan-visual .dh-plan-image-actual img {
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.5s ease;
  object-fit: cover;
  border-radius: 12px;
}

/* New pricing layout styling */
.dh-plan-price-container {
  display: flex;
  margin: 10px 0 20px 10px;
  align-items: center;
  gap: 40px;
}

.dh-plan-price-left {
  display: flex;
  flex-direction: column;
  position: relative
}

.dh-plan-price-left::after {
    content: '';
    position: absolute;
    right: -22px;
    top: 10px;
    width: 1px;
    height: 50px;
    background: #BFBFBF; 
}

.dh-plan-price-starting {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 5px;
  margin-left: 30px;
}

.dh-plan-price-recurring {
  color: ${primaryColor};
  font-family: "${fontName}", sans-serif;
  font-size: 64px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  position: relative;
}

.dh-plan-price-right {
  display: flex;
  flex-direction: column;
}

.dh-plan-price-initial {
  color: ${primaryColor};
  font-family: "${fontName}", sans-serif;
  font-size: 24px;
  font-weight: 400;
}

.dh-plan-price-initial .dh-price-number {
  font-weight: 700;
}

.dh-plan-price-initial span.dh-price-dollar {
  font-size: 17px;
  position: relative;
  top: -7px;
  font-weight: 700;
}

.dh-plan-price-normally {
  color: #4E4E4E;
  font-family: "${fontName}", sans-serif;
  font-size: 19px;
  font-weight: 400;
}

.dh-plan-price-normally span.dh-price-dollar {
  font-size: 14px;
  position: relative;
  top: -5px;
}

.dh-plan-price-crossed {
  text-decoration: line-through;
  font-weight: 700;
}

/* Dollar sign styling */
.dh-plan-price-recurring .dh-price-dollar {
  align-self: flex-start;
  font-size: 37px;
}

/* Asterisk and frequency styling - stacked vertically and smaller */
.dh-price-asterisk {
  font-size: 32px;
  position: relative;
  top: 5px;
  color: #515151;
  font-weight: 400;
  margin-left: 2px;
  align-self: flex-start;
}

/* Exit Survey Centered Layout */
.dh-exit-survey-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
}

.dh-exit-survey-centered .dh-step-heading {
  font-size: 48px !important;
  font-weight: 700 !important;
  line-height: 1.2 !important;
  margin-bottom: 16px !important;
  color: #333 !important;
}

.dh-exit-survey-centered .dh-step-instruction {
  font-size: 20px !important;
  line-height: 1.5 !important;
  margin-bottom: 40px !important;
  color: #666 !important;
  max-width: 500px;
}

.dh-exit-survey-centered .dh-form-group {
  width: 100%;
  max-width: 400px;
  margin-bottom: 24px;
}

/* Custom checkbox styling for exit survey */
.dh-checkbox-container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
  margin-bottom: 40px;
  cursor: pointer;
}

.dh-checkbox-input {
  position: absolute !important;
  opacity: 0 !important;
  cursor: pointer !important;
}

.dh-checkbox-checkmark {
  position: relative;
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  background-color: white;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.2s ease;
}

.dh-checkbox-checkmark:after {
  content: '';
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 10px;
  border: solid ${primaryColor};
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.dh-checkbox-input:checked ~ .dh-checkbox-checkmark {
  background-color: ${primaryColor};
  border-color: ${primaryColor};
}

.dh-checkbox-input:checked ~ .dh-checkbox-checkmark:after {
  display: block;
  border-color: white;
}

.dh-checkbox-text {
  font-size: 14px;
  line-height: 1.5;
  color: #374151;
}

.dh-link {
  color: ${primaryColor};
  text-decoration: underline;
  cursor: pointer;
}

.dh-link:hover {
  color: ${primaryDark};
}

.dh-read-more-link {
  color: ${secondaryColor};
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
}

.dh-read-more-link:hover {
  color: ${secondaryDark};
}

.dh-exit-survey-buttons {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.dh-exit-survey-buttons .dh-form-btn {
  min-width: 200px;
}

/* Error states for exit survey */
.dh-exit-survey-centered .dh-form-input.error {
  border-color: #ef4444 !important;
}

.dh-exit-survey-centered .dh-checkbox-container.error .dh-checkbox-checkmark {
  border-color: #ef4444 !important;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .dh-exit-survey-centered {
    padding: 20px 16px;
  }
  
  .dh-exit-survey-centered .dh-step-heading {
    font-size: 32px !important;
  }
  
  .dh-exit-survey-centered .dh-step-instruction {
    font-size: 18px !important;
  }
  
  .dh-exit-survey-buttons .dh-form-btn {
    min-width: 160px;
  }
  
  .dh-feedback-options {
    max-width: 100%;
    margin: 20px 0;
  }
  
  .dh-feedback-button {
    padding: 14px 16px;
    font-size: 15px;
  }
  
  .dh-feedback-emoji {
    font-size: 20px;
  }
  
  .dh-form-textarea {
    padding: 14px;
    font-size: 15px;
  }
}

/* Contact Step Information Display Sections */
.dh-info-section {
  margin: 24px 0;
  text-align: center;
}

.dh-info-section-header {
  font-size: 12px !important;
  font-style: normal !important;
  font-weight: 600 !important;
  line-height: 28px !important;
  color: ${primaryColor} !important;
  margin: 0 0 8px 0 !important;
}

.dh-info-section-content {
  font-size: 18px !important;
  font-style: normal !important;
  font-weight: 600 !important;
  line-height: 28px !important;
  color: #4E4E4E !important;
}

.dh-info-section-content div {
  margin-bottom: 4px;
}

.dh-info-section-content div:last-child {
  margin-bottom: 0;
}

/* Contact step specific adjustments */
#dh-step-contact .dh-form-content-area {
  margin: 0 auto;
  text-align: center;
}

#dh-step-contact .dh-form-row {
  display: flex;
  gap: 16px;
}

#dh-step-contact .dh-form-row .dh-form-group {
  flex: 1;
}

/* Ensure proper spacing for contact step */
#dh-step-contact .dh-step-heading {
  text-align: center;
  margin-bottom: 12px;
}

#dh-step-contact .dh-step-instruction {
  text-align: center;
  margin-bottom: 32px;
}

/* Complete Step Styles */
.dh-complete-section {
  margin: 32px 0;
  width: 100%;
}

#dh-step-complete .dh-complete-section-title,  #dh-step-complete .dh-complete-service-date,  #dh-step-complete .dh-complete-section-content   {
  font-size: 16px;
  font-weight: 700;
  color: #4E4E4E;
  margin: 0 0 8px 0;
  text-align: center;
  line-height: 20px;
}

#dh-step-complete .requested-date-time {
  font-size: 13px;
}

.dh-complete-section-content {
  font-size: 16px;
  color: #666;
  text-align: center;
  line-height: 1.4;
}

.dh-complete-service-date {
  background: #f5f5f5;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  text-align: center;
  margin-top: 8px;
}

/* Mobile responsive for contact step */
@media (max-width: 768px) {
  #dh-step-contact .dh-form-row {
    flex-direction: column;
    width: 253px;
    gap: 0;
    margin-bottom: 0;
  }
  
  .dh-info-section {
    margin: 16px 0;
  }
  
  .dh-info-section-content {
    font-size: 16px !important;
  }
  
  /* Mobile responsive for complete step */
  .dh-complete-section {
    margin: 24px 0;
  }
  
  .dh-complete-section-title {
    font-size: 15px;
  }
  
  .dh-complete-section-content {
    font-size: 15px;
  }
  
  .dh-complete-service-date {
    font-size: 15px;
    padding: 14px 20px;
  }
}
  `;
  document.head.appendChild(styleElement);
};

// Update widget colors dynamically
const updateWidgetColors = colors => {
  const existingStyles = document.getElementById('dh-widget-styles');
  if (existingStyles) {
    existingStyles.remove();
  }
  createStyles(colors);
};

// Update widget fonts after config is loaded
const updateWidgetFonts = () => {
  const fontName = widgetState.widgetConfig?.fonts?.primary?.name || 'Outfit';
  const fontUrl =
    widgetState.widgetConfig?.fonts?.primary?.url ||
    'https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap';

  console.log('DEBUG updateWidgetFonts: fontName =', fontName);
  console.log('DEBUG updateWidgetFonts: fontUrl =', fontUrl);

  const existingStyles = document.getElementById('dh-widget-styles');
  if (existingStyles) {
    console.log('DEBUG updateWidgetFonts: Found existing styles, updating...');
    let cssText = existingStyles.textContent;

    // Update font import URL
    cssText = cssText.replace(
      /@import url\([^)]+\);/,
      `@import url('${fontUrl}');`
    );

    // Update all font-family declarations
    cssText = cssText.replace(/font-family:\s*[^;]+;/g, match => {
      if (match.includes('sans-serif')) {
        return `font-family: '${fontName}', sans-serif;`;
      } else if (match.includes('"')) {
        return `font-family: "${fontName}", sans-serif;`;
      } else {
        return `font-family: "${fontName}", sans-serif;`;
      }
    });

    existingStyles.textContent = cssText;
  }
};
