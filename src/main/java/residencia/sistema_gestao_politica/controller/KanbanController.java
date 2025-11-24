package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import residencia.sistema_gestao_politica.model.Tarefa;
import residencia.sistema_gestao_politica.model.enums.StatusTarefa;
import residencia.sistema_gestao_politica.repository.TarefaRepository;
import residencia.sistema_gestao_politica.service.MeuUserDetails;

import java.util.List;
import java.util.stream.Collectors;

@Controller
public class KanbanController {

    @Autowired
    private TarefaRepository tarefaRepository;

    // --- ÚNICO MÉTODO GET PARA /kanban ---
    @GetMapping("/kanban")
    public String exibirKanban(Model model, @RequestParam(required = false) Long gabineteId) {
        MeuUserDetails user = (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        List<Tarefa> tarefas;

        if (user.getGabineteId() == null) { // Super Admin
            if (gabineteId != null) {
                tarefas = tarefaRepository.findByGabineteId(gabineteId);
            } else {
                tarefas = tarefaRepository.findAll();
            }
        } else {
            // Admin ou User Comum: Vê apenas do seu gabinete
            tarefas = tarefaRepository.findByGabineteId(user.getGabineteId());
        }

        List<Tarefa> tarefasAFazer = tarefas.stream().filter(t -> t.getStatus() == StatusTarefa.A_FAZER).collect(Collectors.toList());
        List<Tarefa> tarefasEmAndamento = tarefas.stream().filter(t -> t.getStatus() == StatusTarefa.EM_ANDAMENTO).collect(Collectors.toList());
        List<Tarefa> tarefasConcluidas = tarefas.stream().filter(t -> t.getStatus() == StatusTarefa.CONCLUIDO).collect(Collectors.toList());

        model.addAttribute("tarefasAFazer", tarefasAFazer);
        model.addAttribute("tarefasEmAndamento", tarefasEmAndamento);
        model.addAttribute("tarefasConcluidas", tarefasConcluidas);

        return "kanban/kanban";
    }

    @PutMapping("/tarefas/{id}/status")
    @ResponseBody
    public ResponseEntity<String> atualizarStatus(@PathVariable Long id, @RequestParam("novoStatus") String novoStatus) {
        MeuUserDetails user = (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Tarefa tarefa = tarefaRepository.findById(id).orElse(null);

        if (tarefa == null) return ResponseEntity.notFound().build();

        if (user.getGabineteId() != null && !tarefa.getGabinete().getId().equals(user.getGabineteId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Não pode alterar tarefa de outro gabinete");
        }

        try {
            tarefa.setStatus(StatusTarefa.valueOf(novoStatus));
            tarefaRepository.save(tarefa);
            return ResponseEntity.ok("Status atualizado com sucesso!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Status inválido.");
        }
    }

    @DeleteMapping("/tarefas/{id}")
    @ResponseBody
    public ResponseEntity<String> excluirTarefa(@PathVariable Long id) {
        MeuUserDetails user = (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Tarefa tarefa = tarefaRepository.findById(id).orElse(null);

        if (tarefa == null) return ResponseEntity.notFound().build();

        if (user.getGabineteId() != null && !tarefa.getGabinete().getId().equals(user.getGabineteId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Não pode excluir tarefa de outro gabinete");
        }

        try {
            tarefaRepository.delete(tarefa);
            return ResponseEntity.ok("Tarefa excluída com sucesso!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao excluir a tarefa.");
        }
    }
}