document.addEventListener('DOMContentLoaded', async () => {
    const tableBody   = document.getElementById('acoes-tbody');
    const emptyState  = document.getElementById('empty-state');

    async function carregarAcoes() {
        try {
            const res = await fetch('/api/acoes', { credentials: 'same-origin' });
            if (!res.ok) throw new Error(`Falha ao listar ações (${res.status})`);

            const ct = res.headers.get('content-type') || '';
            if (!ct.includes('application/json')) throw new Error('Resposta não-JSON.');

            const acoes = await res.json();

            // limpa sempre antes de preencher
            tableBody.innerHTML = '';

            if (!acoes || acoes.length === 0) {
                emptyState.style.display = 'block';
                return;
            } else {
                emptyState.style.display = 'none';
            }

            acoes.forEach(acao => {
                const row = document.createElement('tr');

                // formata data yyyy-MM-dd -> dd/MM/yyyy
                const dataFmt = acao.data ? formatarData(acao.data) : '';

                row.innerHTML = `
          <td>${sanitize(acao.cidade)}</td>
          <td>${sanitize(acao.bairro)}</td>
          <td>${sanitize(acao.tipoAcao)}</td>
          <td>${dataFmt}</td>
          <td>
            <i class="fas fa-edit edit-icon" data-id="${acao.id}"></i>
            <i class="fas fa-trash-alt trash-icon" data-id="${acao.id}"></i>
          </td>
        `;
                tableBody.appendChild(row);
            });

        } catch (err) {
            console.error('[acoesRegistradas] Erro:', err);
            tableBody.innerHTML = '';
            emptyState.style.display = 'block';
            emptyState.innerHTML = `<em>Erro ao carregar ações.</em>`;
        }
    }

    function formatarData(iso) {
        // espera "yyyy-MM-dd"
        const [y, m, d] = String(iso).split('-');
        if (!y || !m || !d) return iso;
        return `${d}/${m}/${y}`;
    }

    function sanitize(v) {
        return (v ?? '').toString().replace(/[<>&"]/g, (c) =>
            ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c])
        );
    }

    // eventos de clique na tabela
    tableBody.addEventListener('click', async (e) => {
        const target = e.target;

        // Editar: redireciona para página de edição
        if (target.classList.contains('edit-icon')) {
            const id = target.dataset.id;
            if (!id) return alert('Ação sem ID.');
            window.location.href = `/editarAcao/${id}`;
            return;
        }

        // Excluir: DELETE no backend e remove da tela
        if (target.classList.contains('trash-icon')) {
            const id = target.dataset.id;
            if (!id) return;
            if (!confirm('Deseja excluir esta ação?')) return;

            const res = await fetch(`/api/acoes/${id}`, { method: 'DELETE', credentials: 'same-origin' });
            if (res.ok) {
                target.closest('tr')?.remove();
                if (!tableBody.children.length) {
                    emptyState.style.display = 'block';
                }
            } else {
                alert('Erro ao excluir a ação.');
            }
        }
    });

    await carregarAcoes();
});
