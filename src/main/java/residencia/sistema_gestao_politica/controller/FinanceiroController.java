package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import residencia.sistema_gestao_politica.model.Financeiro;
import residencia.sistema_gestao_politica.model.Gabinete;
import residencia.sistema_gestao_politica.repository.FinanceiroRepository;
import residencia.sistema_gestao_politica.repository.GabineteRepository;
import residencia.sistema_gestao_politica.service.MeuUserDetails;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Controller
public class FinanceiroController {

    @Autowired private FinanceiroRepository financeiroRepository;
    @Autowired private GabineteRepository gabineteRepository;

    @GetMapping("/financeiro")
    public String exibirFinanceiro(Model model,
                                   @RequestParam(required = false) Long gabineteId,
                                   @RequestParam(required = false) String mes,
                                   @RequestParam(required = false) String salvo) {

        MeuUserDetails user = (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Financeiro> registros;

        // Determina datas de início e fim se o mês foi passado
        LocalDate dataInicio = null;
        LocalDate dataFim = null;
        if (mes != null && !mes.isEmpty()) {
            YearMonth ym = YearMonth.parse(mes); // Ex: "2025-11"
            dataInicio = ym.atDay(1);
            dataFim = ym.atEndOfMonth();
        }

        // LÓGICA DE BUSCA
        if (user.getGabineteId() == null) { // Super Admin
            Long idFiltro = gabineteId;

            if (idFiltro != null) {
                // Super Admin filtrando por Gabinete
                if (dataInicio != null) {
                    registros = financeiroRepository.findByGabineteIdAndDataRegistroBetween(idFiltro, dataInicio, dataFim);
                } else {
                    registros = financeiroRepository.findByGabineteId(idFiltro);
                }
                model.addAttribute("filtroAtivo", idFiltro);
            } else {
                // Super Admin vendo TUDO
                if (dataInicio != null) {
                    registros = financeiroRepository.findByDataRegistroBetween(dataInicio, dataFim);
                } else {
                    registros = financeiroRepository.findAll();
                }
            }
        } else {
            // Admin/User Comum (Apenas seu gabinete)
            if (dataInicio != null) {
                registros = financeiroRepository.findByGabineteIdAndDataRegistroBetween(user.getGabineteId(), dataInicio, dataFim);
            } else {
                registros = financeiroRepository.findByGabineteId(user.getGabineteId());
            }
        }

        if ("true".equals(salvo)) {
            model.addAttribute("mensagemSucesso", "Registro financeiro salvo com sucesso!");
        }

        // Mantém o filtro de mês preenchido na tela
        model.addAttribute("mesSelecionado", mes);

        model.addAttribute("registros", registros);
        model.addAttribute("novoRegistro", new Financeiro());
        return "financeiro/financeiro";
    }

    @PostMapping("/financeiro")
    public String salvarRegistro(@ModelAttribute Financeiro financeiro,
                                 @RequestParam(required = false) Long gabineteIdSelecionado) {

        MeuUserDetails user = (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long finalId = user.getGabineteId();

        if (finalId == null) { // Super Admin
            if (gabineteIdSelecionado != null) {
                finalId = gabineteIdSelecionado;
            } else {
                return "redirect:/financeiro?erro=GabineteObrigatorio";
            }
        }

        Gabinete g = gabineteRepository.findById(finalId).orElseThrow();
        financeiro.setGabinete(g);

        financeiroRepository.save(financeiro);
        return "redirect:/financeiro?salvo=true";
    }

    @DeleteMapping("/financeiro/{id}")
    @ResponseBody
    public org.springframework.http.ResponseEntity<?> deletarRegistro(@PathVariable Long id) {
        MeuUserDetails user = (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Financeiro registro = financeiroRepository.findById(id).orElse(null);

        if (registro == null) return org.springframework.http.ResponseEntity.notFound().build();

        if (user.getGabineteId() != null && !registro.getGabinete().getId().equals(user.getGabineteId())) {
            return org.springframework.http.ResponseEntity.status(403).body("Acesso negado.");
        }

        financeiroRepository.delete(registro);
        return org.springframework.http.ResponseEntity.ok("Excluído.");
    }
}