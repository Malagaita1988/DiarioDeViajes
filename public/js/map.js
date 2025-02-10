let map;
let marker;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 43.318237, lng: -1.9817051 },
        zoom: 12,
    });
}

function mostrarMapa(lat, lon) {
    // Actualiza el centro del mapa y muestra el marcador
    map.setCenter({ lat, lng: lon });
    map.setZoom(10);
    if (marker) marker.setMap(null);
    marker = new google.maps.Marker({
        position: { lat, lng: lon },
        map: map,
    });

    // Desplaza la vista a la sección donde está el mapa de forma suave
    const mapSection = document.getElementById('map-container');
    if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth' });
    }
}
