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

    private List<Tarefa> getTarefasFiltradas(Long gabineteIdExterno) {
        MeuUserDetails user = getUsuarioLogado();
        if (user.getGabineteId() == null) {
            if (gabineteIdExterno != null) {
                return tarefaRepository.findByGabineteId(gabineteIdExterno);
            }
            return tarefaRepository.findAll();
        }
        return tarefaRepository.findByGabineteId(user.getGabineteId());
    }

    public static record ResponsavelResumo(Long id, String nome, Long qtd) {}

    @GetMapping("/responsaveis")
    public List<ResponsavelResumo> getResponsaveis(@RequestParam(required = false) Long gabineteId) {
        List<Tarefa> todas = getTarefasFiltradas(gabineteId);

        // Mapa: Chave = Nome (Ativo ou Histórico), Valor = Contagem
        Map<String, Long> contagemPorNome = new HashMap<>();
        // Mapa auxiliar para guardar IDs se existirem
        Map<String, Long> idMap = new HashMap<>();

        for (Tarefa t : todas) {
            String nome;
            Long id = -1L; // ID padrão para usuários excluídos

            if (t.getResponsavel() != null) {
                nome = t.getResponsavel().getNome();
                id = t.getResponsavel().getId();
            } else if (t.getNomeHistorico() != null) {
                nome = t.getNomeHistorico();
            } else {
                nome = "Sem Responsável";
            }

            contagemPorNome.put(nome, contagemPorNome.getOrDefault(nome, 0L) + 1);
            if (id != -1L) idMap.put(nome, id);
        }

        List<ResponsavelResumo> lista = new ArrayList<>();
        long fakeId = 9900;

        for (Map.Entry<String, Long> entry : contagemPorNome.entrySet()) {
            Long idFinal = idMap.getOrDefault(entry.getKey(), fakeId++);
            lista.add(new ResponsavelResumo(idFinal, entry.getKey(), entry.getValue()));
        }

        lista.sort(Comparator.comparing(ResponsavelResumo::qtd).reversed().thenComparing(ResponsavelResumo::nome));
        return lista;
    }

    @GetMapping("/status")
    public Map<String, Long> getStatus(@RequestParam(required = false) Long responsavelId,
                                       @RequestParam(required = false) Long gabineteId) {

        List<Tarefa> base = getTarefasFiltradas(gabineteId);

        if (responsavelId != null) {
            // Se o ID for maior que 9000 (fakeId) ou -1, é usuário excluído/sem dono.
            // Filtramos por aqueles sem responsável.
            if (responsavelId == -1L || responsavelId >= 9900) {
                base = base.stream().filter(t -> t.getResponsavel() == null).toList();
            } else {
                base = base.stream()
                        .filter(t -> t.getResponsavel() != null && t.getResponsavel().getId().equals(responsavelId))
                        .toList();
            }
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

        List<Tarefa> base = getTarefasFiltradas(gabineteId);

        if (responsavelId != null) {
            if (responsavelId == -1L || responsavelId >= 9900) {
                base = base.stream().filter(t -> t.getResponsavel() == null).toList();
            } else {
                base = base.stream()
                        .filter(t -> t.getResponsavel() != null && t.getResponsavel().getId().equals(responsavelId))
                        .toList();
            }
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