console.log('[Ações Registradas] Script carregado.');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verifica e esconde o botão de "Registrar" imediatamente (Segurança Visual)
    verificarBotaoNovo();

    // 2. Carrega a tabela
    carregarTabela();

    // 3. Eventos dos Filtros (NOVO)
    const btnFiltrar = document.getElementById('btnFiltrar');
    const btnLimpar = document.getElementById('btnLimpar');

    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', () => {
            carregarTabela(); // Recarrega aplicando os filtros atuais
        });
    }

    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            document.getElementById('filtroBairro').value = '';
            document.getElementById('filtroMes').value = '';
            carregarTabela(); // Recarrega limpo
        });
    }
});

// Função auxiliar para verificar permissão de forma SEGURA e RÁPIDA
function usuarioPodeEditar() {
    // 1. Tenta usar a função global se ela já existir
    if (typeof window.podeEditar === 'function') {
        return window.podeEditar('editarAcoes');
    }

    // 2. Fallback: Se a global não carregou, verifica direto no localStorage
    const role = localStorage.getItem("userRole");
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true;

    const perms = JSON.parse(localStorage.getItem("userPerms") || "{}");
    return perms['editarAcoes'] === true;
}

function verificarBotaoNovo() {
    if (!usuarioPodeEditar()) {
        // Esconde o botão "+ Registrar Ação"
        const btnNovo = document.querySelector('.register-btn');
        if (btnNovo) btnNovo.style.display = 'none';

        // Esconde qualquer outro botão de criar que tiver na tela
        const actionBtns = document.querySelectorAll('.action-btn.register-btn');
        actionBtns.forEach(btn => btn.style.display = 'none');
    }
}

// Função para buscar dados e preencher a tabela
async function carregarTabela() {
    const tbody = document.getElementById('acoes-tbody');
    const emptyState = document.getElementById('empty-state');

    // Limpa a tabela antes de carregar
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#666;">Carregando...</td></tr>';

    try {
        // =================== MONTAGEM DA URL COM FILTROS ===================
        // 1. Inicia a URL base
        let url = new URL(window.location.origin + '/api/acoes');

        // 2. Filtro do Super Admin (Gabinete)
        const role = localStorage.getItem("userRole");
        const filtroId = localStorage.getItem("superAdminGabineteFilter");
        if (role === "SUPER_ADMIN" && filtroId) {
            url.searchParams.append('gabineteId', filtroId);
            console.log("🔎 Filtrando ações pelo Gabinete ID:", filtroId);
        }

        // 3. Filtros da Tela (Bairro e Mês) - NOVO
        const bairroVal = document.getElementById('filtroBairro')?.value;
        const mesVal = document.getElementById('filtroMes')?.value;

        if (bairroVal && bairroVal.trim() !== '') {
            url.searchParams.append('bairro', bairroVal.trim());
        }
        if (mesVal && mesVal.trim() !== '') {
            url.searchParams.append('mes', mesVal.trim());
        }
        // ======================================================================

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Erro na resposta da API');
        }

        const listaAcoes = await response.json();

        tbody.innerHTML = ''; // Limpa o loading

        if (!listaAcoes || listaAcoes.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        } else {
            if (emptyState) emptyState.style.display = 'none';
        }

        // VERIFICA PERMISSÃO UMA VEZ ANTES DO LOOP
        const podeEditar = usuarioPodeEditar();

        listaAcoes.forEach(acao => {
            const tr = document.createElement('tr');

            let dataFormatada = '-';
            if (acao.data) {
                try {
                    const dataParte = acao.data.split('T')[0];
                    const [ano, mes, dia] = dataParte.split('-');
                    dataFormatada = `${dia}/${mes}/${ano}`;
                } catch (e) { dataFormatada = acao.data; }
            }

            // LÓGICA DOS BOTÕES NA TABELA
            let botoesHtml = '';

            if (podeEditar) {
                botoesHtml = `
                    <a href="/editarAcao/${acao.id}" class="btn-icon edit" title="Editar">
                        <i class="fas fa-edit"></i>
                    </a>
                    <button class="btn-icon delete" onclick="deletarAcao(${acao.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
            } else {
                botoesHtml = `<span style="color:#ccc; font-size:0.85em; font-style:italic;">Somente Leitura</span>`;
            }

            tr.innerHTML = `
                <td>${acao.cidade || '-'}</td>
                <td>${acao.bairro || '-'}</td>
                <td>
                    <span class="badge-tipo">${acao.tipoAcao || 'Geral'}</span>
                </td>
                <td>${dataFormatada}</td>
                <td class="actions-cell">${botoesHtml}</td>
            `;

            if (tbody) tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Erro ao carregar tabela:', err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Erro ao carregar dados.</td></tr>';
    }
}

// Função GLOBAL para deletar
window.deletarAcao = async function(id) {
    // Bloqueio extra no clique
    if (!usuarioPodeEditar()) {
        alert("Acesso Negado: Você não tem permissão para excluir.");
        return;
    }

    if (!id) return;

    if (!confirm('Tem certeza que deseja excluir esta ação? Essa operação não pode ser desfeita.')) {
        return;
    }

    try {
        const res = await fetch(`/api/acoes/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert('Ação excluída com sucesso!');
            carregarTabela();
        } else {
            const txt = await res.text();
            alert('Erro ao excluir: ' + txt);
        }
    } catch (err) {
        console.error(err);
        alert('Erro de conexão com o servidor.');
    }
};