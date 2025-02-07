document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar variables globales (compartidas con entries.js)
    window.visibleEntries = 6;
    window.allEntries = [];
    window.currentEntries = [];

    // Inicializar el mapa
    initMap();

    // Cargar favoritos y actualizar contador
    updateFavoritesCounter();

    // Función para cargar datos iniciales
    const loadData = async () => {
        window.allEntries = await fetchEntries();
        window.currentEntries = window.allEntries;
        renderEntries(window.currentEntries);
    };

    // Función de filtrado unificado
    const applyFilters = () => {
        const searchText = document.getElementById('search-input').value;
        const activeCategory = document.querySelector('#menu-categorias .category-btn.active')?.dataset.category || 'all';
        
        window.currentEntries = window.filterEntries(searchText, activeCategory);
        window.visibleEntries = 6; // Resetear paginación
        renderEntries(window.currentEntries);
    };

    // Event listeners para categorías
    document.querySelectorAll('#menu-categorias .category-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('#menu-categorias .category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            applyFilters();
        });
    });

    // Event listener para barra de búsqueda
    document.getElementById('search-input').addEventListener('input', applyFilters);

    // Carga inicial
    await loadData();
});
// JavaScript para la hamburguesa
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('#main-nav');
    
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        hamburger.classList.toggle('active');
        nav.classList.toggle('active');
    });
    
    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#main-nav') && window.innerWidth <= 768) {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
        }
    });
    
    // Cerrar menú al cambiar tamaño de pantalla
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
        }
    });
}); 


