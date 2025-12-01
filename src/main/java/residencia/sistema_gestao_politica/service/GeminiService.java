package residencia.sistema_gestao_politica.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import residencia.sistema_gestao_politica.dto.GeminiRequest;
import residencia.sistema_gestao_politica.dto.GeminiResponse;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String interpretarDados(String contextoDados, String perguntaUsuario) {
        try {
            String prompt = String.format(
                    "Você é um assistente de um sistema de gestão política. " +
                            "Analise os dados abaixo e responda à pergunta do usuário de forma concisa, amigável e direta. " +
                            "Não invente dados. Se a resposta não estiver nos dados, diga que não sabe.\n\n" +
                            "DADOS DO SISTEMA:\n%s\n\n" +
                            "PERGUNTA DO USUÁRIO: %s",
                    contextoDados, perguntaUsuario
            );

            String urlCompleta = apiUrl + "?key=" + apiKey;
            GeminiRequest request = new GeminiRequest(prompt);

            GeminiResponse response = restTemplate.postForObject(urlCompleta, request, GeminiResponse.class);

            if (response != null && !response.getCandidates().isEmpty()) {
                return response.getCandidates().get(0).getContent().getParts().get(0).getText();
            }
            return "Desculpe, o cérebro da IA não respondeu.";

        } catch (HttpClientErrorException e) {
            System.err.println("Erro Gemini API: " + e.getResponseBodyAsString());
            return "Erro na IA: Verifique a URL do modelo ou a API Key.";
        } catch (Exception e) {
            e.printStackTrace();
            return "Erro interno ao conectar com a IA.";
        }
    }
}