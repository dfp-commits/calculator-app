const display = document.getElementById('display');
const calculator = document.getElementById('calculator');
const breadcrumbButtons = document.querySelectorAll('.breadcrumb-btn');
const standardButtons = document.querySelector('.standard-mode');
const scientificButtons = document.querySelector('.scientific-mode');

let current = '';
let angleMode = 'deg'; // 'deg' or 'rad'
let calculationHistory = []; // Array to store last 5 calculations

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
          current = current.slice(0, -1);
          display.value = current;
        }
      } else if (isEquals) {
        try {
          const expression = current;
          const result = evaluateExpression(current);
          current = result.toString();
          display.value = current;
          
          // Send calculation to backend (do NOT show in UI)
          addToHistory(expression, result.toString());
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
    const exprBefore = current || '0';
    let result = '';
    
    switch(func) {
      case 'sin':
        const sinValue = parseFloat(current) || 0;
        const sinResult = angleMode === 'deg' 
          ? Math.sin(sinValue * Math.PI / 180) 
          : Math.sin(sinValue);
        result = sinResult.toString();
        current = result;
        display.value = current;
        addToHistory(`sin(${sinValue}${angleMode === 'deg' ? '°' : ''})`, result);
        break;
      case 'cos':
        const cosValue = parseFloat(current) || 0;
        const cosResult = angleMode === 'deg' 
          ? Math.cos(cosValue * Math.PI / 180) 
          : Math.cos(cosValue);
        result = cosResult.toString();
        current = result;
        display.value = current;
        addToHistory(`cos(${cosValue}${angleMode === 'deg' ? '°' : ''})`, result);
        break;
      case 'tan':
        const tanValue = parseFloat(current) || 0;
        const tanResult = angleMode === 'deg' 
          ? Math.tan(tanValue * Math.PI / 180) 
          : Math.tan(tanValue);
        result = tanResult.toString();
        current = result;
        display.value = current;
        addToHistory(`tan(${tanValue}${angleMode === 'deg' ? '°' : ''})`, result);
        break;
      case 'log':
        const logValue = parseFloat(current) || 1;
        result = Math.log10(logValue).toString();
        current = result;
        display.value = current;
        addToHistory(`log(${logValue})`, result);
        break;
      case 'ln':
        const lnValue = parseFloat(current) || 1;
        result = Math.log(lnValue).toString();
        current = result;
        display.value = current;
        addToHistory(`ln(${lnValue})`, result);
        break;
      case 'x²':
        const squareValue = parseFloat(current) || 0;
        result = (squareValue * squareValue).toString();
        current = result;
        display.value = current;
        addToHistory(`${squareValue}²`, result);
        break;
      case 'x^y':
        current += '^';
        display.value = current;
        break;
      case '√':
        const sqrtValue = parseFloat(current) || 0;
        result = Math.sqrt(sqrtValue).toString();
        current = result;
        display.value = current;
        addToHistory(`√${sqrtValue}`, result);
        break;
      case '∛':
        const cbrtValue = parseFloat(current) || 0;
        result = Math.cbrt(cbrtValue).toString();
        current = result;
        display.value = current;
        addToHistory(`∛${cbrtValue}`, result);
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
        result = (1 / invValue).toString();
        current = result;
        display.value = current;
        addToHistory(`1/${invValue}`, result);
        break;
      case '!':
        const factValue = parseInt(current) || 0;
        if (factValue < 0 || factValue > 170) {
          current = 'Error';
          display.value = current;
        } else {
          result = factorial(factValue).toString();
          current = result;
          display.value = current;
          addToHistory(`${factValue}!`, result);
        }
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
  expr = expr.replace(/\^/g, '**');
  expr = expr.replace(/√(\d+\.?\d*)/g, (match, num) => Math.sqrt(parseFloat(num)));
  return Function('"use strict"; return (' + expr + ')')();
}

setupButtons(standardButtons);
setupButtons(scientificButtons);

// History modal elements
const historyBtn = document.getElementById('historyBtn');
const historyModal = document.getElementById('historyModal');
const historyClose = document.getElementById('historyClose');
const historyList = document.getElementById('historyList');

const API_URL = "http://localhost:3001"; // backend URL

async function saveCalculation(expression, result) {
  try {
    const response = await fetch(`${API_URL}/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expression, result })
    });
    const data = await response.json();
    console.log("Saved calculation:", data);
  } catch (err) {
    console.error("Error saving calculation:", err);
  }
}

async function loadHistory() {
  try {
    const response = await fetch(`${API_URL}/calculations`);
    const history = await response.json();
    const historyDiv = document.getElementById("history");
    historyDiv.innerHTML = history.map(c => `<div>${c.expression} = ${c.result}</div>`).join("");
  } catch (err) {
    console.error("Error loading history:", err);
  }
}

// **Updated addToHistory:** only send to backend
function addToHistory(expression, result) {
  if (result !== 'Error') {
    saveCalculation(expression, result);
  }
}

// Open history modal
historyBtn.addEventListener('click', () => {
  historyModal.style.display = 'flex';
  loadHistory(); // only load when modal opens
});

// Close history modal
historyClose.addEventListener('click', () => {
  historyModal.style.display = 'none';
});

// Close modal when clicking outside
historyModal.addEventListener('click', (e) => {
  if (e.target === historyModal) {
    historyModal.style.display = 'none';
  }
});
