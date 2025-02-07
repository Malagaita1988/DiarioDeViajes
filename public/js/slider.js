$(document).ready(function () {
    const slides = $('.slide');
    let currentIndex = 0;
  
    // Función para actualizar el slider
    function updateSlider() {
      slides.removeClass('active');
      slides.eq(currentIndex).addClass('active');
      $('.dot').removeClass('active').eq(currentIndex).addClass('active');
    }
  
    // Genera los dots basados en la cantidad de slides
    slides.each(function(index) {
      $('.dots-container').append(`<div class="dot ${index === 0 ? 'active' : ''}"></div>`);
    });
  
    // Evento click en la flecha izquierda
    $('.left-arrow').click(function() {
      currentIndex = currentIndex > 0 ? currentIndex - 1 : slides.length - 1;
      updateSlider();
    });
  
    // Evento click en la flecha derecha
    $('.right-arrow').click(function() {
      currentIndex = currentIndex < slides.length - 1 ? currentIndex + 1 : 0;
      updateSlider();
    });
  
    // Evento click en los dots
    $('.dots-container').on('click', '.dot', function() {
      currentIndex = $(this).index();
      updateSlider();
    });
  
    // Navegación con teclado
    $(document).keydown(function(e) {
      if (e.key === 'ArrowLeft') {
        $('.left-arrow').click();
      } else if (e.key === 'ArrowRight') {
        $('.right-arrow').click();
      }
    });
  });
  