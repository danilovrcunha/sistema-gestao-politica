package residencia.sistema_gestao_politica.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ConfiguracoesController {

    @GetMapping("/configuracoes")
    public String configuracoes() {
        return "configuracoes/configuracoes";
    }
}
