document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_USER = "http://localhost:8081/usuarios";

    // ==================================================================
    // 1. FILTRO GLOBAL DO SUPER ADMIN (Executa Primeiro!)
    // ==================================================================
    function verificarRedirecionamentoFiltro() {
        const role = localStorage.getItem("userRole");
        if (role !== "SUPER_ADMIN") return;

        const filtroId = localStorage.getItem("superAdminGabineteFilter");
        if (!filtroId) return;

        // Lista de páginas que precisam do ID na URL
        const paginasFiltradas = ["/kanban", "/financeiro", "/home", "/criarTarefa"];
        const path = window.location.pathname;

        // Se estou numa dessas páginas E a URL não tem o ID do filtro
        if (paginasFiltradas.some(p => path.includes(p)) && !window.location.search.includes("gabineteId=")) {
            console.log("🔄 Filtro ausente. Redirecionando com ID:", filtroId);

            // Monta nova URL mantendo outros parametros se existirem
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('gabineteId', filtroId);

            // Redireciona e para a execução
            window.location.search = urlParams.toString();
        }

        // Atualiza visualmente os links do menu para evitar recarregamentos futuros
        document.querySelectorAll('.nav-menu a').forEach(link => {
            const href = link.getAttribute('href');
            if (paginasFiltradas.some(p => href.includes(p)) && !href.includes('gabineteId=')) {
                const separador = href.includes('?') ? '&' : '?';
                link.href = `${href}${separador}gabineteId=${filtroId}`;
            }
        });
    }

    // Executa ANTES de iniciar segurança
    verificarRedirecionamentoFiltro();


    // ==================================================================
    // 2. CONFIGURAÇÃO DE SEGURANÇA E PERMISSÕES
    // ==================================================================
    const regrasDeAcesso = {
        "/home": "verDashboard",
        "/acoes": "verAcoes",
        "/registrarAcoes": "verAcoes",
        "/kanban": "verKanban",
        "/criarTarefa": "verKanban",
        "/financeiro": "verFinanceiro",
        "/configuracoes": "verConfiguracoes",
        "/gabinetes": "verConfiguracoes"
    };

    window.podeEditar = function(funcionalidade) {
        const role = localStorage.getItem("userRole");
        if (role === "ADMIN" || role === "SUPER_ADMIN") return true;
        const perms = JSON.parse(localStorage.getItem("userPerms") || "{}");
        return perms[funcionalidade] === true;
    };

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
                document.dispatchEvent(new Event("permissoesCarregadas"));

                // Chama novamente para garantir que os links estejam atualizados se o user mudou
                verificarRedirecionamentoFiltro();
            })
            .catch(err => console.error("Erro de segurança:", err));
    }

    function configurarMenuVisual(perms, tipoUsuario) {
        const isAdmin = (tipoUsuario === "ADMIN" || tipoUsuario === "SUPER_ADMIN");
        const toggle = (id, permissaoEspecifica) => {
            const el = document.getElementById(id);
            if (el) {
                const deveMostrar = isAdmin ? true : permissaoEspecifica;
                if (!deveMostrar) el.classList.remove("active");
                el.style.display = deveMostrar ? "block" : "none";
            }
        };

        toggle("menu-dashboard", perms.verDashboard);
        toggle("menu-acoes", perms.verAcoes);
        toggle("menu-kanban", perms.verKanban);
        toggle("menu-financeiro", perms.verFinanceiro);
        toggle("menu-config", perms.verConfiguracoes);
        toggle("assistant-toggle-btn", perms.verDashboard);
    }

    function verificarAcessoPaginaAtual(perms, user) {
        if (user.tipoUsuario === "ADMIN" || user.tipoUsuario === "SUPER_ADMIN") return;

        const path = window.location.pathname;
        const regraEncontrada = Object.keys(regrasDeAcesso).find(rota => path.includes(rota));

        if (regraEncontrada) {
            const permissaoNecessaria = regrasDeAcesso[regraEncontrada];
            if (!perms[permissaoNecessaria]) {
                bloquearTela(user.nome);
            }
        }
    }

    function bloquearTela(nomeUsuario) {
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: #2c3e50; padding: 20px;">
                    <i class="fas fa-lock" style="font-size: 4rem; color: #e74c3c; margin-bottom: 25px;"></i>
                    <h2 style="margin-bottom: 15px; font-weight: 700;">Acesso Restrito</h2>
                    <p style="font-size: 1.1em; color: #7f8c8d; max-width: 600px; line-height: 1.6;">
                        Olá, <strong>${nomeUsuario}</strong>. Você não possui permissão para visualizar este módulo.
                    </p>
                    <div style="margin-top: 30px; padding: 15px; background-color: #f8d7da; color: #721c24; border-radius: 8px; border: 1px solid #f5c6cb;">
                        Solicite a liberação ao <strong>Administrador</strong> do seu gabinete.
                    </div>
                </div>`;
        }
    }

    iniciarSeguranca();
});