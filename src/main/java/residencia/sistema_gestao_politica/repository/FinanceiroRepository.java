package residencia.sistema_gestao_politica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import residencia.sistema_gestao_politica.model.Financeiro;

public interface FinanceiroRepository extends JpaRepository<Financeiro, Long> {
}
