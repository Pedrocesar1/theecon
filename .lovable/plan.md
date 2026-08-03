# Publicar The Econ no GitHub

## Objetivo
Conectar o projeto The Econ ao GitHub via Git sync da Lovable, criando um repositório e sincronizando o código atual.

## Passos

1. **Iniciar conexão no editor Lovable**
   - Abrir o menu Plus (+) na entrada de chat → GitHub → Connect project.
   - Escolher entre criar um novo repositório ou usar um existente (recomendado: novo).

2. **Autorizar e selecionar destino**
   - Autorizar o app GitHub da Lovable quando solicitado.
   - Selecionar a conta ou organização GitHub onde o repositório será criado.

3. **Definir visibilidade do repositório**
   - O usuário escolhe se o repositório será público ou privado durante o fluxo.
   - Padrão sugerido: privado, a menos que o código deva ser aberto.

4. **Criar repositório e sincronizar**
   - Criar o repositório pelo botão da Lovable.
   - Aguardar a sincronização inicial do código completo do projeto.

5. **Confirmar publicação**
   - Verificar no GitHub se o repositório foi criado e contém os arquivos esperados.
   - Confirmar que o Git sync bidirecional está ativo (alterações na Lovable sobem para o GitHub e vice-versa).

## O que não está no escopo
- Não envolve o connector da API do GitHub para uso dentro do app.
- Não altera código do projeto nem adiciona funcionalidades.
- Não migra dados do banco de dados (isso é feito separadamente via Cloud → Export data, se necessário).
