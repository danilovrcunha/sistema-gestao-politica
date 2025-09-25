package residencia.sistema_gestao_politica.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import residencia.sistema_gestao_politica.repository.UsuarioRepository;
import residencia.sistema_gestao_politica.model.Usuario;

@Service
public class DetalhesUsuarioService implements org.springframework.security.core.userdetails.UserDetailsService {

    @Autowired
    private UsuarioRepository repositorioUsuario;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = repositorioUsuario.findByEmail(email);
        if (usuario == null) {
            throw new UsernameNotFoundException("Usuário não encontrado");
        }
        return User.builder()
                .username(usuario.getEmail())
                .password(usuario.getPassword())
                .roles(usuario.getTipoUsuario().name())
                .build();
    }
}
