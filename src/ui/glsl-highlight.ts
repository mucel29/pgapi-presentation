/** A single lexical pass keeps comment/string contents out of later token rules. */
const tokens=/\/\/[^\r\n]*|\/\*[\s\S]*?(?:\*\/|(?![\s\S]))|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|^[\t ]*#[\t ]*[A-Za-z_]\w*|(?<![\w.])(?:0[xX][\da-fA-F]+[uU]?|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[fFuU]?)(?![\w.])|\b[A-Za-z_]\w*\b/gm;
const keywords=new Set('if else for while do break continue return discard switch case default const uniform varying attribute in out inout layout precision highp mediump lowp flat smooth centroid invariant struct true false void let function new null undefined of'.split(' '));
const types=/^(?:(?:[biud]?vec)[234]|d?mat[234](?:x[234])?|(?:[iu]?sampler|[iu]?image)\w+|float|double|int|uint|bool|Ray|Hit|BSDFSample)$/;
const builtins=new Set('abs acos acosh all any asin asinh atan atanh ceil clamp cos cosh cross degrees determinant dFdx dFdy distance dot exp exp2 faceforward floor fract fwidth inversesqrt inverse isinf isnan length log log2 max min mix mod normalize not outerProduct pow radians reflect refract round sign sin sinh smoothstep sqrt step tan tanh texelFetch texture textureLod textureSize transpose trunc'.split(' '));
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const isComment=(value:string)=>value.startsWith('//')||value.startsWith('/*');

/** Only comments are normalized. Identifiers, strings and all whitespace stay exact. */
export function shaderCode(source:string):string{
 return source.replace(tokens,token=>isComment(token)?token.normalize('NFD').replace(/\p{M}/gu,''):token);
}

/** Safe HTML with the exact normalized source as its textContent (including tabs/newlines). */
export function highlightShader(source:string):string{
 source=shaderCode(source);
 let result='',offset=0;
 for(const match of source.matchAll(tokens)){
  const token=match[0],start=match.index!;
  result+=escapeHtml(source.slice(offset,start));
  const kind=isComment(token)?'comment':/^['"]/.test(token)?'string':/^\s*#/.test(token)?'preprocessor':/^(?:\d|\.\d)/.test(token)?'number':types.test(token)?'type':keywords.has(token)?'keyword':builtins.has(token)||/^gl_/.test(token)?'builtin':null;
  result+=kind?`<span class="syntax-${kind}">${escapeHtml(token)}</span>`:escapeHtml(token);
  offset=start+token.length;
 }
 return result+escapeHtml(source.slice(offset));
}
