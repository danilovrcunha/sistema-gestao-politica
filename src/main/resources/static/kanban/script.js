document.addEventListener("DOMContentLoaded", () => {
    const taskLists = document.querySelectorAll(".task-list");
    let draggedItem = null;

    // =================== NOVO: AJUSTAR LINK "NOVA TAREFA" (SUPER ADMIN) ===================
    function ajustarLinkNovaTarefa() {
        const role = localStorage.getItem("userRole");
        const filtroId = localStorage.getItem("superAdminGabineteFilter");
        const btnNova = document.querySelector('.new-task-btn'); // Botão no HTML

        if (btnNova && role === "SUPER_ADMIN" && filtroId) {
            // Altera o link para já levar o ID do gabinete na URL (ex: /criarTarefa?gabineteId=5)
            btnNova.href = `/criarTarefa?gabineteId=${filtroId}`;
            console.log("🔗 Link 'Nova Tarefa' ajustado para filtro:", filtroId);
        }
    }
    // Chama imediatamente ao carregar
    ajustarLinkNovaTarefa();


    // =================== SEGURANÇA E EDIÇÃO ===================
    function aplicarSegurancaKanban() {
        // Verifica se a função existe e se a permissão é falsa
        if (window.podeEditar && !window.podeEditar("editarKanban")) {
            console.log("🔒 Modo Leitura: Kanban");

            // 1. Remove botão "Nova Tarefa"
            const btnNova = document.querySelector(".new-task-btn");
            if (btnNova) btnNova.style.display = "none";

            // 2. Remove botões de lixeira dos cards já renderizados
            document.querySelectorAll(".delete-task-btn").forEach(btn => btn.remove());

            // 3. Trava Drag & Drop visualmente
            document.querySelectorAll(".task-card").forEach(card => {
                card.setAttribute("draggable", "false");
                card.style.cursor = "default";
            });
        }
    }

    // Espera as permissões carregarem ou executa se já tiver em cache
    if (localStorage.getItem("userRole")) aplicarSegurancaKanban();
    document.addEventListener("permissoesCarregadas", aplicarSegurancaKanban);


    // =================== LÓGICA KANBAN ===================
    function mapearStatus(coluna) {
        switch (coluna) {
            case "todo": return "A_FAZER";
            case "in-progress": return "EM_ANDAMENTO";
            case "done": return "CONCLUIDO";
            default: return "A_FAZER";
        }
    }

    function atualizarStatusNoBanco(id, novoStatus) {
        // Bloqueio de segurança
        if (window.podeEditar && !window.podeEditar("editarKanban")) return;

        fetch(`/tarefas/${id}/status?novoStatus=${novoStatus}`, { method: "PUT" })
            .then(r => { if (!r.ok) throw new Error(); })
            .catch(() => alert("Erro ao atualizar status."));
    }

    function excluirTarefa(id, card) {
        // Bloqueio de segurança
        if (window.podeEditar && !window.podeEditar("editarKanban")) {
            alert("Sem permissão para excluir.");
            return;
        }
        if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
            fetch(`/tarefas/${id}`, { method: "DELETE" })
                .then(r => {
                    if (!r.ok) throw new Error();
                    card.remove();
                })
                .catch(() => alert("Erro ao excluir."));
        }
    }

    // Drag & Drop Events
    document.querySelectorAll(".task-card").forEach(card => {
        card.addEventListener("dragstart", e => {
            // Bloqueio final de segurança ao tentar arrastar
            if (window.podeEditar && !window.podeEditar("editarKanban")) {
                e.preventDefault();
                return false;
            }
            draggedItem = e.target;
            e.target.style.opacity = "0.5";
        });

        card.addEventListener("dragend", e => {
            e.target.style.opacity = "1";
            draggedItem = null;
        });
    });

    taskLists.forEach(list => {
        list.addEventListener("dragover", e => {
            if (window.podeEditar && !window.podeEditar("editarKanban")) return;
            e.preventDefault();
            list.style.backgroundColor = "#e9ecef";
        });

        list.addEventListener("dragleave", () => {
            list.style.backgroundColor = "";
        });

        list.addEventListener("drop", e => {
            e.preventDefault();
            list.style.backgroundColor = "";

            // Verifica se pode editar antes de mover no DOM
            if (draggedItem && window.podeEditar && window.podeEditar("editarKanban")) {
                list.appendChild(draggedItem);
                const tarefaId = draggedItem.getAttribute("data-id");
                const novoStatus = mapearStatus(list.getAttribute("data-status"));
                atualizarStatusNoBanco(tarefaId, novoStatus);
            }
        });
    });

    // Botões de Exclusão
    document.querySelectorAll(".delete-task-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            e.stopPropagation();
            const card = e.target.closest(".task-card");
            excluirTarefa(card.getAttribute("data-id"), card);
        });
    });
});