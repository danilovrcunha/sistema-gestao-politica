console.log('[editarAcao] script carregado ✅');

document.addEventListener('DOMContentLoaded', () => {
    const form            = document.getElementById('registroForm');
    const fileInput       = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileName');
    const imagePreview    = document.getElementById('imagePreview');
    const submitBtn       = document.getElementById('submitBtn');
    const removeImageBtn  = document.getElementById('removeImageBtn');

    if (!fileInput) {
        console.error('⚠️ #fileInput não encontrado no DOM.');
    }

    let removerImagem = false;

    // ====== ID DA AÇÃO ======
    let ACAO_ID = window.ACAO_ID ?? null;
    if (!ACAO_ID) {
        const parts = window.location.pathname.split('/').filter(Boolean);
        ACAO_ID = parts[parts.length - 1];
    }
    const idValido = ACAO_ID && !isNaN(Number(ACAO_ID));
    console.log('[editarAcao] ACAO_ID:', ACAO_ID);

    // ====== PREVIEW IMAGEM ======
    fileInput?.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (file) {
            fileNameDisplay.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = `
          <img src="${e.target.result}" alt="Preview da Imagem"
               style="max-width:200px;border-radius:8px;margin-top:8px;">
        `;
            };
            reader.readAsDataURL(file);
            removerImagem = false;
            removeImageBtn.style.display = 'inline-block';
        } else {
            fileNameDisplay.textContent = 'Selecionar Imagem';
            imagePreview.innerHTML = '';
            removeImageBtn.style.display = 'none';
        }
    });

    // ====== REMOVER IMAGEM ======
    removeImageBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        imagePreview.innerHTML = '';
        if (fileInput) fileInput.value = '';
        fileNameDisplay.textContent = 'Selecionar Imagem';
        removerImagem = true;
        removeImageBtn.style.display = 'none';
    });

    // ====== CARREGAR DADOS EXISTENTES ======
    if (idValido) {
        fetch(`/api/acoes/${ACAO_ID}`)
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then((acao) => {
                if (!form) return;
                form.cidade.value       = acao.cidade ?? '';
                form.bairro.value       = acao.bairro ?? '';
                form.tipoAcao.value     = acao.tipoAcao ?? '';
                form.data.value         = acao.data ? acao.data.split('T')[0] : '';
                form.observacoes.value  = acao.observacoes ?? '';

                if (acao.imagem) {
                    fileNameDisplay.textContent = acao.imagem;
                    imagePreview.innerHTML = `
            <img src="/uploads/${acao.imagem}" alt="Imagem atual"
                 style="max-width:200px;border-radius:8px;margin-top:8px;">
          `;
                    removeImageBtn.style.display = 'inline-block';
                }
            })
            .catch(async (err) => {
                const msg = err.status ? await err.text() : err.message;
                console.error('❌ Erro ao carregar ação:', msg);
                alert('Erro ao carregar os dados da ação.');
            });
    }

    // ====== SALVAR ALTERAÇÕES ======
    submitBtn?.addEventListener('click', async () => {
        if (!idValido) {
            alert('ID inválido. Volte e selecione uma ação válida.');
            return;
        }
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const acaoPayload = {
            cidade:        form.cidade.value,
            bairro:        form.bairro.value,
            tipoAcao:      form.tipoAcao.value,
            data:          form.data.value,
            observacoes:   form.observacoes.value,
            removerImagem,
        };

        const fd = new FormData();
        fd.append('acao', JSON.stringify(acaoPayload));
        if (fileInput?.files?.length > 0) {
            fd.append('imagem', fileInput.files[0]);
        }

        try {
            const res = await fetch(`/api/acoes/${ACAO_ID}`, {
                method: 'PUT',
                body: fd,
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`Erro ao atualizar: ${txt}`);
            }
            alert('✅ Alterações salvas com sucesso!');
            window.location.href = '/acoesRegistradas';
        } catch (err) {
            console.error('❌ Erro no PUT:', err);
            alert('Falha ao salvar alterações.');
        }
    });
});
