// DOM elements (will be initialized after DOM loads)
let display;
let calculator;
let breadcrumbButtons;
let standardButtons;
let scientificButtons;

let current = '';
let angleMode = 'deg'; // 'deg' or 'rad'

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

  const initialMode = 'standard';

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

    });
  });
}

// Apply initial UI state after DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  await initCalculator();
  setupBreadcrumbNavigation();
});

// Button handlers
function setupButtons(container) {
  if (!container) return;
  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      if (!display) return;
      const value = button.textContent.trim();
      const isFunction = button.classList.contains('function');
      const isOperator = button.classList.contains('operator');
      const isClear = button.classList.contains('clear');
      const isEquals = button.classList.contains('equals');

      if (isClear) {
        current = value === 'C' ? '' : current.slice(0, -1);
        display.value = current;
        return;
      }

      if (isEquals) {
        try {
          current = evaluateExpression(current);
        } catch (err) {
          current = 'Error';
        }
        display.value = current;
        return;
      }

      if (isFunction) {
        await handleFunction(value);
        return;
      }

      if (isOperator) {
        if (value === '√') {
          const val = parseFloat(current) || 0;
          current = val < 0 ? 'Error' : Math.sqrt(val).toString();
          display.value = current;
          return;
        }
        if (current === '' && value === '-') {
          current = '-';
        } else if (current !== '' && !/[+\-*/%]/.test(current.slice(-1))) {
          current += value;
        } else if (current !== '' && /[+\-*/%]/.test(current.slice(-1))) {
          current = current.slice(0, -1) + value;
        }
        display.value = current;
        return;
      }

      // Numbers/decimal
      current += value;
      display.value = current;
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
        break;
      case 'e': 
        current += Math.E.toString(); 
        display.value = current;
        break;
      case '1/x': applyMath(x => 1/x); break;
      case '!': current = factorial(parseInt(current) || 0); display.value = current; break;
      case 'deg': 
        angleMode = 'deg'; 
        break;
      case 'rad': 
        angleMode = 'rad'; 
        break;
      case '(':
      case ')':
        current += func;
        display.value = current;
        break;
      default: current += func; display.value = current;
    }
  } catch (e) {
    current = 'Error';
    display.value = current;
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


