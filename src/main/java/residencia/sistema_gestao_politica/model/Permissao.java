package residencia.sistema_gestao_politica.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "permissoes")
public class Permissao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Dashboard
    private boolean verDashboard = false;
    private boolean editarDashboard = false; // (Ex: configurar widgets)

    // Ações
    private boolean verAcoes = false;
    private boolean editarAcoes = false;

    // Kanban (Tarefas)
    private boolean verKanban = false;
    private boolean editarKanban = false;

    // Financeiro
    private boolean verFinanceiro = false;
    private boolean editarFinanceiro = false;

    // Configurações (Para usuários comuns, geralmente é false ou limitado)
    private boolean verConfiguracoes = false;
    private boolean editarConfiguracoes = false;

    // Relacionamento inverso (Opcional, mas útil)
    @OneToOne(mappedBy = "permissao")
    @JsonIgnore // Evita loop infinito
    private Usuario usuario;

    public Permissao() {
        // Por padrão, tudo é false (ninguém vê nada)
    }

    // Construtor para dar permissão total (útil para Admins)
    public Permissao(boolean total) {
        if(total) {
            this.verDashboard = true; this.editarDashboard = true;
            this.verAcoes = true; this.editarAcoes = true;
            this.verKanban = true; this.editarKanban = true;
            this.verFinanceiro = true; this.editarFinanceiro = true;
            this.verConfiguracoes = true; this.editarConfiguracoes = true;
        }
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public boolean isVerDashboard() { return verDashboard; }
    public void setVerDashboard(boolean verDashboard) { this.verDashboard = verDashboard; }

    public boolean isEditarDashboard() { return editarDashboard; }
    public void setEditarDashboard(boolean editarDashboard) { this.editarDashboard = editarDashboard; }

    public boolean isVerAcoes() { return verAcoes; }
    public void setVerAcoes(boolean verAcoes) { this.verAcoes = verAcoes; }

    public boolean isEditarAcoes() { return editarAcoes; }
    public void setEditarAcoes(boolean editarAcoes) { this.editarAcoes = editarAcoes; }

    public boolean isVerKanban() { return verKanban; }
    public void setVerKanban(boolean verKanban) { this.verKanban = verKanban; }

    public boolean isEditarKanban() { return editarKanban; }
    public void setEditarKanban(boolean editarKanban) { this.editarKanban = editarKanban; }

    public boolean isVerFinanceiro() { return verFinanceiro; }
    public void setVerFinanceiro(boolean verFinanceiro) { this.verFinanceiro = verFinanceiro; }

    public boolean isEditarFinanceiro() { return editarFinanceiro; }
    public void setEditarFinanceiro(boolean editarFinanceiro) { this.editarFinanceiro = editarFinanceiro; }

    public boolean isVerConfiguracoes() { return verConfiguracoes; }
    public void setVerConfiguracoes(boolean verConfiguracoes) { this.verConfiguracoes = verConfiguracoes; }

    public boolean isEditarConfiguracoes() { return editarConfiguracoes; }
    public void setEditarConfiguracoes(boolean editarConfiguracoes) { this.editarConfiguracoes = editarConfiguracoes; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
}