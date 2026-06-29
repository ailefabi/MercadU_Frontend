const BUSINESS_API = "https://mercadu.onrender.com/api/business";
const PRODUCT_API = "https://mercadu.onrender.com/api/product";
const USER_API = "https://mercadu.onrender.com/api/user"

const businessForm = document.getElementById("businessForm");
const productForm = document.getElementById("productForm");
const reviewForm = document.getElementById("reviewForm");

const message = document.getElementById("message");

// Variables de business
const productGrid = document.getElementById("product-grid");

document.addEventListener("DOMContentLoaded", () => {
    loadFeaturedProducts();
});

async function loadFeaturedProducts() {
    try {
        const response = await fetch(PRODUCT_API);
        
        if (!response.ok) {
            throw new Error("Error al obtener los productos del servidor");
        }

        const products = await response.json();
        productGrid.innerHTML = "";

        if (products.length === 0) {
            productGrid.innerHTML = `<p class="no-products">No hay productos disponibles en este momento.</p>`;
            return;
        }

        products.forEach(product => {
            // Creamos el enlace
            const productCard = document.createElement("a");
            productCard.className = "product-card";
            
            // Forzamos la URL correcta (idProduct viene de tu DTO de Java)
            const productoId = product.idProduct;
            productCard.href = `product.html?id=${productoId}`;

            // Formateador de moneda de Costa Rica
            const formattedPrice = new Intl.NumberFormat('es-CR', {
                style: 'currency',
                currency: 'CRC',
                minimumFractionDigits: 0
            }).format(product.price);

            // Estructura interna de la tarjeta
            productCard.innerHTML = `
                <div class="product-body">
                    <p class="product-name">${product.name}</p>
                    <p class="product-desc">${product.description}</p>
                </div>
                <div class="product-meta">
                    <span class="product-price">${formattedPrice}</span>
                    <span class="product-arrow">›</span>
                </div>
            `;

            // RESPALDO: Si por alguna razón el CSS bloquea el enlace <a>, 
            // este evento detecta el click en cualquier parte de la tarjeta y fuerza la redirección.
            productCard.addEventListener('click', (e) => {
                // Si el usuario no hizo click medio para abrir en pestaña nueva, redirigimos acá
                if (e.button === 0) { 
                    e.preventDefault();
                    window.location.href = `product.html?id=${productoId}`;
                }
            });

            productGrid.appendChild(productCard);
        });

    } catch (error) {
        console.error("Error al cargar productos:", error);
        productGrid.innerHTML = `<p class="error-message">Hubo un problema al cargar los productos.</p>`;
    }
}
