# Varredura da regra de dependência

Pasta analisada: `src` | Data: 2026-11-17 | Arquivos .ts lidos: 166

## 1. Arquivos e importações por camada

| Camada | Arquivos de produção | Arquivos de teste | Importações relativas | Importações de pacotes |
|---|---:|---:|---:|---:|
| domain | 57 | 12 | 118 | 12 |
| useCases | 42 | 25 | 365 | 25 |
| infra | 20 | 9 | 114 | 25 |
| main | 1 | 0 | 43 | 3 |

## 2. Matriz de dependências (código de produção)

Cada célula é a quantidade de importações da camada da linha para a camada da coluna.

| de \ para | domain | useCases | infra | main |
|---|---:|---:|---:|---:|
| **domain** | 100 | 0 | 0 | 0 |
| **useCases** | 147 | 66 | 0 | 0 |
| **infra** | 20 | 33 | 19 | 0 |
| **main** | 0 | 25 | 18 | 0 |

## 3. Matriz de dependências (arquivos de teste)

| de \ para | domain | useCases | infra | main |
|---|---:|---:|---:|---:|
| **domain** | 18 | 0 | 0 | 0 |
| **useCases** | 113 | 39 | 0 | 0 |
| **infra** | 18 | 0 | 24 | 0 |
| **main** | 0 | 0 | 0 | 0 |

## 4. Pacotes externos usados no código de produção

- **domain:** nenhum
- **useCases:** nenhum
- **infra:** @prisma/client (1), bcrypt (1), express (8), jsonwebtoken (1), node:console (4)
- **main:** cors (1), dotenv (1), express (1)

## 5. Violações

Nenhuma violação encontrada em domain e useCases (produção e testes).

## 6. Resultado

**APROVADO:** domain depende apenas de domain; useCases depende apenas de domain e useCases; nenhuma biblioteca de infraestrutura é importada nessas camadas.

Regra aplicada: domain → {domain}; useCases → {domain, useCases}; infra → {domain, useCases, infra}; main → todas. Bibliotecas proibidas em domain e useCases: @prisma/client, prisma, express, cors, bcrypt, jsonwebtoken, dotenv, axios, pg.
