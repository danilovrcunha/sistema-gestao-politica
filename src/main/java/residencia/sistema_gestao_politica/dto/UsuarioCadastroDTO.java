package residencia.sistema_gestao_politica.dto;

import residencia.sistema_gestao_politica.model.enums.TipoUsuario;

/**
 * DTO (Data Transfer Object) para o formulário de cadastro.
 * Isso permite que o frontend envie o 'gabineteId' selecionado
 * quando um SUPER_ADMIN estiver criando um novo usuário.
 */
public class UsuarioCadastroDTO {
    private String nome;
    private String email;
    private String password;
    private TipoUsuario tipoUsuario;
    private Long gabineteId; // ID do gabinete selecionado (pode ser null)

    // Getters e Setters
    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public TipoUsuario getTipoUsuario() {
        return tipoUsuario;
    }

    public void setTipoUsuario(TipoUsuario tipoUsuario) {
        this.tipoUsuario = tipoUsuario;
    }

    public Long getGabineteId() {
        return gabineteId;
    }

    public void setGabineteId(Long gabineteId) {
        this.gabineteId = gabineteId;
    }
}