package residencia.sistema_gestao_politica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import residencia.sistema_gestao_politica.model.Tarefa;
import residencia.sistema_gestao_politica.model.enums.StatusTarefa;

import java.util.List;

@Repository
public interface TarefaRepository extends JpaRepository<Tarefa, Long> {

    long countByStatus(StatusTarefa status);

    List<Tarefa> findByGabineteId(Long gabineteId);

    long countByStatusAndGabineteId(StatusTarefa status, Long gabineteId);

    List<Tarefa> findByResponsavelId(Long responsavelId);

    @Query("SELECT t FROM Tarefa t WHERE t.gabinete.id = :gabineteId AND LOWER(t.responsavel.nome) LIKE LOWER(CONCAT('%', :nome, '%')) AND t.status != 'CONCLUIDO'")
    List<Tarefa> buscarPendentesPorResponsavel(@Param("gabineteId") Long gabineteId, @Param("nome") String nome);

    List<Tarefa> findTop10ByGabineteIdAndStatusOrderByIdDesc(Long gabineteId, StatusTarefa status);
}