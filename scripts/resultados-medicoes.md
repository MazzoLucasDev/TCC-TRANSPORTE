# Medições do OptiVan (2026-11-09)

## Latência por endpoint (ms)

| Endpoint | n | Média | Mediana | P95 | Mín | Máx | Códigos |
|---|---|---|---|---|---|---|---|
| POST /login (bcrypt) | 15 | 75.4 | 77.7 | 85.5 | 65.1 | 85.5 | 200 |
| GET /attendance/confirmed | 30 | 9.5 | 9.2 | 11.1 | 7.4 | 21.0 | 200 |
| PUT /vans/:id/location | 30 | 5.5 | 5.4 | 6.6 | 4.5 | 6.9 | 200 |
| GET /vans/:id/location | 30 | 6.5 | 6.3 | 7.9 | 5.1 | 8.0 | 200 |
| POST /routes/generate | 10 | 2686.1 | 2683.8 | 2725.4 | 2641.6 | 2725.4 | 200 |

## Atraso da localização (motorista a cada 10 s, aluno consulta a cada 5 s)

| Métrica | n | Média | Mediana | Máx |
|---|---|---|---|---|
| Do envio até o aluno ver (s) | 8 | 3.1 | 2.8 | 5.3 |
| Idade da posição na tela do aluno (s) | 14 | 5.2 | 4.6 | 9.7 |

Limite teórico: 15 s (10 s de envio + 5 s de consulta).

## Sem sinal

Após o motorista parar de enviar, a posição foi marcada como desatualizada em 30.3 s (limite configurado: 30 s).

## Carga

| Cenário | Requisições | Erros | Média (ms) | P95 (ms) | Máx (ms) |
|---|---|---|---|---|---|
| 50 alunos consultando a cada 5 s por 30 s | 300 | 0 | 9.2 | 15.0 | 28.8 |
| Pico: 100 consultas simultâneas | 100 | 0 | 360.0 | 557.3 | 567.3 |
