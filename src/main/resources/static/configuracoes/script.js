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

    // Modal de Permissões
    const editPermsBtn = document.querySelector(".edit-perms-btn");
    const permsModal = document.getElementById("permissionsModal");
    const permsForm = document.getElementById("permissionsForm");
    const permsTitle = document.getElementById("modalTitle");
    const closePermsBtn = document.querySelector(".close-btn-perms");

    const tabTexts = {
        cadastro: "Gerencie o cadastro de novos usuários do sistema",
        seguranca: "Altere sua senha com segurança",
        gabinetes: "Gestão centralizada de gabinetes (Super Admin)",
        administracao: "Gerencie usuários e permissões do sistema",
    };

    // =================== 1. FUNÇÃO PARA ATUALIZAR LINKS DO MENU ===================
    function atualizarLinksImediatamente(filtroId) {
        const links = document.querySelectorAll('.nav-menu a');
        const paginasAfetadas = ["/kanban", "/financeiro", "/home", "/acoes"];

        links.forEach(link => {
            const path = link.getAttribute('href').split('?')[0];
            if (paginasAfetadas.includes(path)) {
                if (filtroId) link.href = `${path}?gabineteId=${filtroId}`;
                else link.href = path;
            }
        });
        console.log("🔗 Links do menu atualizados para Gabinete:", filtroId || "Todos");
    }

    // =================== 2. CONTROLE DE ABAS (USER vs ADMIN) ===================
    function aplicarRestricoesDeAbas() {
        const role = localStorage.getItem("userRole");
        if (role === "ADMIN" || role === "SUPER_ADMIN") return;

        const btnCadastro = document.querySelector('.tab-button[data-tab="cadastro"]');
        const btnAdmin = document.querySelector('.tab-button[data-tab="administracao"]');

        if (btnCadastro) btnCadastro.style.display = 'none';
        if (btnAdmin) btnAdmin.style.display = 'none';

        const btnSeguranca = document.querySelector('.tab-button[data-tab="seguranca"]');
        if (btnSeguranca && !document.querySelector('.tab-button.active')) {
            document.getElementById("cadastro").classList.remove("active");
            document.querySelector('.tab-button[data-tab="cadastro"]').classList.remove("active");

            btnSeguranca.click();
            btnSeguranca.classList.add("active");
            document.getElementById("seguranca").classList.add("active");
        }
    }

    if (localStorage.getItem("userRole")) {
        aplicarRestricoesDeAbas();
    } else {
        document.addEventListener("permissoesCarregadas", aplicarRestricoesDeAbas);
    }

    tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            tabButtons.forEach((b) => b.classList.remove("active"));
            tabPanes.forEach((p) => p.classList.remove("active"));
            btn.classList.add("active");

            const tab = btn.getAttribute("data-tab");
            document.getElementById(tab).classList.add("active");
            if (headerDescription && tabTexts[tab]) headerDescription.textContent = tabTexts[tab];

            if (tab === "gabinetes") carregarGabinetes();
            if (tab === "administracao") carregarUsuarios();
        });
    });

    // =================== SUPER ADMIN (OPÇÕES VISUAIS) ===================

    // Função para remover/adicionar opção Super Admin do Select
    function gerenciarOpcoesDeCadastro(role) {
        const tipoSelect = document.getElementById("tipoUsuario");
        if (!tipoSelect) return;

        // Limpa opção existente para segurança visual
        const opcaoExistente = tipoSelect.querySelector('option[value="SUPER_ADMIN"]');
        if (opcaoExistente) opcaoExistente.remove();

        // Se for Super Admin, recoloca a opção
        if (role === "SUPER_ADMIN") {
            const option = document.createElement("option");
            option.value = "SUPER_ADMIN";
            option.textContent = "Super Administrador (Acesso Total)";
            option.style.fontWeight = "bold";
            option.style.color = "#e74c3c";
            tipoSelect.appendChild(option);
        }
    }

    function configurarAmbienteSuperAdmin() {
        fetch(`${API_BASE}/me`)
            .then(res => res.ok ? res.json() : null)
            .then(user => {
                if (!user) return;

                // Configura o select de cadastro
                gerenciarOpcoesDeCadastro(user.tipoUsuario);

                if (user.tipoUsuario === "SUPER_ADMIN") {
                    if(tabGabinetesBtn) tabGabinetesBtn.style.display = "block";
                    if(gabineteContainer) gabineteContainer.style.display = "block";

                    if(filtroGabineteAdmin) {
                        filtroGabineteAdmin.style.display = "block";
                        const salvo = localStorage.getItem("superAdminGabineteFilter");
                        if(salvo) {
                            filtroGabineteAdmin.value = salvo;
                            atualizarLinksImediatamente(salvo);
                        }

                        filtroGabineteAdmin.addEventListener("change", () => {
                            const val = filtroGabineteAdmin.value;
                            if (val) localStorage.setItem("superAdminGabineteFilter", val);
                            else localStorage.removeItem("superAdminGabineteFilter");

                            atualizarLinksImediatamente(val);
                            carregarUsuarios();
                        });
                    }
                    carregarGabinetesNosSelects();
                }
            })
            .catch(console.error);
    }

    function carregarGabinetesNosSelects() {
        fetch(API_GABINETES).then(r => r.json()).then(gabinetes => {
            [gabineteSelect, filtroGabineteAdmin].forEach(select => {
                if (select) {
                    const defText = select === filtroGabineteAdmin ? "Todos os Gabinetes" : "Selecione...";
                    select.innerHTML = `<option value="">${defText}</option>`;
                    gabinetes.forEach(g => select.innerHTML += `<option value="${g.id}">${g.nomeResponsavel}</option>`);
                }
            });
            const salvo = localStorage.getItem("superAdminGabineteFilter");
            if(filtroGabineteAdmin && salvo) {
                filtroGabineteAdmin.value = salvo;
                if(document.getElementById("administracao").classList.contains("active")) {
                    carregarUsuarios();
                }
            }
        });
    }
    configurarAmbienteSuperAdmin();

    // =================== GABINETES CRUD ===================
    function carregarGabinetes() {
        if (!gabinetesTableBody) return;
        fetch(API_GABINETES).then(r => r.status===403 ? [] : r.json()).then(gabinetes => {
            gabinetesTableBody.innerHTML = "";
            if(!gabinetes.length) {
                gabinetesTableBody.innerHTML = "<tr><td colspan='3' style='text-align:center'>Nenhum gabinete.</td></tr>";
                return;
            }
            gabinetes.sort((a, b) => a.id - b.id);
            gabinetes.forEach(g => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${g.id}</td><td>${g.nomeResponsavel}</td><td style="text-align:center"><button class="action-btn delete-btn"><i class="fas fa-trash-alt"></i></button></td>`;
                tr.querySelector(".delete-btn").onclick = () => confirmarDelecaoGabinete(g.id, g.nomeResponsavel);
                gabinetesTableBody.appendChild(tr);
            });
        });
    }

    function confirmarDelecaoGabinete(id, nome) {
        if(confirm(`ATENÇÃO: Excluir o Gabinete "${nome}" apagará TODOS os usuários e dados vinculados. Continuar?`)) {
            fetch(`${API_GABINETES}/${id}`, {method:"DELETE"}).then(r=>{
                if(!r.ok) throw new Error();
                alert("✅ Gabinete excluído!");
                carregarGabinetes();
                carregarGabinetesNosSelects();
            }).catch(()=>alert("Erro ao excluir gabinete."));
        }
    }

    if(gabineteForm) {
        gabineteForm.onsubmit = (e) => {
            e.preventDefault();
            const nome = document.getElementById("nomeGabineteInput").value.trim();
            if(!nome)return;
            fetch(API_GABINETES, {
                method:"POST", headers:{"Content-Type":"application/json"},
                body:JSON.stringify({nomeResponsavel: nome})
            }).then(()=>{
                alert("✅ Gabinete Criado!");
                document.getElementById("nomeGabineteInput").value="";
                carregarGabinetes();
                carregarGabinetesNosSelects();
            });
        };
    }

    // =================== USUÁRIOS CRUD (CADASTRAR) ===================
    if (cadastroForm) {
        cadastroForm.onsubmit = (e) => {
            e.preventDefault();

            const nome = document.getElementById("nome").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const tipoUsuario = document.getElementById("tipoUsuario").value;
            const gabineteId = gabineteSelect ? gabineteSelect.value : null;

            const role = localStorage.getItem("userRole");

            // Validação: Super Admin precisa selecionar gabinete (exceto se criar outro super admin)
            if (role === "SUPER_ADMIN" && tipoUsuario !== "SUPER_ADMIN" && !gabineteId) {
                alert("⚠️ Como Super Admin, você deve selecionar um Gabinete para vincular o usuário.");
                return;
            }

            fetch(API_BASE, {
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({
                    nome, email, password, tipoUsuario,
                    gabinete: gabineteId ? {id: gabineteId} : null
                })
            }).then(async r=>{
                if(!r.ok) {
                    const txt = await r.text();
                    throw new Error(txt);
                }
                alert("✅ Usuário Cadastrado!");
                cadastroForm.reset();
                if(gabineteSelect) gabineteSelect.value = "";
                if(document.getElementById("administracao").classList.contains("active")) carregarUsuarios();
            }).catch(e => alert(e.message));
        };
    }

    function carregarUsuarios() {
        if(!tabelaUsuarios) return;
        let url = API_BASE;

        const filtroVal = (filtroGabineteAdmin && filtroGabineteAdmin.value) ? filtroGabineteAdmin.value : localStorage.getItem("superAdminGabineteFilter");
        if(filtroVal) url += `?gabineteId=${filtroVal}`;

        fetch(url).then(r=>r.ok?r.json():[]).then(users => {
            tabelaUsuarios.innerHTML = "";
            if(!users.length) {
                tabelaUsuarios.innerHTML="<tr><td colspan='3' style='text-align:center'>Nenhum usuário encontrado.</td></tr>";
                return;
            }
            const p = {"SUPER_ADMIN":1,"ADMIN":2,"USER":3};
            users.sort((a,b) => (p[a.tipoUsuario]||99)-(p[b.tipoUsuario]||99));

            users.forEach(u => {
                const tr=document.createElement("tr");
                tr.setAttribute("data-user-id",u.id);
                tr.setAttribute("data-user-email",u.email);
                tr.innerHTML=`<td>${u.nome}</td><td>${u.email}</td><td><span class="tag tag-${u.tipoUsuario.toLowerCase()}">${u.tipoUsuario}</span></td>`;
                tr.onclick=()=>{
                    tabelaUsuarios.querySelectorAll("tr").forEach(x=>x.classList.remove("selected"));
                    tr.classList.add("selected");
                };
                tabelaUsuarios.appendChild(tr);
            });
        });
    }

    if(atualizarListaBtn) atualizarListaBtn.onclick = carregarUsuarios;

    if(removerBtn) {
        removerBtn.onclick = () => {
            const row=tabelaUsuarios.querySelector(".selected");
            if(!row){alert("Selecione um usuário na lista.");return;}
            const id=row.getAttribute("data-user-id");
            if(confirm("Tem certeza que deseja remover este usuário?")) {
                fetch(`${API_BASE}/${id}`, {method:"DELETE"})
                    .then(async r=>{
                        if(r.status === 409) {
                            const txt = await r.text();
                            throw new Error(txt);
                        }
                        if(!r.ok) throw new Error("Erro ao excluir.");
                        alert("✅ Usuário removido!");
                        carregarUsuarios();
                    }).catch(e=>alert(e.message));
            }
        };
    }

    // =================== MODAL PERMISSÕES ===================
    const setChecked = (name, value) => { const el = permsForm.elements[name]; if (el) el.checked = value || false; };
    const getChecked = (name) => { const el = permsForm.elements[name]; return el ? el.checked : false; };

    if (editPermsBtn) {
        editPermsBtn.onclick = () => {
            const row = tabelaUsuarios.querySelector(".selected");
            if (!row) { alert("Selecione um usuário na lista."); return; }
            const email = row.getAttribute("data-user-email");

            fetch(API_BASE).then(r => r.json()).then(lista => {
                const user = lista.find(u => u.email === email);
                if (!user) return;

                if (user.tipoUsuario === "ADMIN" || user.tipoUsuario === "SUPER_ADMIN") {
                    alert("🔒 Admins possuem acesso total por padrão.");
                    return;
                }

                permsTitle.textContent = `Permissões: ${user.nome}`;
                permsModal.dataset.editingUserId = user.id;
                const p = user.permissao || {};

                setChecked('dashboard_access', p.verDashboard);
                setChecked('acoes_access', p.verAcoes); setChecked('acoes_edit', p.editarAcoes);
                setChecked('kanban_access', p.verKanban); setChecked('kanban_edit', p.editarKanban);
                setChecked('financeiro_access', p.verFinanceiro); setChecked('financeiro_edit', p.editarFinanceiro);
                setChecked('configuracoes_access', p.verConfiguracoes);

                document.querySelectorAll('.access-cb').forEach(cb => cb.dispatchEvent(new Event('change')));
                permsModal.style.display = "flex";
            });
        };
    }

    document.querySelectorAll('.access-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const row = e.target.closest('.permission-row');
            const editCb = row.querySelector('.edit-cb');
            if (editCb) {
                if (!e.target.checked) {
                    editCb.checked = false;
                    editCb.disabled = true;
                } else {
                    editCb.disabled = false;
                }
            }
        });
    });

    if (permsForm) {
        permsForm.onsubmit = (e) => {
            e.preventDefault();
            const id = permsModal.dataset.editingUserId;

            const payload = {
                verDashboard: getChecked('dashboard_access'), editarDashboard: false,
                verAcoes: getChecked('acoes_access'), editarAcoes: getChecked('acoes_edit'),
                verKanban: getChecked('kanban_access'), editarKanban: getChecked('kanban_edit'),
                verFinanceiro: getChecked('financeiro_access'), editarFinanceiro: getChecked('financeiro_edit'),
                verConfiguracoes: getChecked('configuracoes_access'), editarConfiguracoes: false
            };

            fetch(`${API_BASE}/${id}/permissoes`, {
                method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
            }).then(r => {
                if(!r.ok) throw new Error();
                alert("✅ Permissões salvas com sucesso!");
                permsModal.style.display = "none";
                carregarUsuarios();
            }).catch(() => alert("Erro ao salvar permissões."));
        };
    }

    if(closePermsBtn) {
        closePermsBtn.onclick = () => {
            permsModal.style.display = "none";
        };
    }
    window.onclick = (e) => { if (e.target === permsModal) permsModal.style.display = "none"; };

    // =================== SENHA ===================
    const segForm = document.getElementById("segurancaForm");

    function carregarDadosSeguranca() {
        fetch(`${API_BASE}/me`).then(r=>r.json()).then(u => {
            if(document.getElementById("emailVinculado")) document.getElementById("emailVinculado").value = u.email;
            localStorage.setItem("userId", u.id);
        }).catch(console.error);
    }

    if(segForm) {
        carregarDadosSeguranca();

        segForm.onsubmit = (e) => {
            e.preventDefault();
            const atual = document.getElementById("senhaAtual").value.trim();
            const nova = document.getElementById("novaSenha").value.trim();
            const conf = document.getElementById("confirmarSenha").value.trim();
            const id = localStorage.getItem("userId");

            if(!id) { alert("Erro de sessão. Recarregue a página."); return; }
            if(!atual) { alert("Digite sua senha atual."); return; }
            if(!nova) { alert("Digite a nova senha."); return; }
            if(nova !== conf) { alert("As senhas não conferem!"); return; }

            const url = `${API_BASE}/${id}/senha?senhaAtual=${encodeURIComponent(atual)}&novaSenha=${encodeURIComponent(nova)}`;

            fetch(url, { method: "PUT" })
                .then(async (res) => {
                    if(!res.ok) {
                        const errorText = await res.text();
                        throw new Error(errorText || "Erro ao alterar senha.");
                    }
                    alert("✅ Senha alterada com sucesso!");
                    segForm.reset();
                    carregarDadosSeguranca();
                })
                .catch((err) => alert("❌ " + err.message));
        };
    }

    document.querySelectorAll(".toggle-password").forEach(i => {
        i.onclick = () => {
            const el = document.getElementById(i.dataset.target);
            el.type = el.type === "password" ? "text" : "password";
            i.classList.toggle("fa-eye"); i.classList.toggle("fa-eye-slash");
        };
    });

    if(document.getElementById("administracao") && document.getElementById("administracao").classList.contains("active")) {
        carregarUsuarios();
    }
});