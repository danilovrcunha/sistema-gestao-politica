document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_USER = "http://localhost:8081/usuarios";

    // =================== 1. FILTRO GLOBAL (SUPER ADMIN) ===================
    // Verifica se o Super Admin escolheu um gabinete e aplica nas telas de gestão
    function aplicarFiltroGlobalSuperAdmin() {
        const role = localStorage.getItem("userRole");
        if (role !== "SUPER_ADMIN") return;

        const filtroId = localStorage.getItem("superAdminGabineteFilter");
        if (!filtroId) return;

        // Páginas que carregam dados via servidor (Thymeleaf) precisam recarregar com parametro
        const paginasServerSide = ["/kanban", "/financeiro", "/home"];
        const path = window.location.pathname;

        // Se estiver numa dessas páginas e a URL NÃO tiver o parametro, recarrega
        if (paginasServerSide.some(p => path.includes(p)) && !window.location.search.includes("gabineteId=")) {
            console.log("🔄 Aplicando filtro de gabinete salvo:", filtroId);
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('gabineteId', filtroId);
            window.location.search = urlParams.toString();
        }
    }
    aplicarFiltroGlobalSuperAdmin();

    // =================== 2. MAPA DE ROTAS X PERMISSÕES ===================
    const regrasDeAcesso = {
        "/home": "verDashboard",
        "/acoes": "verAcoes",
        "/kanban": "verKanban",
        "/financeiro": "verFinanceiro",
        "/configuracoes": "verConfiguracoes",
        "/gabinetes": "verConfiguracoes"
    };

    // =================== 3. FUNÇÃO GLOBAL: PODE EDITAR? ===================
    window.podeEditar = function(funcionalidade) {
        const role = localStorage.getItem("userRole");

        // REGRA DE OURO: Admin e Super Admin editam tudo
        if (role === "ADMIN" || role === "SUPER_ADMIN") return true;

        // User comum: verifica permissão específica
        const perms = JSON.parse(localStorage.getItem("userPerms") || "{}");
        return perms[funcionalidade] === true;
    };

    // =================== 4. INICIAR SEGURANÇA ===================
    function iniciarSeguranca() {
        const emailLocal = localStorage.getItem("userEmail");
        if (!emailLocal) return;

        fetch(`${API_BASE_USER}/me`)
            .then(res => {
                if (!res.ok) throw new Error("Falha ao buscar perfil");
                return res.json();
            })
            .then(user => {
                const perms = user.permissao || {};

                localStorage.setItem("userId", user.id);
                localStorage.setItem("userRole", user.tipoUsuario);
                localStorage.setItem("userPerms", JSON.stringify(perms));

                configurarMenuVisual(perms, user.tipoUsuario);
                verificarAcessoPaginaAtual(perms, user);

                // Avisa outros scripts que as permissões chegaram
                document.dispatchEvent(new Event("permissoesCarregadas"));
            })
            .catch(err => console.error("Erro de segurança:", err));
    }

    function configurarMenuVisual(perms, tipoUsuario) {
        const isAdmin = (tipoUsuario === "ADMIN" || tipoUsuario === "SUPER_ADMIN");

        const toggle = (id, permissaoEspecifica) => {
            const el = document.getElementById(id);
            if (el) {
                // Se for Admin, vê tudo. Se for User, obedece a permissão estritamente.
                const deveMostrar = isAdmin ? true : permissaoEspecifica;

                if (!deveMostrar) el.classList.remove("active");
                el.style.display = deveMostrar ? "block" : "none";
            }
        };

        toggle("menu-dashboard", perms.verDashboard);
        toggle("menu-acoes", perms.verAcoes);
        toggle("menu-kanban", perms.verKanban);
        toggle("menu-financeiro", perms.verFinanceiro);

        // Estrito: Se não tiver permissão "verConfiguracoes", o botão some.
        toggle("menu-config", perms.verConfiguracoes);

        // Assistente IA vinculado ao Dashboard
        toggle("assistant-toggle-btn", perms.verDashboard);
    }

    function verificarAcessoPaginaAtual(perms, user) {
        // Admins nunca são bloqueados
        if (user.tipoUsuario === "ADMIN" || user.tipoUsuario === "SUPER_ADMIN") return;

        const path = window.location.pathname;
        const regraEncontrada = Object.keys(regrasDeAcesso).find(rota => path.includes(rota));

        if (regraEncontrada) {
            const permissaoNecessaria = regrasDeAcesso[regraEncontrada];

            // Se a permissão for false, bloqueia a tela
            if (!perms[permissaoNecessaria]) {
                bloquearTela(user.nome);
            }
        }
    }

    function bloquearTela(nomeUsuario) {
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: #4d6e8d; padding: 20px;">
                    <i class="fas fa-lock" style="font-size: 4rem; color: #e74c3c; margin-bottom: 25px;"></i>
                    <h2 style="margin-bottom: 15px; font-weight: 700;">Acesso Restrito</h2>
                    <p style="font-size: 1.1em; color: #7f8c8d; max-width: 600px; line-height: 1.6;">
                        Olá, <strong>${nomeUsuario}</strong>. Você não possui permissão para visualizar este módulo.
                    </p>
                    <div style="margin-top: 30px; padding: 15px; background-color: #f8d7da; color: #721c24; border-radius: 8px; border: 1px solid #f5c6cb;">
                        Solicite a liberação ao <strong>Administrador</strong> do seu gabinete.
                    </div>
                </div>`;
        } else {
            document.body.innerHTML = "<h1 style='text-align:center; margin-top:50px;'>Acesso Negado</h1>";
        }
    }

    iniciarSeguranca();
});