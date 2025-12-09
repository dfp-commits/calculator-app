const display = document.getElementById('display');
const calculator = document.getElementById('calculator');
const breadcrumbButtons = document.querySelectorAll('.breadcrumb-btn');
const standardButtons = document.querySelector('.standard-mode');
const scientificButtons = document.querySelector('.scientific-mode');

let current = '';
let angleMode = 'deg'; // 'deg' or 'rad'

// Breadcrumb navigation
breadcrumbButtons.forEach(btn => {
  btn.addEventListener('click', () => {
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
    
    // Clear display when switching
    current = '';
    display.value = '';
  });
});

// Button event handlers
function setupButtons(buttonContainer) {
  const buttons = buttonContainer.querySelectorAll('button');
  
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const value = button.textContent;
      const isFunction = button.classList.contains('function');
      const isOperator = button.classList.contains('operator');
      const isClear = button.classList.contains('clear');
      const isEquals = button.classList.contains('equals');

      if (isClear) {
        if (value === 'C') {
          current = '';
          display.value = '';
        } else if (value === 'CE') {
          // Clear entry - remove last number/operation
          current = current.slice(0, -1);
          display.value = current;
        }
      } else if (isEquals) {
        try {
          current = evaluateExpression(current);
          display.value = current;
        } catch (e) {
          current = 'Error';
          display.value = current;
        }
      } else if (isFunction) {
        handleFunction(value);
      } else {
        current += value;
        display.value = current;
      }
    });
  });
}

function handleFunction(func) {
  try {
    switch(func) {
      case 'sin':
        const sinValue = parseFloat(current) || 0;
        const sinResult = angleMode === 'deg' 
          ? Math.sin(sinValue * Math.PI / 180) 
          : Math.sin(sinValue);
        current = sinResult.toString();
        display.value = current;
        break;
      case 'cos':
        const cosValue = parseFloat(current) || 0;
        const cosResult = angleMode === 'deg' 
          ? Math.cos(cosValue * Math.PI / 180) 
          : Math.cos(cosValue);
        current = cosResult.toString();
        display.value = current;
        break;
      case 'tan':
        const tanValue = parseFloat(current) || 0;
        const tanResult = angleMode === 'deg' 
          ? Math.tan(tanValue * Math.PI / 180) 
          : Math.tan(tanValue);
        current = tanResult.toString();
        display.value = current;
        break;
      case 'log':
        const logValue = parseFloat(current) || 1;
        current = Math.log10(logValue).toString();
        display.value = current;
        break;
      case 'ln':
        const lnValue = parseFloat(current) || 1;
        current = Math.log(lnValue).toString();
        display.value = current;
        break;
      case 'x²':
        const squareValue = parseFloat(current) || 0;
        current = (squareValue * squareValue).toString();
        display.value = current;
        break;
      case 'x^y':
        current += '^';
        display.value = current;
        break;
      case '√':
        const sqrtValue = parseFloat(current) || 0;
        current = Math.sqrt(sqrtValue).toString();
        display.value = current;
        break;
      case '∛':
        const cbrtValue = parseFloat(current) || 0;
        current = Math.cbrt(cbrtValue).toString();
        display.value = current;
        break;
      case 'π':
        current += Math.PI.toString();
        display.value = current;
        break;
      case 'e':
        current += Math.E.toString();
        display.value = current;
        break;
      case '1/x':
        const invValue = parseFloat(current) || 1;
        current = (1 / invValue).toString();
        display.value = current;
        break;
      case '!':
        const factValue = parseInt(current) || 0;
        if (factValue < 0 || factValue > 170) {
          current = 'Error';
        } else {
          current = factorial(factValue).toString();
        }
        display.value = current;
        break;
      case 'deg':
        angleMode = 'deg';
        break;
      case 'rad':
        angleMode = 'rad';
        break;
      default:
        current += func;
        display.value = current;
    }
  } catch (e) {
    current = 'Error';
    display.value = current;
  }
}

function factorial(n) {
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

function evaluateExpression(expr) {
  // Replace ^ with ** for exponentiation
  expr = expr.replace(/\^/g, '**');
  
  // Replace √ with Math.sqrt
  expr = expr.replace(/√(\d+\.?\d*)/g, (match, num) => Math.sqrt(parseFloat(num)));
  
  // Evaluate the expression
  return Function('"use strict"; return (' + expr + ')')();
}

// Setup both button containers
setupButtons(standardButtons);
setupButtons(scientificButtons);
