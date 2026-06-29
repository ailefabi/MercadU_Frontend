const API_PRODUCT = "https://mercadu.onrender.com/api/product";
const API_REVIEW  = "https://mercadu.onrender.com/api/review";

// Extraer el ID del producto desde la URL (?id=X)
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

let selectedStars = 0;
let productBusinessId = null; // Mantiene la referencia para amarrar las reseñas

// Ejecutar cargas cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
    if (!productId) {
        document.body.innerHTML = `<h2 style="text-align:center; margin-top:50px;">Error: No se especificó un ID de producto válido.</h2>`;
        return;
    }
    cargarProducto();
});

// ── Cargar detalle del producto ──
async function cargarProducto() {
    try {
        const response = await fetch(`${API_PRODUCT}/${productId}`);
        
        if (!response.ok) {
            throw new Error("Producto no encontrado");
        }

        const product = await response.json();
        
        // CORRECCIÓN CLAVE: Extraemos el ID del negocio asignado a este producto
        productBusinessId = product.businessId; 

        // Formateador para la moneda de Costa Rica (₡)
        const formattedPrice = new Intl.NumberFormat('es-CR', {
            style: 'currency',
            currency: 'CRC',
            minimumFractionDigits: 0
        }).format(product.price);

        // Mapear los datos del ProductResponseDTO al HTML existente
        document.querySelector(".detail-name").textContent = product.name || "–";
        document.querySelector(".detail-seller").textContent = `Disponible en MercadU`;
        document.querySelector(".detail-vendedor").textContent = `Estudiante Emprendedor`; 
        document.querySelector(".detail-desc").textContent = product.description || "Sin descripción disponible.";
        document.querySelector(".detail-price").innerHTML = `${formattedPrice} <small>c/u</small>`;
        
        // Estado de disponibilidad
        const statusText = product.available ? "Disponible" : "No disponible";
        document.querySelector(".detail-categoria").textContent = statusText;

        // Cambiar dinámicamente el título de la pestaña del navegador
        document.title = `MercadU – ${product.name || "Producto"}`;

        // Pasamos a cargar las reseñas ahora que conocemos su "productBusinessId"
        cargarResenas();

    } catch (err) {
        console.error("Error al cargar producto:", err);
        document.querySelector(".product-page").innerHTML = `<p class="error-message">El producto solicitado no existe o no se pudo cargar.</p>`;
    }
}

// ── Cargar reseñas asociadas ──
async function cargarResenas() {
    if (!productBusinessId) return;

    try {
        // Sincronizado con las rutas reales de tu ReviewController utilizando tu lógica Promise.all
        const [resenas, promedio] = await Promise.all([
            fetch(`${API_REVIEW}/business/${productBusinessId}`).then(r => r.ok ? r.json() : []),
            fetch(`${API_REVIEW}/business/${productBusinessId}/avg`).then(r => r.ok ? r.json() : 0)
        ]);

        const avg = typeof promedio === 'number' ? promedio : parseFloat(promedio) || 0;
        document.getElementById("bigAvg").textContent     = avg.toFixed(1);
        document.getElementById("ratingAvg").textContent  = avg.toFixed(1);
        document.getElementById("ratingCount").textContent = `(${resenas.length} reseña${resenas.length !== 1 ? "s" : ""})`;

        renderStars(document.getElementById("starsDisplay"), avg, 18);
        renderStars(document.getElementById("starsDisplayBig"), avg, 22);

        // Distribución en las barras (counts)
        const counts = [0, 0, 0, 0, 0];
        resenas.forEach(r => { 
            if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++; 
        });

        document.getElementById("barChart").innerHTML = [5, 4, 3, 2, 1].map(n => {
            const pct = resenas.length ? Math.round((counts[n - 1] / resenas.length) * 100) : 0;
            return `<div class="bar-row">
                <span style="width:12px;text-align:right">${n}</span>
                <span style="font-size:14px;color:#ffc107">★</span>
                <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                <span>${pct}%</span>
            </div>`;
        }).join("");

        const grid = document.getElementById("reviewsGrid");
        if (resenas.length === 0) {
            grid.innerHTML = '<p style="color:#aaa;font-size:14px;grid-column:1/-1">Todavía no hay reseñas para este emprendimiento. ¡Sé el primero!</p>';
            return;
        }

        // Renderizado mapeando las propiedades del DTO
        grid.innerHTML = resenas.map(r => {
            const fechaOriginal = r.publicationDate ? new Date(r.publicationDate) : new Date();
            const fecha = fechaOriginal.toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });
            
            const starsHTML = Array.from({ length: 5 }, (_, i) =>
                `<span class="star ${i < r.rating ? "filled" : ""}" style="font-size:15px">★</span>`
            ).join("");

            return `<div class="review-card">
                <div class="review-header">
                    <span class="reviewer-name">Usuario #${r.userId || r.idReview}</span>
                    <span class="review-date">${fecha}</span>
                </div>
                <div class="review-stars">${starsHTML}</div>
                <p class="review-text">${escapeHtml(r.comment)}</p>
            </div>`;
        }).join("");

    } catch (err) {
        console.error("Error al cargar reseñas:", err);
        document.getElementById("reviewsGrid").innerHTML =
            '<p style="color:#e88;font-size:13px;grid-column:1/-1">No se pudo conectar con el servidor para cargar las reseñas.</p>';
    }
}

