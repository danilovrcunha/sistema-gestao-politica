console.log('[Ações Registradas] Script carregado.');

document.addEventListener('DOMContentLoaded', () => {
    carregarTabela();
});

// Função para buscar dados e preencher a tabela
async function carregarTabela() {
    const tbody = document.getElementById('acoes-tbody');
    const emptyState = document.getElementById('empty-state');

    // Limpa a tabela antes de carregar
    tbody.innerHTML = '';

    try {
        // Faz a requisição GET para sua API
        const response = await fetch('/api/acoes');

        if (!response.ok) {
            throw new Error('Erro na resposta da API');
        }

        const listaAcoes = await response.json();

        // Verifica se a lista está vazia
        if (!listaAcoes || listaAcoes.length === 0) {
            emptyState.style.display = 'block';
            return;
        } else {
            emptyState.style.display = 'none';
        }

        // Cria as linhas da tabela
        listaAcoes.forEach(acao => {
            const tr = document.createElement('tr');

            // Formata a data (ex: 2025-11-20 -> 20/11/2025)
            let dataFormatada = '-';
            if (acao.data) {
                // Se vier com hora (T), quebra na data
                const dataParte = acao.data.split('T')[0];
                const [ano, mes, dia] = dataParte.split('-');
                dataFormatada = `${dia}/${mes}/${ano}`;
            }

            tr.innerHTML = `
                <td>${acao.cidade || '-'}</td>
                <td>${acao.bairro || '-'}</td>
                <td>
                    <span class="badge-tipo">${acao.tipoAcao || 'Geral'}</span>
                </td>
                <td>${dataFormatada}</td>
                <td class="actions-cell">
                    <a href="/editarAcao/${acao.id}" class="btn-icon edit" title="Editar">
                        <i class="fas fa-edit"></i>
                    </a>
                    
                    <button class="btn-icon delete" onclick="deletarAcao(${acao.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Erro ao carregar tabela:', err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Erro ao carregar dados.</td></tr>';
    }
}

// Função GLOBAL para deletar (precisa ser acessível pelo onclick do HTML)
window.deletarAcao = async function(id) {
    if (!id) return;

    if (!confirm('Tem certeza que deseja excluir esta ação? Essa operação não pode ser desfeita.')) {
        return;
    }

    try {
        // Chama o endpoint DELETE do Java
        const res = await fetch(`/api/acoes/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert('Ação excluída com sucesso!');
            // Recarrega a tabela para sumir com o item
            carregarTabela();
        } else {
            // Tenta ler a mensagem de erro do backend
            const txt = await res.text();
            alert('Erro ao excluir: ' + txt);
        }
    } catch (err) {
        console.error(err);
        alert('Erro de conexão com o servidor.');
    }
};