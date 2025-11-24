package residencia.sistema_gestao_politica.model;

import jakarta.persistence.*;
import residencia.sistema_gestao_politica.model.enums.StatusTarefa;
import java.time.ZonedDateTime;
import com.fasterxml.jackson.annotation.JsonBackReference;


@Entity
@Table(name = "tarefas")
public class Tarefa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titulo;

    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusTarefa status;

    @ManyToOne
    @JoinColumn(name = "responsavel_id", nullable = false)
    private Usuario responsavel;  // Usuario vem da tabela "users"

    @Column(length = 3, nullable = false)
    private String mes;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private ZonedDateTime dataCriacao = ZonedDateTime.now();

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "gabinete_id")
    private Gabinete gabinete;

    public Tarefa() {}

    public Tarefa(String titulo, String descricao, StatusTarefa status, Usuario responsavel, String mes) {
        this.titulo = titulo;
        this.descricao = descricao;
        this.status = status;
        this.responsavel = responsavel;
        this.mes = mes;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public StatusTarefa getStatus() { return status; }
    public void setStatus(StatusTarefa status) { this.status = status; }

    public Usuario getResponsavel() { return responsavel; }
    public void setResponsavel(Usuario responsavel) { this.responsavel = responsavel; }

    public String getMes() { return mes; }
    public void setMes(String mes) { this.mes = mes; }

    public ZonedDateTime getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(ZonedDateTime dataCriacao) { this.dataCriacao = dataCriacao; }

    public Gabinete getGabinete() { return gabinete; }
    public void setGabinete(Gabinete gabinete) { this.gabinete = gabinete; }
}
