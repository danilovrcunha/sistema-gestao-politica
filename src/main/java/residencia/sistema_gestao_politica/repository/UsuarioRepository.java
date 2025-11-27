package residencia.sistema_gestao_politica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import residencia.sistema_gestao_politica.model.Usuario;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    List<Usuario> findByGabineteId(Long gabineteId);

    boolean existsByEmail(String email);

    Optional<Usuario> findByEmail(String email);
}