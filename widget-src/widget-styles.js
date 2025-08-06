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

  const styleElement = document.createElement('style');
  styleElement.id = 'dh-widget-styles';
  styleElement.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
.dh-form-widget { 
  margin: 0 auto; 
  background: ${backgroundColor}; 
  border-radius: 26px; 
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1); 
  overflow: visible; 
  color: ${textColor};
}
.dh-form-content { 
  padding: 24px; 
  border-radius: 26px; 
  background: ${backgroundColor};
} 
.dh-form-step { 
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
  display: block; 
  opacity: 1;
}

.dh-form-step.fade-in {
  animation: fadeIn 0.4s ease forwards;
}

.dh-form-step.fade-out {
  animation: fadeOut 0.3s ease forwards;
} 

.dh-form-step-content {
    padding: 40px 80px;
    border-bottom: 1px solid #cccccc;
  }
.dh-form-step h3 { 
  margin: 0 0 12px 0; 
  font-size: 18px; 
  color: ${secondaryColor}; 
} 
.dh-form-group { 
  width: 515px;
  max-width: 100%;
  margin: 0 auto 20px;
} 
.dh-form-label { 
  display: block; 
  font-weight: 500; 
  color: #4E4E4E; 
  margin-bottom: 6px; 
  font-family: Outfit;
  font-size: 20px;
  line-height: 30px;
} 
.dh-address-form-label {
  display: block;
  margin-bottom: 10px;
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
  font-family: inherit; 
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
  background: url('https://cwmckkfkcjxznkpdxgie.supabase.co/storage/v1/object/public/brand-assets/general/select-arrow.svg') no-repeat right 12px center;
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

/* Contact step form field widths */
#dh-step-contact .dh-form-row, #dh-step-contact .dh-form-group {
  width: 390px;
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
  font-family: Outfit;
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
  background: ${backgroundColor};
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
  gap: 16px;
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
  font-family: Outfit;
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
  position: absolute;
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
  font-family: Outfit;
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
  font-family: Outfit;
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
  font-family: Outfit;
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
  font-family: Outfit;
  text-align: center;
}

.dh-address-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  display: block;
}

/* Address Search Mode vs Display Mode */
#address-search-mode {
  display: block;
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
  font-family: Outfit;
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
  font-family: Outfit;
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
  font-family: Outfit;
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
  font-family: Outfit;
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
  font-family: Outfit;
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
  font-family: Outfit;
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
  font-family: Outfit;
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
  max-width: 500px;
  margin: 0 auto;
}

.dh-form-out-of-service h3 {
  font-family: Outfit;
  font-size: 24px;
  font-weight: 600;
  color: ${secondaryColor};
  margin: 0 0 16px 0;
  line-height: 1.3;
}

.dh-form-out-of-service p {
  font-family: Outfit;
  font-size: 16px;
  font-weight: 400;
  color: ${textColor};
  line-height: 1.5;
  margin: 0 0 24px 0;
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
  font-family: Outfit;
  font-size: 16px;
  font-weight: 500;
  color: ${textColor};
}

.dh-offer-btn {
  padding: 16px 24px;
  border: 2px solid;
  border-radius: 8px;
  font-family: Outfit;
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
  .dh-form-row {
    grid-template-columns: 1fr;
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
}
.dh-form-checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  line-height: 1.5;
  color: ${textColor};
  cursor: pointer;
}
.dh-form-checkbox {
  width: auto !important;
  margin: 0 !important;
  flex-shrink: 0;
  margin-top: 2px !important;
} 
.dh-form-select { 
  width: 100%; 
  padding: 12px 16px; 
  border: 1px solid #d1d5db; 
  border-radius: 8px; 
  outline: none; 
  font-size: 14px; 
  font-family: inherit; 
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
  margin-top: 24px; 
  justify-content: center;
  align-items: center;
  padding: 0 20px 20px 20px;
  border-radius: 0 0 26px 26px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, ${primaryLight} 100%);
} 
#dh-step-exit-survey .dh-form-button-group { 
  background: none;
} 
.dh-form-btn { 
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px; 
  border: none; 
  border-radius: 8px; 
  cursor: pointer; 
  font-size: 18px;
  line-height: 18px;
  font-family: Outfit, sans-serif;
  font-weight: 500; 
  transition: all 0.2s ease;
  transform: translateY(0);
  }
  
