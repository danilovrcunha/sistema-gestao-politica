package residencia.sistema_gestao_politica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import residencia.sistema_gestao_politica.model.Acao;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AcaoRepository extends JpaRepository<Acao, Long> {

    // Busca padrão
    List<Acao> findByGabineteId(Long gabineteId);

    // Busca Avançada (Só chamada se houver filtros)
    @Query("SELECT a FROM Acao a WHERE " +
            "(:gabineteId IS NULL OR a.gabinete.id = :gabineteId) AND " +
            "(:bairro IS NULL OR LOWER(a.bairro) LIKE LOWER(CONCAT('%', :bairro, '%'))) AND " +
            "((cast(:dataInicio as date) IS NULL) OR a.data >= :dataInicio) AND " +
            "((cast(:dataFim as date) IS NULL) OR a.data <= :dataFim)")
    List<Acao> buscarComFiltros(
            @Param("gabineteId") Long gabineteId,
            @Param("bairro") String bairro,
            @Param("dataInicio") LocalDate dataInicio,
            @Param("dataFim") LocalDate dataFim
    );
}