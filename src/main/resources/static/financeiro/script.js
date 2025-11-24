document.addEventListener('DOMContentLoaded', function() {
    // === SELETORES ===
    const registroForm = document.getElementById('registroFinanceiroForm');
    const valorDespesaInput = document.getElementById('valorDespesa');
    const exportBtn = document.querySelector('.export-btn');
    const salvarBtn = document.querySelector('.salvar-btn');
    const acordeaoHeaders = document.querySelectorAll('.acordeao-header');

    // =======================================================
    // === 0. SEGURANÇA (NOVO) ===
    // =======================================================
    function aplicarSegurancaFinanceiro() {
        // Verifica se a função global existe e checa permissão
        if (window.podeEditar && !window.podeEditar("editarFinanceiro")) {
            console.log("🔒 Modo Leitura: Financeiro");

            // 1. Esconde botão "Salvar Informações"
            if (salvarBtn) salvarBtn.style.display = "none";

            // 2. Desabilita os inputs para deixar claro que é só leitura
            const inputs = document.querySelectorAll("#registroFinanceiroForm input, #registroFinanceiroForm select, #registroFinanceiroForm textarea");
            inputs.forEach(i => i.disabled = true);
        }
    }

    // Verifica permissões assim que o global.js avisar ou se já estiver em cache
    if (localStorage.getItem("userRole")) {
        aplicarSegurancaFinanceiro();
    }
    document.addEventListener("permissoesCarregadas", aplicarSegurancaFinanceiro);


    // =======================================================
    // === 1. MÁSCARA MONETÁRIA (FORMATAÇÃO VISUAL)
    // =======================================================
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

    // =======================================================
    // === 2. CONVERSÃO ANTES DE ENVIAR AO BACK-END
    // =======================================================
    if (salvarBtn) {
        salvarBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Bloqueio extra de segurança no clique
            if (window.podeEditar && !window.podeEditar("editarFinanceiro")) {
                alert("Você não tem permissão para criar registros financeiros.");
                return;
            }

            if (!registroForm.checkValidity()) {
                registroForm.reportValidity();
                return;
            }

            // Converte de "R$ 1.234,56" -> "1234.56"
            const valor = valorDespesaInput.value
                .replace(/[R$\s]/g, '')
                .replace(/\./g, '')
                .replace(',', '.');

            valorDespesaInput.value = valor;
            registroForm.submit();
        });
    }

    // =======================================================
    // === 3. EXPORTAÇÃO PARA CSV (UTF-8 + ACENTOS + #### FIX)
    // =======================================================

    // 🔹 Função auxiliar para limpar texto e manter acentos corretos
    function sanitizeCSVText(text) {
        if (!text) return '';
        return text
            .replace(/\u00A0/g, ' ')  // remove espaços invisíveis (Â)
            .replace(/["]/g, '""');   // escapa aspas
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

        // Pega dados do formulário atual para exportar
        const dataRow = fields.map(f => {
            const input = document.getElementById(f.id);
            let value = input ? sanitizeCSVText(input.value) : '';
            // Força o Excel a exibir tudo como texto (evita #####)
            return `"'${value}"'`;
        }).join(';');

        // 🔹 Adiciona BOM UTF-8 para Excel reconhecer acentuação
        const bom = "\uFEFF";

        // 🔹 Limpa possíveis caracteres invisíveis e garante UTF-8
        const cleanData = (header + '\n' + dataRow)
            .replace(/\u00A0/g, ' ')  // remove non-breaking spaces
            .replace(/R\$\s?/g, 'R$ ') // garante espaço após R$
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

    // =======================================================
    // === 4. ACORDEÃO (HISTÓRICO DE TRANSAÇÕES)
    // =======================================================
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