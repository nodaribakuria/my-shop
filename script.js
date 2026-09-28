// კალათაში დამატების ღილაკები
const buyButtons = document.querySelectorAll('.buy-btn');

buyButtons.forEach(button => {
  button.addEventListener('click', () => {
    button.textContent = 'დამატებულია ✔';
    button.style.background = '#28a745';

    setTimeout(() => {
      button.textContent = 'კალათაში დამატება';
      button.style.background = '#ff6b00';
    }, 1500);
  });
});
