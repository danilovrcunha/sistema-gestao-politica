package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
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
    private PasswordEncoder passwordEncoder;

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

        // --- LÓGICA DE CRIAÇÃO ATUALIZADA ---

        if (gabineteId == null) {
            // 1. Lógica do SUPER_ADMIN (Logado)
            // Ele pode criar qualquer tipo, mas deve especificar o gabinete no JSON
            if (usuario.getGabinete() == null || usuario.getGabinete().getId() == null) {
                return ResponseEntity.badRequest().body("SUPER_ADMIN deve especificar um 'gabinete: { id: ... }' para criar usuários.");
            }
        } else {
            // 2. Lógica do ADMIN de Gabinete (Logado)
            Gabinete meuGabinete = repositorioGabinete.findById(gabineteId)
                    .orElseThrow(() -> new RuntimeException("Gabinete do admin não encontrado"));

            // A. Vincula o novo usuário ao mesmo gabinete do Admin logado
            usuario.setGabinete(meuGabinete);

            // B. TRAVA DE SEGURANÇA:
            // Admin de gabinete NÃO pode criar Super Admin.
            if (usuario.getTipoUsuario() == TipoUsuario.SUPER_ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Administradores de gabinete não podem criar Super Admins.");
            }

            // C. Se o tipo não foi enviado, define como USER por padrão.
            // (Isso permite criar ADMIN se o JSON vier com "tipoUsuario": "ADMIN")
            if (usuario.getTipoUsuario() == null) {
                usuario.setTipoUsuario(TipoUsuario.USER);
            }
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
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Optional<Usuario> usuarioParaDeletarOpt = repositorioUsuario.findById(id);

        if (usuarioParaDeletarOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Usuario usuarioParaDeletar = usuarioParaDeletarOpt.get();

        // Regra 2: SUPER_ADMIN pode deletar qualquer um
        if (adminLogado.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"))) {
            repositorioUsuario.deleteById(id);
            return ResponseEntity.noContent().build();
        }

        // Regra 3: ADMIN só pode deletar usuários do SEU gabinete
        if (usuarioParaDeletar.getGabinete() != null && usuarioParaDeletar.getGabinete().getId().equals(gabineteIdAdmin)) {
            // (Opcional) Bloquear deleção de outros ADMINs se quiser, ou permitir:
            // if(usuarioParaDeletar.getTipoUsuario() == TipoUsuario.ADMIN) { ... }

            repositorioUsuario.deleteById(id);
            return ResponseEntity.noContent().build();
        }

        // Se chegou aqui, sem permissão
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
}