document.addEventListener('DOMContentLoaded', () => {
  const authModal = document.getElementById('auth-modal');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const userBadge = document.getElementById('user-badge'); // Badge del usuario
  const userInitials = document.getElementById('user-initials');
  const userFullname = document.getElementById('user-fullname');
  const logoutBtn = document.getElementById('logout-btn');
  const loginNotification = document.getElementById('login-notification'); // Pop-up de bienvenida

  // Función para calcular iniciales a partir del nombre completo
  function getInitials(name) {
    const names = name.split(' ');
    const initials = names.map(n => n.charAt(0).toUpperCase()).join('');
    return initials;
  }

  // Función para actualizar la interfaz según el estado de login
  function updateUIForLoggedUser() {
    const loggedUser = localStorage.getItem('loggedUser');
    if (loggedUser) {
      // Suponemos que 'loggedUser' contiene el nombre completo
      userFullname.innerText = loggedUser;
      userInitials.innerText = getInitials(loggedUser);
      userBadge.style.display = 'flex';
    } else {
      userBadge.style.display = 'none';
    }
  }

  updateUIForLoggedUser();

  // Si ya hay un usuario logueado, evitamos mostrar el modal de autenticación
  function showAuthModal(formType = 'register') {
    if (localStorage.getItem('loggedUser')) {
      alert('Ya tienes una sesión iniciada. Cierra sesión para ingresar con otro usuario.');
      return;
    }
    authModal.style.display = 'flex';
    if (formType === 'login') {
      loginForm.classList.add('active');
      registerForm.classList.remove('active');
    } else {
      registerForm.classList.add('active');
      loginForm.classList.remove('active');
    }
  }

  function hideAuthModal() {
    authModal.style.display = 'none';
    // Limpiar ambos formularios al cerrar el modal
    loginForm.reset();
    registerForm.reset();
  }

  // Event listeners para mostrar/ocultar el modal
  document.querySelector('.close-modal').addEventListener('click', hideAuthModal);

  document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthModal('login');
  });

  document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    showAuthModal('register');
  });

  window.addEventListener('click', (e) => {
    if (e.target === authModal) hideAuthModal();
  });

  // Manejo del formulario de login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const res = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        alert('Login exitoso');
        // Guardar el nombre del usuario en localStorage (suponemos que data.username contiene el nombre completo)
        localStorage.setItem('loggedUser', data.username);
        updateUIForLoggedUser();
        hideAuthModal();
        // Limpiar el formulario de login
        loginForm.reset();

        // Mostrar el pop-up de bienvenida
        loginNotification.innerText = "Bienvenido, " + data.username;
        loginNotification.classList.add('show');
        setTimeout(() => {
          loginNotification.classList.remove('show');
        }, 5000);
      } else {
        alert(`Error en el login: ${data.error}`);
      }
    } catch (error) {
      console.error('Error en la petición de login:', error);
      alert('Error en la conexión con el servidor.');
    }
  });

  // Manejo del formulario de registro
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    try {
      const res = await fetch('http://localhost:4000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();

      if (data.success) {
        alert('Registro exitoso');
        hideAuthModal();
        // Limpiar el formulario de registro
        registerForm.reset();
      } else {
        alert(`Error en el registro: ${data.error}`);
      }
    } catch (error) {
      console.error('Error en la petición de registro:', error);
      alert('Error en la conexión con el servidor.');
    }
  });

  // Alternar entre formularios (si hay otros enlaces en el HTML)
  document.querySelectorAll('.auth-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthModal(link.dataset.form);
    });
  });

  // Manejo del botón de logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('loggedUser');
      updateUIForLoggedUser();
      alert('Sesión cerrada');
    });
  }

  // Opcional: mostrar/ocultar el dropdown del badge al hacer clic
  userBadge.addEventListener('click', () => {
    userBadge.classList.toggle('show-dropdown');
  });
});
