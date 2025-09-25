package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import residencia.sistema_gestao_politica.model.Usuario;
import residencia.sistema_gestao_politica.repository.UsuarioRepository;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {
    @Autowired
    private UsuarioRepository repositorioUsuario;

    @GetMapping
    public List<Usuario> listarUsuarios() {
        return repositorioUsuario.findAll();
    }
}
