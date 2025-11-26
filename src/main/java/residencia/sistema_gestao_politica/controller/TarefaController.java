package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import residencia.sistema_gestao_politica.model.Tarefa;
import residencia.sistema_gestao_politica.model.enums.StatusTarefa;
import residencia.sistema_gestao_politica.repository.TarefaRepository;
import residencia.sistema_gestao_politica.service.MeuUserDetails;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tarefas")
public class TarefaController {

    @Autowired private TarefaRepository tarefaRepository;

    private MeuUserDetails getUsuarioLogado() {
        return (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    // === MÉTODO CENTRAL DE FILTRO ===
    private List<Tarefa> getTarefasFiltradas(Long gabineteIdExterno) {
        MeuUserDetails user = getUsuarioLogado();

        if (user.getGabineteId() == null) { // Super Admin
            if (gabineteIdExterno != null) {
                return tarefaRepository.findByGabineteId(gabineteIdExterno);
            }
            return tarefaRepository.findAll();
        }

        // Admin Comum
        return tarefaRepository.findByGabineteId(user.getGabineteId());
    }

    public static record ResponsavelResumo(Long id, String nome, Long qtd) {}

    @GetMapping("/responsaveis")
    public List<ResponsavelResumo> getResponsaveis(@RequestParam(required = false) Long gabineteId) {
        List<Tarefa> todas = getTarefasFiltradas(gabineteId); // <--- Usa o filtro

        Map<Long, Long> contagem = todas.stream()
                .filter(t -> t.getResponsavel() != null)
                .collect(Collectors.groupingBy(t -> t.getResponsavel().getId(), Collectors.counting()));

        List<ResponsavelResumo> lista = new ArrayList<>();
        for (Map.Entry<Long, Long> e : contagem.entrySet()) {
            String nome = todas.stream()
                    .filter(t -> t.getResponsavel() != null && t.getResponsavel().getId().equals(e.getKey()))
                    .map(t -> t.getResponsavel().getNome())
                    .findFirst().orElse("Desconhecido");
            lista.add(new ResponsavelResumo(e.getKey(), nome, e.getValue()));
        }

        // Adiciona tarefas sem responsável
        long semDono = todas.stream().filter(t -> t.getResponsavel() == null).count();
        if (semDono > 0) lista.add(new ResponsavelResumo(-1L, "Sem Responsável", semDono));

        lista.sort(Comparator.comparing(ResponsavelResumo::qtd).reversed());
        return lista;
    }

    @GetMapping("/status")
    public Map<String, Long> getStatus(@RequestParam(required = false) Long responsavelId,
                                       @RequestParam(required = false) Long gabineteId) {

        List<Tarefa> base = getTarefasFiltradas(gabineteId); // <--- Usa o filtro

        if (responsavelId != null) {
            if(responsavelId == -1L) base = base.stream().filter(t -> t.getResponsavel() == null).toList();
            else base = base.stream().filter(t -> t.getResponsavel() != null && t.getResponsavel().getId().equals(responsavelId)).toList();
        }

        Map<String, Long> result = new HashMap<>();
        result.put("aFazer", base.stream().filter(t -> t.getStatus() == StatusTarefa.A_FAZER).count());
        result.put("emAndamento", base.stream().filter(t -> t.getStatus() == StatusTarefa.EM_ANDAMENTO).count());
        result.put("concluido", base.stream().filter(t -> t.getStatus() == StatusTarefa.CONCLUIDO).count());
        return result;
    }

    @GetMapping("/progresso")
    public Map<String, Object> getProgresso(@RequestParam(required = false) Long responsavelId,
                                            @RequestParam(required = false) Long gabineteId) {

        List<String> meses = Arrays.asList("Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez");
        Map<String, Long> emAndamento = new LinkedHashMap<>();
        Map<String, Long> concluidas = new LinkedHashMap<>();
        Map<String, Long> aFazer = new LinkedHashMap<>();
        meses.forEach(m -> { emAndamento.put(m, 0L); concluidas.put(m, 0L); aFazer.put(m, 0L); });

        List<Tarefa> base = getTarefasFiltradas(gabineteId); // <--- Usa o filtro

        if (responsavelId != null) {
            if(responsavelId == -1L) base = base.stream().filter(t -> t.getResponsavel() == null).toList();
            else base = base.stream().filter(t -> t.getResponsavel() != null && t.getResponsavel().getId().equals(responsavelId)).toList();
        }

        for (Tarefa t : base) {
            String mes = t.getMes();
            if (!emAndamento.containsKey(mes)) continue;
            if (t.getStatus() == StatusTarefa.EM_ANDAMENTO) emAndamento.put(mes, emAndamento.get(mes) + 1);
            if (t.getStatus() == StatusTarefa.CONCLUIDO) concluidas.put(mes, concluidas.get(mes) + 1);
            if (t.getStatus() == StatusTarefa.A_FAZER) aFazer.put(mes, aFazer.get(mes) + 1);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("meses", meses);
        result.put("emAndamento", emAndamento);
        result.put("concluidas", concluidas);
        result.put("aFazer", aFazer);
        return result;
    }
}