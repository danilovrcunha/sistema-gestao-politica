package residencia.sistema_gestao_politica.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
public class ConfiguracaoSeguranca {

    @Bean
    public PasswordEncoder codificadorDeSenha() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth

                        // ======================================================================
                        // 1. LIBERAÇÃO DE ESTILOS E SCRIPTS (SEM CAUSAR ERRO 500)
                        // ======================================================================
                        // Liberamos explicitamente arquivos .css e .js dentro de cada pasta.
                        // O uso de *.css é seguro e não quebra o Spring Boot.

                        .requestMatchers("/financeiro/*.css", "/financeiro/*.js").permitAll()
                        .requestMatchers("/kanban/*.css", "/kanban/*.js").permitAll()
                        .requestMatchers("/acoes/*.css", "/acoes/*.js").permitAll()
                        .requestMatchers("/configuracoes/*.css", "/configuracoes/*.js").permitAll()
                        .requestMatchers("/registrarAcoes/*.css", "/registrarAcoes/*.js").permitAll()
                        .requestMatchers("/editarAcao/*.css", "/editarAcao/*.js").permitAll()
                        .requestMatchers("/acoesRegistradas/*.css", "/acoesRegistradas/*.js").permitAll()
                        .requestMatchers("/criarTarefa/*.css", "/criarTarefa/*.js").permitAll()
                        .requestMatchers("/home/*.css", "/home/*.js").permitAll()

                        // Libera pastas globais (caso você use no futuro)
                        .requestMatchers("/css/**", "/js/**", "/images/**", "/webjars/**", "/favicon.ico").permitAll()
                        .requestMatchers("/AssistenteIA/**").permitAll() // Libera o assistente se estiver numa pasta

                        // 2. LIBERAÇÃO DO LOGIN
                        .requestMatchers("/login/**", "/login", "/login/login.html").permitAll()

                        // ======================================================================
                        // 3. REGRAS DE NEGÓCIO (CONTROLLERS)
                        // ======================================================================

                        .requestMatchers(HttpMethod.GET, "/usuarios/me").authenticated()

                        // Admins
                        .requestMatchers(HttpMethod.GET, "/usuarios").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/usuarios/tipos").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/usuarios").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/usuarios/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/usuarios/*/senha").authenticated()

                        // Super Admin
                        .requestMatchers("/gabinetes/**").hasRole("SUPER_ADMIN")

                        // Páginas do Sistema
                        // (Aqui o Spring vai diferenciar a página "/financeiro" do arquivo "/financeiro/style.css"
                        //  porque a regra do .css veio ANTES lá em cima com permitAll)
                        .requestMatchers(
                                "/home/**",
                                "/acoes/**", "/registrarAcoes/**", "/acoesRegistradas/**", "/editarAcao/**",
                                "/kanban/**", "/criarTarefa/**",
                                "/financeiro/**",
                                "/configuracoes/**"
                        ).authenticated()

                        .requestMatchers("/api/**").authenticated()

                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/login/login.html")
                        .loginProcessingUrl("/login")
                        .defaultSuccessUrl("/home", true)
                        .failureUrl("/login/login.html?error=true")
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutRequestMatcher(new AntPathRequestMatcher("/logout"))
                        .logoutSuccessUrl("/login/login.html?logout=true")
                        .permitAll()
                );

        return http.build();
    }
}