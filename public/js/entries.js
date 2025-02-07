// entries.js
const API_BASE_URL = 'http://localhost:4000';

let visibleEntries = 8;
let allEntries = [];
let currentEntries = [];

// Obtener entradas desde el servidor
async function fetchEntries() {
    try {
        const response = await fetch(`${API_BASE_URL}/entries`);
        if (!response.ok) throw new Error("Error al cargar entradas");
        const entries = await response.json();
        allEntries = entries;
        currentEntries = entries;
        renderEntries(currentEntries);
        return entries;
    } catch (error) {
        console.error("Error:", error);
        return [];
    }
}

// Renderizar entradas en el DOM
function renderEntries(entries) {
    const container = document.getElementById("entries-container");
    container.innerHTML = "";

    if (!entries || entries.length === 0) {
        container.innerHTML = "<p>No hay entradas disponibles.</p>";
        removeToggleButton();
        return;
    }

    const favoritos = new Set(JSON.parse(localStorage.getItem("favoritos") || "[]"));

    entries.slice(0, visibleEntries).forEach((entry) => {
        const entryId = entry.id.toString();
        const isFavorited = favoritos.has(entryId);
        const firstImage = entry.images?.length > 0 
            ? (entry.images[0].startsWith('http') ? entry.images[0] : `${API_BASE_URL}${entry.images[0]}`)
            : 'placeholder.jpg';

        const entryElement = document.createElement("div");
        entryElement.className = "entry";
        entryElement.innerHTML = `
    <div class="entry-image-container">
        <img src="${firstImage}" alt="${entry.location}" class="entry-image" onerror="this.src='placeholder.jpg'">
        <span class="entry-watermark">${entry.category || "Sin categoría"}</span>
    </div>
    <div class="entry-content">
        <h3>${entry.location}</h3>
        <p class="entry-date">📅 ${entry.date || "No especificada"}</p>
        <p class="entry-comment"><b>${entry.comments || "Sin comentarios"}</b></p>
    </div>
    <div class="entry-buttons">
        <button class="view-map-button" onclick="mostrarMapa(${entry.lat}, ${entry.lon})">Ver Mapa</button>
        <button class="view-more-button" onclick="verMas(${entry.id})">Ver Más</button>
    </div>
    <button class="delete-entry-button" data-entry-id="${entry.id}" aria-label="Eliminar entrada">
        ❌ 
    </button>
    <button class="favorite-entry-button ${isFavorited ? "favorited" : ""}" data-entry-id="${entryId}">
        ${isFavorited ? "❤️" : "🤍"}
    </button>
`;

        container.appendChild(entryElement);
    });

    assignFavoriteButtonEvents();
    assignDeleteButtonEvents();
    updateToggleButton();
}

function removeToggleButton() {
    const toggleButtonContainer = document.getElementById("toggle-button-container");
    if (toggleButtonContainer) toggleButtonContainer.remove();
}

function updateToggleButton() {
    let toggleButton = document.getElementById("toggle-entries-button");
    let toggleButtonContainer = document.getElementById("toggle-button-container");

    if (!toggleButtonContainer) {
        toggleButtonContainer = document.createElement("div");
        toggleButtonContainer.id = "toggle-button-container";
        document.getElementById("entries-container").after(toggleButtonContainer);
    }

    if (currentEntries.length > 8) {
        if (!toggleButton) {
            toggleButton = document.createElement("button");
            toggleButton.id = "toggle-entries-button";
            toggleButton.className = "main__scroll";
            toggleButton.innerHTML = `
                <div class="main__scroll-box">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M11.9997 13.1716L7.04996 8.22186L5.63574 9.63607L11.9997 16L18.3637 9.63607L16.9495 8.22186L11.9997 13.1716Z" fill="#1c1c1e"></path>
                    </svg>
                </div>
                <span class="main__scroll-text">Ver más</span>
            `;
            toggleButton.addEventListener("click", toggleEntries);
            toggleButtonContainer.appendChild(toggleButton);
        }

        const shouldShowLess = visibleEntries >= currentEntries.length;
        toggleButton.querySelector(".main__scroll-text").textContent = 
            shouldShowLess ? "Ver menos" : "Ver más";
        toggleButton.querySelector(".main__scroll-box svg").style.transform = 
            shouldShowLess ? "rotate(180deg)" : "rotate(0deg)";
        toggleButtonContainer.style.display = "flex";
    } else {
        toggleButtonContainer.style.display = "none";
        if (toggleButton) toggleButton.remove();
    }
}

function toggleEntries() {
    const totalEntries = currentEntries.length;
    if (visibleEntries >= totalEntries) {
        visibleEntries = 8;
    } else {
        visibleEntries = Math.min(totalEntries, visibleEntries + 8);
    }
    renderEntries(currentEntries);
    updateToggleButton();
}

function filterEntries(searchText, category = 'all') {
    const normalizeText = (text) => {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };

    return allEntries.filter(entry => {
        const normalizedSearch = normalizeText(searchText);
        const normalizedLocation = normalizeText(entry.location || '');
        const normalizedComments = normalizeText(entry.comments || '');
        const matchesSearch = normalizedLocation.includes(normalizedSearch) || normalizedComments.includes(normalizedSearch);
        const matchesCategory = category === 'all' || (entry.category?.toLowerCase() === category.toLowerCase());
        return matchesSearch && matchesCategory;
    });
}

function applyFilters(searchText, category) {
    currentEntries = filterEntries(searchText, category);
    visibleEntries = 8;
    renderEntries(currentEntries);
}

async function deleteEntry(entryId) {
    if (!confirm("¿Eliminar esta entrada?")) return;
    try {
        const numericId = Number(entryId);
        const response = await fetch(`${API_BASE_URL}/entries/${numericId}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error(await response.text());
        allEntries = allEntries.filter(e => e.id !== numericId);
        currentEntries = currentEntries.filter(e => e.id !== numericId);
        renderEntries(currentEntries);
        updateFavoritesCounter();
    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
    }
}

function toggleFavorite(entryId, button) {
    const favoritos = JSON.parse(localStorage.getItem("favoritos") || "[]");
    entryId = entryId.toString();
    const index = favoritos.indexOf(entryId);
    if (index === -1) {
        favoritos.push(entryId);
        button.textContent = "❤️";
        button.classList.add("favorited");
    } else {
        favoritos.splice(index, 1);
        button.textContent = "🤍";
        button.classList.remove("favorited");
    }
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    updateFavoritesCounter();
}

function updateFavoritesCounter() {
    const favoritos = JSON.parse(localStorage.getItem("favoritos") || "[]");
    const counter = document.getElementById("favorites-counter");
    if (counter) counter.textContent = favoritos.length;
}

function assignFavoriteButtonEvents() {
    document.querySelectorAll(".favorite-entry-button").forEach((button) => {
        button.onclick = () => toggleFavorite(button.dataset.entryId, button);
    });
}

function assignDeleteButtonEvents() {
    document.querySelectorAll(".delete-entry-button").forEach((button) => {
        button.onclick = () => deleteEntry(button.dataset.entryId);
    });
}

window.addEventListener("DOMContentLoaded", async () => {
    await fetchEntries();
    updateFavoritesCounter();

    document.getElementById('search-input').addEventListener('input', (e) => {
        const category = document.querySelector('#menu-categorias .category-btn.active')?.dataset.category || 'all';
        applyFilters(e.target.value, category);
    });

    document.querySelectorAll('#menu-categorias .category-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('#menu-categorias .category-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const searchText = document.getElementById('search-input').value;
            applyFilters(searchText, e.target.dataset.category);
        });
    });
});
