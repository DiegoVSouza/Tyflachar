# Chatbot Guide

> Os dois motores do bot de WhatsApp (`internal/chatbot/`), como o modo é escolhido por filial, e como estender cada um.

---

## Visão geral

O chatbot não é acionado por uma rota HTTP do dashboard — ele é acionado pelo `WebhookHandler` sempre que uma mensagem chega de um cliente via WhatsApp (`POST /webhook`). Existem **dois motores** intercambiáveis, ambos implementando a mesma interface:

```go
// internal/chatbot/interface.go
type BotEngine interface {
    // decide e envia a próxima resposta para uma conversa
}
```

| Motor | Arquivo | Abordagem |
|---|---|---|
| `Engine` | `internal/chatbot/engine.go` | Máquina de estados fixa (estados definidos em `states.go`) |
| `LLMEngine` | `internal/chatbot/llm_engine.go` | Claude com RAG sobre `branch_knowledge` + tool calling |

---

## Como o modo é escolhido

Cada filial tem uma coluna `branches.bot_mode`, com valor `fixed` ou `llm`. Ao receber um webhook, `WebhookHandler.engine(branchID)` consulta essa coluna e instancia o motor correspondente para aquela filial. Ou seja, **o modo é por filial**, não global — duas filiais no mesmo backend podem operar em modos diferentes simultaneamente.

Se a filial estiver em modo `llm` mas `ANTHROPIC_API_KEY` não estiver configurada no ambiente, o `LLMEngine` fica desabilitado — nesse caso o CRM efetivamente só consegue operar em modo `fixed` (verifique a configuração antes de apontar uma filial para `llm` em produção).

---

## Motor `fixed` — máquina de estados

Estados definidos em `internal/chatbot/states.go`, com transições geridas por `engine.go`. O estado atual de cada conversa fica persistido em `conversations.bot_state`.

Fluxo de estados:

```
start
  │
  ▼
main_menu
  │
  ▼
choosing_service
  │
  ▼
choosing_slot
  │
  ▼
confirming_appointment
  │
  ▼
done
```

Em cada estado, o `Engine` monta a resposta apropriada (texto, botões ou lista) e envia via `internal/whatsapp/client.go` (`SendText`, `SendButtons`, `SendList` — ver `buttons.go`).

### Como adicionar um novo estado

1. Defina a constante do novo estado em `states.go`.
2. Trate o novo estado no `switch`/lógica de transição em `engine.go`: o que enviar ao usuário nesse estado, e para qual próximo estado ir a partir das respostas possíveis.
3. Se o estado precisar ler/gravar dados (ex.: reservar um slot), use o `repository` já injetado no `Engine` — não acesse o banco diretamente de fora dele.
4. Atualize `conversations.bot_state` ao final de cada transição (já é o padrão usado pelos estados existentes).

---

## Motor `llm` — RAG + tool calling

`LLMEngine` usa `internal/llm/client.go` (wrapper HTTP para a Anthropic Messages API) para conversar com o modelo configurado em `ANTHROPIC_MODEL` (ex.: `claude-3-5-haiku-20241022`).

### RAG sobre `branch_knowledge`

Antes de chamar o modelo, o `LLMEngine` busca registros relevantes na tabela `branch_knowledge` (filtrados por `branch_id`), que tem uma coluna `category` (`services` | `hours` | `policies` | `faq` | `general`). O conteúdo recuperado é injetado no contexto/prompt enviado ao Claude, dando ao modelo informação específica daquela filial (preços, horários, políticas) sem precisar de fine-tuning.

### Tools disponíveis

| Tool | Propósito |
|---|---|
| `list_services` | Lista os serviços ativos da filial (tabela `services`) |
| `search_available_slots` | Busca horários disponíveis (tabela `available_slots`, filtra por `booked = false`) |
| `create_appointment` | Cria um agendamento (tabela `appointments`), tipicamente marcando o slot correspondente como `booked` |

O `LLMEngine` roda um **loop de até 5 rounds de tool-use**: envia a mensagem do usuário + histórico, o modelo pode responder com texto final ou pedir para chamar uma tool; o motor executa a tool (via `repository`), devolve o resultado ao modelo, e repete até obter uma resposta final de texto ou atingir o limite de rounds.

### Como adicionar uma nova tool

1. Defina o schema da tool (nome, descrição, parâmetros) no ponto onde as tools são declaradas em `llm_engine.go`.
2. Implemente a função Go que executa a ação real (tipicamente uma chamada ao `repository`).
3. Trate o `tool_use` correspondente no loop de rounds, mapeando o nome da tool para a função implementada.
4. Garanta que a tool também filtra por `branch_id` — o modelo não deve conseguir, por exemplo, listar serviços de outra filial.

---

## Envio de mensagens ao WhatsApp

Ambos os motores usam o mesmo `internal/whatsapp/client.go` para efetivamente enviar a resposta ao usuário via WhatsApp Cloud API (Graph API da Meta). `buttons.go` contém os helpers para montar payloads de botões interativos e listas. Se um novo tipo de mensagem interativa for necessário (ex.: um novo formato de lista), adicione o helper ali, não duplique a montagem de payload dentro de cada motor.

---

## Logs

Ambos os motores usam prefixos emoji no log padrão (`🤖` para decisões do bot, `📩`/`✅`/`❌` para envio/recebimento — ver `CONTRIBUTING.md`), o que facilita acompanhar o fluxo de uma conversa em produção lendo os logs do processo.
