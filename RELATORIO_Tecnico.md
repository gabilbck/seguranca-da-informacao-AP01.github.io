# Relatório técnico — Análise e melhoria de segurança em sistema web

## 1. Identificação do grupo

| Campo | Conteúdo |
| --- | --- |
| Disciplina | Segurança da Informação |
| Integrantes | Gabrieli Eduarda Lembeck; Julio Bezerra de Mattos Manoel; Mileine da Silva de Freitas |
| Turma | Conforme registro acadêmico |
| Data | 12 de maio de 2026 |
| Repositório | https://github.com/gabilbck/seguranca-da-informacao-AP01 |
| Sistema publicado | https://gabilbck.github.io/seguranca-da-informacao-AP01.github.io/ |

---

## 2. Descrição resumida do sistema

Trata-se de um protótipo web para registro e acompanhamento de ocorrências acadêmicas fictícias, com telas de acesso, cadastro, listagem, busca, alteração de status, exclusão, exportação de dados e área de auditoria simulada. Os perfis conceituais são aluno, professor e administrador. Os dados manipulados incluem identificação de aluno, matrícula, contatos, tipo e prioridade da ocorrência, descrição, observação interna e metadados de criação. Não há back-end, API nem banco de dados central; a execução e a persistência simulada ocorrem no navegador por meio de armazenamento local.

---

## 3. Regras de negócio percebidas

Na concepção esperada para um ambiente institucional, alunos abririam demandas vinculadas à própria identidade; professores atuariam sobre ocorrências das turmas sob sua responsabilidade ou por si registradas; administradores manteriam visão global e funções sensíveis como exportação, limpeza de logs e restauração da base. Alterações destrutivas e ações de governança deveriam observar segregação de funções e trilha de auditoria. Na versão original do protótipo, essas distinções não se refletiam no comportamento: qualquer sessão podia alterar perfil na interface, acessar todos os registros, alterar status, excluir, limpar logs e exportar dados sensíveis embutidos no código cliente.

---

## 4. Identificação dos ativos

| Item | Ativo identificado | Por que este ativo tem valor? |
| --- | --- | --- |
| 1 | Dados de identificação e contato de alunos | Suportam atendimento e rastreio; vazamento ou alteração indevida afeta privacidade e integridade acadêmica. |
| 2 | Registros de ocorrências | Representam decisões e histórico administrativo; são alvo de fraude reputacional e acadêmica se manipulados. |
| 3 | Credenciais e perfis de acesso | Determinam quem pode agir no sistema; comprometimento implica acesso indevido a todo o fluxo. |
| 4 | Logs de auditoria | Devem permitir reconstrução de eventos; se públicos ou apagáveis por qualquer perfil, perdem valor probatório. |
| 5 | Código e dados exportáveis | Revelam implementação e, na versão anterior, podiam expor segredos fictícios e credenciais de demonstração embutidas. |

---

## 5. Classificação dos dados e ativos

| Item | Dado ou ativo | Classificação | Justificativa |
| --- | --- | --- | --- |
| 1 | Nome, matrícula, CPF, e-mail e telefone do aluno | Confidencial | Identificação e contato; impacto elevado em caso de vazamento (LGPD, dignidade da pessoa). |
| 2 | Descrição e status da ocorrência | Restrito / confidencial | Conteúdo potencialmente sensível; alteração indevida compromete integridade do processo. |
| 3 | Observação interna | Restrito | Destina-se a fluxo interno; aluno não deveria visualizar conteúdo de coordenação. |
| 4 | Logs operacionais | Interno | Apoiam governança; exposição ampla revela operação interna e facilita anti-forense. |
| 5 | Interface pública do login | Público | Visível a todos; não deve antecipar credenciais válidas em campos de entrada. |

---

## 6. Análise dos riscos encontrados

| Item | Problema identificado | Risco associado | Impacto possível |
| --- | --- | --- | --- |
| 1 | Campos de login pré-preenchidos com credenciais de demonstração | Confidencialidade, autenticidade | Facilita acesso não intencional por terceiros que visualizem a tela. |
| 2 | Ausência de separação de permissões por perfil | Controle de acesso | Violação do menor privilégio; aluno visualiza e altera dados de terceiros. |
| 3 | Seletor de “perfil ativo” alterável após login | Integridade, controle de acesso | Escalonamento de privilégios simulado na interface. |
| 4 | Exportação contendo estrutura de usuários e token fictício no JSON | Confidencialidade | Reforça falsa sensação de segredo no cliente e expõe modelo de credenciais. |
| 5 | Renderização de dados sem neutralização na tabela | Integridade (XSS), confidencialidade | Carga maliciosa em campos persistidos poderia executar script no navegador. |
| 6 | Persistência apenas no navegador | Disponibilidade, integridade | Perda local de dados; ausência de fonte única da verdade. |
| 7 | Logs armazenados localmente e limpáveis por qualquer sessão | Rastreabilidade | Impossibilidade de auditoria forte; risco de ocultação de ações. |

