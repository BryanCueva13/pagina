// Script principal del proyecto

document.addEventListener("DOMContentLoaded", function () {
  console.log("Proyecto cargado correctamente");

  // Ejemplo de funcionalidad interactiva
  const cards = document.querySelectorAll(".bg-white.rounded-lg");

  cards.forEach((card) => {
    card.addEventListener("click", function () {
      console.log("Card clicked:", this.querySelector("h3").textContent);
    });
  });
});

// Añade aquí tus funciones personalizadas
