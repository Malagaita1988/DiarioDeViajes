// server.js
require('dotenv').config(); // Cargar variables de entorno desde .env
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt'); // Para encriptar contraseñas
const db = require('./database'); // Configuración de SQLite (archivo database.js)

const app = express();
const PORT = process.env.PORT || 4000;

// ADMIN_KEY se utiliza para proteger las rutas de administración.
// Se define en .env o se usa el valor por defecto.
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';

// === Configuración para renderizar archivos .html con EJS ===
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

// Archivo de datos para las "entries"
const DATA_FILE = './datos.json';

// Configuración de categorías (en minúsculas)
const categories = [
  { value: "aventura", text: "Aventura" },
  { value: "cultura", text: "Cultura" },
  { value: "gastronomia", text: "Gastronomía" }
];

// Configuración de Multer para subir imágenes (máximo 3 archivos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'public', 'uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    cb(null, `${name}-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para proteger rutas de administración (con logs para depuración)
function checkAdmin(req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  console.log("ADMIN_KEY (desde .env):", ADMIN_KEY);
  console.log("Header x-admin-key recibido:", adminKey);
  if (!adminKey || adminKey !== ADMIN_KEY) {
    return res.status(403).json({ error: 'Acceso denegado: credenciales de administrador inválidas.' });
  }
  next();
}

// Helpers para leer/escribir en datos.json
const readData = () => {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// ---------------------------------------------------------------------------------
// RUTA PRINCIPAL: Renderiza la página de inicio e inyecta la API key de Google Maps
// ---------------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.render('index', {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
  });
});

// ---------------------------------------------------------------------------------
// RUTAS PARA MANEJO DE USUARIOS (Registro y Login)
// ---------------------------------------------------------------------------------

// Registro de usuario (se guarda la fecha de creación)
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Faltan campos: username, email, password' });
    }
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email],
      async (err, row) => {
        if (err) {
          console.error("Error en consulta:", err);
          return res.status(500).json({ error: 'Error al consultar la base de datos' });
        }
        if (row) {
          return res.status(400).json({ error: 'El usuario o email ya existe' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const createdDate = new Date().toISOString();
        db.run('INSERT INTO users (username, email, password, created_date) VALUES (?, ?, ?, ?)',
          [username, email, hashedPassword, createdDate],
          function (insertErr) {
            if (insertErr) {
              console.error("Error al insertar:", insertErr);
              return res.status(500).json({ error: 'Error al insertar usuario' });
            }
            return res.json({ success: true, userId: this.lastID });
          }
        );
      }
    );
  } catch (error) {
    console.error("Error interno en registro:", error);
    return res.status(500).json({ error: 'Error interno al registrar usuario' });
  }
});

// Login de usuario (actualiza el último inicio de sesión)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan email o password' });
  }
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error("Error en búsqueda de usuario:", err);
      return res.status(500).json({ error: 'Error de base de datos' });
    }
    if (!user) {
      return res.status(400).json({ error: 'Usuario o contraseña inválidos' });
    }
    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(400).json({ error: 'Usuario o contraseña inválidos' });
      }
      
      // Actualizar el campo last_login_date
      const lastLoginDate = new Date().toISOString();
      db.run('UPDATE users SET last_login_date = ? WHERE id = ?', [lastLoginDate, user.id]);
      
      // Si el usuario es administrador (definido por email)
      if (user.email === 'admin@gmail.com') {
        return res.json({ 
          success: true, 
          message: 'Bienvenido, administrador', 
          userId: user.id, 
          username: user.username,
          admin: true,
          adminToken: ADMIN_KEY
        });
      } else {
        return res.json({ 
          success: true, 
          message: 'Login exitoso', 
          userId: user.id, 
          username: user.username,
          admin: false
        });
      }
    } catch (compareErr) {
      console.error("Error al comparar contraseñas:", compareErr);
      return res.status(500).json({ error: 'Error al comparar contraseñas' });
    }
  });
});

// ---------------------------------------------------------------------------------
// RUTAS PARA MANEJO DE "ENTRIES" (viajes)
// ---------------------------------------------------------------------------------

// Obtener todas las entradas (público)
app.get('/entries', (req, res) => {
  try {
    const entries = readData().map(entry => ({
      ...entry,
      category: entry.category.toLowerCase()
    }));
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Error al leer entradas', error: err.message });
  }
});

// Obtener categorías
app.get('/categories', (req, res) => {
  res.json(categories);
});

