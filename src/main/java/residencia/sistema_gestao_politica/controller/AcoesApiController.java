package residencia.sistema_gestao_politica.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import residencia.sistema_gestao_politica.model.Acao;
import residencia.sistema_gestao_politica.repository.AcaoRepository;

import java.util.Optional;
import java.nio.file.*;

@RestController
@RequestMapping("/api/acoes")
public class AcoesApiController {

    @Autowired
    private AcaoRepository acaoRepository;

    private static final String UPLOAD_DIR = "uploads/";
    private final ObjectMapper mapper;

    public AcoesApiController() {
        this.mapper = new ObjectMapper();
        this.mapper.registerModule(new JavaTimeModule());
        this.mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    // --- CADASTRAR ---
    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<?> criarAcao(@RequestParam("acao") String acaoJson, @RequestParam(value = "imagem", required = false) MultipartFile imagem) {
        try {
            Acao acao = mapper.readValue(acaoJson, Acao.class);
            if (imagem != null && !imagem.isEmpty()) {
                String nome = System.currentTimeMillis() + "_" + imagem.getOriginalFilename();
                Files.createDirectories(Paths.get(UPLOAD_DIR));
                Files.write(Paths.get(UPLOAD_DIR, nome), imagem.getBytes());
                acao.setImagem(nome);
            }
            return ResponseEntity.ok(acaoRepository.save(acao));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erro: " + e.getMessage());
        }
    }

    // --- ATUALIZAR ---
    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<?> atualizarAcao(@PathVariable Long id, @RequestParam("acao") String acaoJson, @RequestParam(value = "imagem", required = false) MultipartFile imagem) {
        try {
            Acao dados = mapper.readValue(acaoJson, Acao.class);
            Optional<Acao> opt = acaoRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.notFound().build();

            Acao existente = opt.get();

            // Atualiza campos
            existente.setCep(dados.getCep());
            existente.setLogradouro(dados.getLogradouro());
            existente.setCidade(dados.getCidade());
            existente.setBairro(dados.getBairro());
            existente.setTipoAcao(dados.getTipoAcao());
            existente.setData(dados.getData());
            existente.setObservacoes(dados.getObservacoes());

            // Remove imagem se solicitado
            if (Boolean.TRUE.equals(dados.getRemoverImagem())) {
                // Opcional: Deletar arquivo físico aqui se quiser
                existente.setImagem(null);
            }

            // Adiciona nova imagem
            if (imagem != null && !imagem.isEmpty()) {
                String nome = System.currentTimeMillis() + "_" + imagem.getOriginalFilename();
                Files.createDirectories(Paths.get(UPLOAD_DIR));
                Files.write(Paths.get(UPLOAD_DIR, nome), imagem.getBytes());
                existente.setImagem(nome);
            }
            return ResponseEntity.ok(acaoRepository.save(existente));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro: " + e.getMessage());
        }
    }

    // --- LISTAR TUDO ---
    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(acaoRepository.findAll());
    }

    // --- BUSCAR POR ID (Necessário para a tela de Edição funcionar) ---
    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        return acaoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // --- EXCLUIR (Método que faltava) ---
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        if (!acaoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        try {
            acaoRepository.deleteById(id);
            return ResponseEntity.noContent().build(); // Retorna código 204 (Sucesso)
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao excluir: " + e.getMessage());
        }
    }
}