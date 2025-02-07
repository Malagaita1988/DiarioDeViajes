document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar variables globales (compartidas con entries.js)
    window.visibleEntries = 6; // Puedes ajustar este valor si deseas que coincida con entries.js (por ejemplo, 8)
    window.allEntries = [];
    window.currentEntries = [];
  
    // Inicializar el mapa (asegúrate de tener la función definida en algún lugar, por ejemplo, en maps.js)
    initMap();
  
    // Actualizar el contador de favoritos
    updateFavoritesCounter();
  
    // Función para cargar los datos iniciales de entradas
    const loadData = async () => {
      // fetchEntries() ya utiliza API_BASE_URL desde config.js
      window.allEntries = await fetchEntries();
      window.currentEntries = window.allEntries;
      renderEntries(window.currentEntries);
    };
  
    // Función de filtrado unificado
    const applyFilters = () => {
      const searchText = document.getElementById('search-input').value;
      const activeCategory =
        document.querySelector('#menu-categorias .category-btn.active')?.dataset.category || 'all';
      
      // filterEntries() también se define en entries.js y utiliza API_BASE_URL internamente si fuera necesario
      window.currentEntries = filterEntries(searchText, activeCategory);
      window.visibleEntries = 6; // Resetear paginación
      renderEntries(window.currentEntries);
    };
  
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
  
    // --- Código para el menú hamburguesa ---
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
  
    // Cerrar el menú al cambiar el tamaño de pantalla (por ejemplo, al pasar a una pantalla mayor a 768px)
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        hamburger.classList.remove('active');
        nav.classList.remove('active');
      }
    });
  });
  