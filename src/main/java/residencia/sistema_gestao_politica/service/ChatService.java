package residencia.sistema_gestao_politica.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import residencia.sistema_gestao_politica.model.Acao;
import residencia.sistema_gestao_politica.model.Financeiro;
import residencia.sistema_gestao_politica.model.Tarefa;
import residencia.sistema_gestao_politica.repository.AcaoRepository;
import residencia.sistema_gestao_politica.repository.FinanceiroRepository;
import residencia.sistema_gestao_politica.repository.TarefaRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired private AcaoRepository acaoRepository;
    @Autowired private FinanceiroRepository financeiroRepository;
    @Autowired private TarefaRepository tarefaRepository;

    @Autowired private GeminiService geminiService;

    public String processarPergunta(String pergunta, Long gabineteId) {
        if (gabineteId == null) return "⚠️ Selecione um gabinete para que eu possa acessar os dados.";

        String texto = pergunta.toLowerCase().trim();

        // CONTEXTO: FINANCEIRO ---
        if (texto.contains("gasto") || texto.contains("despesa") || texto.contains("financeiro") || texto.contains("pix") || texto.contains("valor") || texto.contains("dinheiro")) {
            List<Financeiro> dados = financeiroRepository.findByGabineteId(gabineteId);

            if (dados.isEmpty()) return "Não encontrei nenhum registro financeiro neste gabinete.";

            String contextoDados = dados.stream()
                    .map(f -> String.format("- %s | R$ %.2f | %s | Data: %s",
                            f.getDescricao(), f.getValorDespesa(), f.getTipoTransacao(), f.getDataRegistro()))
                    .collect(Collectors.joining("\n"));

            return geminiService.interpretarDados(contextoDados, pergunta);
        }

        // ---CONTEXTO: TAREFAS ---
        if (texto.contains("tarefa") || texto.contains("pendência") || texto.contains("fazer") || texto.contains("andamento") || texto.contains("concluída")) {
            List<Tarefa> dados = tarefaRepository.findByGabineteId(gabineteId);

            if (dados.isEmpty()) return "Não há tarefas cadastradas no quadro.";

            String contextoDados = dados.stream()
                    .map(t -> String.format("- Tarefa: %s | Status: %s | Responsável: %s",
                            t.getTitulo(),
                            t.getStatus(),
                            (t.getResponsavel() != null ? t.getResponsavel().getNome() : (t.getNomeHistorico() != null ? t.getNomeHistorico() : "Sem Dono"))))
                    .collect(Collectors.joining("\n"));

            return geminiService.interpretarDados(contextoDados, pergunta);
        }

        // ---CONTEXTO: AÇÕES (MAPA) ---
        if (texto.contains("ação") || texto.contains("ações") || texto.contains("bairro")) {
            List<Acao> dados = acaoRepository.findByGabineteId(gabineteId);

            if (dados.isEmpty()) return "Não há ações registradas no mapa.";

            String contextoDados = dados.stream()
                    .map(a -> String.format("- Ação: %s | Bairro: %s | Cidade: %s | Data: %s",
                            a.getTipoAcao(), a.getBairro(), a.getCidade(), a.getData()))
                    .collect(Collectors.joining("\n"));

            return geminiService.interpretarDados(contextoDados, pergunta);
        }

        // ---RESUMO GERAL---
        if (texto.contains("resumo") || texto.contains("geral")) {
            long totalAcoes = acaoRepository.findByGabineteId(gabineteId).size();
            long totalTarefas = tarefaRepository.findByGabineteId(gabineteId).size();
            return "📊 Resumo Rápido: Temos " + totalAcoes + " ações registradas e " + totalTarefas + " tarefas no quadro.";
        }

        // ---USA O GEMINI PARA CONVERSAR ---
        return geminiService.interpretarDados("Sou um assistente de gabinete.", pergunta);
    }
}