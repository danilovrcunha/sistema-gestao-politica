document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_USER = "http://localhost:8081/usuarios";

    // ==================================================================
    // 1. FILTRO GLOBAL (SUPER ADMIN)
    // Recarrega a página aplicando o filtro de gabinete se necessário
    // ==================================================================
    function aplicarFiltroGlobalSuperAdmin() {
        const role = localStorage.getItem("userRole");

        // Só executa se for Super Admin
        if (role !== "SUPER_ADMIN") return;

        const filtroId = localStorage.getItem("superAdminGabineteFilter");
        if (!filtroId) return;

        // Lista de páginas que são carregadas pelo Servidor (Java/Thymeleaf)
        // e precisam do ID na URL para filtrar os dados iniciais.
        // ADICIONADO: "/criarTarefa" para filtrar o select de responsáveis
        const paginasServerSide = ["/kanban", "/financeiro", "/home", "/criarTarefa"];
        const path = window.location.pathname;

        // Se estiver em uma dessas páginas e a URL NÃO tiver o "?gabineteId=..."
        if (paginasServerSide.some(p => path.includes(p)) && !window.location.search.includes("gabineteId=")) {
            console.log("🔄 Global: Aplicando filtro de gabinete salvo:", filtroId);

            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('gabineteId', filtroId);

            // Recarrega a página com o novo parâmetro
            window.location.search = urlParams.toString();
        }
    }

    // Executa essa verificação antes de qualquer outra coisa
    aplicarFiltroGlobalSuperAdmin();


    // ==================================================================
    // 2. CONFIGURAÇÕES DE SEGURANÇA (PERMISSÕES)
    // ==================================================================

    // Mapa: Qual URL exige qual permissão de visualização
    const regrasDeAcesso = {
        "/home": "verDashboard",
        "/acoes": "verAcoes",
        "/registrarAcoes": "verAcoes", // Bloqueia acesso direto
        "/kanban": "verKanban",
        "/criarTarefa": "verKanban",   // Bloqueia acesso direto
        "/financeiro": "verFinanceiro",
        "/configuracoes": "verConfiguracoes",
        "/gabinetes": "verConfiguracoes"
    };

    // --- FUNÇÃO GLOBAL: PODE EDITAR? ---
    // Disponível para todos os outros scripts usarem (window.podeEditar)
    window.podeEditar = function(funcionalidade) {
        const role = localStorage.getItem("userRole");

        // REGRA DE OURO: Admin e Super Admin têm poder total
        if (role === "ADMIN" || role === "SUPER_ADMIN") return true;

        // User comum: verifica a permissão específica salva no navegador
        const perms = JSON.parse(localStorage.getItem("userPerms") || "{}");
        return perms[funcionalidade] === true;
    };


    // ==================================================================
    // 3. INICIALIZAÇÃO DE SEGURANÇA (LOGIN E MENU)
    // ==================================================================
    function iniciarSeguranca() {
        const emailLocal = localStorage.getItem("userEmail");

        // Se não tiver e-mail salvo, não faz nada (o Java já redireciona pro login se precisar)
        if (!emailLocal) return;

        // Busca os dados atualizados do usuário logado (/me)
        fetch(`${API_BASE_USER}/me`)
            .then(res => {
                if (!res.ok) throw new Error("Falha ao buscar perfil do usuário");
                return res.json();
            })
            .then(user => {
                const perms = user.permissao || {};

                // Atualiza o cache local com dados frescos do banco
                localStorage.setItem("userId", user.id);
                localStorage.setItem("userRole", user.tipoUsuario);
                localStorage.setItem("userPerms", JSON.stringify(perms));

                // 1. Configura a visibilidade do Menu Lateral
                configurarMenuVisual(perms, user.tipoUsuario);

                // 2. Verifica se o usuário pode ver a página atual
                verificarAcessoPaginaAtual(perms, user);

                // 3. Avisa os outros scripts (Kanban, Mapa, etc) que as permissões carregaram
                document.dispatchEvent(new Event("permissoesCarregadas"));
            })
            .catch(err => console.error("Erro no sistema de segurança global:", err));
    }

    // Função que esconde/mostra itens do menu
    function configurarMenuVisual(perms, tipoUsuario) {
        const isAdmin = (tipoUsuario === "ADMIN" || tipoUsuario === "SUPER_ADMIN");

        const toggle = (id, permissaoEspecifica) => {
            const el = document.getElementById(id);
            if (el) {
                // Se for Admin, mostra tudo. Se não, respeita a permissão.
                const deveMostrar = isAdmin ? true : permissaoEspecifica;

                if (!deveMostrar) el.classList.remove("active"); // Remove destaque se estiver oculto
                el.style.display = deveMostrar ? "block" : "none";
            }
        };

        toggle("menu-dashboard", perms.verDashboard);
        toggle("menu-acoes", perms.verAcoes);
        toggle("menu-kanban", perms.verKanban);
        toggle("menu-financeiro", perms.verFinanceiro);

        // Configurações e Gabinetes: Estrito (Geralmente false para user comum)
        toggle("menu-config", perms.verConfiguracoes);

        // Assistente IA: Vinculado ao Dashboard
        toggle("assistant-toggle-btn", perms.verDashboard);
    }

    // Função que bloqueia a tela inteira se não tiver permissão
    function verificarAcessoPaginaAtual(perms, user) {
        // Admins nunca são bloqueados
        if (user.tipoUsuario === "ADMIN" || user.tipoUsuario === "SUPER_ADMIN") return;

        const path = window.location.pathname;

        // Procura se a URL atual bate com alguma regra
        const regraEncontrada = Object.keys(regrasDeAcesso).find(rota => path.includes(rota));

        if (regraEncontrada) {
            const permissaoNecessaria = regrasDeAcesso[regraEncontrada];

            // Se a permissão for false, substitui o conteúdo da página
            if (!perms[permissaoNecessaria]) {
                bloquearTela(user.nome);
            }
        }
    }

    // Renderiza a tela de "Acesso Negado"
    function bloquearTela(nomeUsuario) {
        const mainContent = document.querySelector(".main-content");

        if (mainContent) {
            mainContent.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: #2c3e50; padding: 20px;">
                    <i class="fas fa-lock" style="font-size: 4rem; color: #e74c3c; margin-bottom: 25px;"></i>
                    <h2 style="margin-bottom: 15px; font-weight: 700;">Acesso Restrito</h2>
                    <p style="font-size: 1.1em; color: #7f8c8d; max-width: 600px; line-height: 1.6;">
                        Olá, <strong>${nomeUsuario}</strong>. Seu usuário está vinculado ao sistema, 
                        mas você não possui permissão para visualizar este módulo.
                    </p>
                    <div style="margin-top: 30px; padding: 15px; background-color: #f8d7da; color: #721c24; border-radius: 8px; border: 1px solid #f5c6cb;">
                        <i class="fas fa-exclamation-triangle"></i> 
                        Solicite a liberação ao <strong>Administrador</strong> do seu gabinete.
                    </div>
                </div>`;
        } else {
            // Fallback caso o HTML esteja diferente
            document.body.innerHTML = "<h1 style='text-align:center; margin-top:50px;'>Acesso Negado</h1>";
        }
    }


    iniciarSeguranca();
});