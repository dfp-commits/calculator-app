// Import utils for config & logging
import { logEvent, getConfig, updateConfig } from "../utils/datastore.js";

// DOM elements
const display = document.getElementById('display');
const calculator = document.getElementById('calculator');
const breadcrumbButtons = document.querySelectorAll('.breadcrumb-btn');
const standardButtons = document.querySelector('.standard-mode');
const scientificButtons = document.querySelector('.scientific-mode');

let current = '';
let angleMode = 'deg'; // 'deg' or 'rad'
let config = {};

// Initialize calculator
async function initCalculator() {
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

// Apply initial UI state after DOM is loaded
document.addEventListener("DOMContentLoaded", initCalculator);

// Breadcrumb navigation
breadcrumbButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const mode = btn.dataset.mode;

    // Update active state
    breadcrumbButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Switch calculator mode
    calculator.dataset.mode = mode;
    if (mode === 'standard') {
      standardButtons.style.display = 'grid';
      scientificButtons.style.display = 'none';
    } else {
      standardButtons.style.display = 'none';
      scientificButtons.style.display = 'grid';
    }

    // Clear display
    current = '';
    display.value = '';

    // Log event & persist mode
    await logEvent({ type: 'mode-switch', mode });
    config.calculatorMode = mode;
    await updateConfig(config);
  });
});

// Button handlers
function setupButtons(container) {
  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      const value = button.textContent;
      const isFunction = button.classList.contains('function');
      const isOperator = button.classList.contains('operator');
      const isClear = button.classList.contains('clear');
      const isEquals = button.classList.contains('equals');

      try {
        if (isClear) {
          if (value === 'C') current = '';
          else if (value === 'CE') current = current.slice(0, -1);
          display.value = current;
          await logEvent({ type: 'clear', value });

        } else if (isEquals) {
          const result = evaluateExpression(current);
          current = result;
          display.value = current;
          await logEvent({ type: 'calculate', expression: current });

        } else if (isFunction) {
          await handleFunction(value);
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
            await logEvent({ type: 'function', value: '√' });
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
            await logEvent({ type: 'input', value });
          }
        } else {
          current += value;
          display.value = current;
          await logEvent({ type: 'input', value });
        }
      } catch (e) {
        current = 'Error';
        display.value = current;
        await logEvent({ type: 'error', message: e.message });
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
        await logEvent({ type: 'input', value: '^' }); 
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
        await logEvent({ type: 'input', value: 'π' }); 
        break;
      case 'e': 
        current += Math.E.toString(); 
        display.value = current; 
        await logEvent({ type: 'input', value: 'e' }); 
        break;
      case '1/x': applyMath(x => 1/x); break;
      case '!': current = factorial(parseInt(current) || 0); display.value = current; break;
      case 'deg': 
        angleMode = 'deg'; 
        config.angleMode = 'deg'; 
        await updateConfig(config); 
        break;
      case 'rad': 
        angleMode = 'rad'; 
        config.angleMode = 'rad'; 
        await updateConfig(config); 
        break;
      case '(':
      case ')':
        current += func;
        display.value = current;
        await logEvent({ type: 'input', value: func });
        break;
      default: current += func; display.value = current;
    }
  } catch (e) {
    current = 'Error';
    display.value = current;
    await logEvent({ type: 'error', message: e.message });
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

// Initialize buttons
setupButtons(standardButtons);
setupButtons(scientificButtons);

