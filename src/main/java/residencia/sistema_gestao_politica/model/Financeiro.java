package residencia.sistema_gestao_politica.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "financeiro")
public class Financeiro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate dataRegistro;

    private Double valorLocacao;
    private Double valorJuridica;
    private Double valorComunicacao;
    private Double valorCombustivel;
    private Double despesasDebito;
    private Double despesasCredito;
    private Double outrasDespesas;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getDataRegistro() {
        return dataRegistro;
    }

    public void setDataRegistro(LocalDate dataRegistro) {
        this.dataRegistro = dataRegistro;
    }

    public Double getValorLocacao() {
        return valorLocacao;
    }

    public void setValorLocacao(Double valorLocacao) {
        this.valorLocacao = valorLocacao;
    }

    public Double getValorJuridica() {
        return valorJuridica;
    }

    public void setValorJuridica(Double valorJuridica) {
        this.valorJuridica = valorJuridica;
    }

    public Double getValorComunicacao() {
        return valorComunicacao;
    }

    public void setValorComunicacao(Double valorComunicacao) {
        this.valorComunicacao = valorComunicacao;
    }

    public Double getValorCombustivel() {
        return valorCombustivel;
    }

    public void setValorCombustivel(Double valorCombustivel) {
        this.valorCombustivel = valorCombustivel;
    }

    public Double getDespesasDebito() {
        return despesasDebito;
    }

    public void setDespesasDebito(Double despesasDebito) {
        this.despesasDebito = despesasDebito;
    }

    public Double getDespesasCredito() {
        return despesasCredito;
    }

    public void setDespesasCredito(Double despesasCredito) {
        this.despesasCredito = despesasCredito;
    }

    public Double getOutrasDespesas() {
        return outrasDespesas;
    }

    public void setOutrasDespesas(Double outrasDespesas) {
        this.outrasDespesas = outrasDespesas;
    }
}
