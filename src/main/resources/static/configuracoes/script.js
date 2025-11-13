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

            if (!nome || !email || !password || !tipoUsuario) {
                alert("Preencha todos os campos!");
                return;
            }

            const novoUsuario = { nome, email, password, tipoUsuario };

            fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(novoUsuario),
            })
                .then((res) => {
                    if (!res.ok) throw new Error("Erro ao cadastrar usuário");
                    return res.json();
                })
                .then(() => {
                    alert("✅ Usuário cadastrado com sucesso!");
                    cadastroForm.reset();
                    carregarUsuarios(); // Atualiza a lista na aba de admin
                })
                .catch((err) => {
                    console.error("❌ Erro ao cadastrar:", err);
                    alert("Erro ao cadastrar usuário.");
                });
        });
    }

    // =================== ABA SEGURANÇA ===================
    const segurancaForm = document.getElementById("segurancaForm");
    const emailVinculado = document.getElementById("emailVinculado");

    let usuarioLogado = {
        email: localStorage.getItem("userEmail"),
        id: localStorage.getItem("userId")
    };

    if (usuarioLogado.email) {
        emailVinculado.value = usuarioLogado.email;

        if (!usuarioLogado.id) {
            fetch(API_BASE)
                .then(res => res.json())
                .then(usuarios => {
                    const user = usuarios.find(u => u.email === usuarioLogado.email);
                    if (user) {
                        usuarioLogado.id = user.id;
                        localStorage.setItem("userId", user.id);
                        console.log("✅ ID do usuário carregado:", user.id);
                    } else {
                        console.warn("⚠️ Usuário não encontrado no banco");
                    }
                })
                .catch(err => console.error("❌ Erro ao buscar usuário por e-mail:", err));
        }
    } else {
        emailVinculado.placeholder = "Usuário não autenticado";
        console.warn("⚠️ Nenhum e-mail salvo no localStorage");
    }

    // Alteração de senha
    if (segurancaForm) {
        segurancaForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const novaSenha = document.getElementById("novaSenha").value.trim();
            const confirmarSenha = document.getElementById("confirmarSenha").value.trim();
            const senhaAtual = document.getElementById("senhaAtual").value.trim();

            if (!usuarioLogado.id) {
                alert("Usuário não autenticado! Faça login novamente.");
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

            // Exemplo de requisição PUT (ajuste conforme sua API real)
            fetch(`http://localhost:8081/usuarios/${usuarioLogado.id}/senha?novaSenha=${encodeURIComponent(novaSenha)}`, {
                method: "PUT"
            })
                .then((res) => {
                    if (!res.ok) throw new Error("Erro ao atualizar senha");
                    alert("✅ Senha atualizada com sucesso!");
                    segurancaForm.reset();
                })
                .catch((err) => {
                    console.error("❌ Erro ao atualizar senha:", err);
                    alert("Erro ao atualizar senha.");
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

                usuarios.forEach((u) => {
                    const tr = document.createElement("tr");
                    tr.dataset.userId = u.id;
                    tr.dataset.userEmail = u.email;

                    // Nota: A classe da tag agora é dinâmica (tag-user, tag-admin, etc.)
                    tr.innerHTML = `
                        <td>${u.nome}</td>
                        <td>${u.email}</td>
                        <td><span class="tag tag-${u.tipoUsuario.toLowerCase()}">${u.tipoUsuario}</span></td>
                    `;

                    // Selecionar linha ao clicar
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

            // CENÁRIO 1: Usuário selecionou clicando na linha (Jeito Rápido)
            if (selectedRow) {
                const id = selectedRow.dataset.userId; // Pega o ID direto da linha
                const email = selectedRow.dataset.userEmail;

                if (!id) {
                    alert("Erro: ID do usuário não identificado.");
                    return;
                }

                if (!confirm(`Deseja remover o usuário ${email}?`)) return;

                // Chama a deleção direto pelo ID
                executarDelecao(id);
            }
            // CENÁRIO 2: Ninguém selecionado, usa o Prompt (Jeito Manual)
            else {
                const emailInput = prompt("Nenhum usuário selecionado. Digite o e-mail:");
                if (!emailInput) return;

                // Aqui sim precisamos buscar o ID pelo e-mail
                fetch(API_BASE)
                    .then(res => res.json())
                    .then(usuarios => {
                        const user = usuarios.find(u => u.email === emailInput);
                        if (!user) {
                            alert("Usuário não encontrado pelo e-mail informado!");
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

        // Função separada para realizar o DELETE e evitar repetição de código
        function executarDelecao(id) {
            fetch(`${API_BASE}/${id}`, { method: "DELETE" })
                .then((res) => {
                    if (!res.ok) throw new Error("Erro ao deletar usuário");
                    alert(`✅ Usuário removido com sucesso!`);
                    carregarUsuarios(); // Atualiza a tabela
                })
                .catch((err) => {
                    console.error("❌ Erro ao remover:", err);
                    alert("Erro ao remover usuário. Verifique se você tem permissão.");
                });
        }
    }


    // =================== MODAL DE PERMISSÕES (ATUALIZADO) ===================

    // Seletores
    const editPermsBtn = document.querySelector(".edit-perms-btn");
    const permissionsModal = document.getElementById("permissionsModal");
    const closeBtnPerms = document.querySelector(".close-btn-perms");
    const permissionsForm = document.getElementById("permissionsForm");
    const modalTitle = document.getElementById("modalTitle");

    // --- 1. Abrir Modal ---
    if (editPermsBtn) {
        editPermsBtn.addEventListener("click", () => {

            const selectedRow = tabela.querySelector('tr.selected');
            let email = selectedRow ? selectedRow.dataset.userEmail : null;

            if (!email) {
                email = prompt("Nenhum usuário selecionado. Digite o e-mail do usuário para editar as permissões:");
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

                    // Prepara e Abre o Modal
                    modalTitle.textContent = `Permissões: ${user.nome}`;
                    permissionsModal.dataset.editingUserId = user.id; // Guarda ID no modal
                    permissionsForm.reset(); // Limpa formulário anterior

                    // (Opcional) Aqui você buscaria as permissões salvas do localStorage para preencher os checkboxes
                    // carregarPermissoesNoModal(user.id);

                    permissionsModal.style.display = "flex";
                })
                .catch(err => {
                    console.error("❌ Erro ao buscar usuário:", err);
                    alert("Erro ao buscar usuário.");
                });
        });
    }

    // --- 2. UX: Desabilitar 'Editar' se tirar 'Acesso' ---
    const accessCheckboxes = document.querySelectorAll('.access-cb');
    accessCheckboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            // Encontra o checkbox de editar na mesma linha
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

    // --- 3. Fechar Modal ---
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

    // --- 4. Salvar Permissões (Submit com lógica Acesso/Editar) ---
    if (permissionsForm) {
        permissionsForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const userId = permissionsModal.dataset.editingUserId;
            if (!userId) return;

            // Monta o objeto de configuração
            const permissoesConfig = {
                dashboard: {
                    acesso: permissionsForm.dashboard_access.checked,
                    editar: permissionsForm.dashboard_edit.checked
                },
                acoes: {
                    acesso: permissionsForm.acoes_access.checked,
                    editar: permissionsForm.acoes_edit.checked
                },
                kanban: {
                    acesso: permissionsForm.kanban_access.checked,
                    editar: permissionsForm.kanban_edit.checked
                },
                financeiro: {
                    acesso: permissionsForm.financeiro_access.checked,
                    editar: permissionsForm.financeiro_edit.checked
                },
                configuracoes: {
                    acesso: permissionsForm.configuracoes_access.checked,
                    editar: permissionsForm.configuracoes_edit.checked
                }
            };

            console.log(`Salvando permissões para User ${userId}:`, permissoesConfig);

            // SALVANDO NO LOCALSTORAGE (Simulação de Backend)
            // Você pode trocar isso por um fetch PUT para sua API depois
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