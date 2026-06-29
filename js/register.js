const USER_API = "https://mercadu.onrender.com/api/auth";

const userForm = document.getElementById("userForm");
const userNameInput = document.getElementById("userName");
const userEmailInput = document.getElementById("userEmail");
const userPasswordInput = document.getElementById("userPassword");
const userRolInput = document.getElementById("userRol");
const message = document.getElementById("message");

userForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const userData = {
        name: userNameInput.value.trim(),
        emailUcr: userEmailInput.value.trim(), 
        password: userPasswordInput.value.trim(),
        rol: userRolInput.value
    };

    try {
        const response = await fetch(`${USER_API}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            showMessage(errorText); 
            return;
        }

        showMessage("Usuario registrado correctamente. Redirigiendo...");
        
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1500);

    } catch (error) {
        showMessage("Error al conectar con el servidor de registro.");
    }
});

function showMessage(text) {
    if (message) {
        message.textContent = text;
    }
}