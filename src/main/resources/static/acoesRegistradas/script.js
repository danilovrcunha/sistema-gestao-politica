console.log('[Ações Registradas] Script carregado.');

document.addEventListener('DOMContentLoaded', () => {
    verificarBotaoNovo();
    carregarTabela();

    const btnFiltrar = document.getElementById('btnFiltrar');
    const btnLimpar = document.getElementById('btnLimpar');

    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', () => {
            carregarTabela();
        });
    }

    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            document.getElementById('filtroBairro').value = '';
            document.getElementById('filtroMes').value = '';
            carregarTabela();
        });
    }
});

function usuarioPodeEditar() {
    if (typeof window.podeEditar === 'function') {
        return window.podeEditar('editarAcoes');
    }

    const role = localStorage.getItem("userRole");
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true;

    const perms = JSON.parse(localStorage.getItem("userPerms") || "{}");
    return perms['editarAcoes'] === true;
}

function verificarBotaoNovo() {
    if (!usuarioPodeEditar()) {
        const btnNovo = document.querySelector('.register-btn');
        if (btnNovo) btnNovo.style.display = 'none';

        const actionBtns = document.querySelectorAll('.action-btn.register-btn');
        actionBtns.forEach(btn => btn.style.display = 'none');
    }
}

async function carregarTabela() {
    const tbody = document.getElementById('acoes-tbody');
    const emptyState = document.getElementById('empty-state');

    if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#666;">Carregando...</td></tr>';

    try {
        let url = new URL(window.location.origin + '/api/acoes');

        const role = localStorage.getItem("userRole");
        const filtroId = localStorage.getItem("superAdminGabineteFilter");
        if (role === "SUPER_ADMIN" && filtroId) {
            url.searchParams.append('gabineteId', filtroId);
        }

        const bairroVal = document.getElementById('filtroBairro')?.value;
        const mesVal = document.getElementById('filtroMes')?.value;

        if (bairroVal && bairroVal.trim() !== '') {
            url.searchParams.append('bairro', bairroVal.trim());
        }
        if (mesVal && mesVal.trim() !== '') {
            url.searchParams.append('mes', mesVal.trim());
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('Erro na resposta da API');
        }

        const listaAcoes = await response.json();

        tbody.innerHTML = '';

        if (!listaAcoes || listaAcoes.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        } else {
            if (emptyState) emptyState.style.display = 'none';
        }

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
        console.error(err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Erro ao carregar dados.</td></tr>';
    }
}

window.deletarAcao = async function(id) {
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