---

## 7. Melhorias implementadas no código

| Item | Melhoria implementada | Arquivo alterado | O que mudou no sistema? |
| --- | --- | --- | --- |
| 1 | Remoção de credenciais pré-preenchidas nos campos de login | index.html | Campos de e-mail e senha passam a iniciar vazios; credenciais permanecem apenas na lista didática separada. |
| 2 | Controle de acesso por perfil (simulação no front-end) | app.js | Aluno enxerga apenas ocorrências da própria matrícula; professor, turmas da sua responsabilidade ou registros por ele criados; administrador mantém visão global. |
| 3 | Eliminação do escalonamento de privilégio via seletor de perfil | index.html, app.js | O perfil passa a refletir somente o usuário autenticado na origem da sessão. |
| 4 | Restrição de logs e ações administrativas | index.html, app.js | Painel de logs, exportação completa, limpeza de logs e restauração da base ficam condicionados ao perfil administrador. |
| 5 | Regras de exclusão e de alteração de status coerentes com papéis | app.js | Aluno não exclui nem altera status; professor altera status nas ocorrências do seu escopo e exclui apenas registros criados por si; administrador preserva poderes mais amplos. |
| 6 | Vínculo do cadastro do aluno à identidade da sessão | app.js | Para o perfil aluno, nome, matrícula e e-mail de contato são travados à identidade autenticada e a matrícula digitada é validada contra a sessão. |
| 7 | Busca operando sobre o conjunto visível e correção de acoplamento com ações da tabela | app.js | Busca aplica-se aos registros já filtrados pelo perfil; botões de ação utilizam delegação de eventos e identificadores neutros em relação a HTML dinâmico. |
| 8 | Redução de exposição em exportação e mitigação de XSS | app.js | Exportação administrativa remove segredos reais de demonstração da carga útil serializada; valores dinâmicos são escapados antes da inserção em HTML. |
| 9 | Campo de turma para roteamento docente e amostra inicial consistente | index.html, app.js | Inclusão de turma nos registros para delimitar o escopo do professor; exemplos fictícios atualizados, inclusive ocorrência associada ao aluno de demonstração. |
| 10 | Comunicação explícita de limitações do protótipo | index.html | Faixa de advertência e rodapé esclarecem ausência de servidor e caráter didático dos controles. |

---

## 8. Relação entre problema, risco, controle e justificativa

| Item | Item analisado | Risco associado | Controle ou melhoria proposta | Foi implementado? |
| --- | --- | --- | --- | --- |
| 1 | Credenciais pré-preenchidas no login | Acesso indevido facilitado | Campos vazios; instruções de demonstração separadas | Sim |
| 2 | Ausência de validação de acesso no servidor | Autenticidade, confidencialidade | Autenticação e autorização reais no back-end, MFA quando aplicável | Dependeria de back-end |
| 3 | Ausência de RBAC materializado | Controle de acesso, menor privilégio | Políticas por papel aplicadas na interface e reforçadas no servidor | Parcialmente |
| 4 | Troca manual de tipo de usuário na sessão | Escalonamento de privilégios | Remoção do seletor; perfil derivado exclusivamente do usuário autenticado | Sim |
| 5 | Registro em nome de terceiros pelo aluno | Integridade, autenticidade | Campos de identidade bloqueados ao perfil aluno e validação de matrícula | Parcialmente |
| 6 | Visualização indiscriminada de ocorrências | Confidencialidade | Filtro de registros por matrícula, turma ou papel administrativo | Parcialmente |
| 7 | Exclusão irrestrita | Integridade, disponibilidade | Exclusão condicionada a administrador ou autor docente do registro | Parcialmente |
| 8 | Alteração de status irrestrita | Integridade de fluxo | Alteração restrita a professor no seu escopo e administrador | Parcialmente |
| 9 | Logs acessíveis a todos | Confidencialidade, rastreabilidade | Visualização de logs somente para administrador na interface | Parcialmente |
| 10 | Busca inoperante ou inconsistente | Disponibilidade operacional | Busca textual sobre o conjunto autorizado ao perfil | Sim |

### Justificativa técnica por item da tabela anterior

