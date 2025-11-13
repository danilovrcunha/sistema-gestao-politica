package residencia.sistema_gestao_politica.service;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import residencia.sistema_gestao_politica.model.Usuario;

import java.util.Collection;
import java.util.Collections;

public class MeuUserDetails implements UserDetails {

    private final Usuario usuario;

    public MeuUserDetails(Usuario usuario) {
        this.usuario = usuario;
    }

    // Método crucial para nossa lógica de negócio
    public Long getGabineteId() {
        if (usuario.getGabinete() == null) {
            return null; // É um SUPER_ADMIN
        }
        return usuario.getGabinete().getId();
    }

    public Long getUsuarioId() {
        return usuario.getId();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Prefixo 'ROLE_' é uma convenção do Spring Security
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + usuario.getTipoUsuario().name()));
    }

    @Override
    public String getPassword() {
        return usuario.getPassword();
    }

    @Override
    public String getUsername() {
        return usuario.getEmail(); // Usamos email como username
    }

    // Métodos padrão do UserDetails
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}