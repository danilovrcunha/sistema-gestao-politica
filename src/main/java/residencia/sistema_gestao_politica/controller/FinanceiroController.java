package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import residencia.sistema_gestao_politica.model.Financeiro;
import residencia.sistema_gestao_politica.model.Gabinete;
import residencia.sistema_gestao_politica.repository.FinanceiroRepository;
import residencia.sistema_gestao_politica.repository.GabineteRepository;
import residencia.sistema_gestao_politica.service.MeuUserDetails;

import java.util.List;

@Controller
public class FinanceiroController {

    @Autowired private FinanceiroRepository financeiroRepository;
    @Autowired private GabineteRepository gabineteRepository;

    // --- ÚNICO MÉTODO GET PARA /financeiro ---
    // Este método atende tanto a chamada simples (/financeiro) quanto a filtrada (/financeiro?gabineteId=1)
    @GetMapping("/financeiro")
    public String exibirFinanceiro(Model model, @RequestParam(required = false) Long gabineteId) {
        MeuUserDetails user = (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        List<Financeiro> registros;

        if (user.getGabineteId() == null) { // É Super Admin
            if (gabineteId != null) {
                // Super Admin aplicou o filtro
                registros = financeiroRepository.findByGabineteId(gabineteId);
                model.addAttribute("filtroAtivo", gabineteId);
            } else {
                // Super Admin vendo tudo
                registros = financeiroRepository.findAll();
            }
        } else {
            // Admin ou User Comum: Vê APENAS o seu gabinete (ignora o parametro da URL)
            registros = financeiroRepository.findByGabineteId(user.getGabineteId());
        }

        model.addAttribute("registros", registros);
        model.addAttribute("novoRegistro", new Financeiro());
        return "financeiro/financeiro";
    }

    @PostMapping("/financeiro")
    public String salvarRegistro(@ModelAttribute Financeiro financeiro) {
        MeuUserDetails user = (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (user.getGabineteId() != null) {
            Gabinete g = gabineteRepository.findById(user.getGabineteId()).orElseThrow();
            financeiro.setGabinete(g);
        }

        financeiroRepository.save(financeiro);
        return "redirect:/financeiro?salvo=true";
    }
}