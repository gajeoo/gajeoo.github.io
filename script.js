const CONTACT_FORM_SELECTOR = '.contact-form';
const AUTH_FORM_SELECTOR = '.auth-form';
const ACCOUNT_STATE_SELECTOR = '.account-state';
const SIGN_OUT_BUTTON_ID = 'signOutButton';
const CURRENT_USER_KEY = 'warehouseRideCurrent';
const API_BASE = typeof window !== 'undefined' ? 'http://localhost:5000/api' : '';

const contactForm = document.querySelector(CONTACT_FORM_SELECTOR);
const authForm = document.querySelector(AUTH_FORM_SELECTOR);
const accountState = document.querySelector(ACCOUNT_STATE_SELECTOR);

function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function getCurrentUser() {
  const stored = localStorage.getItem(CURRENT_USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

function getCurrentUserId() {
  const user = getCurrentUser();
  return user?.id || null;
}

function getCurrentUserEmail() {
  const user = getCurrentUser();
  return user?.email || null;
}

function showMessage(container, message, type = 'info') {
  if (!container) return;
  container.textContent = message;
  container.classList.remove('info', 'error', 'success');
  container.classList.add(type);
}

// Address Autocomplete Setup
async function fetchAddressSuggestions(query) {
  if (query.length < 3) return [];
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
    );
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch address suggestions:', error);
    return [];
  }
}

function setupAddressAutocomplete(inputId, suggestionsId, cityId, stateId, zipId) {
  const input = document.getElementById(inputId);
  if (!input) return; // Skip if elements don't exist on this page

  const suggestions = document.getElementById(suggestionsId);
  const cityInput = document.getElementById(cityId);
  const stateInput = document.getElementById(stateId);
  const zipInput = document.getElementById(zipId);

  input.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    if (query.length < 3) {
      suggestions.style.display = 'none';
      return;
    }

    const results = await fetchAddressSuggestions(query);
    if (results.length === 0) {
      suggestions.style.display = 'none';
      return;
    }

    suggestions.innerHTML = results.map((result, index) => `
      <div class="suggestion-item" style="padding: 0.75rem; border-bottom: 1px solid rgba(93, 209, 255, 0.1); cursor: pointer; color: #5dd1ff;" onclick="selectAddress('${inputId}', '${suggestionsId}', '${cityId}', '${stateId}', '${zipId}', ${index})">
        <div style="font-size: 0.9rem;">${result.display_name.split(',').slice(0, 2).join(',')}</div>
      </div>
    `).join('');

    suggestions.style.display = 'block';
    window.currentSuggestions = { [inputId]: results };
  });

  document.addEventListener('click', (e) => {
    if (e.target !== input) {
      suggestions.style.display = 'none';
    }
  });
}

window.selectAddress = (inputId, suggestionsId, cityId, stateId, zipId, index) => {
  const result = window.currentSuggestions[inputId][index];
  const parts = result.display_name.split(',').map(p => p.trim());
  
  document.getElementById(inputId).value = parts[0] || '';
  document.getElementById(cityId).value = parts[parts.length - 3] || '';
  
  // For state dropdown, try to match the state name or abbreviation
  const stateElement = document.getElementById(stateId);
  const stateValue = parts[parts.length - 2] || '';
  
  if (stateElement && stateElement.tagName === 'SELECT') {
    // Try to find matching option by value (abbreviation) or text (full name)
    let matchingOption = Array.from(stateElement.options).find(option => 
      option.value === stateValue || 
      option.text.toLowerCase() === stateValue.toLowerCase()
    );
    
    if (matchingOption) {
      stateElement.value = matchingOption.value;
    }
  }
  
  document.getElementById(zipId).value = result.postcode || '';
  
  document.getElementById(suggestionsId).style.display = 'none';
};

