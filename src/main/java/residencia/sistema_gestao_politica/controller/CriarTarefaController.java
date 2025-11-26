package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import residencia.sistema_gestao_politica.model.Gabinete;
import residencia.sistema_gestao_politica.model.Tarefa;
import residencia.sistema_gestao_politica.model.Usuario;
import residencia.sistema_gestao_politica.model.enums.StatusTarefa;
import residencia.sistema_gestao_politica.repository.GabineteRepository;
import residencia.sistema_gestao_politica.repository.TarefaRepository;
import residencia.sistema_gestao_politica.repository.UsuarioRepository;
import residencia.sistema_gestao_politica.service.MeuUserDetails;

import java.util.List;

@Controller
public class CriarTarefaController {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private TarefaRepository tarefaRepository;
    @Autowired private GabineteRepository gabineteRepository;

    @GetMapping("/criarTarefa")
    public String exibirFormulario(Model model, @RequestParam(required = false) Long gabineteId) {
        MeuUserDetails user = (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        List<Usuario> usuarios;

        if (user.getGabineteId() == null) { // Super Admin
            if (gabineteId != null) {
                System.out.println("🔍 Super Admin criando tarefa para Gabinete ID: " + gabineteId);
                usuarios = usuarioRepository.findByGabineteId(gabineteId);
            } else {
                System.out.println("⚠️ Super Admin sem filtro: carregando todos os usuários.");
                usuarios = usuarioRepository.findAll();
            }
        } else {
            // Admin Comum
            usuarios = usuarioRepository.findByGabineteId(user.getGabineteId());
        }

        model.addAttribute("usuarios", usuarios);
        model.addAttribute("tarefa", new Tarefa());
        return "criarTarefa/criarTarefa";
    }

    @PostMapping("/criarTarefa")
    public String salvarTarefa(@ModelAttribute Tarefa tarefa, @RequestParam(required = false) Long gabineteIdSelecionado) {
        MeuUserDetails user = (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long finalId = user.getGabineteId();

        // Lógica Super Admin no POST
        if (finalId == null) {
            if (gabineteIdSelecionado != null) {
                finalId = gabineteIdSelecionado;
            } else {
                // Se não veio ID, redireciona para Kanban (segurança)
                return "redirect:/kanban";
            }
        }

        Gabinete g = gabineteRepository.findById(finalId).orElseThrow();
        tarefa.setGabinete(g);
        tarefa.setStatus(StatusTarefa.A_FAZER);

        tarefaRepository.save(tarefa);
        return "redirect:/kanban";
    }
}