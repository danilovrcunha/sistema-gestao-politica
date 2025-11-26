document.addEventListener("DOMContentLoaded", () => {
    // Referências do DOM
    const taskLists = document.querySelectorAll(".task-list");
    const cards = document.querySelectorAll(".task-card");
    let draggedItem = null;

    // =========================================================================
    // GESTÃO DE PERMISSÕES E ROLES
    // =========================================================================

    // Ajusta parâmetros de URL para Super Admins (filtro de gabinete)
    function ajustarLinkNovaTarefa() {
        const role = localStorage.getItem("userRole");
        const filtroId = localStorage.getItem("superAdminGabineteFilter");
        const btnNova = document.querySelector('.new-task-btn');

        if (btnNova && role === "SUPER_ADMIN" && filtroId) {
            btnNova.href = `/criarTarefa?gabineteId=${filtroId}`;
        }
    }

    // Aplica restrições de interface (Modo Leitura)
    function aplicarSegurancaKanban() {
        if (window.podeEditar && !window.podeEditar("editarKanban")) {
            console.info("Kanban: Modo leitura ativo.");

            // Remove controles de criação
            const btnNova = document.querySelector(".new-task-btn");
            if (btnNova) btnNova.style.display = "none";

            // Remove controles de exclusão
            document.querySelectorAll(".delete-task-btn").forEach(btn => btn.remove());

            // Desabilita interações de drag & drop
            document.querySelectorAll(".task-card").forEach(card => {
                card.setAttribute("draggable", "false");
                card.style.cursor = "default";
                card.classList.add("locked");
            });
        }
    }

    // Inicialização de segurança
    ajustarLinkNovaTarefa();
    if (localStorage.getItem("userRole")) aplicarSegurancaKanban();
    document.addEventListener("permissoesCarregadas", aplicarSegurancaKanban);

    // =========================================================================
    // LÓGICA DE NEGÓCIO E API
    // =========================================================================

    // Mapeamento: Frontend ID -> Backend Enum
    function mapearStatus(colunaStatus) {
        switch (colunaStatus) {
            case "todo": return "A_FAZER";
            case "in-progress": return "EM_ANDAMENTO";
            case "done": return "CONCLUIDO";
            default: return "A_FAZER";
        }
    }

    // Persistência de mudança de status
    function atualizarStatusNoBanco(id, novoStatus) {
        if (window.podeEditar && !window.podeEditar("editarKanban")) return;

        fetch(`/tarefas/${id}/status?novoStatus=${novoStatus}`, { method: "PUT" })
            .then(response => {
                if (!response.ok) throw new Error("Erro na resposta da API");
            })
            .catch(error => {
                console.error("Falha ao atualizar status:", error);
                alert("Erro de sincronização. Verifique sua conexão.");
            });
    }

    // Exclusão de registros
    function excluirTarefa(id, card) {
        if (window.podeEditar && !window.podeEditar("editarKanban")) {
            alert("Ação não permitida.");
            return;
        }

        if (confirm("Confirma a exclusão permanente desta tarefa?")) {
            fetch(`/tarefas/${id}`, { method: "DELETE" })
                .then(response => {
                    if (!response.ok) throw new Error();
                    card.remove();
                    atualizarContadores();
                })
                .catch(() => alert("Falha ao excluir tarefa."));
        }
    }

    // Atualização dos contadores de coluna na UI
    function atualizarContadores() {
        taskLists.forEach(list => {
            const count = list.children.length;
            const headerCount = list.parentElement.querySelector(".task-count");
            if (headerCount) headerCount.innerText = count;
        });
    }

    // =========================================================================
    // HANDLERS DE DRAG & DROP
    // =========================================================================

    // Configuração dos Cards (Draggables)
    cards.forEach(card => {
        card.addEventListener("dragstart", (e) => {
            if (window.podeEditar && !window.podeEditar("editarKanban")) {
                e.preventDefault();
                return false;
            }

            draggedItem = card;

            // Timeout para garantir renderização correta da imagem de arraste
            setTimeout(() => {
                card.style.opacity = "0.5";
                card.classList.add("dragging");
            }, 0);
        });

        card.addEventListener("dragend", () => {
            if (draggedItem) {
                draggedItem.style.opacity = "1";
                draggedItem.classList.remove("dragging");
                draggedItem = null;
            }

            // Limpeza visual
            taskLists.forEach(list => list.style.backgroundColor = "");
        });
    });

    // Configuração das Colunas (Dropzones)
    taskLists.forEach(list => {
        list.addEventListener("dragover", (e) => {
            e.preventDefault(); // Necessário para permitir o drop

            if (window.podeEditar && !window.podeEditar("editarKanban")) return;

            list.style.backgroundColor = "rgba(0, 0, 0, 0.03)";
        });

        list.addEventListener("dragleave", () => {
            list.style.backgroundColor = "";
        });

        list.addEventListener("drop", (e) => {
            e.preventDefault();
            list.style.backgroundColor = "";

            if (draggedItem) {
                // Manipulação do DOM
                list.appendChild(draggedItem);

                // Preparação de dados para API
                const tarefaId = draggedItem.getAttribute("data-id");
                const colunaStatus = list.getAttribute("data-status");
                const novoStatusBackend = mapearStatus(colunaStatus);

                atualizarStatusNoBanco(tarefaId, novoStatusBackend);
                atualizarContadores();
            }
        });
    });

    // =========================================================================
    // EVENT LISTENERS AUXILIARES
    // =========================================================================

    document.querySelectorAll(".delete-task-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation(); // Previne disparo de eventos no card pai
            const card = e.target.closest(".task-card");
            const id = card.getAttribute("data-id");
            excluirTarefa(id, card);
        });
    });
});