// Crear una nueva entrada (hasta 3 imágenes)
app.post('/entries', upload.array('images', 3), (req, res) => {
  try {
    console.log("Archivos recibidos:", req.files);
    const { location, date, comments, lat, lon, category, imageUrls = '' } = req.body;
    const normalizedCategory = category.toLowerCase().trim();
    const isValidCategory = categories.some(cat => cat.value.toLowerCase() === normalizedCategory);
    if (!isValidCategory) {
      return res.status(400).json({
        message: 'Categoría inválida',
        categoríasPermitidas: categories.map(c => c.value),
        categoríaRecibida: category
      });
    }
    // Procesar imágenes subidas
    const uploadedImages = (req.files || []).map(file => `/uploads/${file.filename}`);
    // Procesar URLs de imágenes
    const urlImages = imageUrls.split(',')
      .map(url => url.trim())
      .filter(url => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });
    
    // Si no se subió ninguna imagen, asignar una imagen por defecto
    const allImages = [...uploadedImages, ...urlImages];
    if (allImages.length === 0) {
      allImages.push('https://static9.depositphotos.com/1229718/1162/i/950/depositphotos_11622181-stock-photo-global-questions.jpg');
    }

    const newEntry = {
      id: Date.now(),
      location: location.trim(),
      date: date || new Date().toISOString().split('T')[0],
      comments: comments.trim(),
      lat: parseFloat(lat) || 0,
      lon: parseFloat(lon) || 0,
      category: normalizedCategory,
      images: allImages,
      createdAt: new Date().toISOString()
    };
    const entries = readData();
    entries.unshift(newEntry);
    writeData(entries);
    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ 
      message: 'Error al crear entrada', 
      error: err.message 
    });
  }
});

// ---------------------------------------------------------------------------------
// RUTAS ADMIN: Gestión de entradas (protegidas)
// ---------------------------------------------------------------------------------

// Obtener todas las entradas (admin)
app.get('/admin/entries', checkAdmin, (req, res) => {
  try {
    const entries = readData();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Error al leer entradas', error: err.message });
  }
});

// Actualizar una entrada (admin)
app.put('/admin/entries/:id', checkAdmin, (req, res) => {
  try {
    const targetId = Number(req.params.id);
    let entries = readData();
    const entryIndex = entries.findIndex(entry => entry.id === targetId);
    if (entryIndex === -1) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }
    const updatedEntry = { ...entries[entryIndex], ...req.body };
    entries[entryIndex] = updatedEntry;
    writeData(entries);
    res.json(updatedEntry);
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar entrada', error: err.message });
  }
});

// Eliminar una entrada (admin)
app.delete('/admin/entries/:id', checkAdmin, (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const entries = readData();
    const entryIndex = entries.findIndex(entry => entry.id === targetId);
    if (entryIndex === -1) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }
    (entries[entryIndex].images || []).forEach(imagePath => {
      if (imagePath.startsWith('/uploads/')) {
        const fullPath = path.join(__dirname, 'public', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    });
    const updatedEntries = entries.filter(entry => entry.id !== targetId);
    writeData(updatedEntries);
    res.json({ message: 'Entrada eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar entrada', error: err.message });
  }
});

// ---------------------------------------------------------------------------------
// RUTAS ADMIN: Registro de Usuarios (protegido)
// ---------------------------------------------------------------------------------

// Obtener todos los usuarios registrados (solo admin)
app.get('/api/admin/usuarios', checkAdmin, (req, res) => {
  db.all('SELECT id, username, email, created_date, last_login_date FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Eliminar un usuario 
app.delete('/api/admin/usuarios/:id', checkAdmin, (req, res) => {
  const userId = req.params.id;
  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario eliminado correctamente' });
  });
});


// ---------------------------------------------------------------------------------
// Endpoint de diagnóstico
// ---------------------------------------------------------------------------------
app.get('/health', (req, res) => {
  try {
    const data = {
      status: 'OK',
      categorías: categories.map(c => c.value),
      totalEntradas: readData().length,
      espacioDisco: fs.statSync(DATA_FILE).size + ' bytes',
      uptime: process.uptime() + ' segundos'
    };
    res.json(data);
  } catch (err) {
    res.status(500).json({ status: 'ERROR', error: err.message });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: err.message
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor activo en http://localhost:${PORT}`);
  console.log(`📁 Ruta de imágenes: ${path.join(__dirname, 'public', 'uploads')}`);
  if (!fs.existsSync(DATA_FILE)) {
    writeData([]);
    console.log('📄 Archivo de datos creado:', DATA_FILE);
  }
});
