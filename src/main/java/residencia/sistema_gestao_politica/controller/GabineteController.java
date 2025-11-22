package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import residencia.sistema_gestao_politica.model.Gabinete;
import residencia.sistema_gestao_politica.repository.GabineteRepository;

import java.util.List;

@RestController
@RequestMapping("/gabinetes")
@CrossOrigin(origins = "*")
public class GabineteController {

    @Autowired
    private GabineteRepository gabineteRepository;

    @GetMapping
    public ResponseEntity<List<Gabinete>> listarGabinetes() {
        // Retorna todos os gabinetes para o Super Admin listar
        return ResponseEntity.ok(gabineteRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Gabinete> criarGabinete(@RequestBody Gabinete gabinete) {
        // Salva um novo gabinete
        Gabinete novoGabinete = gabineteRepository.save(gabinete);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoGabinete);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarGabinete(@PathVariable Long id) {
        if (gabineteRepository.existsById(id)) {
            gabineteRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

}