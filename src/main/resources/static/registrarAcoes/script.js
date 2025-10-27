document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileName');
    const imagePreview = document.getElementById('imagePreview');
    const form = document.getElementById('registroForm');
    const submitBtn = document.getElementById('submitBtn');

    // 🟢 1. Quando clicar na área de upload → abre o gerenciador de arquivos
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // 🟢 2. Quando selecionar o arquivo → mostrar nome e preview
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = file.name;

            // preview
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview da Imagem" 
                         style="max-width: 200px; border-radius: 8px; margin-top: 8px;">
                `;
            };
            reader.readAsDataURL(file);
        } else {
            fileNameDisplay.textContent = 'Selecionar Imagem';
            imagePreview.innerHTML = '';
        }
    });

    // 🟢 3. Enviar o formulário + imagem para o backend
    submitBtn.addEventListener('click', async () => {
        if (form.checkValidity()) {
            const formData = new FormData();

            // Cria o objeto da ação
            const acao = {
                cidade: form.cidade.value,
                bairro: form.bairro.value,
                tipoAcao: form.tipoAcao.value,
                data: form.data.value,
                observacoes: form.observacoes.value
            };

            // Adiciona os dados e imagem no FormData
            formData.append('acao', JSON.stringify(acao));
            if (fileInput.files.length > 0) {
                formData.append('imagem', fileInput.files[0]);
            }

            try {
                const response = await fetch('/api/acoes', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    alert('Ação registrada com sucesso!');
                    form.reset();
                    fileNameDisplay.textContent = 'Selecionar Imagem';
                    imagePreview.innerHTML = '';
                } else {
                    alert('Erro ao registrar ação.');
                }
            } catch (err) {
                console.error('Erro:', err);
                alert('Falha ao conectar com o servidor.');
            }
        } else {
            form.reportValidity();
        }
    });
});