.dh-form-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dh-form-btn:active {
  transform: translateY(0);
  transition: all 0.1s ease;
} 
.dh-form-btn-primary { 
  background: ${primaryColor}; 
  color: white;
  border: 1px solid ${primaryColor};
} 
.dh-form-btn-primary:hover { 
  background: ${primaryDark}; 
} 
.dh-form-btn-secondary { 
  background: ${secondaryColor}; 
  color: #fff; 
  border: 1px solid ${secondaryColor}; 
} 
.dh-form-btn-secondary svg { 
  transition: transform 0.2s ease;
} 
.dh-form-btn-secondary:hover svg { 
  transform: translateX(2px);
}
.dh-form-btn-back { 
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #CBCBCB; 
  color: #4E4E4E;
  font-family: Outfit;
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
    background: transparent;
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
  display: flex;
  gap: 20px;
  padding: 20px 0;
  flex-flow: row wrap;
  justify-content: center;
}
.dh-pest-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  width: 160px;
  transition: all 0.2s ease;
}
.dh-pest-icon {
  width: 160px;
  height: 100px;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 12px;
  background: white;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.dh-pest-icon svg {
  width: 60px;
  height: 60px;
  fill: #4E4E4E;
}
.dh-pest-icon svg path {
  fill: #4E4E4E;
}
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
.dh-pest-label {
  text-align: center;
  margin-top: 8px;
  width: 100%;
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 18px;
  font-weight: 700;
  line-height: 18px;
}
.dh-pest-option:hover .dh-pest-icon {
  border-color: ${primaryColor};
  background: #f8fafc;
}
.dh-pest-option.selected .dh-pest-icon {
  border-color: ${primaryColor};
  color: white;
}
.dh-step-instruction {
  color: #4E4E4E;
  text-align: center;
  font-size: 26px;
  font-weight: 400;
  line-height: 103%;
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
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid ${primaryColor};
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
  font-family: inherit;
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
  max-width: 900px;
  width: 90%;
  max-height: 90vh;
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  background: white;
  font-family: "Outfit", sans-serif;
  display: flex;
  flex-direction: column;
  transform: scale(0.95);
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
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

.dh-progress-bar {
  display: flex;
  align-items: center;
  padding: 50px 50px 25px 50px;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
}

.dh-progress-step-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 32px;
  position: relative;
}

.dh-progress-step {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  position: relative;
  z-index: 50;
}

.dh-progress-step.completed {
  background: ${primaryColor};
  color: white;
  border: 3px solid ${primaryColor};
}

.dh-progress-step.active {
  background: #fff;
  color: white;
  border: 3px solid ${secondaryColor};
}

.dh-progress-step.active::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: ${secondaryColor};
}

.dh-progress-step.inactive {
  background: #fff;
  color: #9ca3af;
  border: 3px solid #D9D9D9;
}

.dh-progress-step-label {
  display: block;
  position: absolute;
  bottom: -20px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
}

.dh-progress-step-label.completed {
  color: ${primaryColor};
  font-weight: 600;
}

.dh-progress-step-label.active {
  color: ${secondaryColor};
  font-weight: 600;
}

.dh-progress-step-label.inactive {
  color: #9ca3af;
}

.dh-progress-line {
  flex: 1;
  height: 2px;
  background: #e5e7eb;
  position: relative;
  margin-left: -4px;
  margin-right: -4px;
}

.dh-progress-line.active {
  background: ${primaryColor};
}

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
}

.dh-welcome-button:hover .dh-button-arrow {
  transform: translateX(2px);
}

.dh-step-heading {
  color: #4E4E4E;
  text-align: center;
  font-size: 45px;
  font-weight: 700;
  line-height: 100%;
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
  overflow: visible;
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
  box-shadow: none;
  border-radius: 26px;
  padding: 0;
}

.dh-modal-body .dh-form-content {
  padding: 0;
  margin: 0;
}

.dh-modal-body .dh-form-progress {
  margin: 0 24px;
}

