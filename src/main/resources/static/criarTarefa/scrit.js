document.addEventListener("DOMContentLoaded", function () {
    const cancelBtn = document.getElementById("cancelBtn");

    // Volta pro Kanban se clicar em Cancelar
    cancelBtn.addEventListener("click", function () {
        window.location.href = "/kanban";
    });
});
