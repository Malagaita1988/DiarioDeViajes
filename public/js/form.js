// forms.js
(function () {
  // Si window.API_BASE_URL ya está definido (por ejemplo, en config.js), se usará;
  // de lo contrario se asigna un valor por defecto para desarrollo.
  if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'http://localhost:4000';
  }
  const API_BASE_URL_LOCAL = window.API_BASE_URL;
  console.log("API_BASE_URL:", API_BASE_URL_LOCAL);

  // Función para generar y mostrar el formulario en un modal
  async function generarFormulario() {
    console.log("generarFormulario: Iniciando creación del formulario.");
    const modal = document.createElement('div');
    modal.className = 'modal';

    // Obtener categorías desde el servidor usando API_BASE_URL_LOCAL
    let categories = [];
    try {
      const response = await fetch(`${API_BASE_URL_LOCAL}/categories`);
      if (!response.ok) throw new Error('Error al cargar categorías');
      categories = await response.json();
    } catch (error) {
      console.error('Error cargando categorías:', error);
      categories = [];
    }

    // Construir el HTML del modal con las categorías obtenidas
    modal.innerHTML = `
      <div class="modal-content">
        <form id="entry-form">
          <h2>Añadir Nuevo Viaje</h2>
          <div class="form-columns-container">
            <!-- Columna 1 -->
            <div class="form-column">
              <div class="form-group">
                <label for="location">Lugar:</label>
                <input type="text" id="location" name="location" placeholder="Escribe un lugar..." required>
              </div>
              <div class="form-group">
                <label for="date">Fecha:</label>
                <input type="date" id="date" name="date" required>
              </div>
              <div class="form-group">
                <label for="comments">Comentarios:</label>
                <textarea id="comments" name="comments" placeholder="Escribe tus comentarios..." required></textarea>
              </div>
            </div>
            <!-- Columna 2 -->
            <div class="form-column">
              <div class="form-group">
                <label>Categoría:</label>
                <div class="radio-inputs-custom" id="category-container">
                  ${categories.map(cat => `
                    <label class="radio-custom">
                      <input type="radio" name="category" value="${cat.value}" required>
                      <span class="name">${cat.text}</span>
                    </label>
                  `).join('')}
                </div>
              </div>
              <div class="form-group">
                <input type="file" id="images" name="images" accept="image/*" multiple hidden>
                <button type="button" class="upload-button" id="upload-button">
                  <svg viewBox="0 0 200 48" class="upload-svg">
                    <rect class="upload-border" x="2" y="2" width="196" height="44" rx="8" ry="8" fill="none" stroke-width="2" pathLength="100"/>
                    <rect class="loading-bar" x="2" y="2" width="0" height="44" rx="8" ry="8" fill="rgba(255,85,105,0.2)"/>
                  </svg>
                  <span class="upload-text">Subir imagen</span>
                  <span class="upload-progress">0%</span>
                </button>
              </div>
              <div class="form-group">
                <label for="image-urls">URLs de imágenes:</label>
                <input type="text" id="image-urls" name="image-urls" placeholder="Separadas por comas">
              </div>
            </div>
          </div>
          <div class="form-group" id="preview-container"></div>
          <div class="form-actions">
            <button type="button" class="button btn-cancel" id="close-modal">
              <div class="outline"></div>
              <div class="state state--default">
                <div class="icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </div>
                <p>
                  <span style="--i:0">C</span><span style="--i:1">a</span><span style="--i:2">n</span>
                  <span style="--i:3">c</span><span style="--i:4">e</span><span style="--i:5">l</span>
                  <span style="--i:6">a</span><span style="--i:7">r</span>
                </p>
              </div>
              <div class="state state--sent">
                <div class="icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <p>
                  <span style="--i:0">C</span><span style="--i:1">a</span><span style="--i:2">n</span>
                  <span style="--i:3">c</span><span style="--i:4">e</span><span style="--i:5">l</span>
                  <span style="--i:6">a</span><span style="--i:7">d</span>
                  <span style="--i:8">o</span><span style="--i:9">!</span>
                </p>
              </div>
            </button>
            <button type="submit" class="button btn-save" id="btn-guardar">
              <div class="outline"></div>
              <div class="state state--default">
                <div class="icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 7L10 17L5 12"/>
                  </svg>
                </div>
                <p>
                  <span style="--i:0">G</span><span style="--i:1">u</span><span style="--i:2">a</span>
                  <span style="--i:3">r</span><span style="--i:4">d</span><span style="--i:5">a</span>
                  <span style="--i:6">r</span>
                </p>
              </div>
              <div class="state state--sent">
                <div class="icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <path d="M22 4L12 14.01l-3-3"/>
                  </svg>
                </div>
                <p>
                  <span style="--i:0">¡</span><span style="--i:1">L</span><span style="--i:2">i</span>
                  <span style="--i:3">s</span><span style="--i:4">t</span><span style="--i:5">o</span>
                  <span style="--i:6">!</span>
                </p>
              </div>
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Inicializar Autocomplete de Google si está disponible
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
      const autocomplete = new google.maps.places.Autocomplete(
        document.getElementById('location'),
        { types: ['geocode'] }
      );
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          document.getElementById('location').dataset.lat = place.geometry.location.lat();
          document.getElementById('location').dataset.lon = place.geometry.location.lng();
        }
      });
    } else {
      console.warn('Google Maps API no está cargado. Autocomplete no funcionará.');
    }

    const entryForm = document.getElementById('entry-form');
    const closeModalBtn = document.getElementById('close-modal');
    const submitButton = document.getElementById('btn-guardar');
    const imagesInput = document.getElementById('images');
    const imageUrlsInput = document.getElementById('image-urls');
    const previewContainer = document.getElementById('preview-container');
    const uploadButton = document.getElementById('upload-button');
    const uploadProgress = uploadButton.querySelector('.upload-progress');
    const uploadText = uploadButton.querySelector('.upload-text');

    entryForm.addEventListener('submit', guardarEntrada);
    closeModalBtn.addEventListener('click', () => {
      closeModalBtn.classList.add('canceled');
      setTimeout(() => {
        document.querySelector('.modal')?.remove();
      }, 3500);
    });
    uploadButton.addEventListener('click', () => {
      imagesInput.click();
    });

    imagesInput.addEventListener('change', () => {
      const files = imagesInput.files;
      console.log("Archivos seleccionados:", files);
      if (files.length > 3) {
        alert("Solo puedes subir hasta 3 imágenes.");
        imagesInput.value = "";
        return;
      }
      if (files.length > 0) {
        uploadButton.classList.add('loading');
        uploadText.textContent = 'Subiendo...';
        uploadProgress.textContent = '0%';
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          uploadProgress.textContent = `${progress}%`;
          if (progress >= 100) {
            clearInterval(interval);
            uploadButton.classList.remove('loading');
            uploadButton.classList.add('done');
            uploadText.textContent = 'Archivo subido';
            // Actualizamos la previsualización al terminar la "subida"
            actualizarPrevisualizacion();
          }
        }, 300);
      }
    });

    imageUrlsInput.addEventListener('input', actualizarPrevisualizacion);
  }

  // Función para actualizar la previsualización de imágenes (locales y de URL)
  function actualizarPrevisualizacion() {
    const previewContainer = document.getElementById('preview-container');
    previewContainer.innerHTML = '';
    const imagesInput = document.getElementById('images');
    Array.from(imagesInput.files).forEach(file => {
      const img = document.createElement('img');
      const objectURL = URL.createObjectURL(file);
      img.src = objectURL;
      img.alt = 'Vista previa local';
      img.classList.add('preview-image');
      img.onload = () => {
        URL.revokeObjectURL(objectURL);
      };
      previewContainer.appendChild(img);
    });
    const imageUrls = document.getElementById('image-urls').value
      .split(',')
      .map(url => url.trim())
      .filter(url => url);
    imageUrls.forEach(url => {
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Vista previa URL';
      img.classList.add('preview-image');
      img.onerror = () => img.remove();
      previewContainer.appendChild(img);
    });
  }

  // Función para guardar la entrada (enviando los datos al backend usando API_BASE_URL_LOCAL)
  async function guardarEntrada(e) {
    e.preventDefault();
    const submitButton = document.getElementById('btn-guardar');
    submitButton.disabled = true;
    try {
      const categoryInput = document.querySelector('input[name="category"]:checked');
      if (!categoryInput) {
        alert('Por favor selecciona una categoría');
        submitButton.disabled = false;
        return;
      }
      // Validación opcional para exigir exactamente 3 imágenes (descomentar si se requiere)
      // const images = document.getElementById('images').files;
      // if (images.length !== 3) {
      //   alert("Debes subir exactamente 3 imágenes.");
      //   submitButton.disabled = false;
      //   return;
      // }
      const formData = new FormData();
      const locationInput = document.getElementById('location');
      formData.append('location', locationInput.value);
      formData.append('date', document.getElementById('date').value);
      formData.append('comments', document.getElementById('comments').value);
      formData.append('lat', locationInput.dataset.lat || '0');
      formData.append('lon', locationInput.dataset.lon || '0');
      formData.append('category', categoryInput.value);
      formData.append('imageUrls', document.getElementById('image-urls').value);
      const images = document.getElementById('images').files;
      Array.from(images).forEach(file => {
        formData.append('images', file);
      });
      // Enviar la entrada usando API_BASE_URL_LOCAL
      const response = await fetch(`${API_BASE_URL_LOCAL}/entries`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });
      if (!response.ok) throw new Error(await response.text());
      
      // Agregar la clase "sent" para activar la animación en el botón
      submitButton.classList.add('sent');
      // Esperar 1200ms para permitir que se vea la animación completa antes de actualizar la previsualización
      setTimeout(() => {
        const previewContainer = document.getElementById('preview-container');
        previewContainer.innerHTML = `
          <div class="success-feedback">
            <div class="loader"></div>
            <p>Guardando viaje...</p>
          </div>
        `;
      }, 1200);

      let modalClosed = false;
      const mainTimer = setTimeout(() => {
        modalClosed = true;
        document.querySelector('.modal')?.remove();
      }, 5000);
      const backupTimer = setTimeout(() => {
        if (!modalClosed) {
          document.querySelector('.modal')?.remove();
          clearTimeout(mainTimer);
        }
      }, 7000);
      if (typeof window.fetchEntries === 'function') {
        setTimeout(window.fetchEntries, 5200);
      }
    } catch (error) {
      console.error('Error:', error);
      const previewContainer = document.getElementById('preview-container');
      previewContainer.innerHTML = `
        <div class="error-feedback">
          <p>⚠️ Error al guardar: ${error.message}</p>
        </div>
      `;
    } finally {
      submitButton.disabled = false;
    }
  }

  // Al cargar el DOM, asignar el evento al botón para abrir el formulario
  document.addEventListener('DOMContentLoaded', () => {
    const addEntryButton = document.getElementById('add-entry-button');
    if (addEntryButton) {
      addEntryButton.addEventListener('click', generarFormulario);
    } else {
      console.error('No se encontró el botón "add-entry-button"');
    }
  });
})();
