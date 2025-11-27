package residencia.sistema_gestao_politica.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonBackReference;


@Entity
@Table(name = "acoes")
public class Acao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String cep;
    private String logradouro; // <--- NOVO CAMPO (Rua)
    private String cidade;
    private String bairro;
    private String tipoAcao;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate data;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    private String imagem;
    private Boolean removerImagem;

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "gabinete_id")
    private Gabinete gabinete;

    public Long getId() {
        return id;
    }

    public String getCep() {
        return cep;
    }

    public String getLogradouro() {
        return logradouro;
    }

    public String getCidade() {
        return cidade;
    }

    public String getBairro() {
        return bairro;
    }

    public String getTipoAcao() {
        return tipoAcao;
    }

    public LocalDate getData() {
        return data;
    }

    public String getObservacoes() {
        return observacoes;
    }

    public String getImagem() {
        return imagem;
    }

    public Boolean getRemoverImagem() {
        return removerImagem;
    }

    public Gabinete getGabinete() {
        return gabinete;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setCep(String cep) {
        this.cep = cep;
    }

    public void setLogradouro(String logradouro) {
        this.logradouro = logradouro;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public void setBairro(String bairro) {
        this.bairro = bairro;
    }

    public void setTipoAcao(String tipoAcao) {
        this.tipoAcao = tipoAcao;
    }

    public void setData(LocalDate data) {
        this.data = data;
    }

    public void setObservacoes(String observacoes) {
        this.observacoes = observacoes;
    }

    public void setImagem(String imagem) {
        this.imagem = imagem;
    }

    public void setRemoverImagem(Boolean removerImagem) {
        this.removerImagem = removerImagem;
    }

    public void setGabinete(Gabinete gabinete) {
        this.gabinete = gabinete;
    }
}