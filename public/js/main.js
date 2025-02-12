document.addEventListener('DOMContentLoaded', async () => {
  // ================================================
  // Inicialización de variables y funcionalidades
  // ================================================
  
  // Variables globales para entradas
  window.visibleEntries = 6; // Puedes ajustar este valor
  window.allEntries = [];
  window.currentEntries = [];

  // Inicializar el mapa (asegúrate de que initMap esté definida)
  initMap();

  // Actualizar el contador de favoritos (asegúrate de que updateFavoritesCounter esté definida)
  updateFavoritesCounter();

  // Función para cargar los datos iniciales de entradas
  const loadData = async () => {
    // fetchEntries() utiliza API_BASE_URL desde config.js (debe estar definida)
    window.allEntries = await fetchEntries();
    window.currentEntries = window.allEntries;
    renderEntries(window.currentEntries);
  };

  // Función de filtrado unificado para búsquedas y categorías
  const applyFilters = () => {
    const searchText = document.getElementById('search-input').value;
    const activeCategory =
      document.querySelector('#menu-categorias .category-btn.active')?.dataset.category || 'all';
    
    // filterEntries() debe estar definida para filtrar según texto y categoría
    window.currentEntries = filterEntries(searchText, activeCategory);
    window.visibleEntries = 6; // Resetear paginación
    renderEntries(window.currentEntries);
  };

  // ================================================
  // Event Listeners para filtrado y búsqueda
  // ================================================
  
  // Event listeners para botones de categorías
  document.querySelectorAll('#menu-categorias .category-btn').forEach((button) => {
    button.addEventListener('click', (e) => {
      // Remover clase 'active' de todos y asignarla al botón clicado
      document.querySelectorAll('#menu-categorias .category-btn').forEach((btn) => {
        btn.classList.remove('active');
      });
      e.target.classList.add('active');
      applyFilters();
    });
  });

  // Event listener para la barra de búsqueda
  document.getElementById('search-input').addEventListener('input', applyFilters);

  // Carga inicial de entradas
  await loadData();

  // ================================================
  // Menú Hamburguesa para dispositivos móviles
  // ================================================
  
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('#main-nav');

  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    hamburger.classList.toggle('active');
    nav.classList.toggle('active');
  });

  // Cerrar el menú al hacer click fuera del mismo (en pantallas pequeñas)
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#main-nav') && window.innerWidth <= 768) {
      hamburger.classList.remove('active');
      nav.classList.remove('active');
    }
  });

  // Cerrar el menú al cambiar el tamaño de pantalla (por ejemplo, en pantallas mayores a 768px)
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      hamburger.classList.remove('active');
      nav.classList.remove('active');
    }
  });

  // ================================================
  // Funcionalidad del Botón "Subir Arriba"
  // ================================================
  
  // Asegúrate de que en tu HTML exista el botón con id="scrollTopBtn"
  const scrollTopBtn = document.getElementById('scrollTopBtn');

  // Mostrar u ocultar el botón según la posición del scroll
  window.addEventListener('scroll', () => {
    if (document.documentElement.scrollTop > 200) {
      scrollTopBtn.style.display = 'block';
    } else {
      scrollTopBtn.style.display = 'none';
    }
  });

  // Al hacer clic, realizar scroll suave hacia la parte superior
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
});
