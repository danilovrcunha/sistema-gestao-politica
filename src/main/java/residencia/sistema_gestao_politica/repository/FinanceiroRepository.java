package residencia.sistema_gestao_politica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import residencia.sistema_gestao_politica.model.Financeiro;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FinanceiroRepository extends JpaRepository<Financeiro, Long> {

    // Busca normal por gabinete
    List<Financeiro> findByGabineteId(Long gabineteId);

    // Busca por Gabinete E Data (Para o filtro)
    List<Financeiro> findByGabineteIdAndDataRegistroBetween(Long gabineteId, LocalDate inicio, LocalDate fim);

    // Busca Geral por Data (Para Super Admin sem gabinete selecionado)
    List<Financeiro> findByDataRegistroBetween(LocalDate inicio, LocalDate fim);
}