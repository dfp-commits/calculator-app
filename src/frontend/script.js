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

// Load persisted config
let config = await getConfig();
angleMode = config.angleMode || 'deg';
let initialMode = config.calculatorMode || 'standard';

// Apply initial UI state after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const targetBtn = document.querySelector(`.breadcrumb-btn[data-mode="${initialMode}"]`);
  if (targetBtn) targetBtn.classList.add("active");

  if (initialMode === "standard") {
    standardButtons.style.display = "grid";
    scientificButtons.style.display = "none";
  } else {
    standardButtons.style.display = "none";
    scientificButtons.style.display = "grid";
  }
});

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
          current = evaluateExpression(current);
          display.value = current;
          await logEvent({ type: 'calculate', expression: current });

        } else if (isFunction) {
          handleFunction(value);
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
function handleFunction(func) {
  try {
    switch(func) {
      case 'sin': applyTrig(Math.sin); break;
      case 'cos': applyTrig(Math.cos); break;
      case 'tan': applyTrig(Math.tan); break;
      case 'log': applyMath(Math.log10); break;
      case 'ln': applyMath(Math.log); break;
      case 'x²': applyMath(x => x*x); break;
      case 'x^y': current += '^'; display.value = current; break;
      case '√': applyMath(Math.sqrt); break;
      case '∛': applyMath(Math.cbrt); break;
      case 'π': current += Math.PI; display.value = current; break;
      case 'e': current += Math.E; display.value = current; break;
      case '1/x': applyMath(x => 1/x); break;
      case '!': current = factorial(parseInt(current) || 0); display.value = current; break;
      case 'deg': angleMode = 'deg'; config.angleMode = 'deg'; updateConfig(config); break;
      case 'rad': angleMode = 'rad'; config.angleMode = 'rad'; updateConfig(config); break;
      default: current += func; display.value = current;
    }
  } catch (e) {
    current = 'Error';
    display.value = current;
    logEvent({ type: 'error', message: e.message });
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
  expr = expr.replace(/\^/g, '**');
  expr = expr.replace(/√(\d+\.?\d*)/g, (m, n) => Math.sqrt(parseFloat(n)));
  return Function('"use strict"; return (' + expr + ')')();
}

// Initialize buttons
setupButtons(standardButtons);
setupButtons(scientificButtons);
