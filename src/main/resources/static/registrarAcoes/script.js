document.addEventListener('DOMContentLoaded', () => {
    // ============================================================
    // 1. SELETORES DE ELEMENTOS
    // ============================================================
    const form = document.getElementById('registroForm');
    const submitBtn = document.getElementById('submitBtn');

    // Campos de Endereço
    const cepInput = document.getElementById('cep');
    const logradouroInput = document.getElementById('logradouro');
    const bairroInput = document.getElementById('bairro');
    const cidadeInput = document.getElementById('cidade');
    const feedbackCep = document.getElementById('cep-feedback');

    // Campos de Dados da Ação
    const tipoAcaoInput = document.getElementById('tipoAcao');
    const dataInput = document.getElementById('data');
    const obsInput = document.getElementById('observacoes');

    // Upload e Preview
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileName');

    // Container do Preview e Botão de Remover
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const btnRemovePreview = document.getElementById('btnRemovePreview');

    // ============================================================
    // 2. LÓGICA DE UPLOAD, PREVIEW E REMOÇÃO
    // ============================================================

    // Clique na área tracejada abre a janela de arquivos
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // Quando o usuário seleciona um arquivo
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;

            const reader = new FileReader();
            reader.onload = (ev) => {
                // Exibe o container do preview (que tem a borda e o botão X)
                previewContainer.style.display = 'inline-block';

                // Insere a imagem gerada
                imagePreview.innerHTML = `
                    <img src="${ev.target.result}" alt="Preview da Imagem">
                `;
            };
            reader.readAsDataURL(file);
        }
    });

    // Botão da Lixeira (Remover Imagem)
    btnRemovePreview.addEventListener('click', (e) => {
        e.stopPropagation(); // Garante que não clique em nada atrás

        fileInput.value = ''; // Limpa o input file
        fileNameDisplay.textContent = 'Selecionar Imagem'; // Reseta o texto
        previewContainer.style.display = 'none'; // Esconde o container do preview
        imagePreview.innerHTML = ''; // Remove a tag img
    });

    // ============================================================
    // 3. LÓGICA DE BUSCA DE CEP (ViaCEP)
    // ============================================================

    // Máscara simples para o CEP (00000-000)
    cepInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 5) {
            val = val.replace(/^(\d{5})(\d)/, '$1-$2');
        }
        e.target.value = val;
    });

    // Busca automática ao sair do campo (Blur)
    cepInput.addEventListener('blur', async () => {
        const cep = cepInput.value.replace(/\D/g, '');
        if (cep.length !== 8) return;

        feedbackCep.textContent = 'Buscando...';
        feedbackCep.style.color = '#666';

        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();

            if (data.erro) {
                feedbackCep.textContent = 'CEP não encontrado.';
                feedbackCep.style.color = 'red';

                // Limpa campos em caso de erro
                logradouroInput.value = '';
                bairroInput.value = '';
                cidadeInput.value = '';
            } else {
                feedbackCep.textContent = 'Endereço localizado ✓';
                feedbackCep.style.color = 'green';

                // Preenche os campos automaticamente
                logradouroInput.value = data.logradouro;
                bairroInput.value = data.bairro;
                cidadeInput.value = data.localidade;

                // Foca no próximo campo
                tipoAcaoInput.focus();
            }
        } catch (err) {
            feedbackCep.textContent = 'Erro de conexão.';
            feedbackCep.style.color = 'red';
            console.error(err);
        }
    });

    // ============================================================
    // 4. ENVIO DO FORMULÁRIO (COM INJEÇÃO DE GABINETE ID)
    // ============================================================
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        if (form.checkValidity()) {
            const formData = new FormData();

            // Monta o objeto JSON com os dados da ação
            const acao = {
                cep: cepInput.value,
                logradouro: logradouroInput.value,
                cidade: cidadeInput.value,
                bairro: bairroInput.value,
                tipoAcao: tipoAcaoInput.value,
                data: dataInput.value,
                observacoes: obsInput.value
            };

            // Adiciona o JSON stringificado
            formData.append('acao', JSON.stringify(acao));

            // Adiciona a imagem apenas se ela existir
            if (fileInput.files[0]) {
                formData.append('imagem', fileInput.files[0]);
            }

            // --- INJEÇÃO DO ID DO GABINETE (LÓGICA SUPER ADMIN) ---
            const role = localStorage.getItem("userRole");
            const filtroId = localStorage.getItem("superAdminGabineteFilter");

            if (role === "SUPER_ADMIN" && filtroId) {
                formData.append('gabineteId', filtroId);
                console.log("👑 Enviando Ação para Gabinete ID:", filtroId);
            }
            // ------------------------------------------------------

            try {
                submitBtn.textContent = 'Enviando...';
                submitBtn.disabled = true;

                // Envia para o Backend Java
                const res = await fetch('/api/acoes', {
                    method: 'POST',
                    body: formData
                });

                if (res.ok) {
                    alert('Registrado com sucesso!');

                    // Reset completo do formulário
                    form.reset();

                    // Reset manual dos elementos de upload
                    fileInput.value = '';
                    fileNameDisplay.textContent = 'Selecionar Imagem';
                    previewContainer.style.display = 'none';
                    imagePreview.innerHTML = '';
                    feedbackCep.textContent = '';

                } else {
                    const errorText = await res.text();
                    alert('Erro ao salvar: ' + errorText);
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão com o servidor.');
            } finally {
                submitBtn.textContent = '+ Registrar Ação';
                submitBtn.disabled = false;
            }
        } else {
            // Se inválido, mostra os balões de erro nativos do navegador
            form.reportValidity();
        }
    });
});