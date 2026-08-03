# Rotacionar chave pública e travar cadastro de novos usuários

## Situação atual (verificada)
- A chave pública aparece no código apenas em `src/integrations/supabase/client.ts`, e mesmo lá ela é lida das variáveis de ambiente (`VITE_SUPABASE_PUBLISHABLE_KEY`), não está fixa em código.
- O valor real vive no arquivo `.env`, que já está protegido pelo `.gitignore`.
- Não existem edge functions no projeto: o backend usa server functions do TanStack, que leem as chaves do ambiente.
- Existe exatamente uma conta de usuário no sistema: `pedrocesargomes22@gmail.com`, confirmada e com login recente (último acesso registrado). Ou seja, a conta admin existe e está funcional.

## Passo 1 — Rotacionar a chave
- Rodar a rotação de chaves de API do Lovable Cloud. Isso gera novas chaves, invalida as antigas e atualiza automaticamente o `.env` do projeto.
- Como o código lê tudo do ambiente, nenhuma alteração de código é necessária — nada de valor fixo para substituir.
- Reiniciar o servidor de desenvolvimento para carregar os novos valores.

## Passo 2 — Confirmar que o app funciona
- Abrir a home e a listagem de colunas/índices e verificar que os dados públicos continuam carregando.
- Fazer login no `/admin/login` com a conta admin e confirmar que o painel abre normalmente.
- Verificar o console do navegador para garantir que não há erros de autenticação.

## Passo 3 — Desabilitar cadastro público
- Somente após o login admin ser confirmado funcionando com a chave nova, desabilitar o cadastro de novos usuários na configuração de autenticação (signup desativado, cadastro anônimo desativado).
- Manter o login por e-mail/senha ativo para a conta existente.

## Observações importantes
- Depois de publicar novamente o app, a versão publicada passa a usar a chave nova; a antiga deixa de funcionar.
- Com o cadastro desabilitado, criar novas contas no futuro só será possível reativando temporariamente essa configuração.
- Se o `.env` antigo já foi para o GitHub, o histórico do repositório ainda contém o valor antigo — mas ele fica inútil após a rotação.
