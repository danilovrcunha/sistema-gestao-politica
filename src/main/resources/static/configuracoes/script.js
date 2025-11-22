document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://localhost:8081/usuarios";
    const API_GABINETES = "http://localhost:8081/gabinetes";

    console.log("✅ Script de Configurações carregado");

    // =================== SELETORES GERAIS ===================
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabPanes = document.querySelectorAll(".tab-pane");
    const headerDescription = document.getElementById("headerDescription");

    // Seletores Super Admin
    const gabineteContainer = document.getElementById("gabineteSelectorContainer");
    const gabineteSelect = document.getElementById("gabineteId");
    const filtroGabineteAdmin = document.getElementById("filtroGabineteAdmin");
    const tabGabinetesBtn = document.getElementById("tabGabinetesBtn");

    // Tabelas e Forms
    const gabineteForm = document.getElementById("gabineteForm");
    const gabinetesTableBody = document.getElementById("gabinetesTableBody");
    const cadastroForm = document.getElementById("cadastroForm");
    const tabelaUsuarios = document.getElementById("usuariosTableBody");
    const atualizarListaBtn = document.getElementById("atualizarListaBtn");
    const removerBtn = document.querySelector(".remove-user-btn");

    const tabTexts = {
        cadastro: "Gerencie o cadastro de novos usuários do sistema",
        seguranca: "Altere sua senha com segurança",
        gabinetes: "Gestão centralizada de gabinetes (Super Admin)",
        administracao: "Gerencie usuários e permissões do sistema",
    };

    // =================== SISTEMA DE ABAS ===================
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

            // Carrega dados específicos da aba
            if (tab === "gabinetes") carregarGabinetes();
            if (tab === "administracao") carregarUsuarios();
        });
    });

    // =================== LÓGICA DO SUPER ADMIN (Exibir/Ocultar Campos) ===================
    function configurarAmbienteSuperAdmin() {
        fetch(`${API_BASE}/me`)
            .then(res => { if(!res.ok) return null; return res.json(); })
            .then(user => {
                if (user && user.tipoUsuario === "SUPER_ADMIN") {
                    // Mostra componentes
                    if (tabGabinetesBtn) tabGabinetesBtn.style.display = "block";
                    if (gabineteContainer) gabineteContainer.style.display = "block";
                    if (filtroGabineteAdmin) {
                        filtroGabineteAdmin.style.display = "block";
                        filtroGabineteAdmin.addEventListener("change", () => carregarUsuarios());
                    }
                    carregarGabinetesNosSelects();
                } else {
                    // Esconde componentes
                    if (tabGabinetesBtn) tabGabinetesBtn.style.display = "none";
                    if (gabineteContainer) gabineteContainer.style.display = "none";
                    if (filtroGabineteAdmin) filtroGabineteAdmin.style.display = "none";
                }
            })
            .catch(console.error);
    }

    function carregarGabinetesNosSelects() {
        fetch(API_GABINETES)
            .then(res => res.json())
            .then(gabinetes => {
                // Select Cadastro
                if (gabineteSelect) {
                    gabineteSelect.innerHTML = '<option value="">Selecione o Gabinete...</option>';
                    gabinetes.forEach(gab => {
                        const option = document.createElement("option");
                        option.value = gab.id;
                        option.textContent = `${gab.id} - ${gab.nomeResponsavel}`;
                        gabineteSelect.appendChild(option);
                    });
                }
                // Select Filtro Admin
                if (filtroGabineteAdmin) {
                    filtroGabineteAdmin.innerHTML = '<option value="">Todos os Gabinetes</option>';
                    gabinetes.forEach(gab => {
                        const option = document.createElement("option");
                        option.value = gab.id;
                        option.textContent = `${gab.id} - ${gab.nomeResponsavel}`;
                        filtroGabineteAdmin.appendChild(option);
                    });
                }
            })
            .catch(console.error);
    }

    configurarAmbienteSuperAdmin();

    // =================== GABINETES (CRUD) ===================
    function carregarGabinetes() {
        if (!gabinetesTableBody) return;
        fetch(API_GABINETES).then(r => {
            if(r.status===403) throw new Error("Sem permissão"); return r.json();
        }).then(gabinetes => {
            gabinetesTableBody.innerHTML = "";
            if (!gabinetes || !gabinetes.length) return;

            gabinetes.sort((a, b) => a.id - b.id);
            gabinetes.forEach(gab => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${gab.id}</td>
                    <td>${gab.nomeResponsavel}</td>
                    <td style="text-align: center;">
                        <button class="action-btn delete-btn" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;
                tr.querySelector(".delete-btn").onclick = () => confirmarDelecaoGabinete(gab.id, gab.nomeResponsavel);
                gabinetesTableBody.appendChild(tr);
            });
        }).catch(console.error);
    }

    function confirmarDelecaoGabinete(id, nome) {
        if (!confirm(`Excluir Gabinete "${nome}"?`)) return;
        fetch(`${API_GABINETES}/${id}`, { method: "DELETE" })
            .then(res => {
                if (!res.ok) throw new Error("Erro ao excluir (Verifique usuários vinculados).");
                alert("✅ Gabinete excluído!");
                carregarGabinetes();
                carregarGabinetesNosSelects();
            }).catch(e => alert(e.message));
    }

    if (gabineteForm) {
        gabineteForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const nome = document.getElementById("nomeGabineteInput").value.trim();
            if (!nome) return;
            fetch(API_GABINETES, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nomeResponsavel: nome })
            }).then(r => r.json()).then(() => {
                alert("✅ Gabinete criado!");
                document.getElementById("nomeGabineteInput").value = "";
                carregarGabinetes();
                carregarGabinetesNosSelects();
            });
        });
    }

    // =================== CADASTRO DE USUÁRIO ===================
    if (cadastroForm) {
        cadastroForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const nome = document.getElementById("nome").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();
            const tipoUsuario = document.getElementById("tipoUsuario").value;
            const gabineteId = gabineteSelect ? gabineteSelect.value : null;

            if (gabineteContainer.style.display !== "none" && !gabineteId) {
                alert("Selecione um Gabinete."); return;
            }

            fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome, email, password, tipoUsuario, gabinete: gabineteId ? { id: gabineteId } : null })
            }).then(res => {
                if(!res.ok) return res.text().then(t => { throw new Error(t) });
                alert("✅ Usuário cadastrado!");
                cadastroForm.reset();
                carregarUsuarios();
            }).catch(e => alert(e.message));
        });
    }

    // =================== LISTAGEM DE USUÁRIOS ===================
    function carregarUsuarios() {
        if (!tabelaUsuarios) return;
        let url = API_BASE;
        if (filtroGabineteAdmin && filtroGabineteAdmin.value) url += `?gabineteId=${filtroGabineteAdmin.value}`;

        fetch(url).then(r => {
            if(!r.ok) return []; return r.json();
        }).then(usuarios => {
            tabelaUsuarios.innerHTML = "";
            if (!usuarios.length) {
                tabelaUsuarios.innerHTML = `<tr><td colspan="3" style="text-align: center">Nenhum usuário.</td></tr>`;
                return;
            }

            const prioridade = { "SUPER_ADMIN": 1, "ADMIN": 2, "USER": 3 };
            usuarios.sort((a, b) => (prioridade[a.tipoUsuario]||99) - (prioridade[b.tipoUsuario]||99));

            usuarios.forEach(u => {
                const tr = document.createElement("tr");
                tr.setAttribute('data-user-id', u.id);
                tr.setAttribute('data-user-email', u.email);
                tr.innerHTML = `<td>${u.nome}</td><td>${u.email}</td><td><span class="tag tag-${u.tipoUsuario.toLowerCase()}">${u.tipoUsuario}</span></td>`;
                tr.onclick = () => {
                    tabelaUsuarios.querySelectorAll('tr').forEach(x => x.classList.remove('selected'));
                    tr.classList.add('selected');
                };
                tabelaUsuarios.appendChild(tr);
            });
        });
    }
    carregarUsuarios(); // Load inicial
    if(atualizarListaBtn) atualizarListaBtn.onclick = carregarUsuarios;

    // Remover Usuário
    if (removerBtn) {
        removerBtn.onclick = () => {
            const row = tabelaUsuarios.querySelector('.selected');
            if (!row) { alert("Selecione um usuário."); return; }
            const id = row.getAttribute('data-user-id');

            if(!confirm("Remover usuário?")) return;
            fetch(`${API_BASE}/${id}`, { method: "DELETE" })
                .then(r => {
                    if(!r.ok) throw new Error("Erro ou sem permissão");
                    alert("✅ Usuário removido!");
                    carregarUsuarios();
                }).catch(e => alert(e.message));
        };
    }

    // =================== MODAL DE PERMISSÕES ===================
    const editPermsBtn = document.querySelector(".edit-perms-btn");
    const permsModal = document.getElementById("permissionsModal");
    const permsForm = document.getElementById("permissionsForm");
    const permsTitle = document.getElementById("modalTitle");

    if(editPermsBtn) {
        editPermsBtn.onclick = () => {
            const row = tabelaUsuarios.querySelector('.selected');
            if(!row) { alert("Selecione um usuário."); return; }
            const email = row.getAttribute('data-user-email');

            // Busca usuário na lista (Admin já tem acesso)
            fetch(API_BASE).then(r=>r.json()).then(lista => {
                const user = lista.find(u => u.email === email);
                if(!user) return;

                permsTitle.textContent = `Permissões: ${user.nome}`;
                permsModal.dataset.editingUserId = user.id;
                const p = user.permissao || {};
                const f = permsForm;

                f.dashboard_access.checked = p.verDashboard; f.dashboard_edit.checked = p.editarDashboard;
                f.acoes_access.checked = p.verAcoes; f.acoes_edit.checked = p.editarAcoes;
                f.kanban_access.checked = p.verKanban; f.kanban_edit.checked = p.editarKanban;
                f.financeiro_access.checked = p.verFinanceiro; f.financeiro_edit.checked = p.editarFinanceiro;
                f.configuracoes_access.checked = p.verConfiguracoes; f.configuracoes_edit.checked = p.editarConfiguracoes;

                // Atualiza visual dos checkboxes
                document.querySelectorAll('.access-cb').forEach(cb => cb.dispatchEvent(new Event('change')));
                permsModal.style.display = "flex";
            });
        };
    }

    // UI Checkboxes
    document.querySelectorAll('.access-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const editCb = e.target.closest('.permission-row').querySelector('.edit-cb');
            if (!e.target.checked) { editCb.checked = false; editCb.disabled = true; }
            else { editCb.disabled = false; }
        });
    });

    if(permsForm) {
        permsForm.onsubmit = (e) => {
            e.preventDefault();
            const id = permsModal.dataset.editingUserId;
            const f = permsForm;

            const payload = {
                verDashboard: f.dashboard_access.checked, editarDashboard: f.dashboard_edit.checked,
                verAcoes: f.acoes_access.checked, editarAcoes: f.acoes_edit.checked,
                verKanban: f.kanban_access.checked, editarKanban: f.kanban_edit.checked,
                verFinanceiro: f.financeiro_access.checked, editarFinanceiro: f.financeiro_edit.checked,
                verConfiguracoes: f.configuracoes_access.checked, editarConfiguracoes: f.configuracoes_edit.checked
            };

            fetch(`${API_BASE}/${id}/permissoes`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
            }).then(r => {
                if(!r.ok) throw new Error("Erro ao salvar");
                alert("✅ Permissões salvas!");
                permsModal.style.display = "none";
                carregarUsuarios();
            }).catch(e => alert(e.message));
        };
    }
    document.querySelector(".close-btn-perms").onclick = () => permsModal.style.display = "none";

    // =================== SEGURANÇA (SENHA) ===================
    const segForm = document.getElementById("segurancaForm");
    if(segForm) {
        fetch(`${API_BASE}/me`).then(r=>r.json()).then(u => {
            if(document.getElementById("emailVinculado")) document.getElementById("emailVinculado").value = u.email;
        });

        segForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const nova = document.getElementById("novaSenha").value;
            const conf = document.getElementById("confirmarSenha").value;
            const id = localStorage.getItem("userId");

            if(nova !== conf) { alert("Senhas não conferem"); return; }

            fetch(`${API_BASE}/${id}/senha?novaSenha=${encodeURIComponent(nova)}`, { method: "PUT" })
                .then(r => {
                    if(!r.ok) throw new Error("Erro");
                    alert("✅ Senha alterada!");
                    segForm.reset();
                }).catch(e => alert(e.message));
        });
    }

    // Toggle Password
    document.querySelectorAll(".toggle-password").forEach(i => {
        i.onclick = () => {
            const el = document.getElementById(i.dataset.target);
            el.type = el.type === "password" ? "text" : "password";
            i.classList.toggle("fa-eye"); i.classList.toggle("fa-eye-slash");
        };
    });
});