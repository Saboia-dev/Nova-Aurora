import test from 'node:test';
import assert from 'node:assert/strict';
import { readRoute, routeHash, safePhase, sceneSignature } from '../dist/js/navigation.js';

test('Links de fases e telas sobrevivem à recarga e ao histórico do navegador',()=>{
 for(const screen of ['home','intro','tutorial','map','final'])assert.equal(readRoute(routeHash(screen)).screen,screen);
 for(let phase=0;phase<5;phase++)assert.deepEqual(readRoute(routeHash('mission',phase)),{screen:'mission',phase});
});
test('Links incompletos, fases fora do intervalo e valores inválidos têm destino seguro',()=>{
 for(const hash of ['#fase-0','#fase-6','#fase-NaN','#desconhecido',''])assert.equal(readRoute(hash).screen,'home');
 for(const n of [NaN,Infinity,-1,5,1.2])assert.equal(safePhase(n,2),2);
 assert.equal(safePhase('4',0),4);
});
test('Digitar respostas não altera o modelo 3D; construir altera o modelo',()=>{
 assert.equal(sceneSignature(0,{r:4,h:10,volume:''}),sceneSignature(0,{r:4,h:10,volume:'502400'}));
 assert.notEqual(sceneSignature(0,{r:3,h:10}),sceneSignature(0,{r:4,h:10}));
 assert.equal(sceneSignature(1,{slots:[0,1,4,5]}),sceneSignature(1,{slots:[5,1,4,0]}));
 assert.notEqual(sceneSignature(3,{panels:80}),sceneSignature(3,{panels:81}));
});
