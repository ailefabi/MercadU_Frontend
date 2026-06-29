const API_BUSINESS = "https://mercadu.onrender.com/api/business";
const API_PRODUCT  = "https://mercadu.onrender.com/api/product";

let currentUser   = null;
let userBusiness  = null; // Se recuperará estrictamente del Back-end

// ── Init ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const raw = localStorage.getItem("userSession");

  if (!raw) {
    document.getElementById("noSession").style.display    = "block";
    document.getElementById("withSession").style.display  = "none";
    return;
  }

  currentUser = JSON.parse(raw);   
  document.getElementById("noSession").style.display   = "none";
  document.getElementById("withSession").style.display = "block";

  // Perfil del Usuario
  const firstName = (currentUser.name || currentUser.emailUcr || "?").split(" ")[0];
  const initial   = firstName.charAt(0).toUpperCase();

  document.getElementById("profileAvatarBig").textContent = initial;
  document.getElementById("profileName").textContent      = currentUser.name     || "Sin nombre";
  document.getElementById("profileEmail").textContent     = currentUser.emailUcr || "–";
  document.getElementById("profileRol").textContent       = currentUser.rol      || "ESTUDIANTE";

  // IMPORTANTE: Siempre consultamos al Backend la información real
  recuperarNegocioDelServidor();
});

// ── Obtener negocio real desde la Base de Datos ────────────────
async function recuperarNegocioDelServidor() {
  const contenido = document.getElementById("businessContent");
  contenido.innerHTML = '<p style="color:#aaa;font-size:14px;padding:16px">Buscando tu emprendimiento en el servidor...</p>';

  try {
    const res = await fetch(API_BUSINESS);
    if (!res.ok) throw new Error();

    const todosLosNegocios = await res.json();
    // Filtramos para verificar si el usuario logueado posee un negocio activo registrado
    const miNegocio = todosLosNegocios.find(b => b.ownerId === currentUser.id);

    if (miNegocio) {
      userBusiness = miNegocio;
    } else {
      userBusiness = null; 
    }
    renderBusinessBlock();
  } catch (error) {
    console.error("Error al sincronizar con el backend:", error);
    userBusiness = null;
    renderBusinessBlock();
  }
}

// ── Renderizar bloque emprendimiento ─────────────────────────
function renderBusinessBlock() {
  const contenido = document.getElementById("businessContent");

  if (!userBusiness) {
    contenido.innerHTML = `
      <div class="business-empty">
        <div class="empty-icon">🌱</div>
        <h3>Todavía no tenés un emprendimiento</h3>
        <p>Creá tu emprendimiento para poder publicar productos y que toda la comunidad universitaria te encuentre.</p>
        <button class="btn-dark" onclick="abrirModal('modalBusiness')" style="margin-top:8px">
          Crear mi emprendimiento
        </button>
      </div>`;

    document.getElementById("productsBlock").style.display = "none";
    return;
  }

  // Tiene emprendimiento en el Back-end: mostramos info y controles de edición/borrado
  const initial = (userBusiness.name || "?").charAt(0).toUpperCase();
  contenido.innerHTML = `
    <div class="business-info-card" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
      <div style="display: flex; gap: 16px; align-items: center;">
        <div class="business-icon">${initial}</div>
        <div class="business-info">
          <h3>${userBusiness.name}</h3>
          <p>${userBusiness.description || "Sin descripción"}</p>
          <span class="business-categoria">${userBusiness.category || "General"}</span>
        </div>
      </div>
      <div class="business-actions" style="display: flex; gap: 10px; flex-direction: column;">
        <button class="btn-secondary" onclick="prepararEdicion()" style="padding: 6px 12px; font-size: 13px;">✏️ Editar</button>
        <button class="btn-secondary" onclick="eliminarEmprendimiento()" style="padding: 6px 12px; font-size: 13px; color: #ff6b6b; border-color: #ff6b6b;">🗑️ Eliminar</button>
      </div>
    </div>`;

  document.getElementById("productsBlock").style.display = "block";
  cargarProductosUsuario();
}

// ── Cargar productos vinculados ──────────────────────────────
async function cargarProductosUsuario() {
  const grid = document.getElementById("profileProductGrid");
  grid.innerHTML = '<p style="color:#aaa;font-size:14px">Cargando tus productos...</p>';

  try {
    const res = await fetch(`${API_PRODUCT}/business/${userBusiness.id}`);
    if (!res.ok) throw new Error();

    const productos = await res.json();

    if (productos.length === 0) {
      mostrarProductosVacios(grid);
      return;
    }

    grid.innerHTML = productos.map(p => `
      <div class="product-card">
        <div class="product-body">
          <p class="product-name">${p.name}</p>
          <p class="product-desc">${p.description || ""}</p>
        </div>
        <div class="product-meta">
          <span class="product-price">₡${Number(p.price).toLocaleString("es-CR")} <small>c/u</small></span>
          <span style="font-size:11px;color:${p.available ? 'var(--green-mid)' : '#aaa'}">
            ${p.available ? "● Disponible" : "● No disponible"}
          </span>
        </div>
      </div>`
    ).join("");

  } catch (error) {
    grid.innerHTML = `<div style="color:#e88;font-size:13px;padding:16px">No se pudieron cargar los productos.</div>`;
  }
}

