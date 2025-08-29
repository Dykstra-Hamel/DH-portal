/**
 * DH Widget - Form Creation and Management
 * Contains form step creation, form elements, and form-related UI functions
 */

(function () {
  'use strict';

  // Create form steps
  const createFormSteps = () => {
    const steps = [];

    // Step 1: Pest Issue
    const pestStep = document.createElement('div');
    pestStep.className = 'dh-form-step active';
    pestStep.id = 'dh-step-pest-issue';

    // Generate pest options dynamically from config
    const pestOptionsHtml =
      widgetState.widgetConfig?.pestOptions &&
      widgetState.widgetConfig.pestOptions.length > 0
        ? widgetState.widgetConfig.pestOptions
            .map(
              pest => `
          <div class="dh-pest-option" data-pest="${pest.value}" data-category="${pest.category}">
            <div class="dh-pest-icon">${pest.icon}</div>
            <div class="dh-pest-label">${pest.label}</div>
          </div>
        `
            )
            .join('')
        : `
        <div class="dh-pest-option" data-pest="ants">
          <div class="dh-pest-label">Ants</div>
        </div>
        <div class="dh-pest-option" data-pest="spiders">
          <div class="dh-pest-label">Spiders</div>
        </div>
        <div class="dh-pest-option" data-pest="cockroaches">
          <div class="dh-pest-label">Cockroaches</div>
        </div>
        <div class="dh-pest-option" data-pest="rodents">
          <div class="dh-pest-label">Rodents (mice &amp; rats)</div>
        </div>
        <div class="dh-pest-option" data-pest="termites">
          <div class="dh-pest-label">Termites</div>
        </div>
        <div class="dh-pest-option" data-pest="wasps">
          <div class="dh-pest-label">Wasps</div>
        </div>
        <div class="dh-pest-option" data-pest="others">
          <div class="dh-pest-label">Others (earwigs, boxelders, ect.)</div>
        </div>
      `;

    pestStep.innerHTML = `
    <div class="dh-pest-step-container">
      <!-- Left Content Area -->
      <div class="dh-pest-content">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <!-- Quick Time Badge -->
        <div class="dh-pest-time-badge">
          <span>Takes only 30 seconds!</span>
        </div>
        
        <!-- Main Heading -->
        <h1 class="dh-pest-heading">Choose the pest that is bugging you.</h1>
        <p class="dh-pest-instruction">What kind of pest issue are you experiencing at your residence?</p>
        
        <!-- Pest Selection Grid -->
        <div class="dh-pest-selection">
          ${pestOptionsHtml}
        </div>
        
        <!-- Loading State -->
        <div class="dh-pest-loading" id="pest-loading" style="display: none;">
          <div class="dh-loading-spinner"></div>
        </div>
      </div>
      
      <!-- Right Hero Section -->
      <div class="dh-pest-hero step1" id="pest-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image step1" id="pest-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="pest-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
    </div>
`;
    steps.push(pestStep);

    // Step 3: Plan Selection
    const planSelectionStep = document.createElement('div');
    planSelectionStep.className = 'dh-form-step';
    planSelectionStep.id = 'dh-step-plan-selection';
    planSelectionStep.innerHTML = `
    <div class="dh-form-step-content">
  <h3>Choose your protection plan</h3>
  <p class="dh-step-instruction">Based on your pest issue, here are our recommended plans</p>
  <div class="dh-plan-loading" id="plan-loading">
    <div class="dh-loading-spinner"></div>
    <p>Finding the best plans for your needs...</p>
  </div>
  <div class="dh-plan-selection" id="plan-selection" style="display: none;">
    <!-- Plans will be populated dynamically -->
  </div>
</div>
`;
    steps.push(planSelectionStep);

    // Step 4: Address
    const addressPestIcon = getPestIcon();
    const addressStep = document.createElement('div');
    addressStep.className = 'dh-form-step';
    addressStep.id = 'dh-step-address';
    addressStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
       
        <h2 class="dh-step-heading" id="address-step-heading">Yuck, <span id="address-pest-type">pests</span>! We hate those. No worries, we got you!</h2>
        <!-- Address Search Mode (Initial State) -->
        <div id="address-search-mode">
          <p class="dh-step-instruction">Dealing with pests is a hassle, but our licensed and trained techs will have you free of <span id="address-pest-type-two">pests</span> in no time!</p>
           <div class="dh-address-pest-icon" id="address-pest-icon">${addressPestIcon}</div>
          <div class="dh-form-group">
            <div class="dh-address-autocomplete">
              <label class="dh-address-form-label" for="address-search-input">Let's make sure you're in our service area.</label>
              <input type="text" class="dh-form-input dh-address-search-field" id="address-search-input" name="address-search-input" placeholder="Start typing your address..." autocomplete="off">
              <div class="dh-address-suggestions" id="address-suggestions"></div>
            </div>
          </div>
          
          <!-- Service Area Check Button -->
          <div class="dh-form-button-group">
            <button class="dh-form-btn dh-form-btn-secondary" onclick="checkServiceAreaButton()" id="check-service-area-btn" disabled>Search Now<svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none">
  <path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg></button>
          </div>
        </div>

        <!-- Address Display Mode (After Selection) -->
        <div id="address-display-mode" style="display: none;">
          <div class="dh-address-header">
            <p>Review and/or edit your service address:</p>
            <button type="button" class="dh-change-address-btn" onclick="changeAddress()">Search Different Address</button>
          </div>
          
          <!-- Address Visual Confirmation -->
          <div class="dh-address-imagery" id="address-imagery">
            <div class="dh-image-loading" id="image-loading">
              <div class="dh-loading-spinner"></div>
              <p>Loading street view...</p>
            </div>
            <img class="dh-address-image" id="address-image" alt="Street view of selected address" style="display: none;">
            <div class="dh-image-error" id="image-error" style="display: none;">
              <p>📍 Street view not available for this address</p>
            </div>
          </div>
          
          <!-- Editable address form fields -->
          <div class="dh-form-group">
            <div class="dh-floating-input">
              <input type="text" class="dh-form-input" id="street-input" placeholder=" ">
              <label class="dh-floating-label" for="street-input">Street Address</label>
            </div>
          </div>
          <div class="dh-form-group">
            <div class="dh-floating-input">
              <input type="text" class="dh-form-input" id="city-input" placeholder=" ">
              <label class="dh-floating-label" for="city-input">City</label>
            </div>
          </div>
          <div class="dh-form-group">
            <div class="dh-floating-input">
              <input type="text" class="dh-form-input" id="state-input" placeholder=" ">
              <label class="dh-floating-label" for="state-input">State</label>
            </div>
          </div>
          <div class="dh-form-group">
            <div class="dh-floating-input">
              <input type="text" class="dh-form-input" id="zip-input" placeholder=" ">
              <label class="dh-floating-label" for="zip-input">ZIP Code</label>
            </div>
          </div>
          
          <div class="dh-form-button-group">
            <button class="dh-form-btn dh-form-btn-secondary" onclick="nextStep()" id="address-next">Continue <svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M10.5215 1C10.539 1.00009 10.5584 1.00615 10.5781 1.02637L17.5264 8.13672C17.5474 8.15825 17.5615 8.1897 17.5615 8.22852C17.5615 8.26719 17.5473 8.29783 17.5264 8.31934L10.5781 15.4307C10.5584 15.4509 10.539 15.4569 10.5215 15.457C10.5038 15.457 10.4838 15.451 10.4639 15.4307C10.443 15.4092 10.4298 15.3783 10.4297 15.3398C10.4297 15.3011 10.4429 15.2696 10.4639 15.248L15.5488 10.0449L17.209 8.3457H1V8.11133H17.209L15.5488 6.41211L10.4639 1.20898C10.4428 1.18745 10.4297 1.15599 10.4297 1.11719C10.4297 1.07865 10.443 1.04785 10.4639 1.02637C10.4838 1.00599 10.5038 1 10.5215 1Z" fill="white" stroke="white" stroke-width="2"/></svg></button>
          </div>
        </div>
      </div>
      
      <!-- Right Hero Section -->
      <div class="dh-pest-hero" id="address-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="address-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="address-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
    </div>
`;
    steps.push(addressStep);

    // Step 4: Confirm Address
    const confirmAddressStep = document.createElement('div');
    confirmAddressStep.className = 'dh-form-step';
    confirmAddressStep.id = 'dh-step-confirm-address';
    confirmAddressStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <h2 class="dh-step-heading">Good news! We service your neighborhood.</h2>
        <p class="dh-step-instruction">Double check the address information below and hit continue to proceed.</p>
        
        <!-- Mobile background image (shown only on mobile) -->
        <img class="dh-mobile-bg-image" id="confirm-address-mobile-bg-image" src="" alt="Background Image" />
        
        <!-- Editable address form fields -->
        <div class="dh-form-group">
          <div class="dh-floating-input">
            <input type="text" class="dh-form-input" id="confirm-street-input" placeholder=" ">
            <label class="dh-floating-label" for="confirm-street-input">Street Address</label>
          </div>
        </div>
        <div class="dh-form-group">
          <div class="dh-floating-input">
            <input type="text" class="dh-form-input" id="confirm-city-input" placeholder=" ">
            <label class="dh-floating-label" for="confirm-city-input">City</label>
          </div>
        </div>
        <div class="dh-form-row">
          <div class="dh-form-group">
            <div class="dh-floating-input">
              <input type="text" class="dh-form-input" id="confirm-state-input" placeholder=" ">
              <label class="dh-floating-label" for="confirm-state-input">State</label>
            </div>
          </div>
          <div class="dh-form-group">
            <div class="dh-floating-input">
              <input type="text" class="dh-form-input" id="confirm-zip-input" placeholder=" ">
              <label class="dh-floating-label" for="confirm-zip-input">ZIP Code</label>
            </div>
          </div>
        </div>
        <div class="dh-form-group">
          <label class="dh-form-checkbox-label">
            <input type="checkbox" class="dh-form-checkbox" id="confirm-address-consent-checkbox">
            <span class="dh-form-checkbox-text">Yes, <span id="confirm-address-company-name">Company Name</span> may contact me. By submitting this request, I validate that I am 18 years of age or older. Additionally, I give <span id="confirm-address-company-name-2">Company Name</span> permission to direct mail me, email me, or to call or text me at the number provided regarding services from <span id="confirm-address-company-name-3">Company Name</span> using automated technology. I understand my consent is not a condition of purchase.</span>
          </label>
        </div>
        
        <div class="dh-form-button-group">
          <button class="dh-form-btn dh-form-btn-secondary" onclick="nextStep()" id="confirm-address-next">Continue <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      
      <!-- Right Hero Section -->
      <div class="dh-pest-hero" id="confirm-address-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="confirm-address-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="confirm-address-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
    </div>
`;
    steps.push(confirmAddressStep);

    // Step 5: Initial Offer
    const initialOfferStep = document.createElement('div');
    initialOfferStep.className = 'dh-form-step';
    initialOfferStep.id = 'dh-step-how-we-do-it';
    initialOfferStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <h2 class="dh-step-heading" id="how-we-do-it-heading">How We Do It</h2>
        
        <div class="dh-how-we-do-it-main">
          <div class="dh-how-we-do-it-content">
            <div class="dh-how-we-do-it-text">
              <h3 class="dh-how-we-do-it-title">How We Do It</h3>
              <p id="how-we-do-it-description">Loading your personalized treatment plan...</p>
              
              <div class="dh-subspecies-section" id="subspecies-section" style="display: none;">
                <h4 id="subspecies-heading">Some common pests include:</h4>
                <div class="dh-subspecies-grid" id="subspecies-list">
                  <!-- Subspecies populated dynamically -->
                </div>
              </div>
            </div>
            <img id="how-we-do-it-interior-image" class="dh-interior-image" src="" alt="Treatment Process" style="display: none;" />
          </div>
          
          <div class="dh-safety-message" id="safety-message">
            <img class="dh-pet-safety-image" src="" alt="Pet Safety" id="pet-safety-image" />
            <div class="dh-safety-text">
              <p id="safety-message-text">Oh, and don&apos;t worry. Our treatments are safe for people and pets for your property!</p>
            </div>
          </div>
        </div>
        
        <div class="dh-form-button-group">
          <button class="dh-form-btn dh-form-btn-secondary" id="view-detailed-quote" onclick="navigateToDetailedQuote();">View Detailed Quote <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      
      <!-- Right Hero Section -->
      <div class="dh-pest-hero" id="offer-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="offer-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="offer-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
    </div>
`;
    steps.push(initialOfferStep);

    // Step 6: Contact Info (Schedule Service Form)
    const contactStep = document.createElement('div');
    contactStep.className = 'dh-form-step';
    contactStep.id = 'dh-step-contact';
    contactStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <h2 class="dh-step-heading">Great! When do you want us to get started?</h2>
        <p class="dh-step-instruction">Select the your preferred date and time for your appointment.</p>
        
        <!-- Scheduling Fields -->
        <div class="dh-form-row">
          <div class="dh-form-group">
            <div class="dh-floating-input dh-input-with-icon">
              <div class="dh-input-icon" data-type="calendar">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <input type="date" class="dh-form-input" id="start-date-input" placeholder="Your Start Date">
              <label class="dh-floating-label" for="start-date-input">Your Start Date</label>
            </div>
          </div>
          <div class="dh-form-group">
            <div class="dh-floating-input dh-input-with-icon">
              <div class="dh-input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <select class="dh-form-input" id="arrival-time-input">
                <option value=""></option>
                <option value="morning">Morning (8 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                <option value="evening">Evening (5 PM - 8 PM)</option>
                <option value="anytime">Anytime</option>
              </select>
              <label class="dh-floating-label" for="arrival-time-input">Preferred Time</label>
            </div>
          </div>
        </div>
        
        <!-- Contact Details Section -->
        <div class="dh-info-section">
          <h3 class="dh-info-section-header">Contact Details</h3>
          <div class="dh-info-section-content" id="contact-details-content">
            <div id="contact-name">Loading...</div>
            <div id="contact-email">Loading...</div>
            <div id="contact-phone">Loading...</div>
          </div>
        </div>
        
        <!-- Service Address Section -->
        <div class="dh-info-section">
          <h3 class="dh-info-section-header">Service Address</h3>
          <div class="dh-info-section-content" id="service-address-content">
            <div id="service-address">Loading...</div>
          </div>
        </div>
        
        <div class="dh-form-button-group">
          <button class="dh-form-btn dh-form-btn-primary" onclick="submitFormWithValidation()" id="submit-btn">Book It <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      
      <!-- Right Hero Section with Location Background -->
      <div class="dh-pest-hero" id="contact-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="contact-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="contact-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
    </div>
`;
    steps.push(contactStep);

    // Step 7: Quote Contact (Simple form for quote path)
    const quoteContactStep = document.createElement('div');
    quoteContactStep.className = 'dh-form-step';
    quoteContactStep.id = 'dh-step-quote-contact';
    quoteContactStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <h2 class="dh-step-heading">Sure thing. Almost done, we just need a little more info from you.</h2>
        <p class="dh-step-instruction">Complete the following information for your detailed quote.</p>
        <div class="dh-form-row">
          <div class="dh-form-group">
            <div class="dh-floating-input">
              <input type="text" class="dh-form-input" id="quote-first-name-input" placeholder=" ">
              <label class="dh-floating-label" for="quote-first-name-input">First Name</label>
            </div>
          </div>
          <div class="dh-form-group">
            <div class="dh-floating-input">
              <input type="text" class="dh-form-input" id="quote-last-name-input" placeholder=" ">
              <label class="dh-floating-label" for="quote-last-name-input">Last Name</label>
            </div>
          </div>
        </div>
        <div class="dh-form-group">
          <div class="dh-floating-input dh-input-with-icon">
            <div class="dh-input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <input type="email" class="dh-form-input" id="quote-email-input" placeholder=" ">
            <label class="dh-floating-label" for="quote-email-input">Email Address</label>
          </div>
        </div>
        <div class="dh-form-group">
          <div class="dh-floating-input dh-input-with-icon">
            <div class="dh-input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <input type="tel" class="dh-form-input" id="quote-phone-input" placeholder=" ">
            <label class="dh-floating-label" for="quote-phone-input" data-default-text="(888) 888-8888" data-focused-text="Cell Phone Number">Cell Phone Number</label>
          </div>
        </div>
        <div class="dh-quote-loading" id="quote-loading" style="display: none;">
          <div class="dh-loading-spinner"></div>
        </div>
        
        <div class="dh-form-button-group">
          <button class="dh-form-btn dh-form-btn-secondary" onclick="proceedToQuoteWithValidation()" id="quote-contact-submit">See Your Quote <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      
      <!-- Right Hero Section -->
      <div class="dh-pest-hero" id="quote-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="quote-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="quote-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
    </div>
    `;
    steps.push(quoteContactStep);

    // Step 8: Plan Comparison (for detailed quote path)
    const planComparisonStep = document.createElement('div');
    planComparisonStep.className = 'dh-form-step';
    planComparisonStep.id = 'dh-step-plan-comparison';
    planComparisonStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <h2 class="dh-step-heading">Here&apos;s what we recommend for your home to get rid of those pesky <span id="comparison-pest-type">pests</span> - and keep them out!</h2>
        
        <!-- Google Reviews Display -->
        <div class="dh-reviews-container" id="comparison-reviews-container">
          <!-- Loading State -->
          <div class="dh-reviews-loading" id="comparison-reviews-loading">
            <div class="dh-reviews-skeleton">
              <div class="dh-skeleton-stars"></div>
              <div class="dh-skeleton-text"></div>
            </div>
          </div>
          
          <!-- Loaded Content -->
          <div class="dh-reviews-display" id="comparison-reviews-display" style="display: none;">
            <div class="dh-star-rating">
              <svg class="dh-star" xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
                <path d="M9.52875 0.277158C9.57258 0.193944 9.64027 0.123898 9.72421 0.0749244C9.80814 0.025951 9.90496 0 10.0038 0C10.1025 0 10.1994 0.025951 10.2833 0.0749244C10.3672 0.123898 10.4349 0.193944 10.4788 0.277158L12.7888 4.67476C12.9409 4.9642 13.1656 5.21462 13.4434 5.40451C13.7212 5.59441 14.0439 5.71811 14.3838 5.76499L19.5498 6.47553C19.6476 6.48886 19.7396 6.52766 19.8152 6.58756C19.8909 6.64745 19.9472 6.72604 19.9778 6.81444C20.0084 6.90285 20.012 6.99753 19.9883 7.08778C19.9647 7.17804 19.9146 7.26026 19.8438 7.32516L16.1078 10.7444C15.8614 10.97 15.677 11.2486 15.5706 11.5561C15.4642 11.8635 15.4388 12.1907 15.4968 12.5094L16.3788 17.3403C16.396 17.4322 16.3855 17.5269 16.3483 17.6135C16.311 17.7001 16.2487 17.7751 16.1683 17.83C16.0879 17.8848 15.9927 17.9174 15.8936 17.9238C15.7945 17.9303 15.6954 17.9105 15.6078 17.8666L10.9898 15.5846C10.6855 15.4345 10.3469 15.356 10.0033 15.356C9.65957 15.356 9.32104 15.4345 9.01675 15.5846L4.39975 17.8666C4.31208 17.9102 4.21315 17.9299 4.1142 17.9232C4.01526 17.9166 3.92027 17.8841 3.84005 17.8292C3.75982 17.7744 3.69759 17.6995 3.66041 17.6131C3.62323 17.5266 3.61261 17.4321 3.62975 17.3403L4.51075 12.5104C4.56895 12.1915 4.54374 11.8641 4.43729 11.5564C4.33084 11.2488 4.14636 10.9701 3.89975 10.7444L0.163753 7.3261C0.0923467 7.26128 0.041746 7.17891 0.0177153 7.08838C-0.00631551 6.99785 -0.00281025 6.9028 0.0278316 6.81405C0.0584734 6.72531 0.11502 6.64643 0.19103 6.58641C0.267039 6.5264 0.359456 6.48765 0.457753 6.47459L5.62275 5.76499C5.96301 5.71847 6.28614 5.59493 6.56434 5.40501C6.84253 5.2151 7.06746 4.96449 7.21975 4.67476L9.52875 0.277158Z" fill="#F68C1A"/>
              </svg>
              <svg class="dh-star" xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
                <path d="M9.52875 0.277158C9.57258 0.193944 9.64027 0.123898 9.72421 0.0749244C9.80814 0.025951 9.90496 0 10.0038 0C10.1025 0 10.1994 0.025951 10.2833 0.0749244C10.3672 0.123898 10.4349 0.193944 10.4788 0.277158L12.7888 4.67476C12.9409 4.9642 13.1656 5.21462 13.4434 5.40451C13.7212 5.59441 14.0439 5.71811 14.3838 5.76499L19.5498 6.47553C19.6476 6.48886 19.7396 6.52766 19.8152 6.58756C19.8909 6.64745 19.9472 6.72604 19.9778 6.81444C20.0084 6.90285 20.012 6.99753 19.9883 7.08778C19.9647 7.17804 19.9146 7.26026 19.8438 7.32516L16.1078 10.7444C15.8614 10.97 15.677 11.2486 15.5706 11.5561C15.4642 11.8635 15.4388 12.1907 15.4968 12.5094L16.3788 17.3403C16.396 17.4322 16.3855 17.5269 16.3483 17.6135C16.311 17.7001 16.2487 17.7751 16.1683 17.83C16.0879 17.8848 15.9927 17.9174 15.8936 17.9238C15.7945 17.9303 15.6954 17.9105 15.6078 17.8666L10.9898 15.5846C10.6855 15.4345 10.3469 15.356 10.0033 15.356C9.65957 15.356 9.32104 15.4345 9.01675 15.5846L4.39975 17.8666C4.31208 17.9102 4.21315 17.9299 4.1142 17.9232C4.01526 17.9166 3.92027 17.8841 3.84005 17.8292C3.75982 17.7744 3.69759 17.6995 3.66041 17.6131C3.62323 17.5266 3.61261 17.4321 3.62975 17.3403L4.51075 12.5104C4.56895 12.1915 4.54374 11.8641 4.43729 11.5564C4.33084 11.2488 4.14636 10.9701 3.89975 10.7444L0.163753 7.3261C0.0923467 7.26128 0.041746 7.17891 0.0177153 7.08838C-0.00631551 6.99785 -0.00281025 6.9028 0.0278316 6.81405C0.0584734 6.72531 0.11502 6.64643 0.19103 6.58641C0.267039 6.5264 0.359456 6.48765 0.457753 6.47459L5.62275 5.76499C5.96301 5.71847 6.28614 5.59493 6.56434 5.40501C6.84253 5.2151 7.06746 4.96449 7.21975 4.67476L9.52875 0.277158Z" fill="#F68C1A"/>
              </svg>
              <svg class="dh-star" xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
                <path d="M9.52875 0.277158C9.57258 0.193944 9.64027 0.123898 9.72421 0.0749244C9.80814 0.025951 9.90496 0 10.0038 0C10.1025 0 10.1994 0.025951 10.2833 0.0749244C10.3672 0.123898 10.4349 0.193944 10.4788 0.277158L12.7888 4.67476C12.9409 4.9642 13.1656 5.21462 13.4434 5.40451C13.7212 5.59441 14.0439 5.71811 14.3838 5.76499L19.5498 6.47553C19.6476 6.48886 19.7396 6.52766 19.8152 6.58756C19.8909 6.64745 19.9472 6.72604 19.9778 6.81444C20.0084 6.90285 20.012 6.99753 19.9883 7.08778C19.9647 7.17804 19.9146 7.26026 19.8438 7.32516L16.1078 10.7444C15.8614 10.97 15.677 11.2486 15.5706 11.5561C15.4642 11.8635 15.4388 12.1907 15.4968 12.5094L16.3788 17.3403C16.396 17.4322 16.3855 17.5269 16.3483 17.6135C16.311 17.7001 16.2487 17.7751 16.1683 17.83C16.0879 17.8848 15.9927 17.9174 15.8936 17.9238C15.7945 17.9303 15.6954 17.9105 15.6078 17.8666L10.9898 15.5846C10.6855 15.4345 10.3469 15.356 10.0033 15.356C9.65957 15.356 9.32104 15.4345 9.01675 15.5846L4.39975 17.8666C4.31208 17.9102 4.21315 17.9299 4.1142 17.9232C4.01526 17.9166 3.92027 17.8841 3.84005 17.8292C3.75982 17.7744 3.69759 17.6995 3.66041 17.6131C3.62323 17.5266 3.61261 17.4321 3.62975 17.3403L4.51075 12.5104C4.56895 12.1915 4.54374 11.8641 4.43729 11.5564C4.33084 11.2488 4.14636 10.9701 3.89975 10.7444L0.163753 7.3261C0.0923467 7.26128 0.041746 7.17891 0.0177153 7.08838C-0.00631551 6.99785 -0.00281025 6.9028 0.0278316 6.81405C0.0584734 6.72531 0.11502 6.64643 0.19103 6.58641C0.267039 6.5264 0.359456 6.48765 0.457753 6.47459L5.62275 5.76499C5.96301 5.71847 6.28614 5.59493 6.56434 5.40501C6.84253 5.2151 7.06746 4.96449 7.21975 4.67476L9.52875 0.277158Z" fill="#F68C1A"/>
              </svg>
              <svg class="dh-star" xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
                <path d="M9.52875 0.277158C9.57258 0.193944 9.64027 0.123898 9.72421 0.0749244C9.80814 0.025951 9.90496 0 10.0038 0C10.1025 0 10.1994 0.025951 10.2833 0.0749244C10.3672 0.123898 10.4349 0.193944 10.4788 0.277158L12.7888 4.67476C12.9409 4.9642 13.1656 5.21462 13.4434 5.40451C13.7212 5.59441 14.0439 5.71811 14.3838 5.76499L19.5498 6.47553C19.6476 6.48886 19.7396 6.52766 19.8152 6.58756C19.8909 6.64745 19.9472 6.72604 19.9778 6.81444C20.0084 6.90285 20.012 6.99753 19.9883 7.08778C19.9647 7.17804 19.9146 7.26026 19.8438 7.32516L16.1078 10.7444C15.8614 10.97 15.677 11.2486 15.5706 11.5561C15.4642 11.8635 15.4388 12.1907 15.4968 12.5094L16.3788 17.3403C16.396 17.4322 16.3855 17.5269 16.3483 17.6135C16.311 17.7001 16.2487 17.7751 16.1683 17.83C16.0879 17.8848 15.9927 17.9174 15.8936 17.9238C15.7945 17.9303 15.6954 17.9105 15.6078 17.8666L10.9898 15.5846C10.6855 15.4345 10.3469 15.356 10.0033 15.356C9.65957 15.356 9.32104 15.4345 9.01675 15.5846L4.39975 17.8666C4.31208 17.9102 4.21315 17.9299 4.1142 17.9232C4.01526 17.9166 3.92027 17.8841 3.84005 17.8292C3.75982 17.7744 3.69759 17.6995 3.66041 17.6131C3.62323 17.5266 3.61261 17.4321 3.62975 17.3403L4.51075 12.5104C4.56895 12.1915 4.54374 11.8641 4.43729 11.5564C4.33084 11.2488 4.14636 10.9701 3.89975 10.7444L0.163753 7.3261C0.0923467 7.26128 0.041746 7.17891 0.0177153 7.08838C-0.00631551 6.99785 -0.00281025 6.9028 0.0278316 6.81405C0.0584734 6.72531 0.11502 6.64643 0.19103 6.58641C0.267039 6.5264 0.359456 6.48765 0.457753 6.47459L5.62275 5.76499C5.96301 5.71847 6.28614 5.59493 6.56434 5.40501C6.84253 5.2151 7.06746 4.96449 7.21975 4.67476L9.52875 0.277158Z" fill="#F68C1A"/>
              </svg>
              <svg class="dh-star" xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
                <path d="M9.52875 0.277158C9.57258 0.193944 9.64027 0.123898 9.72421 0.0749244C9.80814 0.025951 9.90496 0 10.0038 0C10.1025 0 10.1994 0.025951 10.2833 0.0749244C10.3672 0.123898 10.4349 0.193944 10.4788 0.277158L12.7888 4.67476C12.9409 4.9642 13.1656 5.21462 13.4434 5.40451C13.7212 5.59441 14.0439 5.71811 14.3838 5.76499L19.5498 6.47553C19.6476 6.48886 19.7396 6.52766 19.8152 6.58756C19.8909 6.64745 19.9472 6.72604 19.9778 6.81444C20.0084 6.90285 20.012 6.99753 19.9883 7.08778C19.9647 7.17804 19.9146 7.26026 19.8438 7.32516L16.1078 10.7444C15.8614 10.97 15.677 11.2486 15.5706 11.5561C15.4642 11.8635 15.4388 12.1907 15.4968 12.5094L16.3788 17.3403C16.396 17.4322 16.3855 17.5269 16.3483 17.6135C16.311 17.7001 16.2487 17.7751 16.1683 17.83C16.0879 17.8848 15.9927 17.9174 15.8936 17.9238C15.7945 17.9303 15.6954 17.9105 15.6078 17.8666L10.9898 15.5846C10.6855 15.4345 10.3469 15.356 10.0033 15.356C9.65957 15.356 9.32104 15.4345 9.01675 15.5846L4.39975 17.8666C4.31208 17.9102 4.21315 17.9299 4.1142 17.9232C4.01526 17.9166 3.92027 17.8841 3.84005 17.8292C3.75982 17.7744 3.69759 17.6995 3.66041 17.6131C3.62323 17.5266 3.61261 17.4321 3.62975 17.3403L4.51075 12.5104C4.56895 12.1915 4.54374 11.8641 4.43729 11.5564C4.33084 11.2488 4.14636 10.9701 3.89975 10.7444L0.163753 7.3261C0.0923467 7.26128 0.041746 7.17891 0.0177153 7.08838C-0.00631551 6.99785 -0.00281025 6.9028 0.0278316 6.81405C0.0584734 6.72531 0.11502 6.64643 0.19103 6.58641C0.267039 6.5264 0.359456 6.48765 0.457753 6.47459L5.62275 5.76499C5.96301 5.71847 6.28614 5.59493 6.56434 5.40501C6.84253 5.2151 7.06746 4.96449 7.21975 4.67476L9.52875 0.277158Z" fill="#F68C1A"/>
              </svg>
            </div>
            <span class="dh-reviews-count" id="comparison-reviews-count"></span>
          </div>
        </div>
        
        <!-- Loading State -->
        <div class="dh-plan-loading" id="comparison-plan-loading">
          <div class="dh-loading-spinner"></div>
          <p>Loading your personalized recommendations...</p>
        </div>
        
        <!-- Plan Content -->
        <div class="dh-plan-content" id="comparison-plan-content">
          <!-- Active plan content will be dynamically loaded -->
        </div>
      </div>
      
      <!-- Right Hero Section -->
      <div class="dh-pest-hero" id="plan-comparison-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="plan-comparison-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="plan-comparison-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>

      <!-- Full Width FAQ Section -->
      <div class="dh-plan-faqs-container" id="comparison-plan-faqs">
        <!-- FAQs will be dynamically loaded here -->
      </div>
      
    </div>
    
    `;
    steps.push(planComparisonStep);

    // Step 9: Out of Service Area
    const outOfServiceStep = document.createElement('div');
    outOfServiceStep.className = 'dh-form-step';
    outOfServiceStep.id = 'dh-step-out-of-service';
    outOfServiceStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <h2 class="dh-step-heading">Dang. It doesn&apos;t look like we service your neighborhood.</h2>
        <div class="dh-form-button-group">
          <button class="dh-form-btn dh-form-btn-secondary" onclick="returnToHomepage()">Return to Homepage <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      
      <!-- Right Hero Section -->
      <div class="dh-pest-hero" id="out-of-service-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="out-of-service-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="out-of-service-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
    </div>
`;
    steps.push(outOfServiceStep);

    // Step: Exit Survey
    const exitSurveyStep = document.createElement('div');
    exitSurveyStep.className = 'dh-form-step';
    exitSurveyStep.id = 'dh-step-exit-survey';
    exitSurveyStep.innerHTML = `
        <div class="dh-form-step-content dh-exit-survey-centered">
          <!-- Company Logo -->
          <div class="dh-pest-logo" id="pest-logo">
            <!-- Logo will be populated from widget config -->
          </div>
          
          <h2 class="dh-step-heading">Dang. Was it something we said?</h2>
          <p class="dh-step-instruction">Mind letting us know?</p>
          
          <div class="dh-feedback-options">
            <label class="dh-feedback-option">
              <input type="radio" name="exit-feedback" value="not-ready" class="dh-feedback-radio">
              <div class="dh-feedback-button">
                <span class="dh-feedback-emoji">😊</span>
                <span class="dh-feedback-text">Not ready</span>
              </div>
            </label>
            
            <label class="dh-feedback-option">
              <input type="radio" name="exit-feedback" value="just-checking" class="dh-feedback-radio">
              <div class="dh-feedback-button">
                <span class="dh-feedback-emoji">😬</span>
                <span class="dh-feedback-text">Just checking around</span>
              </div>
            </label>
            
            <label class="dh-feedback-option">
              <input type="radio" name="exit-feedback" value="out-of-budget" class="dh-feedback-radio">
              <div class="dh-feedback-button">
                <span class="dh-feedback-emoji">🤑</span>
                <span class="dh-feedback-text">Out of my budget</span>
              </div>
            </label>
          </div>

          <div class="dh-form-group">
            <div class="dh-textarea-container">
              <textarea class="dh-form-textarea" id="exit-feedback-text" placeholder="Any other feedback?" rows="4"></textarea>
            </div>
          </div>

          <div class="dh-form-button-group dh-exit-survey-buttons">
            <button class="dh-form-btn dh-form-btn-primary" id="survey-submit">Submit <svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M10.5215 1C10.539 1.00009 10.5584 1.00615 10.5781 1.02637L17.5264 8.13672C17.5474 8.15825 17.5615 8.1897 17.5615 8.22852C17.5615 8.26719 17.5473 8.29783 17.5264 8.31934L10.5781 15.4307C10.5584 15.4509 10.539 15.4569 10.5215 15.457C10.5038 15.457 10.4838 15.451 10.4639 15.4307C10.443 15.4092 10.4298 15.3783 10.4297 15.3398C10.4297 15.3011 10.4429 15.2696 10.4639 15.248L15.5488 10.0449L17.209 8.3457H1V8.11133H17.209L15.5488 6.41211L10.4639 1.20898C10.4428 1.18745 10.4297 1.15599 10.4297 1.11719C10.4297 1.07865 10.443 1.04785 10.4639 1.02637C10.4838 1.00599 10.5038 1 10.5215 1Z" fill="white" stroke="white" stroke-width="2"/></svg></button>
          </div>
        </div>
    `;
    steps.push(exitSurveyStep);

    // Step 10: Complete (Thank You)
    const completeStep = document.createElement('div');
    completeStep.className = 'dh-form-step';
    completeStep.id = 'dh-step-complete';
    completeStep.innerHTML = `
    <div class="dh-form-step-content">
      <div class="dh-form-content-area">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <h2 class="dh-step-heading">Thank you <span id="complete-customer-name">Wesley</span>, here is what you can expect next.</h2>
        
        <p class="dh-step-instruction">You should receive a confirmation email shortly. One of our representatives will contact you to confirm your appointment and answer any of your questions during normal business hours.</p>
        
        <!-- Office Hours Section -->
        <div class="dh-complete-section">
          <h3 class="dh-complete-section-title">Office Hours</h3>
          <div class="dh-complete-section-content" id="office-hours-content">
            <!-- Office hours will be populated from widget config -->
          </div>
        </div>
        
        <!-- Requested Service Date & Time Section -->
        <div class="dh-complete-section">
          <h3 class="dh-complete-section-title requested-date-time">Requested Service Date & Time</h3>
          <div class="dh-complete-service-date" id="service-date-content">
            October 7th, 2025 | 10 am
          </div>
        </div>
        
        <div class="dh-form-button-group">
          <button class="dh-form-btn dh-form-btn-secondary" id="return-homepage-btn">Return to Homepage <svg xmlns="http://www.w3.org/2000/svg" width="9" height="16" viewBox="0 0 9 16" fill="none"><path d="M1 14.9231L7.47761 7.99998L1 1.0769" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </div>
      
      <!-- Right Hero Section with Location Background -->
      <div class="dh-pest-hero" id="complete-hero">
        <!-- Background Image -->
        <div class="dh-pest-bg-image" id="complete-bg-image"></div>
        <!-- Actual Hero Image -->
        <img class="dh-pest-hero-image" id="complete-hero-image" src="" alt="Hero Image" style="display: none;" />
      </div>
    </div>
    `;
    steps.push(completeStep);

    // Step 11: Decline Complete (for exit survey submissions)
    const declineCompleteStep = document.createElement('div');
    declineCompleteStep.className = 'dh-form-step';
    declineCompleteStep.id = 'dh-step-decline-complete';
    declineCompleteStep.innerHTML = `
      <div class="dh-form-success">
        <!-- Company Logo -->
        <div class="dh-pest-logo" id="pest-logo">
          <!-- Logo will be populated from widget config -->
        </div>
        
        <h3>Thanks for your feedback!</h3>
        <p>We appreciate you taking the time to let us know. If you change your mind in the future, we&apos;re always here to help with your pest control needs.</p>
        <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">Have a great day! 👋</p>
      </div>
    `;
    steps.push(declineCompleteStep);

    return steps;
  };
})();
