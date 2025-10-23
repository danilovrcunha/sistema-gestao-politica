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

    // Exibe a tela do Financeiro e o histórico de transações
    @GetMapping("/financeiro")
    public String exibirFinanceiro(Model model) {
        List<Financeiro> registros = financeiroRepository.findAll(); // Carrega todos os registros financeiros
        model.addAttribute("registros", registros); // Envia os registros para o Thymeleaf
        model.addAttribute("novoRegistro", new Financeiro()); // Adiciona o objeto "novoRegistro" ao modelo
        return "financeiro/financeiro"; // Retorna a página do financeiro
    }

    // Salva o registro financeiro
    @PostMapping("/financeiro")
    public String salvarRegistro(@ModelAttribute Financeiro financeiro, Model model) {
        // Verifica se os dados estão sendo preenchidos corretamente
        System.out.println("Salvando registro financeiro: " + financeiro);

        // Verifica e converte os valores antes de salvar (removendo formatação de "R$")
        financeiro.setValorLocacao(formatCurrency(financeiro.getValorLocacao()));
        financeiro.setValorJuridica(formatCurrency(financeiro.getValorJuridica()));
        financeiro.setValorComunicacao(formatCurrency(financeiro.getValorComunicacao()));
        financeiro.setValorCombustivel(formatCurrency(financeiro.getValorCombustivel()));
        financeiro.setDespesasDebito(formatCurrency(financeiro.getDespesasDebito()));
        financeiro.setDespesasCredito(formatCurrency(financeiro.getDespesasCredito()));
        financeiro.setOutrasDespesas(formatCurrency(financeiro.getOutrasDespesas()));

        // Persiste o objeto financeiro no banco
        financeiroRepository.save(financeiro);

        // Após salvar, exibe a lista atualizada de registros no histórico
        List<Financeiro> registros = financeiroRepository.findAll();
        model.addAttribute("registros", registros);

        // Redireciona para a página de financeiro com o parâmetro 'salvo=true'
        return "redirect:/financeiro?salvo=true"; // Passa o parâmetro para exibir a mensagem de sucesso
    }

    // Função para converter os valores monetários para Double
    private Double formatCurrency(Double value) {
        if (value == null) {
            return 0.0;
        }
        return value; // Caso a formatação já seja feita no front-end
    }
}
