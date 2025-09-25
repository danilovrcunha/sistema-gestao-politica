package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import residencia.sistema_gestao_politica.model.enums.StatusTarefa;
import residencia.sistema_gestao_politica.repository.TarefaRepository;

import java.util.*;

@Controller
public class HomeController {

    @Autowired
    private TarefaRepository tarefaRepository;

    @GetMapping("/home")
    public String home(Model model) {
        // Contagem por status
        model.addAttribute("aFazer", tarefaRepository.countByStatus(StatusTarefa.A_FAZER));
        model.addAttribute("emAndamento", tarefaRepository.countByStatus(StatusTarefa.EM_ANDAMENTO));
        model.addAttribute("concluido", tarefaRepository.countByStatus(StatusTarefa.CONCLUIDO));

        Map<String, Long> tarefasPorResponsavel = new LinkedHashMap<>();
        tarefaRepository.findAll().forEach(t -> {
            String nome = t.getResponsavel().getNome();
            tarefasPorResponsavel.put(nome, tarefasPorResponsavel.getOrDefault(nome, 0L) + 1);
        });
        model.addAttribute("tarefasPorResponsavel", tarefasPorResponsavel);

        return "home/home";
    }
}
