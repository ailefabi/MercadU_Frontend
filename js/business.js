const API_BUSINESS = "https://mercadu.onrender.com/api/business";
const API_PRODUCT  = "https://mercadu.onrender.com/api/product";

let todosLosNegocios  = []; 
let todosLosProductos = []; // Guardamos los productos globalmente para no perder los tags al filtrar
let categoriaActiva   = "todos";

// ── Cargar emprendimientos + productos ──
async function cargarEmprendimientos() {
  const grid = document.getElementById("empGrid");

  try {
    // Traemos negocios y productos disponibles al mismo tiempo
    const [negocios, productos] = await Promise.all([
      fetch(API_BUSINESS).then(r => r.ok ? r.json() : []),
      fetch(`${API_PRODUCT}/available`).then(r => r.ok ? r.json() : [])
    ]);

    todosLosNegocios = negocios;
    todosLosProductos = productos; 

    if (negocios.length === 0) {
      grid.innerHTML = "";
      document.getElementById("empEmpty").style.display = "block";
      return;
    }

    renderEmprendimientos(todosLosNegocios, todosLosProductos);

  } catch (err) {
    console.error("Error:", err);
    grid.innerHTML = '<p class="emp-error">No se pudo conectar con el servidor. Asegurate de que el backend esté corriendo.</p>';
  }
}

// ── Renderizar tarjetas ──
function renderEmprendimientos(negocios, productos) {
  const grid = document.getElementById("empGrid");
  grid.innerHTML = "";

  if (negocios.length === 0) {
    document.getElementById("empEmpty").style.display = "block";
    return;
  }

  document.getElementById("empEmpty").style.display = "none";

  negocios.forEach(b => {
    // MAPEO EXACTO: Usamos b.id tal como viene en tu BusinessResponseDTO
    const businessId = b.id; 

    // MAPEO EXACTO: Comparamos con p.businessId de tu ProductResponseDTO
    const productosDelNegocio = productos.filter(p => p.businessId === businessId);
    
    // Construcción dinámica de los tags de productos
    const tagsHTML = productosDelNegocio.length > 0
      ? productosDelNegocio.slice(0, 2).map(p =>
          `<span class="emp-producto-tag">${p.name}</span>`
        ).join("") + (productosDelNegocio.length > 2
          ? `<span class="emp-producto-tag more">+${productosDelNegocio.length - 2} más</span>`
          : "")
      : '<span style="font-size:12px;color:#aaa">Sin productos aún</span>';

    grid.innerHTML += `
      <a href="business-detail.html?id=${businessId}" class="emp-card" data-categoria="${(b.category || "").toLowerCase()}" style="text-decoration: none; color: inherit;">
        <div class="emp-icon">${(b.name || "U").charAt(0).toUpperCase()}</div>
        <div class="emp-body">
          <p class="emp-name">${b.name || "Sin nombre"}</p>
          <p class="emp-desc">${b.description || "Sin descripción disponible."}</p>
          <div class="emp-productos">${tagsHTML}</div>
        </div>
        <div class="emp-meta">
          <span class="emp-categoria">${b.category || "General"}</span>
          <span class="emp-arrow">›</span>
        </div>
      </a>`;
  });
}

// ── Filtrar por categoría ──
function filtrarCategoria(categoria, btn) {
  categoriaActiva = categoria.toLowerCase();

  // Actualizar botones activos
  document.querySelectorAll(".filtro-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  aplicarFiltros();
}

// ── Buscar por texto ──
function filtrar() {
  aplicarFiltros();
}

// ── Aplicar búsqueda + categoría ──
function aplicarFiltros() {
  const texto = document.getElementById("searchInput").value.toLowerCase().trim();

  let filtrados = todosLosNegocios;

  // Filtro por categoría
  if (categoriaActiva !== "todos") {
    filtrados = filtrados.filter(b =>
      (b.category || "").toLowerCase().includes(categoriaActiva)
    );
  }

  // Filtro por texto (Evitando errores si la descripción viene null)
  if (texto) {
    filtrados = filtrados.filter(b => {
      const nombreOk = b.name ? b.name.toLowerCase().includes(texto) : false;
      const descOk = b.description ? b.description.toLowerCase().includes(texto) : false;
      return nombreOk || descOk;
    });
  }

  renderEmprendimientos(filtrados, todosLosProductos);
}

// ── Init ──
cargarEmprendimientos();