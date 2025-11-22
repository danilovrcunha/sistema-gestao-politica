package residencia.sistema_gestao_politica.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import residencia.sistema_gestao_politica.model.enums.TipoUsuario;

@Entity
@Table(name = "users")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, length = 100)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoUsuario tipoUsuario;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "gabinete_id")
    private Gabinete gabinete;

    // --- NOVO RELACIONAMENTO ---
    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "permissao_id", referencedColumnName = "id")
    private Permissao permissao;

    public Usuario() {
    }

    public Usuario(String nome, String email, String password, TipoUsuario tipoUsuario) {
        this.nome = nome;
        this.email = email;
        this.password = password;
        this.tipoUsuario = tipoUsuario;
    }

    // Getters e Setters existentes... (id, nome, email, password, tipoUsuario, gabinete)

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public TipoUsuario getTipoUsuario() { return tipoUsuario; }
    public void setTipoUsuario(TipoUsuario tipoUsuario) { this.tipoUsuario = tipoUsuario; }
    public Gabinete getGabinete() { return gabinete; }
    public void setGabinete(Gabinete gabinete) { this.gabinete = gabinete; }

    // --- NOVO GETTER E SETTER ---
    public Permissao getPermissao() { return permissao; }
    public void setPermissao(Permissao permissao) { this.permissao = permissao; }
}