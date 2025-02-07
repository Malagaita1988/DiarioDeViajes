// language-selector.js

// Función que espera la aparición de un elemento en el DOM antes de interactuar con él.
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const intervalTime = 500;
    let elapsedTime = 0;
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(interval);
        resolve(element);
      } else {
        elapsedTime += intervalTime;
        if (elapsedTime >= timeout) {
          clearInterval(interval);
          reject(new Error("No se encontró el elemento: " + selector));
        }
      }
    }, intervalTime);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const langSelect = document.getElementById('language-select');

  langSelect.addEventListener('change', function() {
    const selectedLang = this.value;

    // Esperar hasta que el widget de Google Translate esté disponible
    waitForElement('.goog-te-combo', 10000) 
      .then(gtCombo => {
        gtCombo.value = selectedLang;

        // Crear y disparar el evento 'change' para que Google Translate detecte el cambio
        let event;
        if (typeof Event === 'function') {
          event = new Event('change', { bubbles: true });
        } else {
          event = document.createEvent('HTMLEvents');
          event.initEvent('change', true, true);
        }
        gtCombo.dispatchEvent(event);
        console.log("Idioma cambiado a: " + selectedLang);
      })
      .catch(err => {
        console.error("Error al cambiar de idioma:", err);
      });
  });
});
