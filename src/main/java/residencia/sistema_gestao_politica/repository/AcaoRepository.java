package residencia.sistema_gestao_politica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import residencia.sistema_gestao_politica.model.Acao;
import java.util.List;

@Repository
public interface AcaoRepository extends JpaRepository<Acao, Long> {
    List<Acao> findByGabineteId(Long gabineteId);
}
