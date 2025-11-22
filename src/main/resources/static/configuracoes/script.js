document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://localhost:8081/usuarios";
    const API_GABINETES = "http://localhost:8081/gabinetes";

    console.log("✅ Configurações carregadas");
    console.log("📡 API Usuários:", API_BASE);
    console.log("📡 API Gabinetes:", API_GABINETES);

    // =================== VARIÁVEIS GLOBAIS E SELETORES ===================
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabPanes = document.querySelectorAll(".tab-pane");
    const headerDescription = document.getElementById("headerDescription");

    // Seletores de Gabinetes (Aba Cadastro)
    const gabineteContainer = document.getElementById("gabineteSelectorContainer");
    const gabineteSelect = document.getElementById("gabineteId");

    // Seletores de Gabinetes (Aba Administração - Filtro)
    const filtroGabineteAdmin = document.getElementById("filtroGabineteAdmin");

    // Aba Gabinetes (Menu exclusivo Super Admin)
    const tabGabinetesBtn = document.getElementById("tabGabinetesBtn");
    const gabineteForm = document.getElementById("gabineteForm");
    const gabinetesTableBody = document.getElementById("gabinetesTableBody");

    const tabTexts = {
        cadastro: "Gerencie o cadastro de novos usuários do sistema",
        seguranca: "Altere sua senha com segurança",
        gabinetes: "Gestão centralizada de gabinetes (Super Admin)",
        administracao: "Gerencie usuários e permissões do sistema",
    };

    // =================== TROCA DE ABAS ===================
    tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            tabButtons.forEach((b) => b.classList.remove("active"));
            tabPanes.forEach((p) => p.classList.remove("active"));
            btn.classList.add("active");

            const tab = btn.getAttribute("data-tab");
            const targetPane = document.getElementById(tab);
            if (targetPane) targetPane.classList.add("active");

            if (headerDescription && tabTexts[tab]) {
                headerDescription.textContent = tabTexts[tab];
            }

            // Ações específicas ao entrar na aba
            if (tab === "gabinetes") {
                carregarGabinetes();
            }
            if (tab === "administracao") {
                carregarUsuarios(); // Recarrega a lista para garantir dados frescos
            }
        });
    });

    // =================== LÓGICA DO SUPER ADMIN ===================
    function configurarAmbienteSuperAdmin() {
        const emailLocal = localStorage.getItem("userEmail");
        if (!emailLocal) return;

        // Verifica quem é o usuário logado
        fetch(API_BASE)
            .then(res => res.json())
            .then(usuarios => {
                const user = usuarios.find(u => u.email === emailLocal);

                // Se for SUPER_ADMIN
                if (user && user.tipoUsuario === "SUPER_ADMIN") {
                    console.log("👑 Super Admin detectado!");

                    // 1. Mostra a aba de Gestão de Gabinetes
                    if (tabGabinetesBtn) {
                        tabGabinetesBtn.style.display = "block";
                    }

                    // 2. Mostra o Select de Gabinetes na aba de Cadastro
                    if (gabineteContainer) {
                        gabineteContainer.style.display = "block";
                    }

                    // 3. Mostra o Filtro na aba de Administração
                    if (filtroGabineteAdmin) {
                        filtroGabineteAdmin.style.display = "block";

                        // Adiciona evento para recarregar tabela quando mudar o filtro
                        filtroGabineteAdmin.addEventListener("change", () => {
                            console.log("🔄 Filtro alterado. Recarregando...");
                            carregarUsuarios();
                        });
                    }

                    // Carrega os dados para popular os selects
                    carregarGabinetesNosSelects();

                } else {
                    // Oculta funcionalidades de Super Admin para outros usuários
                    if (tabGabinetesBtn) tabGabinetesBtn.style.display = "none";
                    if (gabineteContainer) gabineteContainer.style.display = "none";
                    if (filtroGabineteAdmin) filtroGabineteAdmin.style.display = "none";
                }
            })
            .catch(err => console.error("Erro ao verificar permissões:", err));
    }

    function carregarGabinetesNosSelects() {
        fetch(API_GABINETES)
            .then(res => {
                if (!res.ok) throw new Error("Erro ao buscar gabinetes");
                return res.json();
            })
            .then(gabinetes => {
                // 1. Popula Select do Cadastro
                if (gabineteSelect) {
                    gabineteSelect.innerHTML = '<option value="">Selecione o Gabinete...</option>';
                    gabinetes.forEach(gab => {
                        const option = document.createElement("option");
                        option.value = gab.id;
                        option.textContent = `${gab.id} - ${gab.nomeResponsavel}`;
                        gabineteSelect.appendChild(option);
                    });
                }

                // 2. Popula Select do Filtro (Admin)
                if (filtroGabineteAdmin) {
                    // Mantém a opção "Todos" e adiciona os outros
                    filtroGabineteAdmin.innerHTML = '<option value="">Todos os Gabinetes</option>';
                    gabinetes.forEach(gab => {
                        const option = document.createElement("option");
                        option.value = gab.id;
                        option.textContent = `${gab.id} - ${gab.nomeResponsavel}`;
                        filtroGabineteAdmin.appendChild(option);
                    });
                }
            })
            .catch(err => console.error("Erro ao carregar gabinetes nos selects:", err));
    }

    // Chama a configuração inicial
    configurarAmbienteSuperAdmin();


    // =================== ABA GABINETES (CRUD) ===================
    function carregarGabinetes() {
        if (!gabinetesTableBody) return;

        fetch(API_GABINETES)
            .then(res => {
                if(res.status === 403) throw new Error("Acesso negado.");
                return res.json();
            })
            .then(gabinetes => {
                gabinetesTableBody.innerHTML = "";

                if (!gabinetes || gabinetes.length === 0) {
                    gabinetesTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center">Nenhum gabinete cadastrado.</td></tr>`;
                    return;
                }

                gabinetes.sort((a, b) => a.id - b.id);

                gabinetes.forEach(gab => {
                    const tr = document.createElement("tr");

                    // Colunas
                    const tdId = document.createElement("td");
                    tdId.textContent = gab.id;

                    const tdNome = document.createElement("td");
                    tdNome.textContent = gab.nomeResponsavel;

                    const tdAcao = document.createElement("td");
                    tdAcao.style.textAlign = "center"; // Centraliza o botão

                    // Botão de Excluir (ATUALIZADO)
                    const btnDelete = document.createElement("button");
                    btnDelete.className = "action-btn delete-btn"; // Classe do CSS atualizado
                    btnDelete.innerHTML = '<i class="fas fa-trash-alt"></i>';
                    btnDelete.title = "Excluir Gabinete";
                    btnDelete.style.margin = "0 auto"; // Centraliza

                    // Evento de Click para deletar
                    btnDelete.onclick = () => confirmarDelecaoGabinete(gab.id, gab.nomeResponsavel);

                    tdAcao.appendChild(btnDelete);
                    tr.append(tdId, tdNome, tdAcao);
                    gabinetesTableBody.appendChild(tr);
                });
            })
            .catch(err => console.error("Erro ao carregar gabinetes:", err));
    }

    // Nova função para deletar Gabinete
    function confirmarDelecaoGabinete(id, nome) {
        if (!confirm(`ATENÇÃO: Tem certeza que deseja excluir o gabinete "${nome}"?\n\nSe houver usuários vinculados, isso pode remover os usuários também ou dar erro (dependendo da configuração do sistema).`)) {
            return;
        }

        fetch(`${API_GABINETES}/${id}`, { method: "DELETE" })
            .then(res => {
                if (res.status === 500) throw new Error("Não é possível excluir: Existem usuários vinculados a este gabinete.");
                if (!res.ok) throw new Error("Erro ao excluir gabinete.");

                alert("✅ Gabinete excluído com sucesso!");
                carregarGabinetes();
                carregarGabinetesNosSelects(); // Atualiza os selects de cadastro e filtro
            })
            .catch(err => alert("Erro: " + err.message));
    }

    if (gabineteForm) {
        gabineteForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const nomeInput = document.getElementById("nomeGabineteInput");
            const nomeValor = nomeInput.value.trim();

            if (!nomeValor) {
                alert("Digite o nome do gabinete.");
                return;
            }

            fetch(API_GABINETES, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nomeResponsavel: nomeValor })
            })
                .then(res => {
                    if (!res.ok) throw new Error("Erro ao criar gabinete");
                    return res.json();
                })
                .then(() => {
                    alert("✅ Gabinete criado com sucesso!");
                    nomeInput.value = "";
                    carregarGabinetes();
                    carregarGabinetesNosSelects(); // Atualiza os selects (Cadastro e Filtro)
                })
                .catch(err => {
                    alert("Erro ao criar gabinete.");
                    console.error(err);
                });
        });
    }


    // =================== ABA CADASTRO (Criação de Usuário) ===================
    const cadastroForm = document.getElementById("cadastroForm");

    if (cadastroForm) {
        cadastroForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const nome = document.getElementById("nome").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            const tipoUsuario = document.getElementById("tipoUsuario").value;

            const selectedGabineteId = gabineteSelect && gabineteSelect.value ? gabineteSelect.value : null;

            // VALIDAÇÃO ESPECÍFICA DO SUPER ADMIN
            const isGabineteVisivel = gabineteContainer && gabineteContainer.style.display !== "none";

            if (isGabineteVisivel && !selectedGabineteId) {
                alert("Como Super Admin, você deve selecionar um Gabinete para vincular este usuário.");
                return;
            }

            if (!nome || !email || !password || !tipoUsuario) {
                alert("Preencha todos os campos obrigatórios!");
                return;
            }

            const novoUsuario = {
                nome,
                email,
                password,
                tipoUsuario,
                // Se houver gabinete selecionado, envia o objeto. Se não, vai null (Back resolve p/ Admin Comum)
                gabinete: selectedGabineteId ? { id: selectedGabineteId } : null
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
                    carregarUsuarios(); // Atualiza a lista na aba de admin
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

    function atualizarDadosUsuarioLogado() {
        const emailLocal = localStorage.getItem("userEmail");

        if (!emailLocal) {
            if(emailVinculado) emailVinculado.placeholder = "Não autenticado";
            return;
        }

        if(emailVinculado) emailVinculado.value = emailLocal;

        // Busca o usuário no banco pelo e-mail para garantir o ID correto
        fetch(API_BASE)
            .then(res => res.json())
            .then(usuarios => {
                const user = usuarios.find(u => u.email === emailLocal);
                if (user) {
                    localStorage.setItem("userId", user.id);
                    console.log(`✅ Segurança: ID sincronizado (${user.id})`);
                }
            })
            .catch(err => console.error("❌ Erro ao sincronizar usuário:", err));
    }

    // Chama ao carregar
    atualizarDadosUsuarioLogado();

    if (segurancaForm) {
        segurancaForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const novaSenha = document.getElementById("novaSenha").value.trim();
            const confirmarSenha = document.getElementById("confirmarSenha").value.trim();
            const senhaAtual = document.getElementById("senhaAtual").value.trim();
            const idReal = localStorage.getItem("userId");

            if (!idReal) {
                alert("Erro de autenticação. Faça login novamente.");
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

            const url = `${API_BASE}/${idReal}/senha?novaSenha=${encodeURIComponent(novaSenha)}`;

            fetch(url, { method: "PUT" })
                .then((res) => {
                    if (res.status === 403) throw new Error("Erro 403: Permissão negada.");
                    if (!res.ok) throw new Error("Erro ao atualizar senha");
                    return res.text();
                })
                .then((msg) => {
                    alert("✅ " + (msg || "Senha atualizada!"));
                    segurancaForm.reset();
                    if(emailVinculado) emailVinculado.value = localStorage.getItem("userEmail");
                })
                .catch((err) => {
                    console.error("❌ Erro ao atualizar senha:", err);
                    alert(err.message);
                });
        });
    }

    // =================== ABA ADMINISTRAÇÃO (Listagem de Usuários) ===================
    const tabela = document.getElementById("usuariosTableBody");
    const atualizarListaBtn = document.getElementById("atualizarListaBtn");
    const removerBtn = document.querySelector(".remove-user-btn");

    function carregarUsuarios() {
        if (!tabela) return;

        // Verifica se tem filtro de gabinete ativo (Super Admin)
        let url = API_BASE;
        const gabineteIdFiltro = filtroGabineteAdmin && filtroGabineteAdmin.value;

        if (gabineteIdFiltro) {
            url += `?gabineteId=${gabineteIdFiltro}`;
            console.log("🔎 Buscando usuários do Gabinete ID:", gabineteIdFiltro);
        }

        fetch(url)
            .then((res) => res.json())
            .then((usuarios) => {
                tabela.innerHTML = "";

                if (!usuarios || !usuarios.length) {
                    tabela.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#888;">Nenhum usuário encontrado.</td></tr>`;
                    return;
                }

                // ORDENAÇÃO: Super Admin > Admin > User > Nome
                const prioridade = { "SUPER_ADMIN": 1, "ADMIN": 2, "USER": 3 };

                usuarios.sort((a, b) => {
                    const pesoA = prioridade[a.tipoUsuario] || 99;
                    const pesoB = prioridade[b.tipoUsuario] || 99;
                    if (pesoA !== pesoB) return pesoA - pesoB;
                    return a.nome.localeCompare(b.nome);
                });

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
                tabela.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Erro ao carregar lista.</td></tr>`;
            });
    }

    // Carrega inicial
    carregarUsuarios();

    if(atualizarListaBtn) {
        atualizarListaBtn.addEventListener("click", () => carregarUsuarios());
    }

    // REMOVER USUÁRIO
    if (removerBtn) {
        removerBtn.addEventListener("click", () => {
            const selectedRow = tabela.querySelector('tr.selected');

            // Lógica para pegar ID (Seleção ou Manual)
            let idToDelete = null;
            let emailToDelete = null;

            if (selectedRow) {
                idToDelete = selectedRow.getAttribute('data-user-id');
                emailToDelete = selectedRow.getAttribute('data-user-email');
            } else {
                const emailInput = prompt("Nenhum usuário selecionado. Digite o e-mail:");
                if (!emailInput) return;

                // Busca ID pelo e-mail (para garantir que temos o ID antes de deletar)
                fetch(API_BASE)
                    .then(res => res.json())
                    .then(usuarios => {
                        const user = usuarios.find(u => u.email === emailInput);
                        if (!user) {
                            alert("Usuário não encontrado!");
                            return;
                        }
                        confirmarEDeletar(user.id, user.email, user.nome);
                    })
                    .catch(() => alert("Erro ao buscar usuário."));
                return;
            }

            if (idToDelete) {
                confirmarEDeletar(idToDelete, emailToDelete, emailToDelete); // nome = email se não tiver nome
            }
        });

        function confirmarEDeletar(id, email, nomeExibicao) {
            const meuId = localStorage.getItem("userId");
            if (String(id) === String(meuId)) {
                alert("Você não pode remover seu próprio usuário.");
                return;
            }

            if (!confirm(`Deseja realmente remover o usuário ${nomeExibicao}?`)) return;

            fetch(`${API_BASE}/${id}`, { method: "DELETE" })
                .then((res) => {
                    if (res.status === 403) throw new Error("Permissão negada: Verifique se o usuário pertence ao seu gabinete.");
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
                email = prompt("Digite o e-mail do usuário para editar permissões:");
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

                    // Aqui você pode implementar o carregamento das permissões salvas (localStorage)
                    // Ex: carregarPermissoesDoLocalStorage(user.id);

                    permissionsModal.style.display = "flex";
                })
                .catch(err => alert("Erro ao buscar dados do usuário para permissões."));
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
            localStorage.setItem(`perms_${userId}`, JSON.stringify(permissoesConfig));
            alert("✅ Permissões salvas com sucesso!");
            permissionsModal.style.display = "none";
        });
    }

    // =================== UI HELPERS (Mostrar/Ocultar Senha) ===================
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