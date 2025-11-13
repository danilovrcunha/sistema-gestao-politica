package residencia.sistema_gestao_politica.model;

import com.fasterxml.jackson.annotation.JsonBackReference; // IMPORTAR
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

    // A coluna agora tem o tamanho correto para o hash BCrypt
    @Column(nullable = false, length = 100)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoUsuario tipoUsuario;

    // --- MUDANÇA AQUI ---
    // Esta anotação diz ao Jackson: "Não serialize este campo,
    // pois o 'pai' (Gabinete) já está cuidando disso."
    // Isso quebra o loop infinito.
    @JsonBackReference
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "gabinete_id")
    private Gabinete gabinete;

    // Construtores, Getters e Setters (sem mudança)
    public Usuario() {
    }

    public Usuario(String nome, String email, String password, TipoUsuario tipoUsuario) {
        this.nome = nome;
        this.email = email;
        this.password = password;
        this.tipoUsuario = tipoUsuario;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public Gabinete getGabinete() {
        return gabinete;
    }

    public void setGabinete(Gabinete gabinete) {
        this.gabinete = gabinete;
    }
}