// ── Renderizar estrellas gráficamente ──
function renderStars(container, avg, size = 20) {
    if (!container) return;
    container.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
        const s = document.createElement("span");
        s.className = "star";
        s.style.fontSize = size + "px";
        s.textContent = "★";
        if (i <= Math.floor(avg)) s.classList.add("filled");
        else if (i - avg < 1 && avg % 1 >= 0.5) s.classList.add("half");
        container.appendChild(s);
    }
}

// ── Picker interactivo de estrellas ──
function setStars(val) {
    selectedStars = val;
    document.querySelectorAll(".star-btn").forEach(b => {
        b.classList.toggle("selected", parseInt(b.dataset.val) <= val);
    });
}

// ── Contador dinámico de caracteres ──
function updateChar() {
    document.getElementById("charCount").textContent = document.getElementById("comentario").value.length;
}

// ── Enviar nueva reseña al backend ──
async function enviarResena() {
    const comentario = document.getElementById("comentario").value.trim();
    if (selectedStars === 0) { showMsg("Por favor seleccioná una calificación.", "error"); return; }
    if (comentario.length < 5) { showMsg("El comentario debe tener al menos 5 caracteres.", "error"); return; }

    // CORRECCIÓN: Extraemos el usuario logueado en la sesión de MercadU
    const sessionRaw = localStorage.getItem("userSession");
    if (!sessionRaw) {
        showMsg("Debes iniciar sesión primero para dejar una reseña.", "error");
        return;
    }
    const user = JSON.parse(sessionRaw);

    // CORRECCIÓN ESTRUCTURAL: Mapea exactamente con tu ReviewRequestDTO de Java
    const payload = {
        rating: selectedStars,
        comment: comentario,
        businessId: productBusinessId, // Asociado al negocio del producto
        userId: user.id               // Asociado al estudiante logueado
    };

    try {
        const res = await fetch(API_REVIEW, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showMsg("¡Reseña publicada! Gracias por tu opinión", "success");
            document.getElementById("comentario").value = "";
            document.getElementById("charCount").textContent = "0";
            setStars(0);
            cargarResenas(); // Recarga y actualiza barras/promedio en caliente
        } else {
            showMsg("Error al guardar: " + await res.text(), "error");
        }
    } catch (err) {
        showMsg("No se pudo conectar con el servidor.", "error");
    }
}

function showMsg(txt, type) {
    const el = document.getElementById("formMsg");
    if (!el) return;
    el.textContent = txt;
    el.className = "form-msg " + type;
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}