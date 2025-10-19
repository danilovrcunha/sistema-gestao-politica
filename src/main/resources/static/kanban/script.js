document.addEventListener("DOMContentLoaded", () => {
    const taskLists = document.querySelectorAll(".task-list");
    let draggedItem = null;

    // 🔹 Início do arraste
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

    // 🔹 Permite soltar nas colunas
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

                // 🔹 Atualiza no backend
                atualizarStatusNoBanco(tarefaId, novoStatus);
            }
        });
    });

    // 🔹 Mapeia o status da coluna → Enum do backend
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

    // 🔹 Atualiza o status no banco de dados
    function atualizarStatusNoBanco(id, novoStatus) {
        fetch(`/tarefas/${id}/status?novoStatus=${novoStatus}`, {
            method: "PUT",
        })
            .then(response => {
                if (!response.ok) throw new Error("Erro ao atualizar status");
                console.log(`✅ Tarefa ${id} atualizada para ${novoStatus}`);
            })
            .catch(error => {
                console.error("❌ Erro:", error);
                alert("Erro ao atualizar o status da tarefa.");
            });
    }
});
