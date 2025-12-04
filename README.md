# Sistema de Gestão Política 🏛️

Um sistema completo de gestão multi-inquilino (SaaS) desenvolvido para gabinetes políticos. O sistema integra gestão financeira, controle de tarefas (Kanban), mapeamento de ações de campo (Heatmap) e um Assistente de IA para análise de dados.

## 🚀 Funcionalidades

### 📊 Dashboard
- Visão geral de tarefas e estatísticas.
- Gráficos interativos de desempenho.

### 📋 Gestão de Tarefas (Kanban)
- Quadro interativo com Drag & Drop.
- Colunas: A Fazer, Em Andamento, Concluído.
- Atribuição de responsáveis e prazos.

### 💰 Financeiro
- Registro de receitas e despesas.
- Categorização de gastos (PIX, Dinheiro, Cartão).
- Filtro por mês e ano.
- **Exportação:** Gerador de relatórios em CSV.
- Cálculo automático de totais no rodapé.

### 📍 Mapa de Ações
- Geolocalização automática via CEP (Integração ViaCEP + Nominatim).
- **Mapa de Calor:** Visualização de densidade de ações por bairro.
- Filtros avançados por Bairro e Mês.

### 🤖 Assistente IA (Google Gemini)
- Chatbot integrado capaz de analisar o banco de dados em tempo real.
- Responde perguntas como: *"Quanto gastamos com combustível?"*, *"Quais as tarefas do João?"*, *"Resumo geral do gabinete"*.
- Utiliza técnica RAG (Retrieval-Augmented Generation) para fornecer respostas precisas baseadas nos dados do gabinete.

### 🔐 Segurança e Permissões
- **Multitenancy:** Isolamento total de dados entre gabinetes.
- **Níveis de Acesso:**
  - **Super Admin:** Visão global, filtro por gabinete, criação de gabinetes.
  - **Admin:** Gestão total do próprio gabinete.
  - **User:** Acesso limitado conforme permissões granulares.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Java 21, Spring Boot 3.
- **Database:** PostgreSQL.
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla), Thymeleaf.
- **Mapas:** Leaflet.js, OpenStreetMap.
- **IA:** Google Gemini 2.5 Flash API.
- **Segurança:** Spring Security, BCrypt.

---

## ⚙️ Pré-requisitos

Antes de começar, você precisa ter instalado em sua máquina:
- [Java JDK 21](https://www.oracle.com/java/technologies/downloads/)
- [Maven](https://maven.apache.org/)
- [PostgreSQL](https://www.postgresql.org/)

---

## 🚀 Como Rodar o Projeto

### 1. Clone o Repositório
```bash
git clone [https://github.com/danilovrcunha/sistema-gestao-politica.git](https://github.com/danilovrcunha/sistema-gestao-politica.git)
cd sistema-gestao-politica
2. Banco de Dados
Crie um banco de dados no PostgreSQL:

SQL
CREATE DATABASE sistema_gestao_politica;

3. Configuração
Navegue até src/main/resources/application.properties e configure suas credenciais:

Properties

# Configurações do Banco
spring.datasource.url=jdbc:postgresql://localhost:5432/sistema_gestao_politica
spring.datasource.username=seu_usuario_postgres
spring.datasource.password=sua_senha_postgres

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
server.port=8081

# Upload de Arquivos
spring.web.resources.static-locations=classpath:/static/,file:uploads/
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# Google Gemini API (IA)
gemini.api.key=SUA_CHAVE_API_AQUI
gemini.api.url=VERSAO_IA

4. Executar a Aplicação
Na raiz do projeto, execute:
Bash
mvn spring-boot:run

🧪 Acesso Inicial
O sistema utiliza criptografia BCrypt e carrega dados iniciais via DataInitializer.java.

Super administrador cadastrado:
Email: super@admin.com
Senha: super123
