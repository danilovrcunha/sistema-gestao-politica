package residencia.sistema_gestao_politica.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.ui.Model; // ✅ Import necessário

@Controller
public class AcoesController {

    @GetMapping("/acoes")
    public String acoes() {
        return "acoes/acoes";
    }

    @GetMapping("/registrarAcoes")
    public String registrarAcoes() {
        return "registrarAcoes/registrarAcoes";
    }

    @GetMapping("/acoesRegistradas")
    public String acoesRegistradas() {
        return "acoesRegistradas/acoesRegistradas";
    }

    @GetMapping("/editarAcao/{id}")
    public String editarAcao(@PathVariable Long id, Model model) {
        model.addAttribute("id", id);
        return "editarAcao/editarAcao";
    }
}
