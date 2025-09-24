package residencia.sistema_gestao_politica.model.enums;

public enum TipoUsuario {
    SUPER_ADMIN("Super Administrador", 1),
    ADMIN("Administrador", 2),
    USER("Usuário Comum", 3);

    private final String descricao;
    private final int codigo;

    TipoUsuario(String descricao, int codigo) {
        this.descricao = descricao;
        this.codigo = codigo;
    }
    public String getDescricao() {
        return descricao;
    }

    public int getCodigo() {
        return codigo;
    }
}
