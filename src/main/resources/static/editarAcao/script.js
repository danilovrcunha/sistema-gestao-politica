// Log inicial para checagem rápida no Console
console.log('[editarAcao] script carregado');

document.addEventListener('DOMContentLoaded', () => {
    // ====== ELEMENTOS ======
    const form            = document.getElementById('registroForm');
    const uploadArea      = document.getElementById('uploadArea');
    const fileInput       = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileName');
    const imagePreview    = document.getElementById('imagePreview');
    const submitBtn       = document.getElementById('submitBtn');
    const removeImageBtn  = document.getElementById('removeImageBtn'); // opcional

    // ====== ESTADO ======
    // Declare antes de usar para evitar ReferenceError
    let removerImagem = false;

    // ====== ID DA AÇÃO ======
    // 1º tenta Thymeleaf; se não vier, pega da URL /editarAcao/:id
    let ACAO_ID = (typeof window.ACAO_ID !== 'undefined' && window.ACAO_ID != null)
        ? String(window.ACAO_ID) : null;

    if (!ACAO_ID) {
        const parts = window.location.pathname.split('/').filter(Boolean);
        ACAO_ID = parts[parts.length - 1];
    }
    const idValido = ACAO_ID && !isNaN(Number(ACAO_ID));
    if (!idValido) {
        console.warn('[editarAcao] ID inválido na URL:', ACAO_ID, '— PUT será bloqueado, mas listeners seguem ativos.');
    } else {
        console.log('[editarAcao] ACAO_ID =', ACAO_ID);
    }

    // ====== HANDLERS ======
    // Abrir seletor de arquivo (cliques na área e no nome)
    const openFilePicker = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (fileInput) fileInput.click();
    };
    [uploadArea, fileNameDisplay].forEach(el => el && el.addEventListener('click', openFilePicker));

    // Preview da imagem escolhida
    fileInput && fileInput.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
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
            if (removeImageBtn) removeImageBtn.style.display = 'inline-block';
        } else {
            fileNameDisplay.textContent = 'Selecionar Imagem';
            imagePreview.innerHTML = '';
        }
    });

    // Remover imagem existente (opcional)
    removeImageBtn && removeImageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        imagePreview.innerHTML = '';
        if (fileInput) fileInput.value = '';
        fileNameDisplay.textContent = 'Selecionar Imagem';
        removerImagem = true;
        removeImageBtn.style.display = 'none';
    });

    // ====== CARREGAR DADOS EXISTENTES ======
    if (idValido) {
        fetch(`/api/acoes/${ACAO_ID}`, { method: 'GET', credentials: 'same-origin' })
            .then(async (res) => {
                const ct = res.headers.get('content-type') || '';
                if (!res.ok) {
                    const txt = await res.text().catch(() => '');
                    throw new Error(`GET /api/acoes/${ACAO_ID} -> ${res.status}\n${txt}`);
                }
                if (!ct.includes('application/json')) {
                    const txt = await res.text().catch(() => '');
                    throw new Error('Resposta não-JSON (login?):\n' + txt.slice(0, 300));
                }
                return res.json();
            })
            .then((acao) => {
                if (!form) return;
                form.cidade.value       = acao.cidade       ?? '';
                form.bairro.value       = acao.bairro       ?? '';
                form.tipoAcao.value     = acao.tipoAcao     ?? '';
                form.data.value         = acao.data         ?? ''; // yyyy-MM-dd
                form.observacoes.value  = acao.observacoes  ?? '';

                if (acao.imagem) {
                    fileNameDisplay.textContent = acao.imagem;
                    imagePreview.innerHTML = `
            <img src="/uploads/${acao.imagem}" alt="Imagem atual"
                 style="max-width:200px;border-radius:8px;margin-top:8px;">
          `;
                    if (removeImageBtn) removeImageBtn.style.display = 'inline-block';
                }
            })
            .catch((err) => {
                console.error('❌ Erro ao carregar a ação:', err);
                // Não bloqueia a tela; usuário ainda pode enviar alterações
            });
    }

    // ====== SALVAR ALTERAÇÕES ======
    submitBtn && submitBtn.addEventListener('click', async () => {
        if (!idValido) {
            alert('ID da ação inválido. Volte e selecione uma ação válida na lista.');
            return;
        }
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const acaoPayload = {
            cidade:       form.cidade.value,
            bairro:       form.bairro.value,
            tipoAcao:     form.tipoAcao.value,
            data:         form.data.value,          // yyyy-MM-dd
            observacoes:  form.observacoes.value,
            removerImagem // boolean
        };

        const fd = new FormData();
        fd.append('acao', JSON.stringify(acaoPayload));
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
            fd.append('imagem', fileInput.files[0]);
        }

        try {
            const res = await fetch(`/api/acoes/${ACAO_ID}`, {
                method: 'PUT',
                body: fd,
                credentials: 'same-origin'
                // Se CSRF estiver habilitado, adicionamos os headers aqui
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => '');
                console.error('❌ PUT falhou:', res.status, txt);
                alert(`Erro ao salvar alterações (status ${res.status}). Abra o Console para detalhes.`);
                return;
            }

            alert('✅ Alterações salvas com sucesso!');
            window.location.href = '/acoesRegistradas';
        } catch (err) {
            console.error('❌ Erro de rede no PUT:', err);
            alert('Falha ao conectar com o servidor.');
        }
    });

    // ====== LOGS DE SANIDADE ======
    if (!form)            console.warn('[editarAcao] #registroForm não encontrado.');
    if (!uploadArea)      console.warn('[editarAcao] #uploadArea não encontrado.');
    if (!fileInput)       console.warn('[editarAcao] #fileInput não encontrado.');
    if (!fileNameDisplay) console.warn('[editarAcao] #fileName não encontrado.');
    if (!imagePreview)    console.warn('[editarAcao] #imagePreview não encontrado.');
    if (!submitBtn)       console.warn('[editarAcao] #submitBtn não encontrado.');
});
