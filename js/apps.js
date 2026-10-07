/**
 * ESTADO GLOBAL DE LA APLICACIÓN
 * Guarda los datos actuales de la tarjeta mientras el usuario los edita.
 */
const state = {
  cardData: {
    name: '',
    bio: '',
    avatarUrl: 'src/assents/avatar0.jpg', // Avatar por defecto
    color: '#3b82f6' // Color azul por defecto
  }
};

/**
 * REFERENCIAS AL DOM
 * Guardamos en un objeto todos los elementos del HTML que vamos a manipular con JS.
 */
const dom = {
  inputName: document.getElementById('input-name'),
  inputBio: document.getElementById('input-bio'),
  inputColor: document.getElementById('input-color'),
  inputSearch: document.getElementById('github-search'),
  btnFetch: document.getElementById('btn-fetch'),
  apiStatus: document.getElementById('api-status'),
  form: document.getElementById('profile-form'),
  avatarSelector: document.getElementById('avatar-selector'),
  previewName: document.getElementById('name-preview'),
  previewBio: document.getElementById('bio-preview'),
  previewAvatar: document.getElementById('avatar-preview'),
  previewHeader: document.getElementById('preview-header'),
  viewCreate: document.getElementById('view-create'),
  // Elementos del Módulo de Galería y Navegación SPA
  viewGallery: document.getElementById('view-gallery'),
  navLinks: document.querySelectorAll('.nav-link'),
  galleryContainer: document.getElementById('gallery-container'),
  btnReloadGallery: document.getElementById('btn-reload-gallery')
};

const API_ENDPOINT = 'api/data/index.php';

/**
 * GENERADOR DEL SELECTOR DE AVATARES
 * Crea dinámicamente las 12 imágenes del selector de avatares en el formulario.
 */
const initAvatarSelector = () => {
  const totalAvatares = 12; // Va desde avatar0.jpg hasta avatar11.jpg
  for (let i = 0; i < totalAvatares; i++) {
    const rutaImagen = `src/assents/avatar${i}.jpg`;
    const img = document.createElement('img');
    img.src = rutaImagen;
    img.alt = `avatar${i}`;
    img.className = 'avatar-option';
    img.dataset.url = rutaImagen;

    // Al hacer clic en un avatar, actualiza el estado y vuelve a renderizar
    img.addEventListener('click', () => {
      state.cardData.avatarUrl = rutaImagen;
      renderCard();
    });

    dom.avatarSelector.appendChild(img);
  }
};

/**
 * FUNCIÓN DE RENDERIZADO (Reactividad de la tarjeta)
 * Actualiza la vista previa de la tarjeta en tiempo real con los datos de `state.cardData`.
 */
const renderCard = () => {
  dom.previewName.textContent = state.cardData.name || 'Nombre Apellido';
  dom.previewBio.textContent = state.cardData.bio || 'La biografía aparecerá aquí...';
  dom.previewAvatar.src = state.cardData.avatarUrl;
  dom.previewHeader.style.backgroundColor = state.cardData.color;
  dom.inputName.value = state.cardData.name;
  dom.inputBio.value = state.cardData.bio;
  dom.inputColor.value = state.cardData.color;

  // Resalta el avatar seleccionado actualmente
  const avatares = dom.avatarSelector.querySelectorAll('.avatar-option');
  avatares.forEach(img => {
    if (img.dataset.url === state.cardData.avatarUrl) {
      img.classList.add('selected');
    } else {
      img.classList.remove('selected');
    }
  });
};

/**
 * CONSUMO DE API INTERNA (Guardar en el servidor)
 * Envía los datos del usuario al archivo PHP para guardarlos en el JSON.
 * asdfghj
 */
const saveCardToServer = async () => {
  // Validación: Evitamos guardar si no ingresó al menos el nombre
  if (!state.cardData.name.trim()) {
    alert('Por favor, ingresa un nombre para la tarjeta.');
    return;
  }

  const btnSubmit = dom.form.querySelector('button[type="submit"]');
  const textoOriginal = btnSubmit.textContent;
  btnSubmit.textContent = 'Guardando en servidor...';
  btnSubmit.disabled = true;

  try {
    const formData = new FormData();
    formData.append('datos_tarjeta', JSON.stringify(state.cardData));

    const response = await fetch(`${API_ENDPOINT}?action=crear_tarjeta`,{
      method: 'POST',
      body: formData
    });

    // Leemos la respuesta como texto crudo para poder depurar en consola en caso de error
    const textoCrudo = await response.text();
    console.log("Respuesta cruda del servidor:", textoCrudo);

    // Como PHP ahora siempre devuelve JSON, lo parseamos directamente
    const result = JSON.parse(textoCrudo);

    if (!response.ok) {
      // Lanzamos el error específico que nos mandó PHP
      throw new Error(result.error || 'El servidor rechazó la petición.');
    }

    alert(result.message || '¡Tarjeta guardada con éxito!');
  } catch (error) {
    alert('Error: ' + error.message);
    console.error('Error capturado en el catch:', error);
  } finally {
    btnSubmit.textContent = textoOriginal;
    btnSubmit.disabled = false;
  }
};

