document.addEventListener('DOMContentLoaded', function() {
    // ============================================================
    // SELETORES
    // ============================================================
    const registroForm = document.getElementById('registroFinanceiroForm');
    const valorDespesaInput = document.getElementById('valorDespesa');
    const exportBtn = document.querySelector('.export-btn');
    const salvarBtn = document.querySelector('.salvar-btn');
    const acordeaoHeaders = document.querySelectorAll('.acordeao-header');

    // seletores de filtro
    const btnFiltrarMes = document.getElementById('btnFiltrarMes');
    const btnLimparFiltro = document.getElementById('btnLimparFiltro');
    const filtroMesInput = document.getElementById('filtroMesInput');

    // ============================================================
    // FUNÇÕES (SEGURANÇA E FILTRO)
    // ============================================================

    // Injeta ID do Gabinete (Super Admin)
    function injetarGabineteId() {
        const role = localStorage.getItem("userRole");
        const filtroId = localStorage.getItem("superAdminGabineteFilter");

        if (role === "SUPER_ADMIN" && filtroId) {
            if (document.getElementById("gabineteIdHidden")) return;
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = "gabineteIdSelecionado";
            input.id = "gabineteIdHidden";
            input.value = filtroId;
            if (registroForm) registroForm.appendChild(input);
        }
    }
    injetarGabineteId();

    // Aplica Permissões (Bloqueia Edição)
    function aplicarSegurancaFinanceiro() {
        if (window.podeEditar && !window.podeEditar("editarFinanceiro")) {
            console.log("🔒 Modo Leitura: Financeiro");

            if (salvarBtn) salvarBtn.style.display = "none";

            // Esconde botões de excluir do histórico
            document.querySelectorAll('.btn-excluir-financa').forEach(btn => btn.style.display = 'none');

            const inputs = document.querySelectorAll("#registroFinanceiroForm input, #registroFinanceiroForm select, #registroFinanceiroForm textarea");
            inputs.forEach(i => i.disabled = true);
        }
    }

    if (localStorage.getItem("userRole")) aplicarSegurancaFinanceiro();
    document.addEventListener("permissoesCarregadas", aplicarSegurancaFinanceiro);

    // Lógica de Filtro por Mês
    if (btnFiltrarMes) {
        btnFiltrarMes.addEventListener('click', () => {
            const mes = filtroMesInput.value;
            if (!mes) { alert("Por favor, selecione um mês."); return; }

            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('mes', mes);
            window.location.search = urlParams.toString();
        });
    }

    if (btnLimparFiltro) {
        btnLimparFiltro.addEventListener('click', () => {
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.delete('mes');
            window.location.search = urlParams.toString();
        });
    }

    // --- MÁSCARA MONETÁRIA ---
    if (valorDespesaInput) {
        valorDespesaInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value === '') {
                e.target.value = '';
                return;
            }
            let numericValue = parseInt(value, 10) / 100;
            e.target.value = numericValue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2
            });
        });

        valorDespesaInput.addEventListener('blur', (e) => {
            if (!e.target.value || e.target.value === 'R$ 0,00') {
                e.target.value = 'R$ 0,00';
            }
        });
    }

    // --- BOTÃO SALVAR ---
    if (salvarBtn) {
        salvarBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if (window.podeEditar && !window.podeEditar("editarFinanceiro")) {
                alert("Sem permissão para salvar.");
                return;
            }

            if (!registroForm.checkValidity()) {
                registroForm.reportValidity();
                return;
            }

            const valor = valorDespesaInput.value
                .replace(/[R$\s]/g, '')
                .replace(/\./g, '')
                .replace(',', '.');

            valorDespesaInput.value = valor;
            registroForm.submit();
        });
    }

    // --- EXPORTAÇÃO CSV ---
    function sanitizeCSVText(text) {
        if (!text) return '';
        return text.replace(/\u00A0/g, ' ').replace(/["]/g, '""');
    }

    function exportToCSV() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
        const timeStr = now.toLocaleTimeString('pt-BR').replace(/:/g, '-');

        const fields = [
            { id: 'dataRegistro', label: 'Data de Registro' },
            { id: 'valorDespesa', label: 'Valor da Despesa' },
            { id: 'tipoTransacao', label: 'Tipo de Transação' },
            { id: 'categoria', label: 'Categoria' },
            { id: 'descricao', label: 'Descrição' },
        ];

        const header = fields.map(f => `"${f.label}"`).join(';');

        const dataRow = fields.map(f => {
            const input = document.getElementById(f.id);
            let value = input ? sanitizeCSVText(input.value) : '';
            return `"'${value}"'`;
        }).join(';');

        const bom = "\uFEFF";
        const cleanData = (header + '\n' + dataRow)
            .replace(/\u00A0/g, ' ')
            .replace(/R\$\s?/g, 'R$ ')
            .trim();

        const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(bom + cleanData);

        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        link.setAttribute('download', `RegistroFinanceiro_${dateStr}_${timeStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert('Dados exportados com sucesso para CSV!');
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exportToCSV();
        });
    }

    // --- ACORDEÃO ---
    if (acordeaoHeaders.length > 0) {
        acordeaoHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const body = this.nextElementSibling;
                this.classList.toggle('active');

                if (body.style.maxHeight) {
                    body.style.maxHeight = null;
                    body.style.paddingTop = '0';
                    body.style.paddingBottom = '0';
                } else {
                    body.style.maxHeight = body.scrollHeight + 30 + "px";
                    body.style.paddingTop = '15px';
                    body.style.paddingBottom = '15px';
                }
                closeOtherAcordeons(this);
            });
        });
    }

    function closeOtherAcordeons(currentHeader) {
        acordeaoHeaders.forEach(header => {
            if (header !== currentHeader && header.classList.contains('active')) {
                header.classList.remove('active');
                const body = header.nextElementSibling;
                body.style.maxHeight = null;
                body.style.paddingTop = '0';
                body.style.paddingBottom = '0';
            }
        });
    }
});

// ============================================================
// FUNÇÃO GLOBAL DE EXCLUSÃO
// ============================================================
window.deletarFinanceiro = function(id) {
    if (window.podeEditar && !window.podeEditar("editarFinanceiro")) {
        alert("Acesso Negado: Você não tem permissão para excluir.");
        return;
    }

    if (confirm("Tem certeza que deseja excluir este registro permanentemente?")) {
        fetch(`/financeiro/${id}`, { method: 'DELETE' })
            .then(async res => {
                if (res.ok) {
                    alert("✅ Registro excluído com sucesso!");
                    window.location.reload();
                } else {
                    const txt = await res.text();
                    alert("Erro ao excluir: " + txt);
                }
            })
            .catch(err => {
                console.error(err);
                alert("Erro de conexão.");
            });
    }
};