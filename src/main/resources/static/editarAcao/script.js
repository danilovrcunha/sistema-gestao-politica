console.log('[editarAcao] Script carregado.');

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registroForm');
    const submitBtn = document.getElementById('submitBtn');

    // Campos de Texto
    const cepInput = document.getElementById('cep');
    const logradouroInput = document.getElementById('logradouro');
    const bairroInput = document.getElementById('bairro');
    const cidadeInput = document.getElementById('cidade');
    const tipoAcaoInput = document.getElementById('tipoAcao');
    const dataInput = document.getElementById('data');
    const obsInput = document.getElementById('observacoes');
    const feedbackCep = document.getElementById('cep-feedback');

    // Campos de Imagem
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileName');
    const imagePreview = document.getElementById('imagePreview');
    const currentImageContainer = document.getElementById('currentImageContainer');
    const currentImage = document.getElementById('currentImage');
    const btnRemoveExisting = document.getElementById('btnRemoveExisting');

    // Variável de controle para deletar a imagem
    let removerImagemFlag = false;

    // 1. Identificar ID da Ação
    let ACAO_ID = window.ACAO_ID;
    if (!ACAO_ID) {
        const parts = window.location.pathname.split('/');
        const possibleId = parts[parts.length - 1];
        if (!isNaN(possibleId)) ACAO_ID = possibleId;
    }

    if (!ACAO_ID) {
        alert('ID da ação não encontrado.');
        return;
    }

    // 2. Carregar Dados Iniciais (GET)
    fetch(`/api/acoes/${ACAO_ID}`)
        .then(res => {
            if (!res.ok) throw new Error('Falha ao buscar dados.');
            return res.json();
        })
        .then(data => {
            // Preencher Campos
            cepInput.value = data.cep || '';
            logradouroInput.value = data.logradouro || '';
            bairroInput.value = data.bairro || '';
            cidadeInput.value = data.cidade || '';
            tipoAcaoInput.value = data.tipoAcao || '';
            dataInput.value = data.data ? data.data.split('T')[0] : '';
            obsInput.value = data.observacoes || '';

            // Lógica de Imagem Existente
            if (data.imagem) {
                // Ajuste o caminho conforme sua configuração de pasta (ex: /uploads/)
                // Se o backend já manda o caminho completo, use data.imagem direto
                currentImage.src = `/uploads/${data.imagem}`;
                currentImageContainer.style.display = 'block';
                fileNameDisplay.textContent = 'Alterar Imagem (Substituir atual)';
            }
        })
        .catch(err => {
            console.error(err);
            alert('Erro ao carregar dados.');
        });

    // 3. Lógica de Busca de CEP (Igual ao registro)
    cepInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 5) val = val.replace(/^(\d{5})(\d)/, '$1-$2');
        e.target.value = val;
    });

    cepInput.addEventListener('blur', async () => {
        const cep = cepInput.value.replace(/\D/g, '');
        if (cep.length !== 8) return;

        feedbackCep.textContent = 'Buscando...';
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (data.erro) {
                feedbackCep.textContent = 'CEP não encontrado';
                feedbackCep.style.color = 'red';
            } else {
                feedbackCep.textContent = 'Ok!';
                feedbackCep.style.color = 'green';
                logradouroInput.value = data.logradouro;
                bairroInput.value = data.bairro;
                cidadeInput.value = data.localidade;
            }
        } catch (e) { console.error(e); }
    });

    // 4. Lógica de Remover Imagem Existente
    btnRemoveExisting.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Deseja remover a imagem atual desta ação?')) {
            currentImageContainer.style.display = 'none'; // Esconde visualmente
            removerImagemFlag = true; // Marca para o backend deletar
            fileInput.value = ''; // Limpa input de nova imagem se houver
            fileNameDisplay.textContent = 'Selecionar Nova Imagem';
        }
    });

    // 5. Preview de Nova Imagem
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Se usuario seleciona nova foto, cancelamos a flag de remover
            // (pois a nova vai substituir a velha de qualquer jeito)
            removerImagemFlag = false;
            currentImageContainer.style.display = 'none'; // Esconde a velha para mostrar a nova

            fileNameDisplay.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (ev) => {
                imagePreview.innerHTML = `
                    <img src="${ev.target.result}" 
                         style="max-width:200px; border-radius:8px; margin-top:10px;">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // 6. Salvar Alterações (PUT)
    submitBtn.addEventListener('click', async () => {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData();
        const acaoObj = {
            id: ACAO_ID,
            cep: cepInput.value,
            logradouro: logradouroInput.value,
            cidade: cidadeInput.value,
            bairro: bairroInput.value,
            tipoAcao: tipoAcaoInput.value,
            data: dataInput.value,
            observacoes: obsInput.value,
            removerImagem: removerImagemFlag // Envia a flag IMPORTANTE
        };

        formData.append('acao', JSON.stringify(acaoObj));
        if (fileInput.files[0]) {
            formData.append('imagem', fileInput.files[0]);
        }

        try {
            submitBtn.textContent = 'Salvando...';
            submitBtn.disabled = true;

            const res = await fetch(`/api/acoes/${ACAO_ID}`, {
                method: 'PUT',
                body: formData
            });

            if (res.ok) {
                alert('Atualizado com sucesso!');
                window.location.href = '/acoesRegistradas';
            } else {
                const txt = await res.text();
                alert('Erro ao atualizar: ' + txt);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Salvar Alterações';
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Salvar Alterações';
        }
    });
});