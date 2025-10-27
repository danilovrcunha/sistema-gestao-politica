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
import java.io.IOException;
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

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<?> criarAcao(
            @RequestParam("acao") String acaoJson,
            @RequestParam(value = "imagem", required = false) MultipartFile imagem
    ) {
        try {
            Acao acao = mapper.readValue(acaoJson, Acao.class);

            if (imagem != null && !imagem.isEmpty()) {
                String nomeArquivo = System.currentTimeMillis() + "_" + imagem.getOriginalFilename();
                Path caminho = Paths.get(UPLOAD_DIR, nomeArquivo);
                Files.createDirectories(caminho.getParent());
                Files.write(caminho, imagem.getBytes());
                acao.setImagem(nomeArquivo);
            }

            Acao salva = acaoRepository.save(acao);
            return ResponseEntity.ok(salva);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Erro ao processar dados da ação: " + e.getMessage());
        }
    }

    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<?> atualizarAcao(
            @PathVariable Long id,
            @RequestParam("acao") String acaoJson,
            @RequestParam(value = "imagem", required = false) MultipartFile imagem
    ) {
        try {
            Acao dados = mapper.readValue(acaoJson, Acao.class);

            Optional<Acao> existenteOpt = acaoRepository.findById(id);
            if (existenteOpt.isEmpty()) return ResponseEntity.notFound().build();

            Acao existente = existenteOpt.get();
            existente.setCidade(dados.getCidade());
            existente.setBairro(dados.getBairro());
            existente.setTipoAcao(dados.getTipoAcao());
            existente.setData(dados.getData());
            existente.setObservacoes(dados.getObservacoes());

            if (Boolean.TRUE.equals(dados.getRemoverImagem())) {
                existente.setImagem(null);
            }

            if (imagem != null && !imagem.isEmpty()) {
                String nomeArquivo = System.currentTimeMillis() + "_" + imagem.getOriginalFilename();
                Path caminho = Paths.get(UPLOAD_DIR, nomeArquivo);
                Files.createDirectories(caminho.getParent());
                Files.write(caminho, imagem.getBytes());
                existente.setImagem(nomeArquivo);
            }

            Acao salva = acaoRepository.save(existente);
            return ResponseEntity.ok(salva);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Erro ao atualizar ação: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> listar() {
        return ResponseEntity.ok(acaoRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        return acaoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}") // <— se usar exclusão na tabela
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        if (!acaoRepository.existsById(id)) return ResponseEntity.notFound().build();
        acaoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
