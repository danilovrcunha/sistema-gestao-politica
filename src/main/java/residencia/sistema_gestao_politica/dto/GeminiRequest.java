package residencia.sistema_gestao_politica.dto;

import java.util.Collections;
import java.util.List;

public class GeminiRequest {
    private List<Content> contents;

    public GeminiRequest(String text) {
        this.contents = Collections.singletonList(new Content(new Part(text)));
    }

    public List<Content> getContents() { return contents; }

    public static class Content {
        private List<Part> parts;
        public Content(Part part) { this.parts = Collections.singletonList(part); }
        public List<Part> getParts() { return parts; }
    }

    public static class Part {
        private String text;
        public Part(String text) { this.text = text; }
        public String getText() { return text; }
    }
}