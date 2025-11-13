package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import residencia.sistema_gestao_politica.model.Gabinete;
import residencia.sistema_gestao_politica.model.Usuario;
import residencia.sistema_gestao_politica.model.enums.TipoUsuario;
import residencia.sistema_gestao_politica.repository.GabineteRepository;
import residencia.sistema_gestao_politica.repository.UsuarioRepository;
import residencia.sistema_gestao_politica.service.MeuUserDetails;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioRepository repositorioUsuario;

    @Autowired
    private GabineteRepository repositorioGabinete;

    @Autowired
    private PasswordEncoder passwordEncoder; // Injetado para codificar senhas

    // Helper para pegar o usuário logado
    private MeuUserDetails getUsuarioLogado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof MeuUserDetails)) {
            throw new RuntimeException("Usuário não autenticado.");
        }
        return (MeuUserDetails) authentication.getPrincipal();
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> listarUsuarios() {
        MeuUserDetails userDetails = getUsuarioLogado();

        if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"))) {
            // SUPER_ADMIN vê todos
            return ResponseEntity.ok(repositorioUsuario.findAll());
        } else {
            // ADMIN vê apenas os de seu gabinete
            return ResponseEntity.ok(repositorioUsuario.findByGabineteId(userDetails.getGabineteId()));
        }
    }

    @PostMapping
    public ResponseEntity<?> criarUsuario(@RequestBody Usuario usuario) {
        MeuUserDetails adminLogado = getUsuarioLogado();
        Long gabineteId = adminLogado.getGabineteId();

        if (gabineteId == null) {
            // Se for SUPER_ADMIN, ele PODE criar outros ADMINS
            // Mas ele DEVE fornecer um gabinete_id no corpo da requisição.
            if (usuario.getGabinete() == null || usuario.getGabinete().getId() == null) {
                return ResponseEntity.badRequest().body("SUPER_ADMIN deve especificar um 'gabinete: { id: ... }' para criar usuários.");
            }
            // SUPER_ADMIN pode definir o TipoUsuario
        } else {
            // Se for ADMIN, ele SÓ PODE criar usuários para o PRÓPRIO gabinete
            // E o tipo DEVE ser 'USER'
            Gabinete meuGabinete = repositorioGabinete.findById(gabineteId)
                    .orElseThrow(() -> new RuntimeException("Gabinete do admin não encontrado"));

            usuario.setGabinete(meuGabinete);
            usuario.setTipoUsuario(TipoUsuario.USER); // Força o tipo para USER
        }

        // Codifica a senha antes de salvar
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));

        Usuario salvo = repositorioUsuario.save(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @PutMapping("/{id}/senha")
    public ResponseEntity<?> alterarSenha(@PathVariable Long id, @RequestParam String novaSenha) {
        MeuUserDetails userLogado = getUsuarioLogado();

        // Regra: Usuário só pode alterar a própria senha
        if (!userLogado.getUsuarioId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Você não pode alterar a senha de outro usuário.");
        }

        return repositorioUsuario.findById(id)
                .map(user -> {
                    // Codifica a nova senha
                    user.setPassword(passwordEncoder.encode(novaSenha));
                    repositorioUsuario.save(user);
                    return ResponseEntity.ok("Senha atualizada com sucesso!");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/tipos")
    public ResponseEntity<List<TipoUsuario>> listarTipos() {
        return ResponseEntity.ok(Arrays.asList(TipoUsuario.values()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarUsuario(@PathVariable Long id) {
        MeuUserDetails adminLogado = getUsuarioLogado();
        Long idAdminLogado = adminLogado.getUsuarioId();
        Long gabineteIdAdmin = adminLogado.getGabineteId();

        // Regra 1: Ninguém pode deletar a si mesmo
        if (id.equals(idAdminLogado)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); // 403 Forbidden
        }

        Optional<Usuario> usuarioParaDeletarOpt = repositorioUsuario.findById(id);

        if (usuarioParaDeletarOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Usuario usuarioParaDeletar = usuarioParaDeletarOpt.get();

        // Regra 2: SUPER_ADMIN pode deletar qualquer um (menos ele mesmo)
        if (adminLogado.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"))) {
            repositorioUsuario.deleteById(id);
            return ResponseEntity.noContent().build();
        }

        // Regra 3: ADMIN só pode deletar usuários do SEU gabinete
        if (usuarioParaDeletar.getGabinete() != null && usuarioParaDeletar.getGabinete().getId().equals(gabineteIdAdmin)) {
            // E não pode deletar outro ADMIN (segurança extra)
            if(usuarioParaDeletar.getTipoUsuario() == TipoUsuario.ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build(); // Não pode deletar outro admin
            }
            repositorioUsuario.deleteById(id);
            return ResponseEntity.noContent().build();
        }

        // Se chegou aqui, não é SUPER_ADMIN e o usuário não é do seu gabinete
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
}