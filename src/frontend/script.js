// Import utils for config & logging
import { logEvent, getConfig, updateConfig } from "../utils/datastore.js";

// DOM elements (will be initialized after DOM loads)
let display;
let calculator;
let breadcrumbButtons;
let standardButtons;
let scientificButtons;

let current = '';
let angleMode = 'deg'; // 'deg' or 'rad'
let config = {};

// Initialize calculator
async function initCalculator() {
  // Get DOM elements
  display = document.getElementById('display');
  calculator = document.getElementById('calculator');
  breadcrumbButtons = document.querySelectorAll('.breadcrumb-btn');
  standardButtons = document.querySelector('.standard-mode');
  scientificButtons = document.querySelector('.scientific-mode');

  // Verify elements exist
  if (!display) {
    console.error('Display element not found!');
    return;
  }
  if (!calculator) {
    console.error('Calculator element not found!');
    return;
  }
  
  console.log('Display found:', display);
  console.log('Standard buttons container:', standardButtons);
  console.log('Scientific buttons container:', scientificButtons);
  
  // Initialize buttons
  if (standardButtons) {
    setupButtons(standardButtons);
  } else {
    console.error('Standard buttons container not found!');
  }
  if (scientificButtons) {
    setupButtons(scientificButtons);
  } else {
    console.error('Scientific buttons container not found!');
  }

  // Load persisted config
  config = await getConfig();
  angleMode = config.angleMode || 'deg';
  const initialMode = config.calculatorMode || 'standard';

  // Apply initial UI state
  const targetBtn = document.querySelector(`.breadcrumb-btn[data-mode="${initialMode}"]`);
  if (targetBtn) {
    breadcrumbButtons.forEach(b => b.classList.remove('active'));
    targetBtn.classList.add("active");
  }

  calculator.dataset.mode = initialMode;
  if (initialMode === "standard") {
    standardButtons.style.display = "grid";
    scientificButtons.style.display = "none";
  } else {
    standardButtons.style.display = "none";
    scientificButtons.style.display = "grid";
  }

  // Initialize settings panel
  const settingsBtn = document.getElementById('settings-btn');
  const settingsPanel = document.getElementById('settings-panel');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const angleModeSelect = document.getElementById('angle-mode-select');
  const calcModeSelect = document.getElementById('calc-mode-select');
  const themeSelect = document.getElementById('theme-select');

  // Load saved settings for settings panel
  if (angleModeSelect) angleModeSelect.value = angleMode;
  if (calcModeSelect) calcModeSelect.value = initialMode;
  if (themeSelect && config.theme) {
    themeSelect.value = config.theme;
    document.body.setAttribute('data-theme', config.theme);
  }

  // Setup settings panel handlers
  if (settingsBtn && settingsPanel) {
    settingsBtn.addEventListener('click', () => {
      settingsPanel.classList.toggle('hidden');
    });
  }

  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async () => {
      angleMode = angleModeSelect.value;
      config.angleMode = angleMode;
      
      const selectedMode = calcModeSelect.value;
      config.calculatorMode = selectedMode;
      
      // Update calculator mode if changed
      if (selectedMode !== calculator.dataset.mode) {
        breadcrumbButtons.forEach(b => b.classList.remove('active'));
        const targetBtn = document.querySelector(`.breadcrumb-btn[data-mode="${selectedMode}"]`);
        if (targetBtn) {
          targetBtn.classList.add('active');
          calculator.dataset.mode = selectedMode;
          if (selectedMode === 'standard') {
            standardButtons.style.display = 'grid';
            scientificButtons.style.display = 'none';
          } else {
            standardButtons.style.display = 'none';
            scientificButtons.style.display = 'grid';
          }
        }
      }
      
      // Update theme
      const theme = themeSelect.value;
      document.body.setAttribute('data-theme', theme);
      config.theme = theme;
      
      await updateConfig(config);
      settingsPanel.classList.add('hidden');
    });
  }
}

