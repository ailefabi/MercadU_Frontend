const USER_API = "https://mercadu.onrender.com/api/auth";

const loginForm = document.getElementById("loginForm");
const userEmailInput = document.getElementById("userEmail");
const userPasswordInput = document.getElementById("userPassword");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const loginData = {
        email: userEmailInput.value.trim(),
        password: userPasswordInput.value.trim()
    };

    try {
        const response = await fetch(`${USER_API}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        });

        if (!response.ok) {
            // El backend responde con un String plano "Credenciales incorrectas" en caso de error (401)
            const errorText = await response.text();
            showMessage(errorText, "error"); 
            return;
        }

        const userData = await response.json(); 
        
        // Guardamos en el navegador que el usuario inició sesión con éxito
        localStorage.setItem("isLoggedIn", "true");
        // Nota: Las propiedades dentro de userData vendrán según lo que dicte tu AuthService de Login (ej: emailUcr, name, rol, id)
        localStorage.setItem("userSession", JSON.stringify(userData));

        showMessage("¡Sesión iniciada con éxito! Redirigiendo...", "success");

        // Te tira al home
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000); 

    } catch (error) {
        showMessage("Error al conectar con el servidor :c", "error");
    }
});

function showMessage(text, type) {
    if (message) {
        message.textContent = text;
        // Limpiamos clases previas por si tenías estilos específicos de error/éxito
        message.className = ""; 
        if (type === "error") {
            message.style.color = "#e88"; // O una variable CSS de tu proyecto
        } else if (type === "success") {
            message.style.color = "var(--green-mid, #2e7d32)";
        }
    }
}