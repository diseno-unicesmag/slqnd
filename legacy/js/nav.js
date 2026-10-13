/* nav.js — Modal de acceso al Aplicativo CDPS */
(function () {
  const PASS = 'sobreloquenodigо';

  const MODAL = `
<div id="nav-pwd-modal" style="display:none;position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.8);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);justify-content:center;align-items:center;">
  <div style="background:linear-gradient(145deg,rgba(12,12,32,.98),rgba(18,18,42,.98));border:1px solid rgba(245,197,66,.22);border-radius:24px;padding:48px 40px;max-width:400px;width:92%;text-align:center;position:relative;box-shadow:0 24px 64px rgba(0,0,0,.6);">
    <button onclick="closeNavModal()" style="position:absolute;top:14px;right:18px;background:none;border:none;color:rgba(255,255,255,.35);font-size:24px;cursor:pointer;line-height:1;transition:.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,.35)'">×</button>
    <div style="font-size:2.4rem;margin-bottom:14px;">🔐</div>
    <h2 style="font-family:'Outfit',sans-serif;font-size:1.35rem;font-weight:700;color:#fff;margin-bottom:6px;letter-spacing:-.01em;">Acceso restringido</h2>
    <p style="color:rgba(255,255,255,.45);font-size:.85rem;margin-bottom:26px;line-height:1.5;">Ingresa la contraseña para acceder<br>al aplicativo CDPS</p>
    <input id="nav-pwd-input" type="password" placeholder="Contraseña..."
      style="width:100%;padding:12px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:#fff;font-size:1rem;font-family:inherit;outline:none;margin-bottom:10px;text-align:center;transition:.2s;"
      onfocus="this.style.borderColor='rgba(245,197,66,.5)'" onblur="this.style.borderColor='rgba(255,255,255,.12)'"
      onkeydown="if(event.key==='Enter')checkNavPassword()">
    <p id="nav-pwd-error" style="display:none;color:#ef4444;font-size:.8rem;margin-bottom:10px;">✖ Contraseña incorrecta</p>
    <button onclick="checkNavPassword()" style="width:100%;padding:12px;border-radius:10px;background:#f5c542;color:#08081a;font-weight:700;font-size:.95rem;border:none;cursor:pointer;margin-bottom:22px;font-family:inherit;transition:.2s;" onmouseover="this.style.background='#e8b820'" onmouseout="this.style.background='#f5c542'">Acceder</button>
    <div id="nav-app-options" style="display:none;flex-direction:column;gap:9px;">
      <a id="nav-lnk-jugador" href="#" style="display:flex;align-items:center;gap:12px;padding:11px 16px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:#fff;text-decoration:none;transition:.2s;" onmouseover="this.style.background='rgba(245,197,66,.1)';this.style.borderColor='rgba(245,197,66,.3)'" onmouseout="this.style.background='rgba(255,255,255,.05)';this.style.borderColor='rgba(255,255,255,.08)'">
        <span style="font-size:1.3rem;">🎮</span>
        <div style="text-align:left"><div style="font-weight:600;font-size:.9rem;">Usuario</div><div style="font-size:.73rem;color:rgba(255,255,255,.5);">Vista del participante</div></div>
      </a>
      <a id="nav-lnk-visualizador" href="#" style="display:flex;align-items:center;gap:12px;padding:11px 16px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:#fff;text-decoration:none;transition:.2s;" onmouseover="this.style.background='rgba(245,197,66,.1)';this.style.borderColor='rgba(245,197,66,.3)'" onmouseout="this.style.background='rgba(255,255,255,.05)';this.style.borderColor='rgba(255,255,255,.08)'">
        <span style="font-size:1.3rem;">📽️</span>
        <div style="text-align:left"><div style="font-weight:600;font-size:.9rem;">Visualizador</div><div style="font-size:.73rem;color:rgba(255,255,255,.5);">Proyección en sala</div></div>
      </a>
      <a id="nav-lnk-admin" href="#" style="display:flex;align-items:center;gap:12px;padding:11px 16px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:#fff;text-decoration:none;transition:.2s;" onmouseover="this.style.background='rgba(245,197,66,.1)';this.style.borderColor='rgba(245,197,66,.3)'" onmouseout="this.style.background='rgba(255,255,255,.05)';this.style.borderColor='rgba(255,255,255,.08)'">
        <span style="font-size:1.3rem;">⚙️</span>
        <div style="text-align:left"><div style="font-weight:600;font-size:.9rem;">Panel</div><div style="font-size:.73rem;color:rgba(255,255,255,.5);">Panel del investigador</div></div>
      </a>
    </div>
  </div>
</div>`;

  document.addEventListener('DOMContentLoaded', function () {
    document.body.insertAdjacentHTML('beforeend', MODAL);
    document.getElementById('nav-pwd-modal').addEventListener('click', function (e) {
      if (e.target === this) closeNavModal();
    });
  });

  window._navBase = '';

  window.openApplicativo = function (basePath) {
    window._navBase = basePath;
    const modal = document.getElementById('nav-pwd-modal');
    modal.style.display = 'flex';
    const inp = document.getElementById('nav-pwd-input');
    inp.value = '';
    inp.style.borderColor = 'rgba(255,255,255,.12)';
    document.getElementById('nav-pwd-error').style.display = 'none';
    document.getElementById('nav-app-options').style.display = 'none';
    setTimeout(() => inp.focus(), 120);
  };

  window.closeNavModal = function () {
    document.getElementById('nav-pwd-modal').style.display = 'none';
  };

  window.checkNavPassword = function () {
    const inp = document.getElementById('nav-pwd-input');
    if (inp.value === PASS) {
      const b = window._navBase;
      document.getElementById('nav-lnk-jugador').href = b + 'index.html';
      document.getElementById('nav-lnk-visualizador').href = b + 'viewer.html';
      document.getElementById('nav-lnk-admin').href = b + 'panel.html';
      document.getElementById('nav-pwd-error').style.display = 'none';
      document.getElementById('nav-app-options').style.display = 'flex';
    } else {
      document.getElementById('nav-pwd-error').style.display = 'block';
      inp.style.borderColor = '#ef4444';
      setTimeout(() => { inp.style.borderColor = 'rgba(255,255,255,.12)'; }, 1400);
    }
  };
})();
