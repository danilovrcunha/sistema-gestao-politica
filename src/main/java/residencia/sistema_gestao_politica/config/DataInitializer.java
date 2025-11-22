package residencia.sistema_gestao_politica.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import residencia.sistema_gestao_politica.model.Gabinete;
import residencia.sistema_gestao_politica.model.Usuario;
import residencia.sistema_gestao_politica.model.enums.TipoUsuario;
import residencia.sistema_gestao_politica.repository.GabineteRepository;
import residencia.sistema_gestao_politica.repository.UsuarioRepository;

/**
 * Esta classe roda automaticamente na inicialização do Spring Boot.
 * Ela verifica se o banco de dados está vazio e, se estiver,
 * cria os dados iniciais (Gabinete, Super Admin, Admin)
 * com as senhas CORRETAMENTE codificadas por BCrypt.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private GabineteRepository gabineteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (usuarioRepository.count() > 0) {
            log.info("O banco de dados já está populado. Inicializador pulado.");
            return;
        }

        log.info("Banco de dados vazio. Populando com dados iniciais...");


        Gabinete gabineteKaido = new Gabinete("Gabinete Principal do Kaido");
        gabineteRepository.save(gabineteKaido);
        log.info("Gabinete 1 criado.");

        Usuario superAdmin = new Usuario();
        superAdmin.setNome("Super Administrador");
        superAdmin.setEmail("super@admin.com");
        superAdmin.setPassword(passwordEncoder.encode("super123"));
        superAdmin.setTipoUsuario(TipoUsuario.SUPER_ADMIN);
        superAdmin.setGabinete(null); // Super Admin não tem gabinete
        usuarioRepository.save(superAdmin);
        log.info("Usuário SUPER_ADMIN (super@admin.com) criado.");

        Usuario adminKaido = new Usuario();
        adminKaido.setNome("Kaido");
        adminKaido.setEmail("kaido@admin.com");
        adminKaido.setPassword(passwordEncoder.encode("kaido123"));
        adminKaido.setTipoUsuario(TipoUsuario.ADMIN);
        adminKaido.setGabinete(gabineteKaido);
        usuarioRepository.save(adminKaido);
        log.info("Usuário ADMIN (kaido@admin.com) criado.");

        log.info("População inicial do banco de dados concluída.");
    }
}