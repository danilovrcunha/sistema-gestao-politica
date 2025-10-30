package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import residencia.sistema_gestao_politica.model.Usuario;
import residencia.sistema_gestao_politica.model.enums.TipoUsuario;
import residencia.sistema_gestao_politica.repository.UsuarioRepository;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "*") // permite acesso do front local
public class UsuarioController {

    @Autowired
    private UsuarioRepository repositorioUsuario;

    @GetMapping
    public List<Usuario> listarUsuarios() {
        return repositorioUsuario.findAll();
    }

    @PostMapping
    public ResponseEntity<Usuario> criarUsuario(@RequestBody Usuario usuario) {
        Usuario salvo = repositorioUsuario.save(usuario);
        return ResponseEntity.ok(salvo);
    }

    @PutMapping("/{id}/senha")
    public ResponseEntity<?> alterarSenha(@PathVariable Long id, @RequestParam String novaSenha) {
        return repositorioUsuario.findById(id)
                .map(user -> {
                    user.setPassword(novaSenha);
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
        if (repositorioUsuario.existsById(id)) {
            repositorioUsuario.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
