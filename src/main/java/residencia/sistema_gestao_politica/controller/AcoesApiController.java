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
import java.time.LocalDate;
import java.time.YearMonth;
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

    // ====================================================================================
    // 1. LISTAR (LÓGICA ROBUSTA: SIMPLES VS AVANÇADA)
    // ====================================================================================
    @GetMapping
    public ResponseEntity<?> listar(
            @RequestParam(required = false) Long gabineteId,
            @RequestParam(required = false) String bairro,
            @RequestParam(required = false) String mes // "yyyy-MM"
    ) {
        try {
            MeuUserDetails user = getUsuarioLogado();
            Long idFinal = user.getGabineteId();

            // Lógica Super Admin
            if (idFinal == null && gabineteId != null) {
                idFinal = gabineteId;
            }

            // Verifica se existem filtros ativos
            boolean temBairro = (bairro != null && !bairro.trim().isEmpty());
            boolean temMes = (mes != null && !mes.trim().isEmpty());

            // --- CENÁRIO 1: SEM FILTROS (Abertura da Página) ---
            // Usa métodos padrão do JPA que são 100% seguros
            if (!temBairro && !temMes) {
                if (idFinal == null) {
                    // Super Admin sem filtro vê TUDO
                    return ResponseEntity.ok(acaoRepository.findAll());
                } else {
                    // Admin/User vê SÓ do seu gabinete
                    return ResponseEntity.ok(acaoRepository.findByGabineteId(idFinal));
                }
            }

            // --- CENÁRIO 2: COM FILTROS (Busca Personalizada) ---
            String bairroQuery = temBairro ? bairro.trim() : null;
            LocalDate dataInicio = null;
            LocalDate dataFim = null;

            if (temMes) {
                try {
                    YearMonth ym = YearMonth.parse(mes);
                    dataInicio = ym.atDay(1);
                    dataFim = ym.atEndOfMonth();
                } catch (Exception e) {
                    System.err.println("Data inválida no filtro: " + mes);
                }
            }

            return ResponseEntity.ok(acaoRepository.buscarComFiltros(idFinal, bairroQuery, dataInicio, dataFim));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao listar ações: " + e.getMessage());
        }
    }

    // ====================================================================================
    // 2. BUSCAR POR ID
    // ====================================================================================
    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPorId(@PathVariable Long id) {
        MeuUserDetails user = getUsuarioLogado();
        Optional<Acao> opt = acaoRepository.findById(id);

        if (opt.isPresent()) {
            if (user.getGabineteId() != null && !opt.get().getGabinete().getId().equals(user.getGabineteId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            return ResponseEntity.ok(opt.get());
        }
        return ResponseEntity.notFound().build();
    }

    // ====================================================================================
    // 3. CADASTRAR
    // ====================================================================================
    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<?> criarAcao(
            @RequestParam("acao") String acaoJson,
            @RequestParam(value = "imagem", required = false) MultipartFile imagem,
            @RequestParam(value = "gabineteId", required = false) Long gabineteIdParam) {
        try {
            MeuUserDetails user = getUsuarioLogado();
            Long finalGabineteId = user.getGabineteId();

            if (finalGabineteId == null) {
                if (gabineteIdParam != null) finalGabineteId = gabineteIdParam;
                else return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Super Admin deve selecionar um gabinete.");
            }

            Acao acao = mapper.readValue(acaoJson, Acao.class);
            Gabinete gabinete = gabineteRepository.findById(finalGabineteId).orElseThrow(() -> new RuntimeException("Gabinete não encontrado"));
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

    // ====================================================================================
    // 4. ATUALIZAR
    // ====================================================================================
    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<?> atualizarAcao(
            @PathVariable Long id,
            @RequestParam("acao") String acaoJson,
            @RequestParam(value = "imagem", required = false) MultipartFile imagem) {
        try {
            MeuUserDetails user = getUsuarioLogado();
            Optional<Acao> opt = acaoRepository.findById(id);
            if (opt.isEmpty()) return ResponseEntity.notFound().build();
            Acao existente = opt.get();

            if (user.getGabineteId() != null && !existente.getGabinete().getId().equals(user.getGabineteId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acesso negado.");
            }

            Acao dados = mapper.readValue(acaoJson, Acao.class);
            existente.setCep(dados.getCep());
            existente.setLogradouro(dados.getLogradouro());
            existente.setCidade(dados.getCidade());
            existente.setBairro(dados.getBairro());
            existente.setTipoAcao(dados.getTipoAcao());
            existente.setData(dados.getData());
            existente.setObservacoes(dados.getObservacoes());

            if (Boolean.TRUE.equals(dados.getRemoverImagem())) existente.setImagem(null);
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

    // ====================================================================================
    // 5. EXCLUIR
    // ====================================================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id) {
        MeuUserDetails user = getUsuarioLogado();
        Optional<Acao> opt = acaoRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        if (user.getGabineteId() != null && !opt.get().getGabinete().getId().equals(user.getGabineteId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acesso negado.");
        }

        try {
            acaoRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao excluir.");
        }
    }
}