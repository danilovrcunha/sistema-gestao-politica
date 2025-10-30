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
                carregarUsuarios();
            })
            .catch((err) => {
                console.error("❌ Erro ao cadastrar:", err);
                alert("Erro ao cadastrar usuário.");
            });
    });

// =================== ABA SEGURANÇA ===================
    const segurancaForm = document.getElementById("segurancaForm");
    const emailVinculado = document.getElementById("emailVinculado");

    let usuarioLogado = {
        email: localStorage.getItem("userEmail"),
        id: localStorage.getItem("userId")
    };

// 🧠 Preenche o campo de e-mail automaticamente
    if (usuarioLogado.email) {
        emailVinculado.value = usuarioLogado.email;

        // ⚙️ Se ainda não tiver ID, busca pelo e-mail no banco
        if (!usuarioLogado.id) {
            fetch(`http://localhost:8081/usuarios`)
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

// 🧩 Lógica de alteração de senha
    if (segurancaForm) {
        segurancaForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const novaSenha = document.getElementById("novaSenha").value.trim();
            const confirmarSenha = document.getElementById("confirmarSenha").value.trim();

            if (!usuarioLogado.id) {
                alert("Usuário não autenticado! Faça login novamente.");
                return;
            }

            if (!novaSenha || !confirmarSenha) {
                alert("Preencha todos os campos de senha!");
                return;
            }

            if (novaSenha !== confirmarSenha) {
                alert("As senhas não coincidem!");
                return;
            }

            fetch(`http://localhost:8081/usuarios/${usuarioLogado.id}/senha?novaSenha=${encodeURIComponent(novaSenha)}`, {
                method: "PUT",
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
        fetch(API_BASE)
            .then((res) => res.json())
            .then((usuarios) => {
                tabela.innerHTML = "";

                if (!usuarios.length) {
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
                    tr.innerHTML = `
                        <td>${u.nome}</td>
                        <td>${u.email}</td>
                        <td><span class="tag tag-admin">${u.tipoUsuario}</span></td>
                    `;
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

    atualizarListaBtn.addEventListener("click", () => carregarUsuarios());

    // 🔥 NOVO: REMOVER USUÁRIO
    if (removerBtn) {
        removerBtn.addEventListener("click", () => {
            const email = prompt("Digite o e-mail do usuário que deseja remover:");
            if (!email) return;

            // 1️⃣ Busca usuário pelo email
            fetch(API_BASE)
                .then((res) => res.json())
                .then((usuarios) => {
                    const user = usuarios.find((u) => u.email === email);
                    if (!user) {
                        alert("Usuário não encontrado!");
                        return;
                    }

                    // 2️⃣ Confirma exclusão
                    const confirmar = confirm(`Deseja realmente remover ${user.nome}?`);
                    if (!confirmar) return;

                    // 3️⃣ Envia DELETE
                    fetch(`${API_BASE}/${user.id}`, { method: "DELETE" })
                        .then((res) => {
                            if (!res.ok) throw new Error("Erro ao deletar usuário");
                            alert(`✅ Usuário ${user.nome} removido com sucesso!`);
                            carregarUsuarios();
                        })
                        .catch((err) => {
                            console.error("❌ Erro ao remover:", err);
                            alert("Erro ao remover usuário.");
                        });
                })
                .catch((err) => {
                    console.error("❌ Erro ao buscar lista de usuários:", err);
                    alert("Erro ao buscar usuários.");
                });
        });
    }

    // =================== MOSTRAR/OCULTAR SENHA ===================
    document.querySelectorAll(".toggle-password").forEach((icon) => {
        icon.addEventListener("click", () => {
            const target = document.getElementById(icon.dataset.target);
            if (target.type === "password") {
                target.type = "text";
                icon.classList.add("active");
            } else {
                target.type = "password";
                icon.classList.remove("active");
            }
        });
    });
});
