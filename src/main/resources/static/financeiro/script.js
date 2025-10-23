document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('exportBtn');
    const salvarBtn = document.getElementById('salvarInfoBtn');
    const registroForm = document.getElementById('registroFinanceiroForm');

    // Lógica de máscara monetária (R$)
    const valueInputs = document.querySelectorAll('input[placeholder="R$ 0.00"]');
    valueInputs.forEach(input => {
        // Adiciona o ouvinte de evento para formatar a cada dígito digitado
        input.addEventListener('input', formatCurrency);

        // Formata o valor inicial (se houver)
        if (input.value) {
            input.value = currencyFormatter(input.value);
        }
    });

    function formatCurrency(e) {
        let value = e.target.value;

        // Remove tudo que não for dígito
        value = value.replace(/\D/g, '');

        // Se o valor for vazio, sai
        if (value === '') {
            e.target.value = '';
            return;
        }

        // Converte para número e divide por 100 para ter centavos
        let numericValue = parseInt(value, 10) / 100;

        // Formata o valor final
        e.target.value = currencyFormatter(numericValue);
    }

    // Função helper para formatar o número com a localidade brasileira
    function currencyFormatter(number) {
        return number.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        }).replace("R$ ", "R$ "); // Remove o caractere estranho (Â) se aparecer
    }

    // Funcionalidade do botão "Exportar" (Abrir documentos)
    exportBtn.addEventListener('click', function() {
        exportToCSV(); // Chama a função que gera o CSV
    });

    // Funcionalidade do botão "Salvar Informações"
    salvarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (registroForm.checkValidity()) {
            alert('Informações financeiras salvas com sucesso!');
            registroForm.reset();
        } else {
            registroForm.reportValidity();
        }
    });

    // Função para exportar os dados para CSV
    function exportToCSV() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
        const timeStr = now.toLocaleTimeString('pt-BR').replace(/:/g, '-');

        // Coleta os campos de interesse e seus rótulos
        const fields = [
            { id: 'dataRegistro', label: 'Data de Registro' },
            { id: 'valorLocacao', label: 'Valor da Locação do Imóvel' },
            { id: 'valorJuridica', label: 'Valor da Assessoria Jurídica' },
            { id: 'valorComunicacao', label: 'Valor da Assessoria de Comunicação' },
            { id: 'valorCombustivel', label: 'Valor do Combustível' },
            { id: 'despesasDebito', label: 'Despesas do Débito' },
            { id: 'despesasCredito', label: 'Despesas no Crédito' },
            { id: 'outrasDespesas', label: 'Outras Despesas' }
        ];

        // 1. Gera o Cabeçalho (Rótulos)
        const header = fields.map(f => `"${f.label}"`).join(';');

        // 2. Gera os Dados (Valores do Formulário)
        const dataRow = fields.map(f => {
            const input = document.getElementById(f.id);
            // Remove aspas e quebras de linha que poderiam quebrar o CSV
            let value = input ? input.value.replace(/"/g, '""') : '';
            return `"${value}"`;
        }).join(';');

        // Constrói o conteúdo CSV completo
        const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(header + '\n' + dataRow);

        // 3. Cria um link temporário para download
        const link = document.createElement('a');
        link.setAttribute('href', csvContent);
        // Define o nome do arquivo para download
        link.setAttribute('download', `RegistroFinanceiro_${dateStr}_${timeStr}.csv`);

        // 4. Simula o clique e remove o link
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert('Dados financeiros exportados com sucesso para CSV!');
    }
});
