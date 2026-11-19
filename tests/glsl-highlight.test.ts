import {test} from 'node:test';
import assert from 'node:assert/strict';
import {highlightShader,shaderCode} from '../src/ui/glsl-highlight.ts';

const htmlText=(html:string)=>html.replace(/<span class="syntax-\w+">|<\/span>/g,'').replace(/&(?:amp|lt|gt|quot|#39);/g,e=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"}[e]!));

test('shader display and selection retain exact source except comment accents',()=>{
 const source='vec3 direcție = vec3(.5, 1e-3, 0xFFu);\r\n\t// lumină și rezoluție\r\n/* înălțime\n   păstrată */\n"șir // neatins";';
 const normalized=source.replace('lumină și rezoluție','lumina si rezolutie').replace('înălțime','inaltime').replace('păstrată','pastrata');
 assert.equal(shaderCode(source),normalized);
 assert.equal(htmlText(highlightShader(source)),normalized);
});

test('highlighter escapes HTML and never reparses comments or strings as code',()=>{
 const source='// <img src=x onerror=alert(1)> vec3 return\n"<script>&"; /* float if */\nfloat x = max(.5, 1e-3);';
 const html=highlightShader(source);
 assert.ok(!html.includes('<img')&&!html.includes('<script>'));
 assert.ok(html.includes('<span class="syntax-comment">// &lt;img src=x onerror=alert(1)&gt; vec3 return</span>'));
 assert.ok(html.includes('<span class="syntax-string">&quot;&lt;script&gt;&amp;&quot;</span>'));
 assert.equal(htmlText(html),source);
});

test('GLSL declarations, preprocessor, builtins and numeric literals receive distinct tokens',()=>{
 const html=highlightShader('#version 300 es\nuniform vec3 c;\nfloat f = max(.5, 1e-3) + 0xFFu;');
 for(const [kind,value] of [['preprocessor','#version'],['keyword','uniform'],['type','vec3'],['builtin','max'],['number','.5'],['number','1e-3'],['number','0xFFu']])assert.ok(html.includes(`<span class="syntax-${kind}">${value}</span>`),value);
});