1. Campos vazios reduzem vazamento casual de credenciais de laboratório por captura de tela ou shoulder surfing, alinhando-se à minimização de exposição.
2. Sem servidor, qualquer verificação de senha permanece inspecionável; somente infraestrutura com TLS, armazenamento segredo de hash e emissão de sessão opaca resolve o risco de forma adequada.
3. A simulação no front-end educa quanto ao modelo RBAC, mas não substitui enforcement em API, pois o usuário pode alterar o código localmente.
4. A remoção do seletor corta um canal explícito de escalonamento na interface; a ameaça residual de edição de `localStorage` permanece fora do escopo de um front-end isolado.
5. O vínculo ao aluno autenticado impede que o próprio formulário seja usado para fabricar ocorrências sobre matrículas arbitrárias sem ao menos contornar a validação; ainda assim, um atacante poderia manipular o armazenamento local ou o código.
6. O filtro por matrícula e turma reduz superfície de visualização indevida em uso legítimo do protótipo; dados agregados em servidor continuariam necessários para consistência global.
7. A exclusão parcial replica a segregação entre autor do registro e função administrativa, aproximando-se da política discutida em sala, com ressalva de ausência de trilha imutável.
8. Restringir mudanças de status a docentes no escopo e a administradores aproxima o fluxo de aprovação; não há bloqueio de estados inválidos nem dupla confirmação, recursos típicos de servidor.
9. Restringir a UI de logs a administradores reduz exposição operacional imediata; os registros ainda podem ser apagados localmente por quem controla o navegador.
10. A busca passa a refletir o subconjunto autorizado, coerente com o princípio de necessidade na exibição de dados.

---

## 9. Justificativa técnica das decisões (síntese)

As alterações priorizam confidencialidade e integridade na experiência de uso honesta do protótipo, utilizando conceitos de menor privilégio, segregação de funções e classificação da informação. A neutralização de HTML dinâmico reduz risco de XSS refletido ou armazenado em cenários de dados manipulados no armazenamento local. A remoção de artefatos de “segredo” e senhas do arquivo exportado evita reforço pedagógico incorreto de segurança por ofuscação no cliente. Todas as medidas permanecem simulações: autenticação, autorização forte, imutabilidade de logs e consistência global exigem camada de servidor, políticas institucionais e canais cifrados.

---

## 10. Melhorias que dependeriam de back-end, banco de dados ou infraestrutura

| Item | Melhoria necessária | Depende de quê? | Por que não pode ser resolvida só no front-end? |
| --- | --- | --- | --- |
| 1 | Autenticação forte e gestão de sessão | Back-end, HTTPS | Senhas e tokens não podem ser verificados de forma opaca apenas no navegador. |
| 2 | Autorização por rota e por recurso | API com políticas | O cliente não pode ser a fonte final da decisão de acesso. |
| 3 | Persistência e backup | Banco de dados, infraestrutura | `localStorage` não oferece RPO/RTO nem replicação institucional. |
| 4 | Logs imutáveis e correlacionados | Servidor de auditoria | Usuário com controle do endpoint pode apagar evidências locais. |
| 5 | Integração com cadastro oficial de alunos | Base institucional, API | Evita divulgar base completa no cliente e garante vínculo acadêmico real. |

---

## 11. Limitações da solução entregue

Toda a lógica permanece inspecionável e modificável no terminal do navegador. Não há TLS aplicado pelo repositório estático em si; a confidencialidade em trânsito depende inteiramente do GitHub Pages. Logs e ocorrências podem ser editados diretamente no armazenamento local. Não há rate limiting, captcha ou detecção de anomalias. A exportação ainda concentra dados pessoais fictícios em um único arquivo JSON quando acionada pelo administrador, comportamento aceitável apenas para demonstração supervisionada.

---

## 12. Conclusão do grupo

O sistema, na forma originalmente recebida, não poderia ser utilizado em produção com dados reais, pois concentrava credenciais de demonstração em campos de entrada, permitia escalonamento de perfil pela interface, exponha todos os registros a qualquer sessão e empacotava dados sensíveis em exportações do cliente sem separação de papéis. A versão entregue melhora a higiene de uso, a separação superficial de funções e a clareza sobre limitações, porém não elimina a dependência exclusiva do front-end nem substitui políticas de segurança em servidor.

Os próximos passos mínimos para evolução responsável incluem: implementar API com autenticação baseada em padrões modernos (por exemplo, OpenID Connect institucional), modelar autorização no servidor, persistir dados em SGBD com criptografia em repouso, publicar aplicação somente sobre HTTPS com cabeçalhos de segurança, externalizar logs para repositório imutável e formalizar política de retenção e privacidade compatível com a LGPD.
