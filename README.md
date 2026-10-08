# Nova Aurora — Operação Cidade Inteligente

Jogo educacional completo de geometria plana e espacial. A cidade em 3D, os modelos das missões, a água por shader e os efeitos são renderizados no navegador. As bibliotecas e as fontes já estão no projeto: não há dependência de CDN.

## Abrir no VS Code e jogar

1. Extraia o ZIP e abra a pasta que contém este README e o `package.json`.
2. Com Node.js 20 ou superior instalado, abra o terminal nessa pasta.
3. Execute `npm run dev`.
4. Abra **http://localhost:8080** no navegador.

Não é necessário executar `npm install`. Alternativamente, sirva a pasta `dist` com a extensão Live Server do VS Code. Não abra o `index.html` diretamente por `file://`, pois o jogo usa módulos JavaScript.

## Como jogar

A apresentação explica a história. Ao aceitar a missão, crie um explorador com seu nome ou o nome da equipe. O tutorial ensina os controles e oferece um pequeno exercício de área. No mapa, os cinco distritos são desbloqueados em sequência:

| Distrito | Jogo | Matemática |
| --- | --- | --- |
| Jardim das Águas | Ajustar raio e altura de um reservatório | Área do círculo, volume do cilindro, m³ para litros |
| Estação Circular | Distribuir contêineres no terreno | Volume de paralelepípedos, área e porcentagem |
| Parque dos Encontros | Posicionar centro comunitário e pintar jardim | Área de retângulos, recuos e volume |
| Colina Solar | Distribuir painéis no telhado | Pitágoras, área das duas águas e potência |
| Ponte Aurora | Escolher diagonais da treliça | Pitágoras, área triangular e volume de prisma |

Construa, preencha os cálculos e use **Simular solução**. Erros recebem explicações; acertos recuperam o bairro e liberam a próxima fase. Há três pistas e um formulário de consulta de fórmulas em cada missão. Não há perda de vidas nem cronômetro obrigatório.

Use vírgula decimal, como `7,5`. O ponto é separador de milhar, como `502.400`. Na fase da água, o valor de π é **3,14**.

## Progresso e relatório

Os perfis são locais. Não há login por e-mail, autenticação remota ou banco de dados. Nome, projetos, tentativas, pistas, estrelas e tempo de exploração são salvos no `localStorage` deste navegador e desta origem. Se você usar outro navegador, mudar o endereço do site ou limpar os dados do navegador, o progresso não acompanha automaticamente.

O **Caderno** exporta um relatório CSV com as tentativas e um JSON com o histórico completo. Ao terminar, é possível imprimir a conquista ou salvar em PDF pelo diálogo de impressão. O JSON é um registro exportado; esta versão não oferece importação de backup.

## Gráficos e acessibilidade

As preferências permitem qualidade automática, alta ou leve, som opcional e movimento ambiente. A resolução do render é limitada; a animação pausa quando a aba está oculta. A qualidade automática reduz o custo de renderização em dispositivos mais lentos. O jogo respeita a preferência de movimento reduzido do sistema.

A cidade tem texturas locais, reflexos do céu, sombras suaves, fachadas com detalhes, telhados inclinados, árvores, bancos, postes e faixas de pedestres. A água usa ondas, reflexos e brilho do sol. Se WebGL não iniciar, imagens renderizadas dos modelos do próprio projeto mantêm os controles e os cálculos jogáveis. Nesse modo, o mapa oferece três ângulos e zoom; nas oficinas, a imagem é uma referência fixa e os controles do formulário continuam funcionando.

É possível explorar a câmera por arrasto ou botões, usar pinça para zoom na cena 3D, jogar com teclado, preencher respostas com teclado numérico e usar controles por toque. O mapa também tem uma lista de fases acessível, independente da cena 3D. Selecionar outro distrito preserva a câmera, e o histórico do navegador permite voltar e avançar entre as telas. Os rascunhos são salvos ao sair da missão.

A cena e o painel têm áreas próprias. Em computador, os botões de dica e simulação ficam visíveis enquanto os dados e controles rolam. Em celular e tablet, a cena aparece acima do painel e a página rola normalmente.

## Verificar o projeto

```sh
npm test
npm run build
```

O comando `build` verifica a sintaxe e as referências locais. O projeto não precisa de compilação. Para publicar em uma hospedagem estática, utilize o conteúdo de `dist`. No Vercel, selecione **Other**, Build Command `npm run build` e Output Directory `dist`; não selecione Next.js. O jogo não usa Supabase nem exige `.env`.

## Organização

- `dist/js/math.js`: regras e conteúdo pedagógico.
- `dist/js/store.js`: exploradores, progresso e histórico.
- `dist/js/app.js`: telas, controles, correção e relatórios.
- `dist/js/world.js`: cidade, modelos 3D, shaders e câmera.
- `dist/js/surfaces.js`: texturas e ambiente de iluminação gerados localmente.
- `dist/js/navigation.js`: rotas e identificação de alterações nos modelos.
- `dist/scenes`: imagens de apoio para carregamento e compatibilidade.
- `dist/style.css`: interface, responsividade e impressão.
- `dist/experience.css`: melhorias de layout, legibilidade e controles.
- `scripts/serve.mjs`: servidor local sem dependências.
- `tests`: verificação das soluções, limites e persistência.

Veja `docs/ALTERACOES.md` para as mudanças desta versão e `docs/VALIDACAO.md` para os testes executados e seu limite de verificação gráfica.

As soluções e restrições são modelos matemáticos educacionais. Não constituem dimensionamento executivo de infraestrutura, estrutura, instalação elétrica ou abastecimento de água.

Three.js é distribuído sob licença MIT, incluída em `dist/vendor/THREE-LICENSE.txt`. As fontes Roboto acompanham o projeto para uso local. Brasão, cidade, modelos e interface foram criados para Nova Aurora.
