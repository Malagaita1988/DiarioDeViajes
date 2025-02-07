// details.js

// Se obtiene API_BASE_URL desde el objeto global (por ejemplo, definido en config.js)
// Si no está definida, se usa 'http://localhost:4000' por defecto.
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4000';

function verMas(id) {
  // Buscamos la entrada en el arreglo global window.allEntries
  const entry = window.allEntries.find(e => e.id === id);
  if (!entry) return;

  console.log("Entry images:", entry.images);

  // La imagen principal se toma como la primera imagen.
  // Si la imagen no es una URL absoluta, se antepone API_BASE_URL (agregando la barra "/" si es necesaria)
  const mainImageSrc = (entry.images && entry.images.length > 0)
    ? (entry.images[0].startsWith('http')
         ? entry.images[0]
         : `${API_BASE_URL}${entry.images[0].startsWith('/') ? '' : '/'}${entry.images[0]}`)
    : 'placeholder.jpg';

  /* Construimos el carrusel con todas las imágenes (si hay más de una)
     para poder actualizar la imagen principal al navegar. */
  const carouselImagesArray = (entry.images && entry.images.length > 1)
    ? entry.images.map((image, index) => {
        const src = image.startsWith('http')
          ? image
          : `${API_BASE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
        return `<img src="${src}" alt="${entry.location}" class="detail-image extra-image" data-index="${index}" loading="lazy">`;
      })
    : [];

  const carouselHTML = carouselImagesArray.length > 0
    ? `<div class="detail-carousel">
         <button class="carousel-button left">&#9664;</button>
         <div class="carousel-track-container">
           <div class="carousel-track">
             ${ carouselImagesArray.join('') }
           </div>
         </div>
         <button class="carousel-button right">&#9654;</button>
       </div>`
    : '';

  /* Estructura del modal:
       - La imagen principal se muestra en .detail-image-container.
       - La marca de agua (categoría) se superpone a la imagen.
       - El carrusel permite actualizar la imagen principal.
  */
  const detailModal = document.createElement("div");
  detailModal.className = "detail-modal";
  detailModal.innerHTML = `
    <div class="detail-modal-content">
      <div class="modal-content-inner">
        <button class="close-detail-button" onclick="closeDetailModal()">X</button>
        <div class="detail-image-wrapper">
          <div class="detail-image-container">
            <img src="${mainImageSrc}" alt="${entry.location}" class="detail-image" loading="lazy">
            <div class="category-watermark">${entry.category || "Sin categoría"}</div>
          </div>
          ${ carouselHTML }
        </div>
        <div class="detail-modal-body">
          <h2>${entry.location}</h2>
          <p>📅 ${entry.date || "No especificada"}</p>
          <p><b>${entry.comments || "Sin comentarios"}</b></p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(detailModal);
  
  // Tras un pequeño delay se activa la animación y se inicializa el carrusel
  setTimeout(() => {
    detailModal.classList.add("active");
    initCarousel();
  }, 15);
}

function closeDetailModal() {
  const detailModal = document.querySelector(".detail-modal");
  if (detailModal) {
    detailModal.classList.remove("active");
    detailModal.addEventListener("transitionend", () => {
      detailModal.remove();
    });
  }
}

/* Función para inicializar el carrusel y actualizar la imagen principal */
function initCarousel() {
  const carousel = document.querySelector(".detail-carousel");
  if (!carousel) return;
  const track = carousel.querySelector(".carousel-track");
  const images = track.querySelectorAll("img.extra-image");
  if (images.length === 0) return;

  let currentIndex = 0;

  function updateCarousel() {
    // Calcula el ancho de cada miniatura (ancho + gap de 16px)
    const imageWidth = images[0].offsetWidth + 16;
    track.style.transform = `translateX(-${currentIndex * imageWidth}px)`;

    // Actualiza la clase "active" en las miniaturas
    images.forEach((img, index) => {
      if (index === currentIndex) {
        img.classList.add("active");
      } else {
        img.classList.remove("active");
      }
    });

    // Actualiza el src de la imagen principal según la miniatura activa
    const mainImg = document.querySelector(".detail-image-container img.detail-image");
    if (mainImg && images[currentIndex]) {
      mainImg.src = images[currentIndex].src;
    }
  }

  updateCarousel();

  const btnLeft = carousel.querySelector(".carousel-button.left");
  const btnRight = carousel.querySelector(".carousel-button.right");

  btnLeft.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    updateCarousel();
  });

  btnRight.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % images.length;
    updateCarousel();
  });
}


