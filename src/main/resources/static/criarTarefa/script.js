document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form"); // Pega o form padrão
    const cancelBtn = document.getElementById("cancelBtn");

    // =================== LÓGICA SUPER ADMIN (POST) ===================
    function injetarGabineteId() {
        const role = localStorage.getItem("userRole");
        const filtroId = localStorage.getItem("superAdminGabineteFilter");

        // Se é Super Admin e tem filtro, injeta input hidden
        if (role === "SUPER_ADMIN" && filtroId && form) {
            // Verifica se já existe para não duplicar
            if(!form.querySelector('input[name="gabineteIdSelecionado"]')) {
                let input = document.createElement("input");
                input.type = "hidden";
                input.name = "gabineteIdSelecionado"; // Nome esperado pelo Controller
                input.value = filtroId;
                form.appendChild(input);
                console.log("👑 ID Gabinete (" + filtroId + ") injetado para salvamento.");
            }
        }
    }
    injetarGabineteId();

    // =================== BOTÃO CANCELAR ===================
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            // Tenta voltar com o filtro na URL se possível, ou só volta simples
            const filtroId = localStorage.getItem("superAdminGabineteFilter");
            if (filtroId) window.location.href = `/kanban?gabineteId=${filtroId}`;
            else window.location.href = "/kanban";
        });
    }
});