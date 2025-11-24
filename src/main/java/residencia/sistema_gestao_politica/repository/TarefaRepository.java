package residencia.sistema_gestao_politica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import residencia.sistema_gestao_politica.model.Tarefa;
import residencia.sistema_gestao_politica.model.enums.StatusTarefa;

import java.util.List;

@Repository
public interface TarefaRepository extends JpaRepository<Tarefa, Long> {

    // 1. Para o Super Admin (Conta tudo no banco, independente de gabinete)
    long countByStatus(StatusTarefa status);

    // 2. Para listar tarefas de um gabinete específico
    List<Tarefa> findByGabineteId(Long gabineteId);

    // 3. Para os gráficos do Dashboard de um Gabinete específico
    long countByStatusAndGabineteId(StatusTarefa status, Long gabineteId);
}