/**
 * EVENTOS MANUALES
 * Escucha cuando el usuario escribe en los campos del formulario
 */
const setupManualEvents = () => {
  dom.inputName.addEventListener('input', (e) => {
    state.cardData.name = e.target.value;
    renderCard();
  });

  dom.inputBio.addEventListener('input', (e) => {
    state.cardData.bio = e.target.value;
    renderCard();
  });

  dom.inputColor.addEventListener('input', (e) => {
    state.cardData.color = e.target.value;
    renderCard();
  });

  dom.form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveCardToServer();
  });
};

/**
 * CONSUMO DE API GitHub
 * Busca datos de un perfil público de GitHub y llena automáticamente los datos.
 */
const fetchGitHubData = async (username) => {
  if (!username) return;

  dom.apiStatus.textContent = 'Buscando usuario en GitHub...';
  dom.apiStatus.className = 'status-msg status-loading';
  dom.btnFetch.disabled = true;

  try {
    const response = await fetch(`https://api.github.com/users/${username}`);

    if (!response.ok) throw new Error('Usuario no encontrado');

    const data = await response.json();

    state.cardData.name = data.name || data.login;
    state.cardData.bio = data.bio || 'Este usuario no tiene biografía pública.';
    state.cardData.avatarUrl = data.avatar_url;

    renderCard();

    dom.apiStatus.textContent = '¡Datos cargados correctamente!';
    dom.apiStatus.className = 'status-msg status-success';
  } catch (error) {
    dom.apiStatus.textContent = error.message;
    dom.apiStatus.className = 'status-msg status-error';
  } finally {
    dom.btnFetch.disabled = false;
    setTimeout(() => dom.apiStatus.textContent = '', 3000);
  }
};

/**
 * LÓGICA DE LA GALERÍA (Consumo y Renderizado)
 * Lee el archivo JSON con todas las tarjetas guardadas y las muestra en la vista de Galería.
 * asdfg
 */
const loadGalleryData = async () => {
  dom.galleryContainer.innerHTML = '<p class="status-msg status-loading">Cargando tarjetas...</p>';

  try {
    // Añadimos ?t=Date.now() para evitar problemas de caché del navegador
    const response = await fetch(`${API_ENDPOINT}?action=listar_tarjetas&t=${Date.now()}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al obtener las tarjetas');
    }

    const tarjetas = result.data || [];

    if (tarjetas.length === 0) {
      throw new Error('La galería está vacía.');
    }

    dom.galleryContainer.innerHTML = '';

    // Muestra las tarjetas de la más reciente a la más antigua (.reverse())
    tarjetas.reverse().forEach(tarjeta => {
      const cardHTML = `
        <article class="card">
            <div class="card-header" style="background-color: ${tarjeta.color}"></div>
            <img src="${tarjeta.avatarUrl}" alt="Avatar de ${tarjeta.name}" class="avatar">
            <div class="card-body">
                <h3>${tarjeta.name}</h3>
                <p style="font-size: 0.95rem; color: #64748b;">${tarjeta.bio}</p>
            </div>
        </article>
      `;
      dom.galleryContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
  } catch (error) {
    dom.galleryContainer.innerHTML = `<p class="status-msg status-error">${error.message}</p>`;
  }
};

/**
 * ENRUTADOR BASADO EN HASH (El corazón de la SPA)
 * Cambia dinámicamente entre el formulario de crear perfil y la galería sin recargar la página.
 */
const handleRouting = () => {
  const currentHash = window.location.hash || '#/crear';

  // Actualiza la clase active en el menú superior
  dom.navLinks.forEach(link => {
    if (link.getAttribute('href') === currentHash) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Muestra u oculta los módulos según la ruta del Hash
  if (currentHash === '#/galeria') {
    dom.viewCreate.classList.remove('active');
    dom.viewCreate.style.display = 'none';

    dom.viewGallery.style.display = 'block';
    setTimeout(() => dom.viewGallery.classList.add('active'), 10);

    loadGalleryData();
  } else {
    dom.viewGallery.classList.remove('active');
    dom.viewGallery.style.display = 'none';

    dom.viewCreate.style.display = 'block';
    setTimeout(() => dom.viewCreate.classList.add('active'), 10);
  }
};

/**
 * INICIALIZACIÓN DE LA APLICACIÓN
 * Se ejecuta al terminar de cargar el DOM.
 */
document.addEventListener('DOMContentLoaded', () => {
  initAvatarSelector();
  setupManualEvents();

  // Búsqueda en GitHub
  dom.btnFetch.addEventListener('click', () => {
    const username = dom.inputSearch.value.trim();
    fetchGitHubData(username);
  });

  dom.inputSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      dom.btnFetch.click();
    }
  });

  renderCard();

  // Eventos de enrutamiento SPA y botón de recarga en la Galería
  window.addEventListener('hashchange', handleRouting);
  if (dom.btnReloadGallery) {
    dom.btnReloadGallery.addEventListener('click', loadGalleryData);
  }
  
  handleRouting();
});