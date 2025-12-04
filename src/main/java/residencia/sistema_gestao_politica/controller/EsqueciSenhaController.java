package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import residencia.sistema_gestao_politica.model.Usuario;
import residencia.sistema_gestao_politica.repository.UsuarioRepository;
import residencia.sistema_gestao_politica.service.EmailService;

import java.util.Optional;
import java.util.UUID;

@Controller
public class EsqueciSenhaController {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService;

    @GetMapping("/esqueci-senha")
    public String abrirPagina() {
        return "login/esqueciSenha";
    }

    @PostMapping("/esqueci-senha")
    public String processarRecuperacao(@RequestParam("email") String email, Model model) {
        Optional<Usuario> optUser = usuarioRepository.findByEmail(email);

        if (optUser.isEmpty()) {
            model.addAttribute("erro", "E-mail não encontrado no sistema.");
            return "login/esqueciSenha";
        }

        Usuario usuario = optUser.get();

        String senhaTemporaria = UUID.randomUUID().toString().substring(0, 8);

        usuario.setPassword(passwordEncoder.encode(senhaTemporaria));
        usuarioRepository.save(usuario);

        try {
            emailService.enviarNovaSenha(email, senhaTemporaria);
            model.addAttribute("sucesso", "Uma nova senha foi enviada para seu e-mail!");
        } catch (Exception e) {
            model.addAttribute("erro", "Erro ao enviar e-mail. Tente novamente.");
            e.printStackTrace();
        }

        return "login/esqueciSenha";
    }
}