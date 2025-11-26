package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import residencia.sistema_gestao_politica.model.Gabinete;
import residencia.sistema_gestao_politica.model.Permissao;
import residencia.sistema_gestao_politica.model.Tarefa;
import residencia.sistema_gestao_politica.model.Usuario;
import residencia.sistema_gestao_politica.model.enums.TipoUsuario;
import residencia.sistema_gestao_politica.repository.GabineteRepository;
import residencia.sistema_gestao_politica.repository.TarefaRepository;
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
    private TarefaRepository tarefaRepository; // Necessário para buscar tarefas do usuário

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MeuUserDetails getUsuarioLogado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof MeuUserDetails)) {
            throw new RuntimeException("Usuário não autenticado.");
        }
        return (MeuUserDetails) authentication.getPrincipal();
    }

    @GetMapping("/me")
    public ResponseEntity<Usuario> getMeuPerfil() {
        MeuUserDetails userDetails = getUsuarioLogado();
        return repositorioUsuario.findById(userDetails.getUsuarioId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> listarUsuarios(@RequestParam(required = false) Long gabineteId) {
        MeuUserDetails userDetails = getUsuarioLogado();
        boolean isSuperAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (isSuperAdmin) {
            if (gabineteId != null) {
                return ResponseEntity.ok(repositorioUsuario.findByGabineteId(gabineteId));
            }
            return ResponseEntity.ok(repositorioUsuario.findAll());
        } else {
            return ResponseEntity.ok(repositorioUsuario.findByGabineteId(userDetails.getGabineteId()));
        }
    }

    @PostMapping
    public ResponseEntity<?> criarUsuario(@RequestBody Usuario usuario) {
        MeuUserDetails adminLogado = getUsuarioLogado();
        Long gabineteId = adminLogado.getGabineteId();

        if (gabineteId == null) {
            if (usuario.getGabinete() == null || usuario.getGabinete().getId() == null) {
                return ResponseEntity.badRequest().body("SUPER_ADMIN deve especificar um 'gabinete: { id: ... }'.");
            }
        } else {
            Gabinete meuGabinete = repositorioGabinete.findById(gabineteId)
                    .orElseThrow(() -> new RuntimeException("Gabinete não encontrado"));
            usuario.setGabinete(meuGabinete);

            if (usuario.getTipoUsuario() == TipoUsuario.SUPER_ADMIN) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Não pode criar Super Admin.");
            }
            if (usuario.getTipoUsuario() == null) {
                usuario.setTipoUsuario(TipoUsuario.USER);
            }
        }

        if (usuario.getTipoUsuario() == TipoUsuario.SUPER_ADMIN || usuario.getTipoUsuario() == TipoUsuario.ADMIN) {
            usuario.setPermissao(new Permissao(true));
        } else {
            usuario.setPermissao(new Permissao(false));
        }

        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        Usuario salvo = repositorioUsuario.save(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(salvo);
    }

    @PutMapping("/{id}/permissoes")
    public ResponseEntity<?> atualizarPermissoes(@PathVariable Long id, @RequestBody Permissao novasPermissoes) {
        Usuario usuarioAlvo = repositorioUsuario.findById(id).orElse(null);
        if (usuarioAlvo == null) return ResponseEntity.notFound().build();

        Permissao permAtual = usuarioAlvo.getPermissao();
        if (permAtual == null) {
            permAtual = new Permissao();
            usuarioAlvo.setPermissao(permAtual);
        }

        permAtual.setVerDashboard(novasPermissoes.isVerDashboard());
        permAtual.setEditarDashboard(novasPermissoes.isEditarDashboard());
        permAtual.setVerAcoes(novasPermissoes.isVerAcoes());
        permAtual.setEditarAcoes(novasPermissoes.isEditarAcoes());
        permAtual.setVerKanban(novasPermissoes.isVerKanban());
        permAtual.setEditarKanban(novasPermissoes.isEditarKanban());
        permAtual.setVerFinanceiro(novasPermissoes.isVerFinanceiro());
        permAtual.setEditarFinanceiro(novasPermissoes.isEditarFinanceiro());
        permAtual.setVerConfiguracoes(novasPermissoes.isVerConfiguracoes());
        permAtual.setEditarConfiguracoes(novasPermissoes.isEditarConfiguracoes());

        repositorioUsuario.save(usuarioAlvo);
        return ResponseEntity.ok("Permissões atualizadas!");
    }

    @PutMapping("/{id}/senha")
    public ResponseEntity<?> alterarSenha(@PathVariable Long id, @RequestParam String senhaAtual, @RequestParam String novaSenha) {
        MeuUserDetails userLogado = getUsuarioLogado();
        if (!userLogado.getUsuarioId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Você não pode alterar a senha de outro usuário.");
        }
        Optional<Usuario> usuarioOpt = repositorioUsuario.findById(id);
        if (usuarioOpt.isEmpty()) return ResponseEntity.notFound().build();

        Usuario user = usuarioOpt.get();

        if (!passwordEncoder.matches(senhaAtual, user.getPassword())) {
            return ResponseEntity.badRequest().body("A senha atual está incorreta.");
        }

        user.setPassword(passwordEncoder.encode(novaSenha));
        repositorioUsuario.save(user);
        return ResponseEntity.ok("Senha atualizada com sucesso!");
    }

    @GetMapping("/tipos")
    public ResponseEntity<List<TipoUsuario>> listarTipos() {
        return ResponseEntity.ok(Arrays.asList(TipoUsuario.values()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletarUsuario(@PathVariable Long id) {
        MeuUserDetails adminLogado = getUsuarioLogado();
        Long idAdminLogado = adminLogado.getUsuarioId();
        Long gabineteIdAdmin = adminLogado.getGabineteId();

        if (id.equals(idAdminLogado)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        Optional<Usuario> usuarioParaDeletarOpt = repositorioUsuario.findById(id);
        if (usuarioParaDeletarOpt.isEmpty()) return ResponseEntity.notFound().build();
        Usuario usuarioParaDeletar = usuarioParaDeletarOpt.get();

        boolean isSuperAdmin = adminLogado.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (!isSuperAdmin) {
            if (usuarioParaDeletar.getGabinete() != null && !usuarioParaDeletar.getGabinete().getId().equals(gabineteIdAdmin)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Usuário pertence a outro gabinete.");
            }
        }

        try {
            // --- ADIÇÃO: Desvincular Tarefas antes de excluir ---
            List<Tarefa> tarefasDoUsuario = tarefaRepository.findByResponsavelId(id);

            if (!tarefasDoUsuario.isEmpty()) {
                for (Tarefa t : tarefasDoUsuario) {
                    // Salva o nome atual para histórico
                    t.setNomeHistorico(usuarioParaDeletar.getNome() + " (Excluído)");
                    // Remove o vínculo com o usuário
                    t.setResponsavel(null);
                }
                tarefaRepository.saveAll(tarefasDoUsuario);
                tarefaRepository.flush(); // Garante que o banco atualize as tarefas antes de deletar o user
            }

            repositorioUsuario.deleteById(id);
            return ResponseEntity.noContent().build();

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Erro ao excluir usuário. Detalhe: " + e.getMessage());
        }
    }
}