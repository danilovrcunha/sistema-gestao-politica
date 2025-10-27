package residencia.sistema_gestao_politica.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

@Entity
@Table(name = "acoes")
public class Acao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String cidade;
    private String bairro;
    private String tipoAcao;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate data;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    private String imagem;
    private Boolean removerImagem;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }

    public String getBairro() { return bairro; }
    public void setBairro(String bairro) { this.bairro = bairro; }

    public String getTipoAcao() { return tipoAcao; }
    public void setTipoAcao(String tipoAcao) { this.tipoAcao = tipoAcao; }

    public LocalDate getData() { return data; }
    public void setData(LocalDate data) { this.data = data; }

    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }

    public String getImagem() { return imagem; }
    public void setImagem(String imagem) { this.imagem = imagem; }

    public Boolean isRemoverImagem() { return removerImagem; }
    public Boolean getRemoverImagem() { return removerImagem; } // <—
    public void setRemoverImagem(Boolean removerImagem) { this.removerImagem = removerImagem; }
}
