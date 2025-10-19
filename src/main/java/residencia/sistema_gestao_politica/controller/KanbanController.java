package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import residencia.sistema_gestao_politica.model.Tarefa;
import residencia.sistema_gestao_politica.model.enums.StatusTarefa;
import residencia.sistema_gestao_politica.repository.TarefaRepository;

import java.util.List;
import java.util.stream.Collectors;

@Controller
public class KanbanController {

    @Autowired
    private TarefaRepository tarefaRepository;

    @GetMapping("/kanban")
    public String exibirKanban(Model model) {
        List<Tarefa> todasTarefas = tarefaRepository.findAll();

        List<Tarefa> tarefasAFazer = todasTarefas.stream()
                .filter(t -> t.getStatus() == StatusTarefa.A_FAZER)
                .collect(Collectors.toList());

        List<Tarefa> tarefasEmAndamento = todasTarefas.stream()
                .filter(t -> t.getStatus() == StatusTarefa.EM_ANDAMENTO)
                .collect(Collectors.toList());

        List<Tarefa> tarefasConcluidas = todasTarefas.stream()
                .filter(t -> t.getStatus() == StatusTarefa.CONCLUIDO)
                .collect(Collectors.toList());

        model.addAttribute("tarefasAFazer", tarefasAFazer);
        model.addAttribute("tarefasEmAndamento", tarefasEmAndamento);
        model.addAttribute("tarefasConcluidas", tarefasConcluidas);

        return "kanban/kanban";
    }

    // 🔹 NOVO: Atualizar status da tarefa (usado pelo JS ao arrastar)
    @PutMapping("/tarefas/{id}/status")
    @ResponseBody
    public ResponseEntity<String> atualizarStatus(@PathVariable Long id, @RequestParam("novoStatus") String novoStatus) {
        Tarefa tarefa = tarefaRepository.findById(id).orElse(null);

        if (tarefa == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            tarefa.setStatus(StatusTarefa.valueOf(novoStatus));
            tarefaRepository.save(tarefa);
            return ResponseEntity.ok("Status atualizado com sucesso!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Status inválido.");
        }
    }
}
