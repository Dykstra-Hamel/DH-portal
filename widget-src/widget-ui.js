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

      // Check for recovery data and show continue prompt if available
      if (typeof widgetState !== 'undefined' && widgetState.recoveryData && 
          typeof window.progressiveFormManager !== 'undefined' && 
          window.progressiveFormManager.shouldPromptToContinue(widgetState.recoveryData)) {
        
        // Check if this is cross-device recovery (auto-restore without prompt)
        if (widgetState.recoveryData.source === 'cross-device') {
          // Wait for modal DOM to be fully ready with polling
          const waitForModalReady = () => {
            // Check if all required elements exist
            const requiredElements = [
              '.dh-form-content',
              '.dh-form-step',
              '#dh-step-' + widgetState.recoveryData.currentStep
            ];
            
            const allElementsReady = requiredElements.every(selector => {
              return document.querySelector(selector) !== null;
            });
            
            if (allElementsReady) {
              if (typeof window.restoreProgress === 'function') {
                window.restoreProgress(widgetState.recoveryData);
              }
            } else {
              setTimeout(waitForModalReady, 100);
            }
          };
          
          setTimeout(waitForModalReady, 200);
        } else {
          // Show continue prompt for normal recovery (localStorage/server)
          setTimeout(() => {
            if (window.progressiveFormManager && typeof window.progressiveFormManager.showContinuePrompt === 'function') {
              window.progressiveFormManager.showContinuePrompt(widgetState.recoveryData);
            }
          }, 300); // Slight delay to let modal finish opening
        }
      } else {
        // Initialize first step after a brief delay if no recovery data
        setTimeout(() => {
          if (window.progressiveFormManager) {
            window.progressiveFormManager.startAutoSave();
          }
          showStep('pest-issue');
          setupStepValidation('pest-issue');
        }, 100);
      }
    } else {
      // For subsequent modal opens, check if we should show continue prompt
      if (typeof widgetState !== 'undefined' && widgetState.recoveryData && 
          typeof window.progressiveFormManager !== 'undefined' && 
          window.progressiveFormManager.shouldPromptToContinue(widgetState.recoveryData)) {
        
        setTimeout(() => {
          if (window.progressiveFormManager && typeof window.progressiveFormManager.showContinuePrompt === 'function') {
            window.progressiveFormManager.showContinuePrompt(widgetState.recoveryData);
          }
        }, 300);
      } else {
        // Show current step or default to first step
        if (typeof widgetState !== 'undefined' && widgetState.currentStep) {
          showStep(widgetState.currentStep);
        } else {
          showStep('pest-issue');
        }
      }
    }

    // Show modal with smooth animation
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scroll

    // Force reflow to ensure display is set before animation
    void modal.offsetHeight;

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

// Progress bar functionality removed - no longer needed

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

  // Create close icon for all steps
  const closeIcon = document.createElement('div');
  closeIcon.className = 'dh-widget-close-icon';
  closeIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="29" height="29" viewBox="0 0 29 29" fill="none">
    <path d="M14.5 28C21.9558 28 28 21.9558 28 14.5C28 7.04416 21.9558 1 14.5 1C7.04416 1 1 7.04416 1 14.5C1 21.9558 7.04416 28 14.5 28Z" fill="white" stroke="#515151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M18.5492 10.45L10.4492 18.55L18.5492 10.45Z" fill="white"/>
    <path d="M18.5492 10.45L10.4492 18.55" stroke="#515151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10.4492 10.45L18.5492 18.55L10.4492 10.45Z" fill="white"/>
    <path d="M10.4492 10.45L18.5492 18.55" stroke="#515151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  // Add click handler for close functionality
  closeIcon.addEventListener('click', () => {
    if (config.displayMode === 'button') {
      // For button mode, close the modal
      closeModal();
    } else {
      // For inline mode, reset to first step or hide widget
      showStep('pest-issue');
      if (typeof resetWidgetState === 'function') {
        resetWidgetState();
      }
    }
  });

  // Create global back button
  const globalBackButton = document.createElement('button');
  globalBackButton.className = 'dh-global-back-button';
  globalBackButton.id = 'dh-global-back-button';
  globalBackButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 20 16" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M19.0006 7.99993C19.0006 8.41414 18.6648 8.74993 18.2506 8.74993H3.5609L9.03122 14.2193C9.32427 14.5124 9.32427 14.9875 9.03122 15.2806C8.73816 15.5736 8.26302 15.5736 7.96996 15.2806L1.21996 8.53055C1.07913 8.38988 1 8.19899 1 7.99993C1 7.80087 1.07913 7.60998 1.21996 7.4693L7.96996 0.719304C8.26302 0.426248 8.73816 0.426248 9.03122 0.719304C9.32427 1.01236 9.32427 1.4875 9.03122 1.78055L3.5609 7.24993H18.2506C18.6648 7.24993 19.0006 7.58571 19.0006 7.99993Z" fill="#515151" stroke="#515151"/>
</svg> BACK`;

  // Add click handler for global back button
  globalBackButton.addEventListener('click', () => {
    if (typeof previousStep === 'function') {
      previousStep();
    }
  });

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

  // Create form steps
  const steps = createFormSteps();
  steps.forEach(step => content.appendChild(step));

  // Assemble form elements into container
  formContainer.appendChild(content);
  formWidget.appendChild(closeIcon);
  formWidget.appendChild(globalBackButton);
  formWidget.appendChild(formContainer);

  return {
    formWidget: formWidget,
    formContainer: formContainer,
    content: content,
  };
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
      formWidget.style.overflow = 'visible';
    }
  }
};

// Welcome screen function removed - widget now starts directly with pest issue selection
