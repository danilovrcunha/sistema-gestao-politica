document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://localhost:8081/usuarios";

    console.log("✅ Configurações carregadas");
    console.log("📡 API:", API_BASE);

    // =================== TROCA DE ABAS ===================
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabPanes = document.querySelectorAll(".tab-pane");
    const headerDescription = document.getElementById("headerDescription");

    const tabTexts = {
        cadastro: "Gerencie o cadastro de novos usuários do sistema",
        seguranca: "Altere sua senha com segurança",
        administracao: "Gerencie usuários e permissões do sistema",
    };

    tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            tabButtons.forEach((b) => b.classList.remove("active"));
            tabPanes.forEach((p) => p.classList.remove("active"));
            btn.classList.add("active");

            const tab = btn.getAttribute("data-tab");
            document.getElementById(tab).classList.add("active");
            headerDescription.textContent = tabTexts[tab];
        });
    });

    // =================== ABA CADASTRO ===================
    const cadastroForm = document.getElementById("cadastroForm");

    if (cadastroForm) {
        cadastroForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const nome = document.getElementById("nome").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            const tipoUsuario = document.getElementById("tipoUsuario").value;

            const gabineteSelect = document.getElementById("gabineteId");
            const gabineteId = gabineteSelect && gabineteSelect.value ? gabineteSelect.value : null;

            if (!nome || !email || !password || !tipoUsuario) {
                alert("Preencha todos os campos obrigatórios!");
                return;
            }

            const novoUsuario = {
                nome,
                email,
                password,
                tipoUsuario,
                gabinete: gabineteId ? { id: gabineteId } : null
            };

            fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(novoUsuario),
            })
                .then((res) => {
                    if (!res.ok) {
                        return res.text().then(text => { throw new Error(text || "Erro desconhecido") });
                    }
                    return res.json();
                })
                .then(() => {
                    alert("✅ Usuário cadastrado com sucesso!");
                    cadastroForm.reset();
                    carregarUsuarios(); // Atualiza a lista imediatamente
                })
                .catch((err) => {
                    console.error("❌ Erro ao cadastrar:", err);
                    alert("Erro ao cadastrar: " + err.message);
                });
        });
    }

    // =================== ABA SEGURANÇA ===================
    const segurancaForm = document.getElementById("segurancaForm");
    const emailVinculado = document.getElementById("emailVinculado");

    // Função para garantir que temos o ID atualizado do banco
    function atualizarDadosUsuarioLogado() {
        const emailLocal = localStorage.getItem("userEmail");

        if (!emailLocal) {
            console.warn("⚠️ Nenhum e-mail logado encontrado.");
            if(emailVinculado) emailVinculado.placeholder = "Não autenticado";
            return;
        }

        if(emailVinculado) emailVinculado.value = emailLocal;

        // Busca o usuário no banco pelo e-mail para pegar o ID real e atual
        fetch(API_BASE)
            .then(res => res.json())
            .then(usuarios => {
                // Encontra o usuário pelo e-mail
                const user = usuarios.find(u => u.email === emailLocal);
                if (user) {
                    // Atualiza o localStorage com o ID correto vindo do banco
                    localStorage.setItem("userId", user.id);
                    console.log(`✅ Dados de segurança sincronizados. ID atual: ${user.id}`);
                } else {
                    console.warn("⚠️ Usuário logado não encontrado no banco de dados.");
                }
            })
            .catch(err => console.error("❌ Erro ao sincronizar usuário:", err));
    }

    // Chama a atualização assim que o script carrega
    atualizarDadosUsuarioLogado();

    // Alteração de senha
    if (segurancaForm) {
        segurancaForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const novaSenha = document.getElementById("novaSenha").value.trim();
            const confirmarSenha = document.getElementById("confirmarSenha").value.trim();
            const senhaAtual = document.getElementById("senhaAtual").value.trim();

            // Pega o ID atualizado do localStorage
            const idReal = localStorage.getItem("userId");

            if (!idReal) {
                alert("Erro de autenticação: ID do usuário não encontrado. Tente fazer login novamente.");
                return;
            }

            if (!senhaAtual || !novaSenha || !confirmarSenha) {
                alert("Preencha todos os campos de senha!");
                return;
            }

            if (novaSenha !== confirmarSenha) {
                alert("As senhas não coincidem!");
                return;
            }

            // URL corrigida e log para conferência
            const url = `${API_BASE}/${idReal}/senha?novaSenha=${encodeURIComponent(novaSenha)}`;
            console.log("📤 Enviando requisição para:", url);

            fetch(url, {
                method: "PUT",
                // headers: { "Authorization": "Bearer token..." } // Se tiver token no futuro
            })
                .then((res) => {
                    if (res.status === 403) {
                        throw new Error("Erro 403: Permissão negada. O ID do usuário não confere com o login.");
                    }
                    if (!res.ok) throw new Error("Erro ao atualizar senha");

                    return res.text(); // Backend retorna texto simples
                })
                .then((msg) => {
                    alert("✅ " + (msg || "Senha atualizada com sucesso!"));
                    segurancaForm.reset();
                    // Reaplica o email no campo após limpar
                    if(emailVinculado) emailVinculado.value = localStorage.getItem("userEmail");
                })
                .catch((err) => {
                    console.error("❌ Erro ao atualizar senha:", err);
                    alert(err.message);
                });
        });
    }

    // =================== ABA ADMINISTRAÇÃO ===================
    const tabela = document.getElementById("usuariosTableBody");
    const atualizarListaBtn = document.getElementById("atualizarListaBtn");
    const removerBtn = document.querySelector(".remove-user-btn");

    function carregarUsuarios() {
        if (!tabela) return;

        fetch(API_BASE)
            .then((res) => res.json())
            .then((usuarios) => {
                tabela.innerHTML = "";

                if (!usuarios || !usuarios.length) {
                    tabela.innerHTML = `
                        <tr>
                          <td colspan="3" style="text-align:center; color:#888;">
                            Nenhum usuário encontrado no sistema.
                          </td>
                        </tr>`;
                    return;
                }

                // --- NOVA LÓGICA DE ORDENAÇÃO (Admin no topo) ---
                const prioridade = {
                    "SUPER_ADMIN": 1,
                    "ADMIN": 2,
                    "USER": 3
                };

                usuarios.sort((a, b) => {
                    // Pega o peso do cargo (se não tiver na lista, joga pro fim com peso 99)
                    const pesoA = prioridade[a.tipoUsuario] || 99;
                    const pesoB = prioridade[b.tipoUsuario] || 99;

                    // Se os pesos forem diferentes, ordena pelo peso (menor em cima)
                    if (pesoA !== pesoB) {
                        return pesoA - pesoB;
                    }

                    // Se forem do mesmo cargo (empate), ordena por nome alfabético
                    return a.nome.localeCompare(b.nome);
                });
                // ------------------------------------------------

                usuarios.forEach((u) => {
                    const tr = document.createElement("tr");

                    tr.setAttribute('data-user-id', u.id);
                    tr.setAttribute('data-user-email', u.email);

                    tr.innerHTML = `
                        <td>${u.nome}</td>
                        <td>${u.email}</td>
                        <td><span class="tag tag-${u.tipoUsuario ? u.tipoUsuario.toLowerCase() : 'user'}">${u.tipoUsuario}</span></td>
                    `;

                    tr.addEventListener('click', () => {
                        tabela.querySelectorAll('tr').forEach(row => row.classList.remove('selected'));
                        tr.classList.add('selected');
                    });

                    tabela.appendChild(tr);
                });
            })
            .catch((err) => {
                console.error("❌ Erro ao buscar usuários:", err);
                tabela.innerHTML = `
                    <tr>
                      <td colspan="3" style="text-align:center; color:red;">
                        Erro ao buscar usuários.
                      </td>
                    </tr>`;
            });
    }

    carregarUsuarios();

    if(atualizarListaBtn) {
        atualizarListaBtn.addEventListener("click", () => carregarUsuarios());
    }

    // REMOVER USUÁRIO
    if (removerBtn) {
        removerBtn.addEventListener("click", () => {
            const selectedRow = tabela.querySelector('tr.selected');

            if (selectedRow) {
                const id = selectedRow.getAttribute('data-user-id');
                const email = selectedRow.getAttribute('data-user-email');

                if (!id || id === "undefined") {
                    alert("Erro: ID do usuário não identificado. Atualize a lista.");
                    return;
                }

                const meuId = localStorage.getItem("userId");
                if (String(id) === String(meuId)) {
                    alert("Você não pode remover seu próprio usuário.");
                    return;
                }

                if (!confirm(`Deseja remover o usuário ${email}?`)) return;

                executarDelecao(id);
            }
            else {
                const emailInput = prompt("Nenhum usuário selecionado. Digite o e-mail:");
                if (!emailInput) return;

                fetch(API_BASE)
                    .then(res => res.json())
                    .then(usuarios => {
                        const user = usuarios.find(u => u.email === emailInput);
                        if (!user) {
                            alert("Usuário não encontrado pelo e-mail informado!");
                            return;
                        }
                        const meuId = localStorage.getItem("userId");
                        if (String(user.id) === String(meuId)) {
                            alert("Você não pode remover seu próprio usuário.");
                            return;
                        }
                        if (!confirm(`Deseja realmente remover ${user.nome}?`)) return;
                        executarDelecao(user.id);
                    })
                    .catch(err => {
                        console.error("❌ Erro ao buscar usuário:", err);
                        alert("Erro ao buscar usuário.");
                    });
            }
        });

        function executarDelecao(id) {
            const idStr = String(id).trim();
            fetch(`${API_BASE}/${idStr}`, { method: "DELETE" })
                .then((res) => {
                    if (res.status === 403) throw new Error("Permissão negada: Só é possível remover usuários do seu gabinete.");
                    if (!res.ok) throw new Error("Erro ao deletar usuário.");

                    alert(`✅ Usuário removido com sucesso!`);
                    carregarUsuarios();
                })
                .catch((err) => {
                    console.error("❌ Erro ao remover:", err);
                    alert(err.message);
                });
        }
    }

    // =================== MODAL DE PERMISSÕES ===================
    const editPermsBtn = document.querySelector(".edit-perms-btn");
    const permissionsModal = document.getElementById("permissionsModal");
    const closeBtnPerms = document.querySelector(".close-btn-perms");
    const permissionsForm = document.getElementById("permissionsForm");
    const modalTitle = document.getElementById("modalTitle");

    if (editPermsBtn) {
        editPermsBtn.addEventListener("click", () => {
            const selectedRow = tabela.querySelector('tr.selected');
            let email = selectedRow ? selectedRow.getAttribute('data-user-email') : null;

            if (!email) {
                email = prompt("Nenhum usuário selecionado. Digite o e-mail para editar permissões:");
            }
            if (!email) return;

            fetch(API_BASE)
                .then(res => res.json())
                .then(usuarios => {
                    const user = usuarios.find(u => u.email === email);
                    if (!user) {
                        alert("Usuário não encontrado!");
                        return;
                    }
                    modalTitle.textContent = `Permissões: ${user.nome}`;
                    permissionsModal.dataset.editingUserId = user.id;
                    permissionsForm.reset();
                    permissionsModal.style.display = "flex";
                })
                .catch(err => {
                    console.error("❌ Erro ao buscar usuário:", err);
                    alert("Erro ao buscar usuário.");
                });
        });
    }

    const accessCheckboxes = document.querySelectorAll('.access-cb');
    accessCheckboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const row = e.target.closest('.permission-row');
            const editCb = row.querySelector('.edit-cb');
            if (!e.target.checked) {
                editCb.checked = false;
                editCb.disabled = true;
            } else {
                editCb.disabled = false;
            }
        });
    });

    if (closeBtnPerms) {
        closeBtnPerms.addEventListener("click", () => {
            permissionsModal.style.display = "none";
        });
    }
    window.addEventListener("click", (e) => {
        if (e.target === permissionsModal) {
            permissionsModal.style.display = "none";
        }
    });

    if (permissionsForm) {
        permissionsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const userId = permissionsModal.dataset.editingUserId;
            if (!userId) return;

            const permissoesConfig = {
                dashboard: { acesso: permissionsForm.dashboard_access.checked, editar: permissionsForm.dashboard_edit.checked },
                acoes: { acesso: permissionsForm.acoes_access.checked, editar: permissionsForm.acoes_edit.checked },
                kanban: { acesso: permissionsForm.kanban_access.checked, editar: permissionsForm.kanban_edit.checked },
                financeiro: { acesso: permissionsForm.financeiro_access.checked, editar: permissionsForm.financeiro_edit.checked },
                configuracoes: { acesso: permissionsForm.configuracoes_access.checked, editar: permissionsForm.configuracoes_edit.checked }
            };

            console.log(`Salvando permissões para User ${userId}:`, permissoesConfig);
            localStorage.setItem(`perms_${userId}`, JSON.stringify(permissoesConfig));
            alert("✅ Permissões salvas com sucesso!");
            permissionsModal.style.display = "none";
        });
    }

    // =================== MOSTRAR/OCULTAR SENHA ===================
    document.querySelectorAll(".toggle-password").forEach((icon) => {
        icon.addEventListener("click", () => {
            const targetId = icon.dataset.target;
            if (!targetId) return;
            const target = document.getElementById(targetId);
            if (!target) return;

            if (target.type === "password") {
                target.type = "text";
                icon.classList.add("fa-eye-slash");
                icon.classList.remove("fa-eye");
            } else {
                target.type = "password";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }
        });
    });
});