package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import residencia.sistema_gestao_politica.model.enums.StatusTarefa;
import residencia.sistema_gestao_politica.repository.TarefaRepository;
import residencia.sistema_gestao_politica.service.MeuUserDetails;

import java.util.*;

@Controller
public class HomeController {

    @Autowired
    private TarefaRepository tarefaRepository;

    @GetMapping("/home")
    public String home(Model model, @RequestParam(required = false) Long gabineteId) {
        MeuUserDetails user = (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long userGabineteId = user.getGabineteId();

        // Lógica de Filtro
        Long idParaFiltrar = null;

        if (userGabineteId == null) {
            // É Super Admin: Usa o filtro da URL se existir
            if (gabineteId != null) {
                idParaFiltrar = gabineteId;
            }
        } else {
            // É Admin/User: Usa o próprio gabinete sempre
            idParaFiltrar = userGabineteId;
        }

        if (idParaFiltrar != null) {
            // Busca filtrada por Gabinete
            model.addAttribute("aFazer", tarefaRepository.countByStatusAndGabineteId(StatusTarefa.A_FAZER, idParaFiltrar));
            model.addAttribute("emAndamento", tarefaRepository.countByStatusAndGabineteId(StatusTarefa.EM_ANDAMENTO, idParaFiltrar));
            model.addAttribute("concluido", tarefaRepository.countByStatusAndGabineteId(StatusTarefa.CONCLUIDO, idParaFiltrar));
        } else {
            // Busca total (Apenas Super Admin sem filtro selecionado)
            model.addAttribute("aFazer", tarefaRepository.countByStatus(StatusTarefa.A_FAZER));
            model.addAttribute("emAndamento", tarefaRepository.countByStatus(StatusTarefa.EM_ANDAMENTO));
            model.addAttribute("concluido", tarefaRepository.countByStatus(StatusTarefa.CONCLUIDO));
        }

        return "home/home";
    }
}