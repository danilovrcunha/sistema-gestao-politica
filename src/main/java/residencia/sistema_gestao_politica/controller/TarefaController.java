package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import residencia.sistema_gestao_politica.model.Tarefa;
import residencia.sistema_gestao_politica.model.enums.StatusTarefa;
import residencia.sistema_gestao_politica.repository.TarefaRepository;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tarefas")
public class TarefaController {

    @Autowired
    private TarefaRepository tarefaRepository;

    public static record ResponsavelResumo(Long id, String nome, Long qtd) {}

    @GetMapping("/responsaveis")
    public List<ResponsavelResumo> getResponsaveis() {
        List<Tarefa> todas = tarefaRepository.findAll();

        Map<Long, Long> contagemPorId = todas.stream()
                .collect(Collectors.groupingBy(t -> t.getResponsavel().getId(), LinkedHashMap::new, Collectors.counting()));

        List<ResponsavelResumo> lista = new ArrayList<>();
        for (Map.Entry<Long, Long> e : contagemPorId.entrySet()) {
            Long respId = e.getKey();
            Long qtd = e.getValue();
            String nome = todas.stream().filter(t -> t.getResponsavel().getId().equals(respId))
                    .map(t -> t.getResponsavel().getNome()).findFirst().orElse("Sem nome");
            lista.add(new ResponsavelResumo(respId, nome, qtd));
        }

        lista.sort(Comparator.comparing(ResponsavelResumo::qtd).reversed().thenComparing(ResponsavelResumo::nome));
        return lista;
    }

    @GetMapping("/status")
    public Map<String, Long> getStatus(@RequestParam(required = false) Long responsavelId) {
        List<Tarefa> base = tarefaRepository.findAll();
        if (responsavelId != null) {
            base = base.stream().filter(t -> t.getResponsavel().getId().equals(responsavelId)).toList();
        }

        long aFazer = base.stream().filter(t -> t.getStatus() == StatusTarefa.A_FAZER).count();
        long emAndamento = base.stream().filter(t -> t.getStatus() == StatusTarefa.EM_ANDAMENTO).count();
        long concluido = base.stream().filter(t -> t.getStatus() == StatusTarefa.CONCLUIDO).count();

        Map<String, Long> result = new HashMap<>();
        result.put("aFazer", aFazer);
        result.put("emAndamento", emAndamento);
        result.put("concluido", concluido);
        return result;
    }

    @GetMapping("/progresso")
    public Map<String, Object> getProgresso(@RequestParam(required = false) Long responsavelId) {
        // Ordem fixa de meses para o gráfico
        List<String> meses = Arrays.asList("Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez");

        Map<String, Long> novas = new LinkedHashMap<>();
        Map<String, Long> concluidas = new LinkedHashMap<>();
        Map<String, Long> aFazer = new LinkedHashMap<>();
        meses.forEach(m -> { novas.put(m,0L); concluidas.put(m,0L); aFazer.put(m,0L); });

        List<Tarefa> base = tarefaRepository.findAll();
        if (responsavelId != null) {
            base = base.stream().filter(t -> t.getResponsavel().getId().equals(responsavelId)).toList();
        }

        for (Tarefa t : base) {
            String mes = t.getMes();
            if (!novas.containsKey(mes)) continue;

            novas.put(mes, novas.get(mes) + 1);
            if (t.getStatus() == StatusTarefa.CONCLUIDO) {
                concluidas.put(mes, concluidas.get(mes) + 1);
            }
            if (t.getStatus() == StatusTarefa.A_FAZER) {
                aFazer.put(mes, aFazer.get(mes) + 1);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("meses", meses);
        result.put("novas", novas);
        result.put("concluidas", concluidas);
        result.put("aFazer", aFazer);
        return result;
    }
}
