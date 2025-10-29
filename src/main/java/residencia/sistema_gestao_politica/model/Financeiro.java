package residencia.sistema_gestao_politica.model;

import jakarta.persistence.*;
import java.text.DecimalFormat;
import java.time.LocalDate;

@Entity
@Table(name = "financeiro")
public class Financeiro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate dataRegistro;
    private Double valorDespesa;
    private String tipoTransacao;
    private String categoria;
    private String descricao;

    @Transient
    private String valorFormatado;

    // ===== GETTERS e SETTERS =====
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getDataRegistro() { return dataRegistro; }
    public void setDataRegistro(LocalDate dataRegistro) { this.dataRegistro = dataRegistro; }

    public Double getValorDespesa() { return valorDespesa; }
    public void setValorDespesa(Double valorDespesa) { this.valorDespesa = valorDespesa; }

    public String getTipoTransacao() { return tipoTransacao; }
    public void setTipoTransacao(String tipoTransacao) { this.tipoTransacao = tipoTransacao; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    // ===== Valor formatado em R$ =====
    public String getValorFormatado() {
        if (valorDespesa == null) return "R$ 0,00";
        DecimalFormat df = new DecimalFormat("#,##0.00");
        return "R$ " + df.format(valorDespesa);
    }
}
