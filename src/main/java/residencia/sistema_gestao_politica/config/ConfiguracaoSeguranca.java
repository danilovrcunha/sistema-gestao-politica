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
                        .requestMatchers("/global/**").permitAll()

                        // Libera pastas padrões do Spring Boot
                        .requestMatchers("/css/**", "/js/**", "/images/**", "/webjars/**", "/favicon.ico").permitAll()

                        // Libera o Assistente IA
                        .requestMatchers("/AssistenteIA/**").permitAll()

                        .requestMatchers("/financeiro/*.js").permitAll()
                        .requestMatchers("/kanban/*.js").permitAll()
                        .requestMatchers("/acoes/*.js").permitAll()
                        .requestMatchers("/configuracoes/*.js").permitAll()
                        .requestMatchers("/registrarAcoes/*.js").permitAll()
                        .requestMatchers("/editarAcao/*.js").permitAll()
                        .requestMatchers("/acoesRegistradas/*.js").permitAll()
                        .requestMatchers("/criarTarefa/*.js").permitAll()
                        .requestMatchers("/home/*.js").permitAll()

                        .requestMatchers("/login/**", "/login", "/login/login.html").permitAll()


                        .requestMatchers(HttpMethod.GET, "/usuarios/me").authenticated()

                        // Regras de Admin
                        .requestMatchers(HttpMethod.GET, "/usuarios").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/usuarios/tipos").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/usuarios").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/usuarios/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/usuarios/*/senha").authenticated()

                        // Regras de Super Admin
                        .requestMatchers("/gabinetes/**").hasRole("SUPER_ADMIN")

                        // Páginas do Sistema (Views)
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