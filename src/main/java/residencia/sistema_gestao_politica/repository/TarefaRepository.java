package residencia.sistema_gestao_politica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import residencia.sistema_gestao_politica.model.Tarefa;
import residencia.sistema_gestao_politica.model.enums.StatusTarefa;

import java.util.List;

@Repository
public interface TarefaRepository extends JpaRepository<Tarefa, Long> {

    long countByStatus(StatusTarefa status);

    List<Tarefa> findByGabineteId(Long gabineteId);

    long countByStatusAndGabineteId(StatusTarefa status, Long gabineteId);

    // --- NECESSÁRIO PARA A EXCLUSÃO DE USUÁRIO ---
    List<Tarefa> findByResponsavelId(Long responsavelId);
}