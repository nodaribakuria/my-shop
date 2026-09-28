// "კალათაში დამატება" ღილაკები (მუშაობს ბაზიდან ჩატვირთულ ნივთებზეც)
document.addEventListener("click", (e) => {
  const button = e.target.closest(".buy-btn");
  if (!button) return;

  button.textContent = "დამატებულია ✔";
  button.classList.add("added");

  setTimeout(() => {
    button.textContent = "კალათაში დამატება";
    button.classList.remove("added");
  }, 1500);
});
