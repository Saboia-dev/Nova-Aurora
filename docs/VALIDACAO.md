# Verificação da entrega — versão 1.1.0

## Verificações executadas

31 testes automatizados verificam a matemática, os limites dos cinco desafios, respostas em português, desbloqueio em sequência, persistência, independência dos exploradores, recuperação de registros incompletos e funcionamento em memória quando o salvamento é bloqueado. Também verificam rotas, limites dos índices de fase, identificação de alterações estruturais, modelos 3D, posição das ruas, reutilização de contêineres e painéis solares e respostas do servidor local.

`npm run build` verifica a sintaxe dos módulos, referências locais e as 12 imagens de apoio. O código da cidade e das oficinas é instanciado nos testes sem criar um contexto WebGL. As regras em `math.js` foram preservadas.

No navegador, um perfil de teste concluiu o tutorial e as cinco missões, incluindo uma tentativa errada com feedback e uma resposta com vírgula decimal. A conquista mostrou cinco distritos, 15 estrelas e 875 XP. Após recarregar, o progresso permaneceu salvo. O CSV exportado foi baixado e conferido: contém as seis tentativas e os respectivos cálculos.

Voltar e avançar pelo histórico, salvar o rascunho ao navegar e recarregar, e selecionar outro distrito sem perder o zoom foram conferidos no navegador. Os layouts foram inspecionados em computador, tablet e celular. A tela de computador com 1280 × 720 mantém os botões do distrito visíveis; a lista de fases rola quando necessário. Em celular de 390 × 844 e tablet de 920 × 768, não foi observado transbordamento horizontal.

## Limite de verificação gráfica

O navegador de prévia deste ambiente não disponibiliza WebGL. Assim, os fluxos foram testados usando a visualização de apoio, e a renderização 3D ao vivo não pôde ser inspecionada nesse navegador.

Os modelos foram renderizados separadamente com OpenGL por software para conferir a composição e produzir as imagens de apoio. Os shaders de água, partículas e grade foram compilados e vinculados com sucesso em um contexto OpenGL separado. Isso verifica a sintaxe gráfica, mas não substitui um teste visual completo do Three.js em um navegador com WebGL.

## Conferência da cena 3D ao abrir

Em Chrome, Edge ou Firefox com WebGL habilitado, confira giro, zoom por pinça, materiais, sombras, ondas e mudança dos modelos ao ajustar os controles. As preferências oferecem qualidade automática, alta e leve para adequar o custo gráfico ao dispositivo.
