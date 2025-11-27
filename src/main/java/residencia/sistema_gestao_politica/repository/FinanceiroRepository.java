package residencia.sistema_gestao_politica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import residencia.sistema_gestao_politica.model.Financeiro;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FinanceiroRepository extends JpaRepository<Financeiro, Long> {

    List<Financeiro> findByGabineteId(Long gabineteId);
    List<Financeiro> findByGabineteIdAndDataRegistroBetween(Long gabineteId, LocalDate inicio, LocalDate fim);
    List<Financeiro> findByDataRegistroBetween(LocalDate inicio, LocalDate fim);

    @Query("SELECT SUM(f.valorDespesa) FROM Financeiro f WHERE f.gabinete.id = :gabineteId AND MONTH(f.dataRegistro) = :mes AND YEAR(f.dataRegistro) = :ano")
    Double somaDespesasPorMes(@Param("gabineteId") Long gabineteId, @Param("mes") int mes, @Param("ano") int ano);

    @Query("SELECT SUM(f.valorDespesa) FROM Financeiro f WHERE f.gabinete.id = :gabineteId AND LOWER(f.tipoTransacao) LIKE LOWER(CONCAT('%', :tipo, '%'))")
    Double somaPorTipo(@Param("gabineteId") Long gabineteId, @Param("tipo") String tipo);

    List<Financeiro> findTop5ByGabineteIdOrderByValorDespesaDesc(Long gabineteId);
}