// Initialize address autocomplete on both pages
setupAddressAutocomplete('pickupAddress', 'pickupAddressSuggestions', 'pickupCity', 'pickupState', 'pickupZip');
setupAddressAutocomplete('destinationAddress', 'destinationAddressSuggestions', 'destinationCity', 'destinationState', 'destinationZip');

// Zipcode validation - only allow numbers and limit to 7 characters
function setupZipcodeValidation() {
  const zipInputs = ['pickupZip', 'destinationZip'];
  zipInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', (e) => {
        // Remove any non-numeric characters
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        // Limit to 7 characters
        if (e.target.value.length > 7) {
          e.target.value = e.target.value.slice(0, 7);
        }
      });
    }
  });
}

setupZipcodeValidation();

if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = contactForm.querySelector('#name').value.trim();
    const email = contactForm.querySelector('#email').value.trim();
    const service = contactForm.querySelector('#service').value;
    
    // Get address fields
    const pickupAddress = (document.getElementById('pickupAddress')?.value || '').trim();
    const pickupCity = (document.getElementById('pickupCity')?.value || '').trim();
    const pickupState = (document.getElementById('pickupState')?.value || '').trim();
    const pickupZip = (document.getElementById('pickupZip')?.value || '').trim();
    
    const destinationAddress = (document.getElementById('destinationAddress')?.value || '').trim();
    const destinationCity = (document.getElementById('destinationCity')?.value || '').trim();
    const destinationState = (document.getElementById('destinationState')?.value || '').trim();
    const destinationZip = (document.getElementById('destinationZip')?.value || '').trim();
    
    const additionalMessage = (document.getElementById('message')?.value || '').trim();

    if (!name || !email) {
      alert('Please fill out your name and email to continue.');
      return;
    }

    // Validate addresses if provided
    if (pickupAddress || pickupCity || pickupState || pickupZip) {
      if (!pickupAddress || !pickupCity || !pickupState || !pickupZip) {
        alert('Please fill in all pickup address fields.');
        return;
      }
    }

    if (destinationAddress || destinationCity || destinationState || destinationZip) {
      if (!destinationAddress || !destinationCity || !destinationState || !destinationZip) {
        alert('Please fill in all delivery address fields.');
        return;
      }
    }

    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        alert('Please sign in to submit an enquiry.');
        return;
      }

      // Build message with addresses
      let messageContent = additionalMessage;
      if (pickupAddress) {
        messageContent = `Pickup Address:\n${pickupAddress}\n${pickupCity}, ${pickupState} ${pickupZip}\n\n`;
        if (destinationAddress) {
          messageContent += `Delivery Address:\n${destinationAddress}\n${destinationCity}, ${destinationState} ${destinationZip}\n\n`;
        }
        messageContent += additionalMessage;
      }

      const response = await fetch(`${API_BASE}/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentUser.id,
          serviceType: service,
          message: messageContent,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Thanks, ${name}! Your transport request for ${service} has been received. Our team will contact you shortly.`);
        contactForm.reset();
        window.location.href = 'dashboard.html';
      } else {
        alert('Failed to submit enquiry. Please try again.');
      }
    } catch (error) {
      alert('Connection error. Make sure the backend server is running.');
      console.error('Enquiry submission error:', error);
    }
  });
}

