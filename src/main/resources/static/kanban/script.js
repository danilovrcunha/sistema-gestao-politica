document.addEventListener("DOMContentLoaded", () => {
    const taskLists = document.querySelectorAll(".task-list");
    let draggedItem = null;

    // 🔹 Função: Mapeia status visual → enum backend
    function mapearStatus(coluna) {
        switch (coluna) {
            case "todo":
                return "A_FAZER";
            case "in-progress":
                return "EM_ANDAMENTO";
            case "done":
                return "CONCLUIDO";
            default:
                return "A_FAZER";
        }
    }

    // 🔹 Atualiza status no backend
    function atualizarStatusNoBanco(id, novoStatus) {
        fetch(`/tarefas/${id}/status?novoStatus=${novoStatus}`, {
            method: "PUT",
        })
            .then(response => {
                if (!response.ok) throw new Error("Erro ao atualizar status");
                console.log(`✅ Tarefa ${id} atualizada para ${novoStatus}`);
            })
            .catch(() => alert("Erro ao atualizar o status da tarefa."));
    }

    // 🔹 Excluir tarefa no backend
    function excluirTarefa(id, card) {
        if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
            fetch(`/tarefas/${id}`, { method: "DELETE" })
                .then(response => {
                    if (!response.ok) throw new Error("Erro ao excluir tarefa");
                    card.remove();
                    console.log(`🗑️ Tarefa ${id} excluída com sucesso`);
                })
                .catch(() => alert("Erro ao excluir a tarefa."));
        }
    }

    // 🔹 Arrastar e soltar
    document.querySelectorAll(".task-card").forEach(card => {
        card.addEventListener("dragstart", e => {
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
            e.preventDefault();
            list.style.backgroundColor = "#e9ecef";
        });

        list.addEventListener("dragleave", () => {
            list.style.backgroundColor = "";
        });

        list.addEventListener("drop", e => {
            e.preventDefault();
            list.style.backgroundColor = "";
            if (draggedItem) {
                list.appendChild(draggedItem);
                const tarefaId = draggedItem.getAttribute("data-id");
                const novoStatus = mapearStatus(list.getAttribute("data-status"));
                atualizarStatusNoBanco(tarefaId, novoStatus);
            }
        });
    });

    // 🔹 Eventos do botão de exclusão
    document.querySelectorAll(".delete-task-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            e.stopPropagation(); // evita interferência no drag
            const card = e.target.closest(".task-card");
            const tarefaId = card.getAttribute("data-id");
            excluirTarefa(tarefaId, card);
        });
    });
});
