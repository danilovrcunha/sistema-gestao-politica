document.addEventListener('DOMContentLoaded', function() {

    // Função para criar o gráfico de pizza (doughnut) de Status das Tarefas
    function createStatusChart() {
        const statusCtx = document.getElementById('statusChart').getContext('2d');
        new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['A fazer', 'Em andamento', 'Concluído'],
                datasets: [{
                    data: [60, 60, 60],
                    backgroundColor: [
                        '#3498db', // A fazer
                        '#f1c40f', // Em andamento
                        '#2ecc71'  // Concluído
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%', // Tamanho do buraco no centro do gráfico
                plugins: {
                    legend: {
                        display: false // Oculta a legenda do Chart.js, pois usamos uma legenda customizada no HTML
                    },
                    tooltip: {
                        enabled: false // Oculta o tooltip ao passar o mouse
                    }
                }
            }
        });
    }

    // Função para criar o gráfico de barras de Tarefas por Responsável
    function createResponsibleChart() {
        const responsibleCtx = document.getElementById('responsibleChart').getContext('2d');
        new Chart(responsibleCtx, {
            type: 'bar',
            data: {
                labels: ['João Vitor', 'Jean Lucas', 'Gabriel Allan', 'Lucca Denton', 'Júnior Santos', 'Breno Barbosa', 'Bob Marley'],
                datasets: [{
                    label: 'Tarefas Concluídas',
                    data: [80, 90, 110, 115, 85, 95, 75],
                    backgroundColor: '#2ecc71',
                    borderRadius: 5
                }]
            },
            options: {
                indexAxis: 'y', // Define o eixo X como o de valores e o Y como o de rótulos
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Função para criar o gráfico de barras misto de Progresso de Tarefas
    function createProgressChart() {
        const progressCtx = document.getElementById('progressChart').getContext('2d');
        new Chart(progressCtx, {
            type: 'bar',
            data: {
                labels: ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.'],
                datasets: [{
                    label: 'Novas Tarefas',
                    data: [250, 180, 50, 60, 30, 40, 50, 70],
                    backgroundColor: '#3498db',
                    borderRadius: 5
                }, {
                    label: 'Tarefas Concluídas',
                    data: [200, 150, 400, 20, 10, 20, 30, 60],
                    backgroundColor: '#2ecc71',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        stacked: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#ecf0f1'
                        }
                    }
                }
            }
        });
    }

    // Chama as funções para criar os gráficos quando o documento estiver pronto
    createStatusChart();
    createResponsibleChart();
    createProgressChart();
});