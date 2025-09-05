/**
 * Widget UI Components
 * Contains all UI creation, rendering, and DOM manipulation functions
 */

// Track if modal widget has been created
let modalWidgetCreated = false;
// Track if modal has been opened in this session (to distinguish from cross-session recovery)
let modalOpenedInSession = false;

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
      // For subsequent modal opens in same session, just show current step
      if (modalOpenedInSession) {
        // Show current step or default to first step
        if (typeof widgetState !== 'undefined' && widgetState.currentStep) {
          showStep(widgetState.currentStep);
        } else {
          showStep('pest-issue');
        }
      } else {
        // This is first open in session, check if we should show continue prompt
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
    }

    // Show modal with smooth animation
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent background scroll

    // Force reflow to ensure display is set before animation
    void modal.offsetHeight;

    // Add show class for animation
    modal.classList.add('show');
    
    // Mark that modal has been opened in this session
    modalOpenedInSession = true;

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

// Create confirmation popup
const createConfirmationPopup = () => {
  // Check if popup already exists
  if (document.getElementById('dh-confirmation-popup')) {
    return;
  }

  const popup = document.createElement('div');
  popup.className = 'dh-confirmation-popup';
  popup.id = 'dh-confirmation-popup';

  const content = document.createElement('div');
  content.className = 'dh-confirmation-content';

  const title = document.createElement('h3');
  title.className = 'dh-confirmation-title';
  title.textContent = 'Are you sure you want to leave?';

  const message = document.createElement('p');
  message.className = 'dh-confirmation-message';
  message.textContent = "Don't worry, your progress will be saved and you can continue another time.";

  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'dh-confirmation-buttons';

  const cancelButton = document.createElement('button');
  cancelButton.className = 'dh-confirmation-button cancel';
  cancelButton.textContent = 'Stay';
  cancelButton.type = 'button';

  const confirmButton = document.createElement('button');
  confirmButton.className = 'dh-confirmation-button confirm';
  confirmButton.textContent = 'Leave';
  confirmButton.type = 'button';

  buttonsContainer.appendChild(cancelButton);
  buttonsContainer.appendChild(confirmButton);

  content.appendChild(title);
  content.appendChild(message);
  content.appendChild(buttonsContainer);
  popup.appendChild(content);

  document.body.appendChild(popup);

  return { popup, cancelButton, confirmButton };
};

// Show confirmation popup
const showConfirmationPopup = () => {
  const existingPopup = document.getElementById('dh-confirmation-popup');
  
  if (existingPopup) {
    existingPopup.classList.add('show');
    return;
  }

  const { popup, cancelButton, confirmButton } = createConfirmationPopup();

  // Add event listeners
  cancelButton.addEventListener('click', hideConfirmationPopup);
  
  confirmButton.addEventListener('click', () => {
    hideConfirmationPopup();
    closeModal();
  });

  // Also close on backdrop click
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      hideConfirmationPopup();
    }
  });

  // Show popup
  popup.classList.add('show');

  // Focus the cancel button by default
  setTimeout(() => {
    cancelButton.focus();
  }, 100);
};

// Hide confirmation popup
const hideConfirmationPopup = () => {
  const popup = document.getElementById('dh-confirmation-popup');
  if (popup) {
    popup.classList.remove('show');
  }
};

// Progress bar functionality removed - no longer needed

// Create button for modal trigger
const createButton = () => {
  const button = document.createElement('button');
  button.className = 'dh-widget-button';
  button.id = 'dh-widget-button';
  button.textContent = config.buttonText || (widgetState.widgetConfig && widgetState.widgetConfig.welcomeButtonText) || 'Get Started';
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
  closeButton.addEventListener('click', showConfirmationPopup);

  modalContent.appendChild(closeButton);
  modal.appendChild(modalContent);

  // Add backdrop click handler if enabled
  if (config.modalCloseOnBackdrop) {
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        showConfirmationPopup();
      }
    });
  }

  // Add ESC key handler
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.style.display !== 'none') {
      // Check if confirmation popup is already showing
      const confirmationPopup = document.getElementById('dh-confirmation-popup');
      if (confirmationPopup && confirmationPopup.classList.contains('show')) {
        hideConfirmationPopup();
      } else {
        showConfirmationPopup();
      }
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
      // For button mode, show confirmation popup
      showConfirmationPopup();
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
  globalBackButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <path d="M14 27C21.1797 27 27 21.1797 27 14C27 6.8203 21.1797 1 14 1C6.8203 1 1 6.8203 1 14C1 21.1797 6.8203 27 14 27Z" stroke="#B2B2B2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M20 14.0001C20 14.2762 19.7761 14.5001 19.5 14.5001H9.70721L13.354 18.1462C13.5493 18.3416 13.5493 18.6583 13.354 18.8537C13.1586 19.0491 12.8419 19.0491 12.6465 18.8537L8.14664 14.3539C8.05275 14.2601 8 14.1328 8 14.0001C8 13.8674 8.05275 13.7402 8.14664 13.6464L12.6465 9.14652C12.8419 8.95116 13.1586 8.95116 13.354 9.14652C13.5493 9.34189 13.5493 9.65864 13.354 9.854L9.70721 13.5001H19.5C19.7761 13.5001 20 13.724 20 14.0001Z" fill="#515151" stroke="#B2B2B2"/>
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
    // Past welcome screen - keep overflow as set by CSS
    if (modalContent) {
      modalContent.style.overflow = '';
    }
    if (formWidget) {
      formWidget.style.overflow = 'visible';
    }
  }
};

// Welcome screen function removed - widget now starts directly with pest issue selection
