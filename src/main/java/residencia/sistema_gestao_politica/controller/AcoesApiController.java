package residencia.sistema_gestao_politica.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import residencia.sistema_gestao_politica.model.Acao;
import residencia.sistema_gestao_politica.model.Gabinete;
import residencia.sistema_gestao_politica.repository.AcaoRepository;
import residencia.sistema_gestao_politica.repository.GabineteRepository;
import residencia.sistema_gestao_politica.service.MeuUserDetails;

import java.nio.file.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/acoes")
public class AcoesApiController {

    @Autowired
    private AcaoRepository acaoRepository;

    @Autowired
    private GabineteRepository gabineteRepository;

    private static final String UPLOAD_DIR = "uploads/";
    private final ObjectMapper mapper;

    public AcoesApiController() {
        this.mapper = new ObjectMapper();
        this.mapper.registerModule(new JavaTimeModule());
        this.mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    private MeuUserDetails getUsuarioLogado() {
        return (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    // --- CADASTRAR (Com vínculo de Gabinete) ---
    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<?> criarAcao(@RequestParam("acao") String acaoJson, @RequestParam(value = "imagem", required = false) MultipartFile imagem) {
        try {
            MeuUserDetails user = getUsuarioLogado();
            Long gabineteId = user.getGabineteId();

            // Se for Super Admin sem gabinete, não pode criar ação "solta"
            if (gabineteId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Super Admin deve selecionar um gabinete para criar ações ou logar como Admin.");
            }

            Acao acao = mapper.readValue(acaoJson, Acao.class);

            // VINCULA AO GABINETE
            Gabinete gabinete = gabineteRepository.findById(gabineteId).orElseThrow();
            acao.setGabinete(gabinete);

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

    // --- ATUALIZAR (Com verificação de segurança) ---
    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<?> atualizarAcao(@PathVariable Long id, @RequestParam("acao") String acaoJson, @RequestParam(value = "imagem", required = false) MultipartFile imagem) {
        try {
            MeuUserDetails user = getUsuarioLogado();
            Optional<Acao> opt = acaoRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.notFound().build();

            Acao existente = opt.get();

            // Verifica se a ação pertence ao gabinete do usuário
            if (user.getGabineteId() != null && !existente.getGabinete().getId().equals(user.getGabineteId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Você não pode editar ações de outro gabinete.");
            }

            Acao dados = mapper.readValue(acaoJson, Acao.class);

            existente.setCep(dados.getCep());
            existente.setLogradouro(dados.getLogradouro());
            existente.setCidade(dados.getCidade());
            existente.setBairro(dados.getBairro());
            existente.setTipoAcao(dados.getTipoAcao());
            existente.setData(dados.getData());
            existente.setObservacoes(dados.getObservacoes());

            if (Boolean.TRUE.equals(dados.getRemoverImagem())) {
                existente.setImagem(null);
            }

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

    // --- LISTAR TUDO (ÚNICO MÉTODO - CORRIGIDO) ---
    // Este método lida tanto com a listagem normal quanto com o filtro do Super Admin
    @GetMapping
    public ResponseEntity<?> listar(@RequestParam(required = false) Long gabineteId) {
        MeuUserDetails user = getUsuarioLogado();

        if (user.getGabineteId() == null) { // Super Admin
            if (gabineteId != null) {
                // Super Admin filtrando por um gabinete específico
                return ResponseEntity.ok(acaoRepository.findByGabineteId(gabineteId));
            }
            // Super Admin vendo tudo
            return ResponseEntity.ok(acaoRepository.findAll());
        }

        // Admin/User comum vê apenas o seu
        return ResponseEntity.ok(acaoRepository.findByGabineteId(user.getGabineteId()));
    }

    // --- BUSCAR POR ID ---
    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        MeuUserDetails user = getUsuarioLogado();
        Optional<Acao> opt = acaoRepository.findById(id);

        if (opt.isPresent()) {
            // Segurança de leitura: se não for Super Admin, verifica se é do mesmo gabinete
            if (user.getGabineteId() != null && !opt.get().getGabinete().getId().equals(user.getGabineteId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            return ResponseEntity.ok(opt.get());
        }
        return ResponseEntity.notFound().build();
    }

    // --- EXCLUIR ---
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        MeuUserDetails user = getUsuarioLogado();
        Optional<Acao> opt = acaoRepository.findById(id);

        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        // Segurança de exclusão: se não for Super Admin, verifica gabinete
        if (user.getGabineteId() != null && !opt.get().getGabinete().getId().equals(user.getGabineteId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Ação pertence a outro gabinete.");
        }

        try {
            acaoRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao excluir: " + e.getMessage());
        }
    }
}