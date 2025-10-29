package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import residencia.sistema_gestao_politica.model.Financeiro;
import residencia.sistema_gestao_politica.repository.FinanceiroRepository;

import java.util.List;

@Controller
public class FinanceiroController {

    @Autowired
    private FinanceiroRepository financeiroRepository;

    @GetMapping("/financeiro")
    public String exibirFinanceiro(Model model) {
        List<Financeiro> registros = financeiroRepository.findAll();
        model.addAttribute("registros", registros);
        model.addAttribute("novoRegistro", new Financeiro());
        return "financeiro/financeiro";
    }

    @PostMapping("/financeiro")
    public String salvarRegistro(@ModelAttribute Financeiro financeiro) {
        // Apenas log para debug (opcional)
        System.out.println(">>> Salvando: " + financeiro.getCategoria() + " - " + financeiro.getValorDespesa());
        financeiroRepository.save(financeiro);
        return "redirect:/financeiro?salvo=true";
    }
}
