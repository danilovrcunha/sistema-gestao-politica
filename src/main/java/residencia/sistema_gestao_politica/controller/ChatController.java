package residencia.sistema_gestao_politica.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import residencia.sistema_gestao_politica.service.ChatService;
import residencia.sistema_gestao_politica.service.MeuUserDetails;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping
    public ResponseEntity<Map<String, String>> conversar(@RequestBody Map<String, String> payload) {
        String pergunta = payload.get("pergunta");
        String gabineteIdStr = payload.get("gabineteId");

        MeuUserDetails user = (MeuUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Long gabineteId = user.getGabineteId();

        if (gabineteId == null && gabineteIdStr != null && !gabineteIdStr.isEmpty()) {
            try {
                gabineteId = Long.parseLong(gabineteIdStr);
            } catch (NumberFormatException e) {}
        }

        String resposta = chatService.processarPergunta(pergunta, gabineteId);
        return ResponseEntity.ok(Map.of("resposta", resposta));
    }
}