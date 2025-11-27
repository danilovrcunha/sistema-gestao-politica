package residencia.sistema_gestao_politica.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import residencia.sistema_gestao_politica.model.Acao;
import residencia.sistema_gestao_politica.model.Financeiro;
import residencia.sistema_gestao_politica.model.Tarefa;
import residencia.sistema_gestao_politica.model.enums.StatusTarefa;
import residencia.sistema_gestao_politica.repository.AcaoRepository;
import residencia.sistema_gestao_politica.repository.FinanceiroRepository;
import residencia.sistema_gestao_politica.repository.TarefaRepository;

import java.text.Normalizer;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ChatService {

    @Autowired private AcaoRepository acaoRepository;
    @Autowired private FinanceiroRepository financeiroRepository;
    @Autowired private TarefaRepository tarefaRepository;

    public String processarPergunta(String pergunta, Long gabineteId) {
        if (gabineteId == null) return "⚠️ Selecione um gabinete para que eu possa acessar os dados.";

        String textoOriginal = pergunta.toLowerCase().trim();
        String texto = removerAcentos(textoOriginal);

        if (texto.equals("oi") || texto.equals("ola") || texto.contains("ajuda") || texto.contains("menu") || texto.contains("lista")) {
            return "🤖 **O que eu posso fazer:**\n\n" +
                    "📋 **Tarefas:**\n" +
                    "• 'Tarefas concluídas' (ou 'em andamento', 'a fazer')\n" +
                    "• 'Tarefas do [Nome]'\n" +
                    "• 'Total de tarefas'\n\n" +
                    "💰 **Financeiro:**\n" +
                    "• 'Total gasto' (Detalhado)\n" +
                    "• 'Gastos com Cartão' (Crédito + Débito)\n" +
                    "• 'Gastos de Novembro' (ou 'de 2023')\n" +
                    "• 'Maiores despesas'\n\n" +
                    "📍 **Ações (Mapa):**\n" +
                    "• 'Ações por bairro' (Lista todos)\n" +
                    "• 'Ações no bairro [Nome]'\n" +
                    "• 'Últimas ações' ou 'Ações antigas'\n" +
                    "• 'Ações de 2024'\n\n" +
                    "📊 **Geral:**\n" +
                    "• 'Resumo geral'";
        }

        // ===================================================================================
        // TAREFAS
        // ===================================================================================
        if (texto.contains("tarefa") || texto.contains("trabalho")) {
            if (texto.contains("concluida") || texto.contains("feita") || texto.contains("terminada")) {
                List<Tarefa> lista = tarefaRepository.findTop10ByGabineteIdAndStatusOrderByIdDesc(gabineteId, StatusTarefa.CONCLUIDO);
                return formatarListaTarefas("✅ Tarefas Concluídas Recentemente:", lista);
            }
            if (texto.contains("andamento") || texto.contains("fazendo")) {
                List<Tarefa> lista = tarefaRepository.findTop10ByGabineteIdAndStatusOrderByIdDesc(gabineteId, StatusTarefa.EM_ANDAMENTO);
                return formatarListaTarefas("🚧 Tarefas em Andamento:", lista);
            }
            if (texto.contains("fazer") || texto.contains("pendente") || texto.contains("nova")) {
                List<Tarefa> lista = tarefaRepository.findTop10ByGabineteIdAndStatusOrderByIdDesc(gabineteId, StatusTarefa.A_FAZER);
                return formatarListaTarefas("📌 Tarefas a Fazer:", lista);
            }

            Pattern patternNome = Pattern.compile("\\b(de|do|da|para)\\s+(\\w+)", Pattern.CASE_INSENSITIVE);
            Matcher matcher = patternNome.matcher(textoOriginal);

            if (matcher.find()) {
                String nome = matcher.group(2);
                List<Tarefa> tarefasUser = tarefaRepository.buscarPendentesPorResponsavel(gabineteId, nome);

                if (tarefasUser.isEmpty()) return "Não encontrei tarefas pendentes para **" + capitalize(nome) + "**.";

                StringBuilder sb = new StringBuilder("📋 **Tarefas de " + capitalize(nome) + ":**\n");
                for (Tarefa t : tarefasUser) {
                    sb.append("• ").append(t.getTitulo()).append(" (").append(t.getStatus()).append(")\n");
                }
                return sb.toString();
            }

            // Total de Tarefas
            if (texto.contains("total")) {
                long total = tarefaRepository.findByGabineteId(gabineteId).size();
                return "Total de tarefas no quadro: **" + total + "**.";
            }

            return "Temos um total de " + tarefaRepository.findByGabineteId(gabineteId).size() + " tarefas. Pergunte por status para ver detalhes.";
        }

        // ===================================================================================
        // FINANCEIRO
        // ===================================================================================
        if (texto.contains("gasto") || texto.contains("despesa") || texto.contains("financeiro") || texto.contains("valor") || texto.contains("pix") || texto.contains("dinheiro") || texto.contains("credito") || texto.contains("debito") || texto.contains("cartao")) {

            // Maiores Despesas
            if (texto.contains("maior") || texto.contains("top")) {
                List<Financeiro> tops = financeiroRepository.findTop5ByGabineteIdOrderByValorDespesaDesc(gabineteId);
                if (tops.isEmpty()) return "Não há registros financeiros.";
                StringBuilder sb = new StringBuilder("💰 **Maiores Despesas:**\n");
                for (Financeiro f : tops) sb.append("• ").append(f.getCategoria()).append(": ").append(formatarMoeda(f.getValorDespesa())).append("\n");
                return sb.toString();
            }

            // Filtro Cartão
            if (texto.contains("cartao")) {
                Double credito = nvl(financeiroRepository.somaPorTipo(gabineteId, "Crédito"));
                Double debito = nvl(financeiroRepository.somaPorTipo(gabineteId, "Débito"));
                return "💳 Total em **Cartão** (Crédito + Débito): " + formatarMoeda(credito + debito);
            }

            // Tipos Individuais
            if (texto.contains("pix")) return "💸 Total em **PIX**: " + formatarMoeda(nvl(financeiroRepository.somaPorTipo(gabineteId, "PIX")));
            if (texto.contains("dinheiro")) return "💵 Total em **Dinheiro**: " + formatarMoeda(nvl(financeiroRepository.somaPorTipo(gabineteId, "Dinheiro")));
            if (texto.contains("credito")) return "💳 Total em **Crédito**: " + formatarMoeda(nvl(financeiroRepository.somaPorTipo(gabineteId, "Crédito")));
            if (texto.contains("debito")) return "💳 Total em **Débito**: " + formatarMoeda(nvl(financeiroRepository.somaPorTipo(gabineteId, "Débito")));

            // Gasto Atual / Passado / Por Mês
            int ano = identificarAno(texto);
            if (ano == -1) ano = LocalDate.now().getYear(); //

            int mes = identificarMes(texto);

            if (texto.contains("passado") && mes == -1) {
                LocalDate dataPassada = LocalDate.now().minusMonths(1);
                mes = dataPassada.getMonthValue();
                ano = dataPassada.getYear();
            }
            if (texto.contains("atual") || texto.contains("esse mes")) {
                mes = LocalDate.now().getMonthValue();
                ano = LocalDate.now().getYear();
            }

            if (mes != -1) {
                Double valor = nvl(financeiroRepository.somaDespesasPorMes(gabineteId, mes, ano));
                return "📅 Despesas de **" + nomeDoMes(mes) + "/" + ano + "**: " + formatarMoeda(valor);
            }

            // otal Gasto (Detelhado)
            if (texto.contains("total")) {
                Double totalPix = nvl(financeiroRepository.somaPorTipo(gabineteId, "PIX"));
                Double totalDinheiro = nvl(financeiroRepository.somaPorTipo(gabineteId, "Dinheiro"));
                Double totalCredito = nvl(financeiroRepository.somaPorTipo(gabineteId, "Crédito"));
                Double totalDebito = nvl(financeiroRepository.somaPorTipo(gabineteId, "Débito"));
                Double totalGeral = totalPix + totalDinheiro + totalCredito + totalDebito;

                return "💰 **Detalhamento de Gastos:**\n" +
                        "• PIX: " + formatarMoeda(totalPix) + "\n" +
                        "• Dinheiro: " + formatarMoeda(totalDinheiro) + "\n" +
                        "• Crédito: " + formatarMoeda(totalCredito) + "\n" +
                        "• Débito: " + formatarMoeda(totalDebito) + "\n" +
                        "──────────────\n" +
                        "**Total Geral: " + formatarMoeda(totalGeral) + "**";
            }
        }

        // ===================================================================================
        // AÇÕES
        // ===================================================================================
        if (texto.contains("acao") || texto.contains("acoes")) {

            if (texto.contains("por bairro")) {
                List<Object[]> listaBairros = acaoRepository.contarTodasPorBairro(gabineteId);
                if (listaBairros.isEmpty()) return "Nenhuma ação registrada com bairro identificado.";

                StringBuilder sb = new StringBuilder("📍 **Ações por Bairro:**\n");
                for (Object[] row : listaBairros) {
                    String nomeBairro = (String) row[0];
                    Long qtd = (Long) row[1];
                    if(nomeBairro != null) sb.append("• ").append(nomeBairro).append(": ").append(qtd).append("\n");
                }
                return sb.toString();
            }

            if (texto.contains("no bairro") || texto.contains("no ") || texto.contains("na ")) {
                String bairro = "";
                if (texto.contains("bairro ")) bairro = texto.split("bairro ")[1].trim();
                else if (texto.contains("no ")) bairro = texto.split("no ")[1].trim();

                bairro = bairro.replace("?", "").trim();

                if (!bairro.isEmpty()) {
                    long qtd = acaoRepository.contarPorBairro(gabineteId, bairro);
                    return "📍 Encontrei **" + qtd + "** ações registradas em **" + capitalize(bairro) + "**.";
                }
            }

            if (texto.contains("antiga") || texto.contains("velha") || texto.contains("primeira")) {
                List<Acao> antigas = acaoRepository.findTop5ByGabineteIdOrderByDataAsc(gabineteId);
                return formatarListaAcoes("📜 Primeiras Ações:", antigas);
            }
            if (texto.contains("nova") || texto.contains("recente") || texto.contains("ultima")) {
                List<Acao> recentes = acaoRepository.findTop5ByGabineteIdOrderByDataDesc(gabineteId);
                return formatarListaAcoes("🆕 Ações Recentes:", recentes);
            }

            int mes = identificarMes(texto);
            int ano = identificarAno(texto);

            if (mes != -1 || ano != -1) {
                if (ano == -1) ano = LocalDate.now().getYear();
                LocalDate inicio, fim;
                if (mes != -1) {
                    inicio = LocalDate.of(ano, mes, 1);
                    fim = inicio.withDayOfMonth(inicio.lengthOfMonth());
                } else {
                    inicio = LocalDate.of(ano, 1, 1);
                    fim = LocalDate.of(ano, 12, 31);
                }
                List<Acao> acoes = acaoRepository.findByGabineteIdAndDataBetweenOrderByDataDesc(gabineteId, inicio, fim);
                if(acoes.isEmpty()) return "Nenhuma ação em " + (mes != -1 ? nomeDoMes(mes)+"/" : "") + ano + ".";

                if(acoes.size() > 7) return "🗓️ Encontrei **" + acoes.size() + "** ações em " + (mes != -1 ? nomeDoMes(mes)+"/" : "") + ano + ".";
                return formatarListaAcoes("🗓️ Ações de " + (mes != -1 ? nomeDoMes(mes)+"/" : "") + ano + ":", acoes);
            }

            long total = acaoRepository.findByGabineteId(gabineteId).size();
            return "Total de ações registradas: **" + total + "**.";
        }

        // ===================================================================================
        // RESUMO GERAL
        // ===================================================================================
        if (texto.contains("resumo") || texto.contains("geral") || texto.contains("panorama")) {
            long totalAcoes = acaoRepository.findByGabineteId(gabineteId).size();
            long totalTarefas = tarefaRepository.findByGabineteId(gabineteId).size();

            Double totalGasto = financeiroRepository.findByGabineteId(gabineteId).stream()
                    .mapToDouble(Financeiro::getValorDespesa).sum();

            return String.format("📊 **Resumo do Gabinete:**\n• Total de Ações: %d\n• Total de Tarefas: %d\n• Gasto Total: %s",
                    totalAcoes, totalTarefas, formatarMoeda(totalGasto));
        }

        return "🤔 Não entendi. Digite **'Menu'** para ver o que posso fazer.";
    }

    // ===================================================================================
    // UTILITÁRIOS
    // ===================================================================================

    private Double nvl(Double valor) {
        return valor == null ? 0.0 : valor;
    }

    private String removerAcentos(String str) {
        return Normalizer.normalize(str, Normalizer.Form.NFD).replaceAll("[^\\p{ASCII}]", "");
    }

    private String formatarListaTarefas(String titulo, List<Tarefa> tarefas) {
        if (tarefas.isEmpty()) return "Nenhuma tarefa encontrada.";
        StringBuilder sb = new StringBuilder(titulo + "\n");
        for (Tarefa t : tarefas) {
            String resp = (t.getResponsavel() != null) ? t.getResponsavel().getNome() : (t.getNomeHistorico() != null ? t.getNomeHistorico() : "Sem Responsável");
            sb.append("• ").append(t.getTitulo()).append(" (**").append(resp).append("**)\n");
        }
        return sb.toString();
    }

    private String formatarListaAcoes(String titulo, List<Acao> acoes) {
        if(acoes.isEmpty()) return "Nenhum registro.";
        StringBuilder sb = new StringBuilder(titulo + "\n");
        for (Acao a : acoes) {
            String dataFmt = a.getData() != null ? a.getData().format(DateTimeFormatter.ofPattern("dd/MM/yy")) : "?";
            sb.append("• ").append(dataFmt).append(": ").append(a.getTipoAcao()).append(" em ").append(a.getBairro()).append("\n");
        }
        return sb.toString();
    }

    private String formatarMoeda(Double valor) {
        if (valor == null) valor = 0.0;
        return NumberFormat.getCurrencyInstance(new Locale("pt", "BR")).format(valor);
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    private int identificarMes(String texto) {
        if (texto.contains("janeiro") || texto.contains("/01")) return 1;
        if (texto.contains("fevereiro") || texto.contains("/02")) return 2;
        if (texto.contains("marco") || texto.contains("março") || texto.contains("/03")) return 3;
        if (texto.contains("abril") || texto.contains("/04")) return 4;
        if (texto.contains("maio") || texto.contains("/05")) return 5;
        if (texto.contains("junho") || texto.contains("/06")) return 6;
        if (texto.contains("julho") || texto.contains("/07")) return 7;
        if (texto.contains("agosto") || texto.contains("/08")) return 8;
        if (texto.contains("setembro") || texto.contains("/09")) return 9;
        if (texto.contains("outubro") || texto.contains("/10")) return 10;
        if (texto.contains("novembro") || texto.contains("/11")) return 11;
        if (texto.contains("dezembro") || texto.contains("/12")) return 12;
        return -1;
    }

    private int identificarAno(String texto) {
        Pattern p = Pattern.compile("\\b(20\\d{2})\\b");
        Matcher m = p.matcher(texto);
        if (m.find()) return Integer.parseInt(m.group(1));
        return -1;
    }

    private String nomeDoMes(int mes) {
        String[] meses = {"Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"};
        return (mes >= 1 && mes <= 12) ? meses[mes - 1] : "";
    }
}