package residencia.sistema_gestao_politica.model;

import com.fasterxml.jackson.annotation.JsonManagedReference; // IMPORTAR
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "gabinetes")
public class Gabinete {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nomeResponsavel;

    // --- MUDANÇA AQUI ---
    // Esta anotação diz ao Jackson: "Você é o 'pai'. Serialize esta lista normalmente."
    @JsonManagedReference
    @OneToMany(mappedBy = "gabinete", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Usuario> usuarios = new ArrayList<>();

    public Gabinete() {
    }

    public Gabinete(String nomeResponsavel) {
        this.nomeResponsavel = nomeResponsavel;
    }

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNomeResponsavel() {
        return nomeResponsavel;
    }

    public void setNomeResponsavel(String nomeResponsavel) {
        this.nomeResponsavel = nomeResponsavel;
    }

    public List<Usuario> getUsuarios() {
        return usuarios;
    }

    public void setUsuarios(List<Usuario> usuarios) {
        this.usuarios = usuarios;
    }
}