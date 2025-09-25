document.addEventListener('DOMContentLoaded', function () {
    let statusChartInstance = null;
    let responsibleChartInstance = null;
    let progressChartInstance = null;

    let responsaveis = [];         // [{id, nome, qtd}, ...]
    let selectedResponsavelId = null;

    // Util: destrói gráfico antigo antes de recriar
    function resetChart(instance) {
        if (instance && typeof instance.destroy === 'function') {
            instance.destroy();
        }
    }

    // ==============================
    // Carrega e desenha: Status (pizza)
    // ==============================
    function loadStatus(responsavelId = null) {
        const url = responsavelId ? `/api/tarefas/status?responsavelId=${responsavelId}` : '/api/tarefas/status';
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const total = data.aFazer + data.emAndamento + data.concluido;
                const perc = (valor) => total > 0 ? ((valor / total) * 100).toFixed(1) : "0.0";

                const percAfazer = perc(data.aFazer);
                const percEmAndamento = perc(data.emAndamento);
                const percConcluido = perc(data.concluido);

                // Atualiza o gráfico
                const ctx = document.getElementById('statusChart').getContext('2d');
                resetChart(statusChartInstance);
                statusChartInstance = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['A Fazer', 'Em Andamento', 'Concluídas'],
                        datasets: [{
                            data: [data.aFazer, data.emAndamento, data.concluido],
                            backgroundColor: ['#f1c40f', '#3498db', '#2ecc71'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.parsed || 0;
                                        const p = perc(value);
                                        return `${label}: ${value} (${p}%)`;
                                    }
                                }
                            }
                        }
                    }
                });

                // Atualiza a legenda em texto
                document.getElementById('percent-afazer').textContent = percAfazer + '%';
                document.getElementById('percent-emandamento').textContent = percEmAndamento + '%';
                document.getElementById('percent-concluido').textContent = percConcluido + '%';
            })
            .catch(err => console.error("Erro ao carregar status:", err));
    }



    // ===================================
    // Carrega e desenha: Responsáveis (barra)
    // ===================================
    function loadResponsaveis() {
        fetch('/api/tarefas/responsaveis')
            .then(res => res.json())
            .then(data => {
                responsaveis = data; // [{id, nome, qtd}]

                const labels = responsaveis.map(r => r.nome);
                const values = responsaveis.map(r => r.qtd);

                const ctx = document.getElementById('responsibleChart').getContext('2d');
                resetChart(responsibleChartInstance);
                responsibleChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Tarefas',
                            data: values,
                            backgroundColor: '#2ecc71',
                            borderRadius: 5
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { beginAtZero: true, grid: { display: false } },
                            y: { grid: { display: false } }
                        },
                        onClick: (evt, elements) => {
                            if (!elements || elements.length === 0) return;
                            const idx = elements[0].index;
                            const resp = responsaveis[idx];
                            if (!resp) return;

                            // Seleciona / alterna filtro
                            if (selectedResponsavelId === resp.id) {
                                selectedResponsavelId = null; // desmarca se clicar no mesmo
                            } else {
                                selectedResponsavelId = resp.id;
                            }

                            // Recarrega gráficos dependentes
                            loadStatus(selectedResponsavelId);
                            loadProgresso(selectedResponsavelId);
                        }
                    }
                });

                // Duplo clique no canvas para limpar filtro
                const canvas = document.getElementById('responsibleChart');
                canvas.addEventListener('dblclick', () => {
                    selectedResponsavelId = null;
                    loadStatus(null);
                    loadProgresso(null);
                });
            })
            .catch(err => console.error("Erro ao carregar responsáveis:", err));
    }

    // ==============================
    // Carrega e desenha: Progresso (barras empilhadas)
    // Azul = Novas | Verde = Concluídas | Amarelo = A Fazer
    // ==============================
    function loadProgresso(responsavelId = null) {
        const url = responsavelId ? `/api/tarefas/progresso?responsavelId=${responsavelId}` : '/api/tarefas/progresso';
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const labels = data.meses; // array
                const novas = Object.values(data.novas);         // Azul
                const concluidas = Object.values(data.concluidas); // Verde
                const aFazer = Object.values(data.aFazer);       // Amarelo

                const ctx = document.getElementById('progressChart').getContext('2d');


                resetChart(progressChartInstance);

                progressChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Novas Tarefas',
                                data: novas,
                                backgroundColor: '#3498db', // Azul
                                borderRadius: 5,
                                stack: 'stack1'
                            },
                            {
                                label: 'Concluídas',
                                data: concluidas,
                                backgroundColor: '#2ecc71', // Verde
                                borderRadius: 5,
                                stack: 'stack1'
                            },
                            {
                                label: 'A Fazer',
                                data: aFazer,
                                backgroundColor: '#f1c40f', // Amarelo
                                borderRadius: 5,
                                stack: 'stack1'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            x: { stacked: true, grid: { display: false } },
                            y: { beginAtZero: true, stacked: true, grid: { color: '#ecf0f1' } }
                        }
                    }
                });
            })
            .catch(err => console.error("Erro ao carregar progresso:", err));
    }

    // Inicializa tudo (sem filtro)
    loadResponsaveis();
    loadStatus(null);
    loadProgresso(null);
});
