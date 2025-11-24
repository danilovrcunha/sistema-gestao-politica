document.addEventListener("DOMContentLoaded", () => {
    const taskLists = document.querySelectorAll(".task-list");
    let draggedItem = null;

    // --- SEGURANÇA E EDIÇÃO ---
    function aplicarSegurancaKanban() {
        // Se NÃO pode editar Kanban
        if (!window.podeEditar("editarKanban")) {
            console.log("🔒 Modo Leitura: Kanban");

            // 1. Remove botão "Nova Tarefa"
            const btnNova = document.querySelector(".new-task-btn");
            if (btnNova) btnNova.style.display = "none";

            // 2. Remove botões de lixeira dos cards já renderizados (se houver estático)
            document.querySelectorAll(".delete-task-btn").forEach(btn => btn.remove());

            // 3. Trava Drag & Drop
            document.querySelectorAll(".task-card").forEach(card => {
                card.setAttribute("draggable", "false");
                card.style.cursor = "default";
            });
        }
    }

    // Espera as permissões carregarem
    if (localStorage.getItem("userRole")) aplicarSegurancaKanban();
    document.addEventListener("permissoesCarregadas", aplicarSegurancaKanban);


    // --- LÓGICA KANBAN ---
    function mapearStatus(coluna) {
        switch (coluna) {
            case "todo": return "A_FAZER";
            case "in-progress": return "EM_ANDAMENTO";
            case "done": return "CONCLUIDO";
            default: return "A_FAZER";
        }
    }

    function atualizarStatusNoBanco(id, novoStatus) {
        if (!window.podeEditar("editarKanban")) return;
        fetch(`/tarefas/${id}/status?novoStatus=${novoStatus}`, { method: "PUT" })
            .then(r => { if (!r.ok) throw new Error(); })
            .catch(() => alert("Erro ao atualizar status."));
    }

    function excluirTarefa(id, card) {
        if (!window.podeEditar("editarKanban")) {
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
            // Bloqueio final de segurança
            if (!window.podeEditar("editarKanban")) {
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
            if (!window.podeEditar("editarKanban")) return;
            e.preventDefault();
            list.style.backgroundColor = "#e9ecef";
        });

        list.addEventListener("dragleave", () => {
            list.style.backgroundColor = "";
        });

        list.addEventListener("drop", e => {
            e.preventDefault();
            list.style.backgroundColor = "";
            if (draggedItem && window.podeEditar("editarKanban")) {
                list.appendChild(draggedItem);
                const tarefaId = draggedItem.getAttribute("data-id");
                const novoStatus = mapearStatus(list.getAttribute("data-status"));
                atualizarStatusNoBanco(tarefaId, novoStatus);
            }
        });
    });

    // Botões de Exclusão (Delegate ou direto)
    document.querySelectorAll(".delete-task-btn").forEach(btn => {
        // Se não tem permissão, o btn já foi removido no aplicarSegurancaKanban
        // mas se sobrou algum:
        btn.addEventListener("click", e => {
            e.stopPropagation();
            const card = e.target.closest(".task-card");
            excluirTarefa(card.getAttribute("data-id"), card);
        });
    });
});