function mostrarProductosVacios(grid) {
  grid.innerHTML = `
    <div class="product-card empty-card" style="cursor:default;border:2px dashed #ddd">
      <div class="product-body">
        <p class="product-name" style="color:#aaa">Aún no tenés productos publicados</p>
        <p class="product-desc">Usá el botón "+ Agregar producto" para publicar tu primer producto</p>
      </div>
    </div>`;
}

// ── Acciones: Crear Emprendimiento ─────────────────────────────
async function crearEmprendimiento() {
  const name     = document.getElementById("bName").value.trim();
  const desc     = document.getElementById("bDesc").value.trim();
  const category = document.getElementById("bCategory").value;
  const msg      = document.getElementById("businessMsg");

  if (!name || !category || !desc) {
    showModalMsg(msg, "Completá todos los campos obligatorios.", "error");
    return;
  }

  const payload = { name, description: desc, category, ownerId: currentUser.id };

  try {
    const res = await fetch(`${API_BUSINESS}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      showModalMsg(msg, errorText || "Error al procesar la solicitud.", "error");
      return;
    }

    showModalMsg(msg, "¡Emprendimiento creado con éxito!", "success");
    setTimeout(() => {
      cerrarModal("modalBusiness");
      recuperarNegocioDelServidor(); // Recarga directamente de la BD
    }, 1000);

  } catch {
    showModalMsg(msg, "Error de red con el servidor.", "error");
  }
}

// ── Acciones: EDITAR Emprendimiento (PUT) ─────────────────────
function prepararEdicion() {
  // Rellenamos el modal con los datos actuales almacenados en la BD
  document.getElementById("editBName").value = userBusiness.name;
  document.getElementById("editBDesc").value = userBusiness.description || "";
  document.getElementById("editBCategory").value = userBusiness.category ? userBusiness.category.toLowerCase() : "general";
  abrirModal("modalEditBusiness");
}

async function actualizarEmprendimiento() {
  const name = document.getElementById("editBName").value.trim();
  const desc = document.getElementById("editBDesc").value.trim();
  const category = document.getElementById("editBCategory").value;
  const msg = document.getElementById("editBusinessMsg");

  if (!name || !desc) {
    showModalMsg(msg, "El nombre y la descripción no pueden quedar vacíos.", "error");
    return;
  }

  const payload = { name, description: desc, category, ownerId: currentUser.id };

  try {
    // LLamamos al @PutMapping("/{id}") de tu BusinessController
    const res = await fetch(`${API_BUSINESS}/${userBusiness.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error();

    showModalMsg(msg, "¡Emprendimiento actualizado!", "success");
    setTimeout(() => {
      cerrarModal("modalEditBusiness");
      recuperarNegocioDelServidor(); // Refrescamos vista
    }, 1000);

  } catch {
    showModalMsg(msg, "No se pudo actualizar el emprendimiento.", "error");
  }
}

// ── Acciones: ELIMINAR Emprendimiento (DELETE) ──────────────────
async function eliminarEmprendimiento() {
  const seguro = confirm(`¿Estás completamente seguro de que deseas eliminar "${userBusiness.name}"? Esta acción borrará permanentemente el negocio del mapa universitario.`);
  if (!seguro) return;

  try {
    // Llamamos al @DeleteMapping("/{id}") de tu BusinessController
    const res = await fetch(`${API_BUSINESS}/${userBusiness.id}`, {
      method: "DELETE"
    });

    if (!res.ok) throw new Error();

    alert("Emprendimiento eliminado correctamente.");
    recuperarNegocioDelServidor(); // Volverá a pintar el bloque vacío con la opción de crear uno nuevo

  } catch {
    alert("Hubo un problema al intentar eliminar el emprendimiento.");
  }
}

// ── Publicar producto ─────────────────────────────────────────
async function publicarProducto() {
  const name  = document.getElementById("pName").value.trim();
  const desc  = document.getElementById("pDesc").value.trim();
  const price = parseInt(document.getElementById("pPrice").value, 10);
  const msg   = document.getElementById("productMsg");

  if (!name || !desc || !price || price < 0) { 
    showModalMsg(msg, "Completá los campos con valores válidos.", "error"); 
    return; 
  }

  const payload = { name, description: desc, price, available: true, businessId: userBusiness.id };

  try {
    const res = await fetch(API_PRODUCT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error();

    showModalMsg(msg, "¡Producto publicado!", "success");
    ["pName","pDesc","pPrice"].forEach(id => document.getElementById(id).value = "");
    setTimeout(() => {
      cerrarModal("modalProduct");
      cargarProductosUsuario();
    }, 900);

  } catch {
    showModalMsg(msg, "Error al publicar el producto.", "error");
  }
}

// ── Helpers modales ───────────────────────────────────────────
function abrirModal(id) { document.getElementById(id).style.display = "flex"; }
function cerrarModal(id) {
  document.getElementById(id).style.display = "none";
  document.querySelectorAll(".form-msg").forEach(el => { el.textContent = ""; el.className = "form-msg"; });
}
function abrirModalProducto() { abrirModal("modalProduct"); }

document.addEventListener("click", (e) => {
  ["modalBusiness", "modalEditBusiness", "modalProduct"].forEach(id => {
    const overlay = document.getElementById(id);
    if (overlay && e.target === overlay) cerrarModal(id);
  });
});

function showModalMsg(el, text, type) {
  el.textContent = text;
  el.className   = "form-msg " + type;
}