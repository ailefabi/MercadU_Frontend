(function () {
  const zone = document.getElementById("navAuthZone");
  if (!zone) return;

  const raw  = localStorage.getItem("userSession");
  const user = raw ? JSON.parse(raw) : null;

  if (user) {
    // Primer nombre para el avatar
    const firstName = (user.name || user.email || "?").split(" ")[0];
    const initial   = firstName.charAt(0).toUpperCase();

    zone.innerHTML = `
      <div class="user-menu" tabindex="0">
        <div class="user-avatar">${initial}</div>
        <span class="user-name">${firstName}</span>
        <div class="dropdown">
          <a href="/html/profile.html"> Mi perfil</a>
          <a href="/html/profile.html#mis-productos"> Mis productos</a>
          <hr class="dropdown-divider" />
          <a href="#" class="danger" id="logoutBtn"> Cerrar sesión</a>
        </div>
      </div>`;

    document.getElementById("logoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userSession");
      window.location.reload();
    });

  } else {
    zone.innerHTML = `
      <div class="nav-actions">
        <button onclick="window.location.href='/html/login.html'">Iniciar sesión</button>
      </div>`;
  }
})();