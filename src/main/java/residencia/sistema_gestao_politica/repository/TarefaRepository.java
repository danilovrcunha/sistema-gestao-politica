package residencia.sistema_gestao_politica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import residencia.sistema_gestao_politica.model.Tarefa;
import residencia.sistema_gestao_politica.model.enums.StatusTarefa;

public interface TarefaRepository extends JpaRepository<Tarefa, Long> {
    long countByStatus(StatusTarefa status);
}


