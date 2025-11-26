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

    @GetMapping("/kanban")
    public String exibirKanban(Model model, @RequestParam(required = false) Long gabineteId) {
        MeuUserDetails user = (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        List<Tarefa> tarefas;

        if (user.getGabineteId() == null) { // Super Admin
            if (gabineteId != null) {
                // FILTRA pelo ID da URL
                tarefas = tarefaRepository.findByGabineteId(gabineteId);
            } else {
                // SEM FILTRO: Mostra tudo (Comportamento padrão se clicar no menu sem JS ter atuado)
                tarefas = tarefaRepository.findAll();
            }
        } else {
            // Admin Comum: Vê só o seu
            tarefas = tarefaRepository.findByGabineteId(user.getGabineteId());
        }

        // Filtragem por status
        List<Tarefa> tarefasAFazer = tarefas.stream().filter(t -> t.getStatus() == StatusTarefa.A_FAZER).collect(Collectors.toList());
        List<Tarefa> tarefasEmAndamento = tarefas.stream().filter(t -> t.getStatus() == StatusTarefa.EM_ANDAMENTO).collect(Collectors.toList());
        List<Tarefa> tarefasConcluidas = tarefas.stream().filter(t -> t.getStatus() == StatusTarefa.CONCLUIDO).collect(Collectors.toList());

        model.addAttribute("tarefasAFazer", tarefasAFazer);
        model.addAttribute("tarefasEmAndamento", tarefasEmAndamento);
        model.addAttribute("tarefasConcluidas", tarefasConcluidas);

        return "kanban/kanban";
    }

    // ... Mantenha os métodos PUT e DELETE abaixo (já enviados anteriormente) ...
    @PutMapping("/tarefas/{id}/status")
    @ResponseBody
    public ResponseEntity<String> atualizarStatus(@PathVariable Long id, @RequestParam("novoStatus") String novoStatus) {
        MeuUserDetails user = (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Tarefa tarefa = tarefaRepository.findById(id).orElse(null);
        if (tarefa == null) return ResponseEntity.notFound().build();
        if (user.getGabineteId() != null && !tarefa.getGabinete().getId().equals(user.getGabineteId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acesso negado.");
        }
        try {
            tarefa.setStatus(StatusTarefa.valueOf(novoStatus));
            tarefaRepository.save(tarefa);
            return ResponseEntity.ok("Atualizado");
        } catch (Exception e) { return ResponseEntity.badRequest().body("Erro"); }
    }

    @DeleteMapping("/tarefas/{id}")
    @ResponseBody
    public ResponseEntity<String> excluirTarefa(@PathVariable Long id) {
        MeuUserDetails user = (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Tarefa tarefa = tarefaRepository.findById(id).orElse(null);
        if (tarefa == null) return ResponseEntity.notFound().build();
        if (user.getGabineteId() != null && !tarefa.getGabinete().getId().equals(user.getGabineteId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acesso negado.");
        }
        tarefaRepository.delete(tarefa);
        return ResponseEntity.ok("Deletado");
    }
}