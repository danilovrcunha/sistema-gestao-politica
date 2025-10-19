package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import residencia.sistema_gestao_politica.model.Tarefa;
import residencia.sistema_gestao_politica.model.Usuario;
import residencia.sistema_gestao_politica.model.enums.StatusTarefa;
import residencia.sistema_gestao_politica.repository.TarefaRepository;
import residencia.sistema_gestao_politica.repository.UsuarioRepository;

import java.util.List;

@Controller
public class CriarTarefaController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TarefaRepository tarefaRepository;

    // Exibe o formulário de criação
    @GetMapping("/criarTarefa")
    public String exibirFormulario(Model model) {
        List<Usuario> usuarios = usuarioRepository.findAll();
        model.addAttribute("usuarios", usuarios);
        model.addAttribute("tarefa", new Tarefa());
        return "criarTarefa/criarTarefa";
    }

    // Salva a tarefa no banco
    @PostMapping("/criarTarefa")
    public String salvarTarefa(@ModelAttribute Tarefa tarefa) {
        tarefa.setStatus(StatusTarefa.A_FAZER);
        tarefaRepository.save(tarefa);
        return "redirect:/kanban";
    }
}
