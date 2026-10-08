# Nova Aurora — Operação Cidade Inteligente

## Intenção e resultado
Transformar os problemas urbanos do protótipo em um jogo educacional completo. O estudante apresenta-se como urbanista, conhece a narrativa, aprende os controles e visita cinco distritos em sequência. Cada distrito contém um minijogo diferente que exige construção e cálculo. A geometria plana sustenta áreas e ocupação; a espacial, volumes e estruturas.

## Direção de arte
Cidade costeira estilizada em 3D, com influência de jogos de estratégia e da referência verde e dourada. Floresta #102924, profundidade #081b1a, ouro #dfc48c, papel #f1eddf, água #6ba5a2, terracota #c98262. Títulos serifados de proporção monumental; interface sans-serif legível. A cidade é o elemento principal, acompanhada por painéis discretos, um brasão geométrico próprio e linguagem de expedição. Sem carrosséis de marketing. Movimento responde à exploração, construção e conclusão.

## Conteúdo e fases
1. Jardim das Águas: dimensionar cilindro que forneça de 500.000 a 600.000 L, caiba no terreno e tenha até 10 m de altura. Calcular volume. Usar π = 3,14 em todo o jogo.
2. Estação Circular: distribuir contêineres de 3 × 2 × 1,5 m em posições válidas de um terreno de 12 × 6 m, atender 36 m³ e ocupar até 50% do lote. Calcular capacidade total.
3. Parque dos Encontros: posicionar edifício 20 × 15 × 12 m em terreno 50 × 30 m, respeitar recuos de 5 m, manter via de acesso e desenhar pelo menos 800 m² de jardim. Calcular área da base e volume.
4. Colina Solar: calcular a geratriz de telhado de prisma triangular (meia largura 6 m, altura 4,5 m, comprimento 20 m), área das duas águas e distribuir painéis de 2 m²/400 W, com utilização máxima de 70%, fornecendo pelo menos 32 kW.
5. Ponte Aurora: montar as duas diagonais de uma treliça triangular (meia base 6 m e altura 8 m), calcular área de seção e volume de um prisma triangular com largura de 5 m. É um modelo matemático didático, sem pretensão de projeto estrutural executivo.

## Arquitetura
HTML, CSS e módulos JavaScript, sem compilação e com Three.js 0.186.1 incluído localmente. Uma única cena WebGL com cidade e bancada de construção, modelos procedurais, água por shader, sombras, atmosfera, partículas e veículos. Limite de resolução, pausa em aba oculta, qualidade ajustável e movimento reduzido. Alternativa gráfica em SVG quando não houver WebGL. Interface e validação continuam utilizáveis sem a cena 3D.

Módulos separados: matemática e regras, persistência, interface, ícones e mundo 3D. O progresso é local por explorador e explicitamente descrito como salvo neste navegador. Não há autenticação ou banco de dados remoto. Histórico de tentativas, estrelas, dicas, tempo ativo e relatório exportável. Nenhuma vida perdida ou bloqueio por erro; fases posteriores são desbloqueadas pela conclusão anterior.

## Execução e verificação
Implementar regras primeiro, depois cidade e telas, integrar os cinco jogos, testar cenários válidos e inválidos, serialização e desbloqueios, verificar referências estáticas e sintaxe, publicar a versão exata. Revisar cálculos independentemente. Verificação visual no navegador apenas se a infraestrutura suportada de prévia estiver disponível; registrar esse limite caso não esteja.

## Critérios de aceitação
Apresentação e tutorial navegáveis; cinco fases realmente interativas; respostas avaliadas com tolerâncias explícitas e unidades; erros explicados e dicas graduais; desbloqueio sequencial persistente; revisão de fases; conclusão com relatório; controles acessíveis por teclado e toque; ausência de requisições a CDNs; funcionamento offline depois de servido; modelos 3D não essenciais à validação.