/* Mobile modal adjustments */
@media (max-width: 768px) {
  .dh-modal-overlay {
    padding: 10px;
  }
  
  .dh-modal-content {
    max-height: 95vh;
    width: 95%;
  }
  
  .dh-modal-close {
    top: 8px;
    right: 8px;
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
  
  .dh-modal-body .dh-form-progress {
    margin: 0 16px;
  }
  
  .dh-widget-button {
    padding: 14px 28px;
    font-size: 16px;
    width: 100%;
    max-width: 300px;
  }

  .dh-form-step-content {
    padding: 40px;
  }

  .dh-step-heading {
    font-size: 32px;
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
  .dh-progress-bar {
    margin-bottom: 30px;
  }
}
@media (max-width: 650px) {
  .dh-welcome-hero {
    width: 250px;
  }
  .dh-welcome-svg-background {
    width: 300px;
    height: 400px;
  }
}
@media (max-width: 600px) {
  .dh-welcome-hero,
  .dh-welcome-svg-background {
    display: none;
  }

  .dh-welcome-content {
    padding-right: 20px;
    text-align: center;
  }

  .dh-welcome-title {
    font-size: 40px
  }

  .dh-welcome-description {
    max-width: 100%;
    font-size: 22px;
  }

  .dh-welcome-button {
    margin: 0 auto;
  }

  .dh-progress-bar {
    padding: 20px 25px;
  }

  .dh-step-heading {
    font-size: 30px;
  }

  .dh-step-instruction {
    font-size: 18px;
  }

  .dh-form-step-content {
    padding: 20px;
  }
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
  font-family: Outfit;
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
  font-family: Outfit;
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
.dh-plan-details {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
  align-items: start;
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
  font-family: Outfit;
  font-size: 40px;
  font-weight: 500;
  line-height: 50px;
}
.dh-plan-description {
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 20px;
  font-weight: 400;
  line-height: 25px;
}

.dh-plan-included h4 {
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 20px;
  font-weight: 600;
  line-height: 33px;
  margin-bottom: 5px;
}
.dh-plan-features-list {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
}

.dh-plan-feature {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 20px;
  line-height: 23px;
  font-weight: 400;
  margin-bottom: 8px;
}

.dh-feature-checkmark svg {
  display: block;
}

.dh-feature-checkmark path {
  stroke: ${primaryColor};
}

.dh-plan-pricing {
  margin: 24px 0 0;
  padding: 20px 0 0;
}
.dh-plan-price-label {
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 26px;
  font-weight: 500;
  line-height: 30px;
}
.dh-plan-price-detail {
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 20px;
  font-weight: 400;
  line-height: 25px;
  margin: 8px 0 4px 0;
}
.dh-plan-price-disclaimer {
  color: #4E4E4E;
  font-family: Outfit;
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  margin: 0;
  font-style: italic;
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
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.dh-plan-image-actual {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Plan Actions */
.dh-plan-actions {
  margin: 32px 0 0 0;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
}
@media (max-width: 768px) {
  .dh-plan-actions {
    flex-direction: column;
  }
}

.dh-form-btn.plan-no-thanks {
  background: transparent;
}
.dh-form-btn.plan-no-thanks:hover {
  opacity: 0.8;
}

/* FAQ Accordion Styles */
.dh-plan-faqs {
  margin: 40px 0 0 0;
  padding: 40px 0 0 0;
  border-top: 1px solid #e5e7eb;
}
.dh-form-step h3.dh-faqs-title {
  color: ${secondaryColor};
  text-align: center;
  font-family: Outfit;
  font-size: 26px;
  font-weight: 600;
  line-height: 103%;
}
.dh-faqs-container {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.dh-faq-item {
  border-bottom: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.2s ease;
}
.dh-faq-item:hover {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dh-faq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.dh-faq-header:hover {
  background: #f9fafb;
}

.dh-faq-question {
  font-size: 16px;
  font-weight: 600;
  color: ${textColor};
  margin: 0;
  flex: 1;
  padding-right: 16px;
  text-align: left;
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
  background: ${backgroundColor};
}
.dh-faq-answer {
  padding: 0 20px 16px 20px;
}
.dh-faq-answer p {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0;
}
@media (max-width: 768px) {
  .dh-plan-faqs {
    margin: 32px 0 0 0;
    padding: 20px 0 0 0;
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
}

/* Mobile Styles */
@media (max-width: 650px) {
  .dh-plan-visual {
    order: 1;
  }

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
    text-align: center;
  }

  .dh-plan-description {
    font-size: 18px;
    text-align: center;
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
