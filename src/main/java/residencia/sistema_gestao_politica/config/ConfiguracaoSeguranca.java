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
        // --- MUDANÇA IMPORTANTE ---
        // Trocamos de NoOpPasswordEncoder para BCryptPasswordEncoder.
        // Isso é o padrão de segurança e o motivo de precisarmos de hashes.
        return new BCryptPasswordEncoder();
        // --- FIM DA MUDANÇA ---
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Desativa CSRF
                .authorizeHttpRequests(auth -> auth
                        // Libera o login e arquivos estáticos
                        .requestMatchers(
                                "/login/**",
                                "/login",
                                "/css/**", "/js/**", "/images/**", "/webjars/**",
                                "/login/login.html"
                        ).permitAll()

                        // Protege os endpoints de usuários
                        .requestMatchers(HttpMethod.GET, "/usuarios").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/usuarios/tipos").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/usuarios").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/usuarios/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/usuarios/*/senha").authenticated()
                        .requestMatchers("/gabinetes/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/home/**").authenticated()
                        .requestMatchers("/acoes/**").authenticated()
                        .requestMatchers("/kanban/**").authenticated()
                        .requestMatchers("/financeiro/**").authenticated()
                        .requestMatchers("/configuracoes/**").authenticated()

                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/login/login.html") // Sua página de login
                        .loginProcessingUrl("/login") // Endpoint que o Spring Security ouve
                        .defaultSuccessUrl("/home", true) // Para onde vai após login
                        .failureUrl("/login/login.html?error=true") // Para onde vai se errar
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutRequestMatcher(new AntPathRequestMatcher("/logout")) // URL de logout
                        .logoutSuccessUrl("/login/login.html?logout=true")
                        .permitAll()
                );

        return http.build();
    }
}