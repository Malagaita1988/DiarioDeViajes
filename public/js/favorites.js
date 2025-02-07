// Limpiar TODOS los favoritos
function clearFavorites() {
    localStorage.removeItem("favoritos");
    updateFavoritesCounter();
    
    // Actualizar corazones en el DOM
    document.querySelectorAll(".favorite-entry-button").forEach((button) => {
        button.textContent = "🤍";
        button.classList.remove("favorited");
    });
    
    // Recargar entradas para sincronizar
    fetchEntries();
}

// Asignar evento al botón de limpiar
document.getElementById("clear-favorites-button").addEventListener("click", clearFavorites);