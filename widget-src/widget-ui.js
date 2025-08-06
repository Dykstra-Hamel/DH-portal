/**
 * Widget UI Components
 * Contains all UI creation, rendering, and DOM manipulation functions
 */

// Track if modal widget has been created
let modalWidgetCreated = false;

// Open modal function
const openModal = () => {
  const modal = document.getElementById('dh-modal-overlay');
  const modalBody = document.getElementById('dh-modal-body');

  if (modal && modalBody) {
    // Only create widget on first open, then reuse the existing one
    if (!modalWidgetCreated) {
      modalBody.innerHTML = '';
      const widget = createInlineWidget();
      modalBody.appendChild(widget.formWidget);
      modalWidgetCreated = true;

      // Initialize first step after a brief delay
      setTimeout(() => {
        showStep('welcome');
      }, 100);
    } else {
      // For subsequent modal opens, just show the current step
      if (typeof widgetState !== 'undefined' && widgetState.currentStep) {
        showStep(widgetState.currentStep);
      } else {
        showStep('welcome');
      }
    }

    // Show modal with smooth animation
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    
    // Force reflow to ensure display is set before animation
    modal.offsetHeight;
    
    // Add show class for animation
    modal.classList.add('show');

    // Focus management after animation starts
    setTimeout(() => {
      const firstFocusable = modal.querySelector(
        'input, button, select, textarea'
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }, 100);
  }
};

// Close modal function
const closeModal = () => {
  const modal = document.getElementById('dh-modal-overlay');
  if (modal) {
    // Add hide class for animation
    modal.classList.remove('show');
    modal.classList.add('hide');
    
    // Wait for animation before hiding
    setTimeout(() => {
      modal.style.display = 'none';
      modal.classList.remove('hide');
      document.body.style.overflow = ''; // Restore scroll
    }, 300); // Match CSS transition duration
    
    // State is automatically preserved since we're not destroying the widget
  }
};

// Update progress bar function
const updateProgressBar = stepName => {
  // Update the current step in widget state
  widgetState.currentStep = stepName;

  // Find and update the global progress bar
  const globalProgressBar = document.getElementById('dh-global-progress-bar');

  if (globalProgressBar) {
    // Replace the global progress bar with a new one reflecting current state
    const newProgressBar = createCircularProgress();
    newProgressBar.id = 'dh-global-progress-bar';
    globalProgressBar.parentNode.replaceChild(
      newProgressBar,
      globalProgressBar
    );
  }
};

// Reusable circular progress component creator
const createCircularProgress = () => {
  const progressBar = document.createElement('div');
  progressBar.className = 'dh-progress-bar';

  stepProgressManager.stepFlow.forEach((stepName, index) => {
    // Create step container
    const stepContainer = document.createElement('div');
    stepContainer.className = 'dh-progress-step-container';

    // Create the step circle
    const step = document.createElement('div');
    const stepStatus = stepProgressManager.getStepStatus(stepName);
    step.className = `dh-progress-step ${stepStatus}`;

    // Add checkmark for completed step or empty for others
    if (stepStatus === 'completed') {
      step.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="13" viewBox="0 0 17 13" fill="none"><path d="M5.7 12.025L0 6.325L1.425 4.9L5.7 9.175L14.875 0L16.3 1.425L5.7 12.025Z" fill="white"/></svg>`;
    } else {
      step.textContent = '';
    }

    // Create step label
    const stepLabel = document.createElement('div');
    stepLabel.className = `dh-progress-step-label ${stepStatus}`;
    stepLabel.textContent = stepProgressManager.stepLabels[stepName];

    stepContainer.appendChild(step);
    stepContainer.appendChild(stepLabel);
    progressBar.appendChild(stepContainer);

    // Add connecting line between steps (except after last step)
    if (index < stepProgressManager.stepFlow.length - 1) {
      const line = document.createElement('div');
      const lineStatus =
        stepProgressManager.getStepStatus(stepName) === 'completed'
          ? 'active'
          : '';
      line.className = `dh-progress-line ${lineStatus}`;
      progressBar.appendChild(line);
    }
  });

  return progressBar;
};

// Create button for modal trigger
const createButton = () => {
  const button = document.createElement('button');
  button.className = 'dh-widget-button';
  button.id = 'dh-widget-button';
  button.textContent = config.buttonText;
  button.type = 'button';

  // Add click handler to open modal
  button.addEventListener('click', openModal);

  return button;
};

// Create modal overlay
const createModal = () => {
  const modal = document.createElement('div');
  modal.className = 'dh-modal-overlay';
  modal.id = 'dh-modal-overlay';
  modal.style.display = 'none';

  const modalContent = document.createElement('div');
  modalContent.className = 'dh-modal-content';
  modalContent.id = 'dh-modal-content';

  const modalBody = document.createElement('div');
  modalBody.className = 'dh-modal-body';
  modalBody.id = 'dh-modal-body';
  modalContent.appendChild(modalBody);

  // Create close button and attach to modal content (positioned outside)
  const closeButton = document.createElement('button');
  closeButton.className = 'dh-modal-close';
  closeButton.innerHTML = '&times;';
  closeButton.type = 'button';
  closeButton.addEventListener('click', closeModal);

  modalContent.appendChild(closeButton);
  modal.appendChild(modalContent);

  // Add backdrop click handler if enabled
  if (config.modalCloseOnBackdrop) {
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // Add ESC key handler
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.style.display !== 'none') {
      closeModal();
    }
  });

  document.body.appendChild(modal);
  return { modal, modalBody };
};

// Create inline widget
const createInlineWidget = () => {
  // Create main form container
  const formWidget = document.createElement('div');
  formWidget.className = 'dh-form-widget';
  formWidget.id = 'dh-form-widget';

  // Create form elements
  const formContainer = document.createElement('div');
  formContainer.id = 'dh-form-container';

  // Create header (commented out in original)
  // const header = document.createElement('div');
  // header.className = 'dh-form-header';
  // header.id = 'dh-form-header';

  // const titleEl = document.createElement('h2');
  // titleEl.id = 'dh-form-title';
  // titleEl.textContent = config.headerText || 'Get Free Estimate';

  // header.appendChild(titleEl);

  // Only create subtitle if text is provided
  let subtitleEl = null;
  if (config.subHeaderText) {
    subtitleEl = document.createElement('p');
    subtitleEl.id = 'dh-form-subtitle';
    subtitleEl.textContent = config.subHeaderText;
    header.appendChild(subtitleEl);
  }

  // Create content area
  const content = document.createElement('div');
  content.className = 'dh-form-content';
  content.id = 'dh-form-content';

  // Create single global progress bar
  const globalProgressBar = createCircularProgress();
  globalProgressBar.id = 'dh-global-progress-bar';
  content.appendChild(globalProgressBar);

  // Create form steps
  const steps = createFormSteps();
  steps.forEach(step => content.appendChild(step));

  // Assemble form elements into container
  formContainer.appendChild(content);
  formWidget.appendChild(formContainer);

  return {
    formWidget: formWidget,
    formContainer: formContainer,
    content: content
  };
};

// Helper function to add progress bar to a form step
const addProgressBarToStep = stepElement => {
  const progressBar = createCircularProgress();
  stepElement.insertBefore(progressBar, stepElement.firstChild);
};

// Main widget creation function
const createWidget = () => {
  if (config.displayMode === 'button') {
    // Create button and modal for button mode
    createModal();
    return createButton();
  } else {
    // Default inline mode
    return createInlineWidget();
  }
};

// Update modal overflow behavior based on current step
const updateModalOverflow = stepName => {
  const modalContent = document.querySelector('.dh-modal-content');
  const formWidget = document.querySelector('.dh-form-widget');

  if (stepName === 'welcome') {
    // On welcome screen - allow visible overflow
    if (modalContent) {
      modalContent.style.overflow = 'visible';
    }
    if (formWidget) {
      formWidget.style.maxHeight = '';
      formWidget.style.overflow = '';
    }
  } else {
    // Past welcome screen - hide overflow and constrain form
    if (modalContent) {
      modalContent.style.overflow = 'hidden';
    }
    if (formWidget) {
      formWidget.style.maxHeight = '90vh';
      formWidget.style.overflow = 'auto';
    }
  }
};

// Create welcome screen content for Step 1 (new design) 
const createWelcomeScreenContent = () => {
  const welcomeContainer = document.createElement('div');
  welcomeContainer.className = 'dh-welcome-screen';

  // Left content area
  const welcomeContent = document.createElement('div');
  welcomeContent.className = 'dh-welcome-content';

  // Welcome title
  const welcomeTitle = document.createElement('h1');
  welcomeTitle.className = 'dh-welcome-title';
  welcomeTitle.textContent =
    (typeof widgetState !== 'undefined' && widgetState.widgetConfig?.welcomeTitle) || 'Get help now!';

  // Welcome description
  const welcomeDescription = document.createElement('h2');
  welcomeDescription.className = 'dh-welcome-description';
  welcomeDescription.textContent =
    (typeof widgetState !== 'undefined' && widgetState.widgetConfig?.welcomeDescription) ||
    'For fast, affordable & professional pest solutions in your area.';

  // Benefits list
  const benefitsList = document.createElement('ul');
  benefitsList.className = 'dh-welcome-benefits';

  // Render custom benefits if available
  if (
    typeof widgetState !== 'undefined' &&
    widgetState.widgetConfig?.welcomeBenefits &&
    widgetState.widgetConfig.welcomeBenefits.length > 0
  ) {
    widgetState.widgetConfig.welcomeBenefits.forEach(benefit => {
      const li = document.createElement('li');

      // Create icon element
      if (benefit.icon && benefit.icon.trim()) {
        const iconElement = document.createElement('span');
        iconElement.className = 'dh-benefit-icon';
        iconElement.innerHTML = benefit.icon;
        li.appendChild(iconElement);
      }

      // Create text element
      const textElement = document.createElement('span');
      textElement.className = 'dh-benefit-text';
      textElement.textContent = benefit.text;
      li.appendChild(textElement);

      benefitsList.appendChild(li);
    });
  }

  // Welcome button
  const welcomeButton = document.createElement('button');
  welcomeButton.className = 'dh-welcome-button';
  welcomeButton.innerHTML = `
    <span>${widgetState.widgetConfig?.welcomeButtonText || 'Start My Free Estimate'}</span>
    <span class="dh-button-arrow"><svg xmlns="http://www.w3.org/2000/svg" width="19" height="17" viewBox="0 0 19 17" fill="none"><path d="M10.5215 1C10.539 1.00009 10.5584 1.00615 10.5781 1.02637L17.5264 8.13672C17.5474 8.15825 17.5615 8.1897 17.5615 8.22852C17.5615 8.26719 17.5473 8.29783 17.5264 8.31934L10.5781 15.4307C10.5584 15.4509 10.539 15.4569 10.5215 15.457C10.5038 15.457 10.4838 15.451 10.4639 15.4307C10.443 15.4092 10.4298 15.3783 10.4297 15.3398C10.4297 15.3011 10.4429 15.2696 10.4639 15.248L15.5488 10.0449L17.209 8.3457H1V8.11133H17.209L15.5488 6.41211L10.4639 1.20898C10.4428 1.18745 10.4297 1.15599 10.4297 1.11719C10.4297 1.07865 10.443 1.04785 10.4639 1.02637C10.4838 1.00599 10.5038 1 10.5215 1Z" fill="white" stroke="white" stroke-width="2"/></svg></span>
  `;
  welcomeButton.addEventListener('click', () => {
    nextStep();
  });

  // Terms disclaimer
  const termsDisclaimer = document.createElement('p');
  termsDisclaimer.className = 'dh-terms-disclaimer';
  termsDisclaimer.textContent =
    '*terms and conditions apply. See details for more information';

  // Assemble content
  welcomeContent.appendChild(welcomeTitle);
  welcomeContent.appendChild(welcomeDescription);
  welcomeContent.appendChild(benefitsList);
  welcomeContent.appendChild(welcomeButton);
  welcomeContent.appendChild(termsDisclaimer);

  // Right hero area
  const welcomeHero = document.createElement('div');
  welcomeHero.className = 'dh-welcome-hero';

  // Set hero image if available
  if (widgetState.widgetConfig?.branding?.hero_image_url) {
    welcomeHero.style.backgroundImage = `url(${widgetState.widgetConfig.branding.hero_image_url})`;
  }

  // Set welcome screen background in bottom corner
  const bgSvg = document.createElement('div');
  bgSvg.className = 'dh-welcome-svg-background';
  bgSvg.innerHTML = `<img src="https://cwmckkfkcjxznkpdxgie.supabase.co/storage/v1/object/public/brand-assets/general/background-pests.svg" alt="" />`;

  // Assemble welcome container
  welcomeContainer.appendChild(welcomeContent);
  welcomeContainer.appendChild(welcomeHero);
  welcomeContainer.appendChild(bgSvg);

  return welcomeContainer;
};