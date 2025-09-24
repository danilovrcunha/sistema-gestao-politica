package residencia.sistema_gestao_politica.controller;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;



@Controller
public class LoginController {

    @GetMapping("/login")
    public String login() {
        return "login/login";
    }

    @GetMapping("/dashboard")
    public String dashboard() {
        return "home/home";
    }
}