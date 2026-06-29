const API_BUSINESS = "https://mercadu.onrender.com/api/business";
const API_PRODUCT   = "https://mercadu.onrender.com/api/product";

// Capturar el ID pasado desde la lista completa (?id=X)
const params = new URLSearchParams(window.location.search);
const businessId = params.get("id");

document.addEventListener("DOMContentLoaded", () => {
    if (!businessId) {
        document.body.innerHTML = `<h2 style="text-align:center; margin-top:50px;">Error: No se especificó un emprendimiento válido.</h2>`;
        return;
    }
    cargarDetalleEmprendimiento();
});

async function cargarDetalleEmprendimiento() {
    try {
        // 1. Obtener la info del negocio
        const resBusiness = await fetch(`${API_BUSINESS}/${businessId}`);
        if (!resBusiness.ok) throw new Error("No se pudo obtener el detalle del negocio");
        const business = await resBusiness.json();

        document.getElementById("businessTitle").textContent = business.name || "Sin nombre";
        document.getElementById("businessDesc").textContent = business.description || "Sin descripción disponible.";
        document.getElementById("businessCat").textContent = business.category || "General";
        document.title = `MercadU – ${business.name || "Emprendimiento"}`;

        // 2. Obtener los productos llamando a tu endpoint exacto: /api/product/business/{businessId}
        const resProducts = await fetch(`${API_PRODUCT}/business/${businessId}`); 
        const gridProductos = document.getElementById("businessProductsGrid");
        
        if (!gridProductos) return;
        gridProductos.innerHTML = "";

        if (!resProducts.ok) {
            gridProductos.innerHTML = `<p style="color:#aaa; grid-column: 1/-1;">Este emprendimiento aún no tiene productos publicados.</p>`;
            return;
        }

        const productos = await resProducts.json();

        if (!productos || productos.length === 0) {
            gridProductos.innerHTML = `<p style="color:#aaa; grid-column: 1/-1;">Este emprendimiento aún no tiene productos publicados.</p>`;
            return;
        }

        // Renderizar las tarjetas mapeando tu ProductResponseDTO
        productos.forEach(p => {
            const productId = p.idProduct; // Mapea con tu 'idProduct' de Java
            const precioSeguro = p.price != null ? p.price : 0;

            const formattedPrice = new Intl.NumberFormat('es-CR', {
                style: 'currency', 
                currency: 'CRC', 
                minimumFractionDigits: 0
            }).format(precioSeguro);

            gridProductos.innerHTML += `
                <a href="product.html?id=${productId}" class="product-card" style="text-decoration: none; color: inherit;">
                    <div class="product-body">
                        <p class="product-name">${p.name || "Producto sin nombre"}</p>
                        <p class="product-desc">${p.description || "Sin descripción disponible."}</p>
                    </div>
                    <div class="product-meta">
                        <span class="product-price">${formattedPrice}</span>
                    </div>
                </a>`;
        });

    } catch (err) {
        console.error("Error crítico en el front:", err);
        const gridProductos = document.getElementById("businessProductsGrid");
        if (gridProductos) {
            gridProductos.innerHTML = `<p style="color:#e88; grid-column: 1/-1;">Error al conectar con el servidor. Asegurate de que el backend esté corriendo.</p>`;
        }
    }
}