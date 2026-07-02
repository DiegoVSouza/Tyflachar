# Contributing

> Convenções do time para o backend Go (`crm-whatsapp-api`).

---

## Estrutura e nomenclatura

- Pacotes minúsculos e simples: `handlers`, `models`, `repository`, `chatbot`, `whatsapp`, `llm`, `ws`, `redisclient`, `middleware`, `config`, `database`.
- Arquivos em `snake_case`, nomeados pelo domínio: `auth_handler.go`, `webhook_handler.go`, `client_handler.go`.
- Construtores seguem o padrão `New<Tipo>(...)` (ex.: `NewClientHandler(repo)`), retornando o valor pronto para uso — evite inicialização parcial/lazy dentro do próprio tipo.
- Um handler HTTP por arquivo, agrupando os métodos daquele domínio (ex.: todos os métodos de `AppointmentHandler` em `appointment_handler.go`).

---

## Erros e respostas HTTP

- Go idiomático: `if err != nil { ... }`, sem wrapper central de erro.
- Não há middleware global de tratamento de erro — o Fiber usa seu handler de erro padrão. Cada handler é responsável por retornar o status e o corpo corretos.
- Corpo de erro padrão:

```json
{ "error": "mensagem legível do problema" }
```

- Status HTTP conforme a situação: `400` (request malformado), `401` (auth), `404` (não encontrado), `422` (validação de negócio), `500` (erro inesperado). Ver `instructions/API_GUIDE.md` para a tabela completa.
- Nunca deixe um `err != nil` sem tratamento silencioso — sempre logue ou retorne erro ao cliente (ou ambos).

---

## Validação de entrada

Não há biblioteca de validação (tipo `validator/v10`) no projeto — cada handler valida manualmente os campos obrigatórios do request antes de seguir. Ao adicionar um endpoint novo, siga o padrão dos handlers vizinhos: checar campos obrigatórios logo no início da função e retornar `400`/`422` cedo se algo estiver faltando ou for inválido.

---

## SQL — regra de segurança inegociável

- **Sempre** use placeholders `$1, $2, ...` do `pgx` para valores de entrada em queries.
- **Nunca** interpole valor de entrada de usuário via `fmt.Sprintf` diretamente numa string SQL — isso é a porta de entrada clássica para SQL injection.
- Nomes de coluna/cláusula dinâmicos (quando genuinamente necessários) só podem vir de um conjunto fixo e controlado no código (ex.: um `switch` sobre um enum interno), nunca diretamente de input do usuário.
- Toda query de domínio de negócio deve filtrar por `branch_id` — é a única barreira de isolamento multi-tenant que o sistema tem (ver `architecture/ARCHITECTURE.md`).

---

## Logging

- `log` padrão da stdlib, sem lib de logging estruturado.
- Prefixos emoji para facilitar leitura rápida em produção:

| Emoji | Uso |
|---|---|
| 📩 | Mensagem recebida |
| ✅ | Operação concluída com sucesso |
| ❌ | Erro |
| 🤖 | Decisão/ação do motor de chatbot |
| ℹ️ | Informação geral |

- O Fiber `logger.New()` já loga cada request HTTP automaticamente — não duplique esse log manualmente dentro dos handlers.
- Ao adicionar um log novo, siga a convenção de prefixo existente em vez de inventar um novo símbolo sem necessidade.

---

## Comentários e organização de arquivo

Arquivos maiores usam separadores de seção no estilo:

```go
// ─── Nome da Seção ──────────────────────────────────
```

Use esse padrão para dividir um arquivo grande em blocos lógicos (ex.: "Handlers", "Helpers", "Validação") em vez de deixar tudo misturado sem separação visual.

---

## Testes

O projeto tem testes automatizados cobrindo os módulos de maior risco: `internal/middleware/auth.go` (JWT + `RequireRole`), `internal/handlers/webhook_handler.go` (validação HMAC), `internal/handlers/auth_handler.go` (Argon2id) e `internal/repository/` (isolamento multi-tenant por `branch_id`, via testes de integração contra um Postgres real). Ver `TESTING_GUIDE.md` para como rodar cada camada (`go test ./...` para os unitários; `docker compose up -d` antes para não pular os de `internal/repository`).

Cobertura ainda não é ampla nem obrigatória em 100% do código — segue incremental, priorizando área crítica (auth, webhook, agendamento, RBAC). Ao adicionar um teste, siga a convenção padrão de Go (`arquivo_test.go` ao lado do arquivo testado, `func TestX(t *testing.T)`), sem necessidade de framework externo — a stdlib (`testing`) é suficiente para a maior parte dos casos aqui.

---

## Checklist antes de abrir um PR

- [ ] Toda query nova filtra por `branch_id` (quando aplicável)
- [ ] Toda query nova usa placeholders `$1, $2...` para valores
- [ ] Handler novo segue o padrão de erro `{"error": "..."}` e status HTTP apropriado
- [ ] Listas retornam `[]` em vez de `null` quando vazias
- [ ] Logs novos seguem o padrão de prefixo emoji existente
- [ ] Se a mudança for em área crítica (auth, webhook, agendamento, RBAC), adicione um teste (ver `TESTING_GUIDE.md`)
- [ ] `go build ./...` e `go vet ./...` passam sem erros
- [ ] `go test ./...` passa (ou pula com motivo claro, se for teste de `internal/repository/` sem Postgres local)
