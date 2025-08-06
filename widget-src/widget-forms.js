/**
 * DH Widget - Form Creation and Management
 * Contains form step creation, form elements, and form-related UI functions
 */

(function () {
  'use strict';

  // Create form steps
  const createFormSteps = () => {
    const steps = [];

    // Step 1: Welcome (redesigned)
    const welcomeStep = document.createElement('div');
    welcomeStep.className = 'dh-form-step welcome active';
    welcomeStep.id = 'dh-step-welcome';

    // Use the new welcome screen design instead of simple HTML
    const welcomeContent = createWelcomeScreenContent();
    welcomeStep.appendChild(welcomeContent);
    steps.push(welcomeStep);

    // Step 2: Pest Issue
    const pestStep = document.createElement('div');
    pestStep.className = 'dh-form-step';
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
    <div class="dh-form-step-content" style="position: relative;">
      <h2 class="dh-step-heading">What's your main pest issue?</h2>
      <p class="dh-step-instruction">What kind of pest issue are you experiencing?</p>
      <div class="dh-pest-selection">
        ${pestOptionsHtml}
      </div>
      <div class="dh-pest-loading" id="pest-loading" style="display: none;">
        <div class="dh-loading-spinner"></div>
      </div>
    </div>
    <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
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
<div class="dh-form-button-group">
    <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
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
    <div class="dh-address-pest-icon" id="address-pest-icon">${addressPestIcon}</div>
  <h2 class="dh-step-heading">Yuck, <span id="address-pest-type">pests</span>! We hate those. No worries, we got you!</h2>
  <!-- Address Search Mode (Initial State) -->
  <div id="address-search-mode">
    <p class="dh-step-instruction">Dealing with pests is a hassle, but our licensed and trained techs will have you free of <span id="address-pest-type-two">pests</span> in no time!</p>
    <div class="dh-form-group">
      <div class="dh-address-autocomplete">
        <label class="dh-address-form-label" for="address-search-input">Let's make sure you're in our service area.</label>
        <input type="text" class="dh-form-input dh-address-search-field" id="address-search-input" name="address-search-input" placeholder="Start typing your address..." autocomplete="off">
        <div class="dh-address-suggestions" id="address-suggestions"></div>
      </div>
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
  </div>
  </div>
  <div class="dh-form-button-group">
    <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
    <button class="dh-form-btn dh-form-btn-secondary" onclick="nextStep()" id="address-next">Continue <svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M10.5215 1C10.539 1.00009 10.5584 1.00615 10.5781 1.02637L17.5264 8.13672C17.5474 8.15825 17.5615 8.1897 17.5615 8.22852C17.5615 8.26719 17.5473 8.29783 17.5264 8.31934L10.5781 15.4307C10.5584 15.4509 10.539 15.4569 10.5215 15.457C10.5038 15.457 10.4838 15.451 10.4639 15.4307C10.443 15.4092 10.4298 15.3783 10.4297 15.3398C10.4297 15.3011 10.4429 15.2696 10.4639 15.248L15.5488 10.0449L17.209 8.3457H1V8.11133H17.209L15.5488 6.41211L10.4639 1.20898C10.4428 1.18745 10.4297 1.15599 10.4297 1.11719C10.4297 1.07865 10.443 1.04785 10.4639 1.02637C10.4838 1.00599 10.5038 1 10.5215 1Z" fill="white" stroke="white" stroke-width="2"/></svg></button>
  </div>
`;
    steps.push(addressStep);

    // Step 4: Urgency
    const urgencyStep = document.createElement('div');
    urgencyStep.className = 'dh-form-step';
    urgencyStep.id = 'dh-step-urgency';
    urgencyStep.innerHTML = `
    <div class="dh-form-step-content" style="position: relative;">
  <h2 class="dh-step-heading">Excellent. How soon are you wanting to get rid of those pesky <span id="urgency-pest-type">pests</span>?</h2>
  <p class="dh-step-instruction">Select your preferred timeline to continue</p>
  <div class="dh-urgency-selection">
    <div class="dh-urgency-option" data-urgency="yesterday">Yesterday! (we hear you)</div>
    <div class="dh-urgency-option" data-urgency="1-2-days">Within 1-2 days</div>
    <div class="dh-urgency-option" data-urgency="next-week">Within the next week</div>
    <div class="dh-urgency-option" data-urgency="no-rush">I&apos;m not in a rush</div>
  </div>
  <div class="dh-urgency-loading" id="urgency-loading" style="display: none;">
    <div class="dh-loading-spinner"></div>
  </div>
  </div>
  <div class="dh-form-button-group">
    <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
  </div>
`;
    steps.push(urgencyStep);

    // Step 5: Initial Offer
    const initialOfferStep = document.createElement('div');
    initialOfferStep.className = 'dh-form-step';
    initialOfferStep.id = 'dh-step-initial-offer';
    initialOfferStep.innerHTML = `
    <div class="dh-form-step-content">
  <h2 class="dh-step-heading">Great! We can take care of those <span id="offer-pest-type">pests</span>, <span id="urgency-timeline-ref">usually within one business day</span>, starting at just <span id="offer-price">$</span>.</h2>
  <p class="dh-step-instruction">How would you like to proceed?</p>
  <div class="dh-offer-options">
    <button class="dh-offer-btn dh-offer-btn-primary" id="lets-schedule" data-choice="schedule">Schedule Now!</button>
    <p>OR</p>
    <button class="dh-offer-btn dh-offer-btn-primary" id="detailed-quote" data-choice="quote">Detailed Quote?</button>
  </div>
  </div>
  <div class="dh-form-button-group">
    <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
    <button class="dh-form-btn dh-form-btn-back" id="no-thanks" data-choice="decline">No Thanks <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none"><line x1="14.9298" y1="1.49153" x2="0.707292" y2="15.714" stroke="#4E4E4E" stroke-width="2"/><line x1="15.2929" y1="15.7103" x2="1.07042" y2="1.48781" stroke="#4E4E4E" stroke-width="2"/></svg></button>
  </div>
`;
    steps.push(initialOfferStep);

    // Step 6: Contact Info (Schedule Service Form)
    const contactStep = document.createElement('div');
    contactStep.className = 'dh-form-step';
    contactStep.id = 'dh-step-contact';
    contactStep.innerHTML = `
    <div class="dh-form-step-content">
  <h2 class="dh-step-heading">Let&apos;s schedule your service</h2>
  <p class="dh-step-instruction">Fill out the details below and we&apos;ll get you taken care of.</p>
  <div class="dh-form-row">
    <div class="dh-form-group">
      <div class="dh-floating-input">
        <input type="text" class="dh-form-input" id="first-name-input" placeholder=" ">
        <label class="dh-floating-label" for="first-name-input">First Name</label>
      </div>
    </div>
    <div class="dh-form-group">
      <div class="dh-floating-input">
        <input type="text" class="dh-form-input" id="last-name-input" placeholder=" ">
        <label class="dh-floating-label" for="last-name-input">Last Name</label>
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
      <input type="email" class="dh-form-input" id="email-input" placeholder=" ">
      <label class="dh-floating-label" for="email-input">Email Address</label>
    </div>
  </div>
  <div class="dh-form-group">
    <div class="dh-floating-input dh-input-with-icon">
      <div class="dh-input-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      </div>
      <input type="tel" class="dh-form-input" id="phone-input" placeholder=" ">
      <label class="dh-floating-label" for="phone-input" data-default-text="(888) 888-8888" data-focused-text="Cell Phone Number">Cell Phone Number</label>
    </div>
  </div>
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
      <input type="date" class="dh-form-input" id="start-date-input" placeholder=" ">
      <label class="dh-floating-label" for="start-date-input">Preferred Start Date</label>
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
      <label class="dh-floating-label" for="arrival-time-input">Select Preferred Arrival Time</label>
    </div>
  </div>
  <div class="dh-form-group">
    <label class="dh-form-checkbox-label">
      <input type="checkbox" class="dh-form-checkbox" id="terms-checkbox">
      <span class="dh-form-checkbox-text">I agree to receive automated promotional messages and calls. Reply STOP to opt out. Message rates apply.</span>
    </label>
  </div>
  </div>
  <div class="dh-form-button-group">
    <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
    <button class="dh-form-btn dh-form-btn-primary" onclick="submitFormWithValidation()" id="submit-btn">Schedule Service <svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M10.5215 1C10.539 1.00009 10.5584 1.00615 10.5781 1.02637L17.5264 8.13672C17.5474 8.15825 17.5615 8.1897 17.5615 8.22852C17.5615 8.26719 17.5473 8.29783 17.5264 8.31934L10.5781 15.4307C10.5584 15.4509 10.539 15.4569 10.5215 15.457C10.5038 15.457 10.4838 15.451 10.4639 15.4307C10.443 15.4092 10.4298 15.3783 10.4297 15.3398C10.4297 15.3011 10.4429 15.2696 10.4639 15.248L15.5488 10.0449L17.209 8.3457H1V8.11133H17.209L15.5488 6.41211L10.4639 1.20898C10.4428 1.18745 10.4297 1.15599 10.4297 1.11719C10.4297 1.07865 10.443 1.04785 10.4639 1.02637C10.4838 1.00599 10.5038 1 10.5215 1Z" fill="white" stroke="white" stroke-width="2"/></svg></button>
  </div>
`;
    steps.push(contactStep);

    // Step 7: Quote Contact (Simple form for quote path)
    const quoteContactStep = document.createElement('div');
    quoteContactStep.className = 'dh-form-step';
    quoteContactStep.id = 'dh-step-quote-contact';
    quoteContactStep.innerHTML = `
    <div class="dh-form-step-content" style="position: relative;">
      <h2 class="dh-step-heading">Let&apos;s get you a detailed quote</h2>
      <p class="dh-step-instruction">We just need a few details to prepare your personalized quote.</p>
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
      </div>
      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
        <button class="dh-form-btn dh-form-btn-primary" onclick="proceedToQuoteWithValidation()" id="quote-contact-submit">Get a Quote</button>
      </div>
    `;
    steps.push(quoteContactStep);

    // Step 8: Plan Comparison (for detailed quote path)
    const planComparisonStep = document.createElement('div');
    planComparisonStep.className = 'dh-form-step';
    planComparisonStep.id = 'dh-step-plan-comparison';
    planComparisonStep.innerHTML = `
        <div class="dh-form-step-content">
      <h2 class="dh-step-heading">Here&apos;s what we recommend for your home to get rid of those pesky <span id="comparison-pest-type">pests</span> - and keep them out!</h2>
      
      <!-- Tab Navigation -->
      <div class="dh-plan-tabs" id="comparison-plan-tabs">
        <!-- Tabs will be dynamically loaded -->
        <div class="dh-plan-loading" id="comparison-plan-loading">
          <div class="dh-loading-spinner"></div>
          <p>Loading your personalized recommendations...</p>
        </div>
      </div>
      
      <!-- Tab Content -->
      <div class="dh-plan-content" id="comparison-plan-content">
        <!-- Active plan content will be dynamically loaded -->
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
      <div class="dh-form-out-of-service">
        <h3>We&apos;re sorry, we don&apos;t currently service your area</h3>
        <p>Unfortunately, your location is outside our current service area. We&apos;re always expanding, so please check back with us in the future!</p>
      </div>
      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-secondary" onclick="changeAddress()">Try Different Address</button>
      </div>
    </div>
`;
    steps.push(outOfServiceStep);

    // Step: Exit Survey
    const exitSurveyStep = document.createElement('div');
    exitSurveyStep.className = 'dh-form-step';
    exitSurveyStep.id = 'dh-step-exit-survey';
    exitSurveyStep.innerHTML = `
        <div class="dh-form-step-content">
      <h2 class="dh-step-heading">Dang. Was it something we said?</h2>
      <p class="dh-step-instruction">Mind letting us know?</p>
      <div class="dh-exit-survey-options">
        <div class="dh-survey-option" data-reason="not-ready">
          <span class="dh-survey-emoji">🤔</span>
          <span class="dh-survey-text">Not ready</span>
        </div>
        <div class="dh-survey-option" data-reason="just-checking">
          <span class="dh-survey-emoji">👀</span>
          <span class="dh-survey-text">Just checking around</span>
        </div>
        <div class="dh-survey-option" data-reason="out-of-budget">
          <span class="dh-survey-emoji">🤑</span>
          <span class="dh-survey-text">Out of my budget</span>
        </div>
        <div class="dh-survey-option" data-reason="none-of-business">
          <span class="dh-survey-emoji">🖐</span>
          <span class="dh-survey-text">None of your business</span>
        </div>
      </div>
      <div class="dh-form-group">
        <div class="dh-floating-input">
          <textarea class="dh-form-input" id="exit-feedback" placeholder=" " rows="3"></textarea>
          <label class="dh-floating-label" for="exit-feedback">Any other feedback?</label>
        </div>
      </div>
      <div class="dh-form-button-group">
        <button class="dh-form-btn dh-form-btn-back" onclick="previousStep()"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M8.04004 15.4568C8.02251 15.4567 8.00315 15.4506 7.9834 15.4304L1.03516 8.32007C1.01411 8.29853 1 8.26708 1 8.22827C1.00003 8.1896 1.01422 8.15896 1.03516 8.13745L7.9834 1.02612C8.00316 1.0059 8.02251 0.999842 8.04004 0.999755C8.05768 0.999755 8.07775 1.00575 8.09766 1.02612C8.11852 1.04757 8.13174 1.07844 8.13184 1.11694C8.13184 1.15569 8.11864 1.18721 8.09766 1.20874L3.0127 6.41186L1.35254 8.11108L17.5615 8.11108L17.5615 8.34546L1.35254 8.34546L3.0127 10.0447L8.09766 15.2478C8.11869 15.2693 8.13184 15.3008 8.13184 15.3396C8.13179 15.3781 8.1185 15.4089 8.09766 15.4304C8.07775 15.4508 8.05768 15.4568 8.04004 15.4568Z" fill="white" stroke="#4E4E4E" stroke-width="2"/></svg> Back</button>
        <button class="dh-form-btn dh-form-btn-primary" id="survey-submit">We&apos;re done here</button>
      </div>
      </div>
    `;
    steps.push(exitSurveyStep);

    // Step 10: Complete (Thank You)
    const completeStep = document.createElement('div');
    completeStep.className = 'dh-form-step';
    completeStep.id = 'dh-step-complete';
    completeStep.innerHTML = `
      <div class="dh-form-success">
        <h3>Thank you for your request!</h3>
        <p>We&apos;ve received your information and will contact you within 24 hours with your free estimate. Keep an eye on your email and phone for our response.</p>
      </div>
    `;
    steps.push(completeStep);

    // Step 11: Decline Complete (for exit survey submissions)
    const declineCompleteStep = document.createElement('div');
    declineCompleteStep.className = 'dh-form-step';
    declineCompleteStep.id = 'dh-step-decline-complete';
    declineCompleteStep.innerHTML = `
      <div class="dh-form-success">
        <h3>Thanks for your feedback!</h3>
        <p>We appreciate you taking the time to let us know. If you change your mind in the future, we&apos;re always here to help with your pest control needs.</p>
        <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">Have a great day! 👋</p>
      </div>
    `;
    steps.push(declineCompleteStep);

    return steps;
  };

})();