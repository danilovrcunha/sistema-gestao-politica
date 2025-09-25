package residencia.sistema_gestao_politica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import residencia.sistema_gestao_politica.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Usuario findByEmail(String email);
}
