package residencia.sistema_gestao_politica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import residencia.sistema_gestao_politica.model.Gabinete;

@Repository
public interface GabineteRepository extends JpaRepository<Gabinete, Long> {
}