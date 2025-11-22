document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_USER = "http://localhost:8081/usuarios";

    // =================== 1. MAPA DE ROTAS X PERMISSÕES ===================
    // Aqui definimos qual permissão é necessária para ver cada página (URL)
    const regrasDeAcesso = {
        "/home": "verDashboard",
        "/acoes": "verAcoes",
        "/kanban": "verKanban",
        "/financeiro": "verFinanceiro",
        "/configuracoes": "verConfiguracoes",
        "/gabinetes": "verConfiguracoes" // Super Admin geralmente tem essa
    };

    // =================== 2. APLICAR PERMISSÕES GLOBALMENTE ===================
    function iniciarSeguranca() {
        const emailLocal = localStorage.getItem("userEmail");

        // Se não tem usuário logado, deixa o Spring Security cuidar (ou redireciona pro login)
        if (!emailLocal) return;

        fetch(`${API_BASE_USER}/me`)
            .then(res => {
                if (!res.ok) throw new Error("Falha ao buscar perfil");
                return res.json();
            })
            .then(user => {
                // 1. Salva dados atualizados
                const perms = user.permissao || {};
                localStorage.setItem("userId", user.id);
                localStorage.setItem("userPerms", JSON.stringify(perms));

                // 2. Configura o Menu Lateral (Esconde botões)
                configurarMenuVisual(perms);

                // 3. VERIFICA A PÁGINA ATUAL (Bloqueio de Conteúdo)
                verificarAcessoPaginaAtual(perms, user);
            })
            .catch(err => {
                console.error("Erro de segurança:", err);
                // Opcional: forçar logout se der erro de validação
                // window.location.href = "/login/login.html";
            });
    }

    // Esconde os links do menu lateral
    function configurarMenuVisual(perms) {
        const toggle = (id, podeVer) => {
            const el = document.getElementById(id);
            if (el) {
                if (!podeVer) el.classList.remove("active");
                el.style.display = podeVer ? "block" : "none";
            }
        };

        toggle("menu-dashboard", perms.verDashboard);
        toggle("menu-acoes", perms.verAcoes);
        toggle("menu-kanban", perms.verKanban);
        toggle("menu-financeiro", perms.verFinanceiro);
        toggle("menu-config", perms.verConfiguracoes || true); // Config sempre visível para troca de senha
    }

    // Bloqueia a tela se o usuário estiver onde não deve
    function verificarAcessoPaginaAtual(perms, user) {
        const path = window.location.pathname; // Ex: "/home" ou "/financeiro"

        // Verifica se a página atual requer alguma permissão especial
        // Usamos 'Object.keys' para ver se a URL atual contém alguma das chaves do nosso mapa
        const regraEncontrada = Object.keys(regrasDeAcesso).find(rota => path.includes(rota));

        if (regraEncontrada) {
            const permissaoNecessaria = regrasDeAcesso[regraEncontrada];

            // Se a permissão for FALSE ou Indefinida
            if (!perms[permissaoNecessaria]) {
                bloquearTela(user.nome);
            }
        }
    }

    // Substitui o conteúdo da página por uma mensagem de bloqueio
    function bloquearTela(nomeUsuario) {
        console.warn("⛔ Acesso bloqueado para esta rota.");

        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; color: #2c3e50;">
                    <i class="fas fa-lock" style="font-size: 4rem; color: #e74c3c; margin-bottom: 20px;"></i>
                    <h2 style="margin-bottom: 10px; color: #7f8c8d">Acesso Restrito</h2>
                    <p style="font-size: 1.1em; color: #7f8c8d; max-width: 500px;">
                        Olá, <strong>${nomeUsuario}</strong>. Seu usuário está vinculado ao gabinete, mas você ainda não possui permissão para visualizar este módulo.
                    </p>
                    <p style="margin-top: 20px; font-size: 0.9em; color: #95a5a6;">
                        Solicite a liberação ao Administrador do seu gabinete.
                    </p>
                </div>
            `;
        } else {
            // Caso extremo: remove o body todo
            document.body.innerHTML = "<h1 style='text-align:center; margin-top:50px;'>Acesso Negado</h1>";
        }
    }

    // Inicia o processo
    iniciarSeguranca();
});