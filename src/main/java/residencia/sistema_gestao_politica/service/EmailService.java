package residencia.sistema_gestao_politica.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void enviarNovaSenha(String para, String novaSenha) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("noreply@sistemapolitico.com");
        message.setTo(para);
        message.setSubject("Recuperação de Senha - Sistema de Gestão");
        message.setText("Olá,\n\nRecebemos uma solicitação de recuperação de senha.\n\n" +
                "Sua nova senha temporária é: " + novaSenha + "\n\n" +
                "Por favor, faça login e altere sua senha imediatamente no menu Configurações.\n\n" +
                "Atenciosamente,\nEquipe de Suporte.");

        mailSender.send(message);
    }
}