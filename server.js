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

// Registro de usuario
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
        db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
          [username, email, hashedPassword],
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

// Login de usuario
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
      return res.json({ success: true, message: 'Login exitoso', userId: user.id, username: user.username });
    } catch (compareErr) {
      console.error("Error al comparar contraseñas:", compareErr);
      return res.status(500).json({ error: 'Error al comparar contraseñas' });
    }
  });
});

// ---------------------------------------------------------------------------------
// RUTAS PARA MANEJO DE "ENTRIES" (viajes)
// ---------------------------------------------------------------------------------

// Obtener todas las entradas
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

// Eliminar una entrada
app.delete('/entries/:id', (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const entries = readData();
    const entryIndex = entries.findIndex(entry => entry.id === targetId);
    if (entryIndex === -1) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }
    // Eliminar imágenes asociadas
    entries[entryIndex].images.forEach(imagePath => {
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

// Crear una nueva entrada (hasta 3 imágenes)
app.post('/entries', upload.array('images', 3), (req, res) => {
  try {
    console.log("Archivos recibidos:", req.files); // Depuración de archivos recibidos
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
    const newEntry = {
      id: Date.now(),
      location: location.trim(),
      date: date || new Date().toISOString().split('T')[0],
      comments: comments.trim(),
      lat: parseFloat(lat) || 0,
      lon: parseFloat(lon) || 0,
      category: normalizedCategory,
      images: [...uploadedImages, ...urlImages],
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

// Endpoint de diagnóstico
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