// Setup breadcrumb navigation
function setupBreadcrumbNavigation() {
  if (!breadcrumbButtons || breadcrumbButtons.length === 0) {
    console.error('Breadcrumb buttons not found');
    return;
  }
  
  console.log(`Setting up ${breadcrumbButtons.length} breadcrumb buttons`);
  
  breadcrumbButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      console.log('Switching to mode:', mode);

      // Update active state
      breadcrumbButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Switch calculator mode
      if (calculator) calculator.dataset.mode = mode;
      
      if (mode === 'standard') {
        if (standardButtons) standardButtons.style.display = 'grid';
        if (scientificButtons) scientificButtons.style.display = 'none';
      } else {
        if (standardButtons) standardButtons.style.display = 'none';
        if (scientificButtons) scientificButtons.style.display = 'grid';
      }

      // Clear display
      current = '';
      if (display) display.value = '';

      // Log event & persist mode (non-blocking)
      safeLogEvent({ type: 'mode-switch', mode });
      config.calculatorMode = mode;
      updateConfig(config).catch(err => console.error('Failed to update config:', err));
    });
  });
}

// Apply initial UI state after DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  // Small delay to ensure all elements are rendered
  await new Promise(resolve => setTimeout(resolve, 10));
  await initCalculator();
  setupBreadcrumbNavigation();
  
  // Test if display is working
  if (display) {
    console.log('Display element verified:', display);
    console.log('Display type:', display.tagName);
    console.log('Display value:', display.value);
  }
});

// Helper function for non-blocking logging
function safeLogEvent(event) {
  logEvent(event).catch(err => {
    console.warn('Failed to log event:', err);
  });
}

// Button handlers
function setupButtons(container) {
  if (!container) {
    console.error('Container is null, cannot setup buttons');
    return;
  }
  
  const buttons = container.querySelectorAll('button');
  if (buttons.length === 0) {
    console.warn('No buttons found in container');
    return;
  }
  
  console.log(`Setting up ${buttons.length} buttons in container`);
  
  buttons.forEach((button, index) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log(`Button ${index} clicked, value: ${button.textContent.trim()}`);
      
      if (!display) {
        console.error('Display element not found');
        return;
      }
      
      const value = button.textContent.trim();
      const isFunction = button.classList.contains('function');
      const isOperator = button.classList.contains('operator');
      const isClear = button.classList.contains('clear');
      const isEquals = button.classList.contains('equals');

      try {
        if (isClear) {
          if (value === 'C') {
            current = '';
          } else if (value === 'CE') {
            current = current.slice(0, -1);
          }
          display.value = current;
          safeLogEvent({ type: 'clear', value });

        } else if (isEquals) {
          const result = evaluateExpression(current);
          current = result;
          display.value = current;
          safeLogEvent({ type: 'calculate', expression: current });

        } else if (isFunction) {
          handleFunction(value).catch(err => {
            console.error('Error in handleFunction:', err);
            current = 'Error';
            display.value = current;
          });
        } else if (isOperator) {
          // Special handling for square root in standard mode
          if (value === '√') {
            const val = parseFloat(current) || 0;
            if (val < 0) {
              current = 'Error';
            } else {
              current = Math.sqrt(val).toString();
            }
            display.value = current;
            safeLogEvent({ type: 'function', value: '√' });
          } else {
            // Handle regular operators - allow chaining
            if (current === '' && value === '-') {
              current = '-';
            } else if (current !== '' && !/[+\-*/%]/.test(current.slice(-1))) {
              current += value;
            } else if (current !== '' && /[+\-*/%]/.test(current.slice(-1))) {
              // Replace last operator
              current = current.slice(0, -1) + value;
            }
            display.value = current;
            safeLogEvent({ type: 'input', value });
          }
        } else {
          // Number or decimal point
          console.log(`Adding ${value} to current: ${current} -> ${current + value}`);
          current += value;
          display.value = current;
          console.log(`Display value set to: ${display.value}`);
          safeLogEvent({ type: 'input', value });
        }
      } catch (e) {
        console.error('Error in button handler:', e);
        current = 'Error';
        display.value = current;
        safeLogEvent({ type: 'error', message: e.message });
      }
    });
  });
}

