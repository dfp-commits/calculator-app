const display = document.getElementById('display');
const buttons = document.querySelectorAll('button');

let current = '';

buttons.forEach(button => {
  button.addEventListener('click', () => {
    const value = button.textContent;

    if (value === '=') {
      try {
        current = eval(current);
      } catch (e) {
        current = 'Error';
      }
      display.value = current;
    } else {
      current += value;
      display.value = current;
    }
  });
});
