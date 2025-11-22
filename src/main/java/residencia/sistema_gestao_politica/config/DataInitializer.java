package residencia.sistema_gestao_politica.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import residencia.sistema_gestao_politica.model.Gabinete;
import residencia.sistema_gestao_politica.model.Permissao;
import residencia.sistema_gestao_politica.model.Usuario;
import residencia.sistema_gestao_politica.model.enums.TipoUsuario;
import residencia.sistema_gestao_politica.repository.GabineteRepository;
import residencia.sistema_gestao_politica.repository.UsuarioRepository;

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
            return;
        }

        log.info("Populando banco de dados...");

        // 1. Criar Gabinete
        Gabinete gabineteKaido = new Gabinete("Gabinete Principal do Kaido");
        gabineteRepository.save(gabineteKaido);

        // 2. Criar Super Admin
        Usuario superAdmin = new Usuario();
        superAdmin.setNome("Super Administrador");
        superAdmin.setEmail("super@admin.com");
        superAdmin.setPassword(passwordEncoder.encode("super123"));
        superAdmin.setTipoUsuario(TipoUsuario.SUPER_ADMIN);
        superAdmin.setGabinete(null);
        // Permissão Total
        superAdmin.setPermissao(new Permissao(true));
        usuarioRepository.save(superAdmin);

        // 3. Criar Admin Kaido
        Usuario adminKaido = new Usuario();
        adminKaido.setNome("Kaido");
        adminKaido.setEmail("kaido@admin.com");
        adminKaido.setPassword(passwordEncoder.encode("kaido123"));
        adminKaido.setTipoUsuario(TipoUsuario.ADMIN);
        adminKaido.setGabinete(gabineteKaido);
        // Permissão Total
        adminKaido.setPermissao(new Permissao(true));
        usuarioRepository.save(adminKaido);

        log.info("Dados iniciais criados com sucesso!");
    }
}