// Handle scientific functions
async function handleFunction(func) {
  try {
    switch(func) {
      case 'sin': applyTrig(Math.sin); break;
      case 'cos': applyTrig(Math.cos); break;
      case 'tan': applyTrig(Math.tan); break;
      case 'log': applyMath(Math.log10); break;
      case 'ln': applyMath(Math.log); break;
      case 'x²': applyMath(x => x*x); break;
      case 'x^y': 
        current += '^'; 
        display.value = current; 
        safeLogEvent({ type: 'input', value: '^' }); 
        break;
      case '√': 
        if (current === '') {
          current = '√';
          display.value = current;
        } else {
          applyMath(Math.sqrt);
        }
        break;
      case '∛': applyMath(Math.cbrt); break;
      case 'π': 
        current += Math.PI.toString(); 
        display.value = current; 
        safeLogEvent({ type: 'input', value: 'π' }); 
        break;
      case 'e': 
        current += Math.E.toString(); 
        display.value = current; 
        safeLogEvent({ type: 'input', value: 'e' }); 
        break;
      case '1/x': applyMath(x => 1/x); break;
      case '!': current = factorial(parseInt(current) || 0); display.value = current; break;
      case 'deg': 
        angleMode = 'deg'; 
        config.angleMode = 'deg'; 
        updateConfig(config).catch(err => console.error('Failed to update config:', err)); 
        break;
      case 'rad': 
        angleMode = 'rad'; 
        config.angleMode = 'rad'; 
        updateConfig(config).catch(err => console.error('Failed to update config:', err)); 
        break;
      case '(':
      case ')':
        current += func;
        display.value = current;
        safeLogEvent({ type: 'input', value: func });
        break;
      default: current += func; display.value = current;
    }
  } catch (e) {
    current = 'Error';
    display.value = current;
    safeLogEvent({ type: 'error', message: e.message });
  }
}

// Helper for trig functions with angle mode
function applyTrig(fn) {
  const val = parseFloat(current) || 0;
  const result = angleMode === 'deg' ? fn(val * Math.PI / 180) : fn(val);
  current = result.toString();
  display.value = current;
}

// Helper for math functions
function applyMath(fn) {
  const val = parseFloat(current) || 0;
  current = fn(val).toString();
  display.value = current;
}

// Factorial
function factorial(n) {
  if (n < 0 || n > 170) return 'Error';
  let res = 1;
  for (let i=2;i<=n;i++) res *= i;
  return res.toString();
}

// Evaluate expression
function evaluateExpression(expr) {
  if (!expr || expr.trim() === '') return '0';
  
  try {
    // Replace custom operators
    expr = expr.replace(/\^/g, '**');
    expr = expr.replace(/√(\d+\.?\d*)/g, (m, n) => Math.sqrt(parseFloat(n)));
    
    // Handle percentage
    expr = expr.replace(/(\d+\.?\d*)%/g, (m, n) => parseFloat(n) / 100);
    
    // Replace × with * and ÷ with /
    expr = expr.replace(/×/g, '*').replace(/÷/g, '/');
    
    // Validate expression (basic safety check)
    if (!/^[0-9+\-*/().\s]+$/.test(expr.replace(/\*\*/g, '').replace(/√/g, ''))) {
      throw new Error('Invalid expression');
    }
    
    const result = Function('"use strict"; return (' + expr + ')')();
    
    // Handle division by zero
    if (!isFinite(result)) {
      throw new Error('Division by zero');
    }
    
    // Round to avoid floating point errors
    return parseFloat(result.toFixed(10)).toString();
  } catch (e) {
    throw new Error('Invalid expression');
  }
}


