# Publicar The Econ no GitHub

## Objetivo
Conectar o projeto The Econ ao GitHub via Git sync da Lovable, criando um repositório e sincronizando o código atual sem vazar dados sensíveis.

## Passos

1. **Proteger o arquivo .env antes do sync**
   - Verificar que `.env` contém secrets do Supabase e que `.gitignore` ainda não o protege.
   - Adicionar `.env` e `.env.*` ao `.gitignore` para garantir que nenhum arquivo de ambiente seja commitado.
   - Confirmar que o `.env` atual não será enviado ao GitHub.

2. **Iniciar conexão no editor Lovable**
   - Abrir o menu Plus (+) na entrada de chat → GitHub → Connect project.
   - Escolher entre criar um novo repositório ou usar um existente (recomendado: novo).

3. **Autorizar e selecionar destino**
   - Autorizar o app GitHub da Lovable quando solicitado.
   - Selecionar a conta ou organização GitHub onde o repositório será criado.

4. **Definir visibilidade do repositório**
   - O usuário escolhe se o repositório será público ou privado durante o fluxo.
   - Padrão sugerido: privado, a menos que o código deva ser aberto.

5. **Criar repositório e sincronizar**
   - Criar o repositório pelo botão da Lovable.
   - Aguardar a sincronização inicial do código completo do projeto.

6. **Confirmar publicação e segurança**
   - Verificar no GitHub se o repositório foi criado e contém os arquivos esperados.
   - Confirmar que `.env` não está presente no repositório remoto.
   - Confirmar que o Git sync bidirecional está ativo (alterações na Lovable sobem para o GitHub e vice-versa).

## O que não está no escopo
- Não envolve o connector da API do GitHub para uso dentro do app.
- Não altera funcionalidades do projeto.
- Não migra dados do banco de dados (isso é feito separadamente via Cloud → Export data, se necessário).