if (authForm) {
  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const mode = authForm.dataset.mode;
    const emailInput = authForm.querySelector('#email');
    const passwordInput = authForm.querySelector('#password');
    const nameInput = authForm.querySelector('#name');
    const confirmPasswordInput = authForm.querySelector('#confirmPassword');
    const messageContainer = authForm.querySelector('.form-message');

    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const password = passwordInput ? passwordInput.value : '';
    const name = nameInput ? nameInput.value.trim() : '';
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

    if (!email) {
      showMessage(messageContainer, 'Please enter your email address.', 'error');
      return;
    }

    try {
      if (mode === 'signin') {
        if (!password) {
          showMessage(messageContainer, 'Please enter your password.', 'error');
          return;
        }

        const response = await fetch(`${API_BASE}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (!response.ok) {
          showMessage(messageContainer, data.error || 'Sign in failed', 'error');
          return;
        }

        setCurrentUser({
          id: data.customer.id,
          email: data.customer.email,
          name: data.customer.name,
        });
        showMessage(messageContainer, `Welcome back, ${data.customer.name}! Redirecting...`, 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 900);
        return;
      }

      if (mode === 'signup') {
        if (!name) {
          showMessage(messageContainer, 'Please enter your full name.', 'error');
          return;
        }

        if (!password) {
          showMessage(messageContainer, 'Please create a password.', 'error');
          return;
        }

        if (password.length < 6) {
          showMessage(messageContainer, 'Password must be at least 6 characters.', 'error');
          return;
        }

        if (password !== confirmPassword) {
          showMessage(messageContainer, 'Passwords do not match.', 'error');
          return;
        }

        const response = await fetch(`${API_BASE}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();
        if (!response.ok) {
          showMessage(messageContainer, data.error || 'Sign up failed', 'error');
          return;
        }

        setCurrentUser({
          id: data.customerId,
          email,
          name,
        });
        showMessage(messageContainer, 'Account created! Redirecting to your dashboard...', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 900);
        return;
      }

      if (mode === 'forgot') {
        const response = await fetch(`${API_BASE}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        showMessage(messageContainer, data.message || 'Check your email for reset instructions', 'success');
        return;
      }
    } catch (error) {
      showMessage(messageContainer, 'Connection error. Ensure the backend is running.', 'error');
      console.error('Auth error:', error);
    }
  });
}

if (accountState) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    accountState.innerHTML = `
      <h3>Not signed in yet</h3>
      <p>Please sign in to view your WarehouseRide account details.</p>
      <div class="account-actions">
        <a href="signin.html" class="button button-primary">Sign In</a>
        <a href="signup.html" class="button button-secondary">Create account</a>
      </div>
    `;
  } else {
    accountState.innerHTML = `
      <h3>Welcome, ${currentUser.name || currentUser.email}</h3>
      <p><strong>Email:</strong> ${currentUser.email}</p>
      <p>Access your trip history, service requests, and account settings from this page.</p>
      <div class="account-actions">
        <button class="button button-secondary" id="signOutButton">Sign Out</button>
      </div>
    `;

    setTimeout(() => {
      const signOutBtn = document.getElementById(SIGN_OUT_BUTTON_ID);
      if (signOutBtn) {
        signOutBtn.addEventListener('click', (event) => {
          event.preventDefault();
          clearCurrentUser();
          window.location.href = 'signin.html';
        });
      }
    }, 100);
  }
}

/* Mobile Menu Toggle Handler */
function initializeMobileMenu() {
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const mainNavMenu = document.getElementById('main-nav-menu');
  const header = document.querySelector('.site-header');
  const navLinks = document.querySelectorAll('.main-nav a');

  if (!menuToggle || !mainNavMenu) return;

  // Toggle menu on hamburger click
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    mainNavMenu.classList.toggle('open', !isExpanded);
  });

  // Close menu when a nav link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      mainNavMenu.classList.remove('open');
    });
  });

  // Close menu when clicking outside header
  document.addEventListener('click', (e) => {
    const isClickInsideHeader = header.contains(e.target);
    
    if (!isClickInsideHeader && menuToggle.getAttribute('aria-expanded') === 'true') {
      menuToggle.setAttribute('aria-expanded', 'false');
      mainNavMenu.classList.remove('open');
    }
  });

  // Close menu on window resize if resized to desktop width
  window.addEventListener('resize', () => {
    if (window.innerWidth > 720) {
      menuToggle.setAttribute('aria-expanded', 'false');
      mainNavMenu.classList.remove('open');
    }
  });
}

// Initialize mobile menu when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMobileMenu);
} else {
  initializeMobileMenu();
}
