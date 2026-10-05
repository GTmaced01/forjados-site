const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const source = fs.readFileSync(require('node:path').resolve(__dirname, '../supabase/functions/submit-registration/index.ts'), 'utf8').replace(/^import .*;\n/, '');
const javascript = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
let handler;
let writes;
const client = {
  from(table) {
    const q = {
      select() { return q; }, eq() { return q; }, gte() { return q; }, ilike() { return q; },
      limit() { return Promise.resolve({ data: [], error: null }); },
      maybeSingle() { return Promise.resolve({ data: { secret_value: 'mock-secret' }, error: null }); },
      insert(row) { writes.push({ table, row }); return Promise.resolve({ error: null }); },
      delete() { return q; },
      then(resolve, reject) { return Promise.resolve({ count: 0, error: null }).then(resolve, reject); },
    }; return q;
  },
  storage: { from(bucket) { return {
    upload(path) { writes.push({ bucket, path }); return Promise.resolve({ error: null }); },
    remove() { return Promise.resolve({ error: null }); },
  }; } },
};
vm.runInNewContext(javascript, {
  createClient: () => client,
  Deno: { env: { get: (name) => name === 'SUPABASE_URL' ? 'https://example.supabase.co' : 'test-secret' }, serve: (fn) => handler = fn },
  crypto: globalThis.crypto, File, Request, Response, FormData, TextEncoder, URL, Uint8Array,
  console: { error() {} },
});
function form(options = {}) {
  const f = new FormData();
  const fields = {
    categoria: options.categoria || 'participante', nome: 'Teste isolado', cpf: '52998224725', telefone: '21999999999', email: 'isolado@example.com',
    endereco: 'Teste', cidade: 'Teste', data_nascimento: options.minor ? '2011-01-01' : '1995-01-01',
    congrega: 'nao', gestante: 'nao', camisa: 'M', alergias: 'Não', medicamentos: 'Não',
    condicao_saude: 'Não', restricao_alimentar: 'Não', contato_emergencia_nome: 'Contato',
    contato_emergencia_telefone: '21999999999', aceitou_termo: 'true', aceitou_politica: options.noConsent ? '' : 'true',
  };
  for (const [k,v] of Object.entries(fields)) f.set(k,v);
  f.set('foto', new File([Uint8Array.from(options.invalidPhoto ? [1,2,3] : [255,216,255,1])], 'foto.jpg', { type: 'image/jpeg' }));
  if (options.receipt) f.set('comprovante', new File([options.receipt === 'invalid' ? 'invalid' : '%PDF-1.7'], 'recibo.pdf', { type: 'application/pdf' }));
  if (options.authorization) f.set('autorizacao_menor', new File(['%PDF-1.7'], 'autorizacao.pdf', { type: 'application/pdf' }));
  return f;
}
require('node:test').test('registration categories and protected documents', async () => {
  for (const [label, options, status] of [
    ['adult without receipt', {}, 201],
    ['team without receipt', { categoria: 'equipe' }, 201],
    ['invalid category', { categoria: 'outro' }, 400],
    ['minor with authorization without receipt', { minor: true, authorization: true }, 201],
    ['minor missing authorization', { minor: true }, 400],
    ['legacy client with receipt', { receipt: 'valid' }, 201],
    ['invalid legacy receipt', { receipt: 'invalid' }, 400],
    ['invalid face photo', { invalidPhoto: true }, 400],
    ['missing consent', { noConsent: true }, 400],
  ]) {
    writes = [];
    const response = await handler(new Request('https://example.supabase.co/submit-registration', { method: 'POST', body: form(options), headers: { Origin: 'https://forjados-site-theta.vercel.app' } }));
    assert.equal(response.status, status, label + ': ' + await response.text());
    if (status === 201) {
      const registration = writes.find(x => x.table === 'inscritos').row;
      assert.equal(registration.categoria, options.categoria || 'participante');
      assert.equal(registration.pagamento_status, 'pendente');
      const tokens = writes.find(x => x.table === 'registration_file_tokens').row;
      if (!options.receipt) {
        assert.equal(registration.comprovante_url, null);
        assert(!writes.some(x => x.bucket === 'comprovantes'));
        assert(!tokens.some(x => x.file_kind === 'comprovante'));
      } else assert(tokens.some(x => x.file_kind === 'comprovante'));
    }
    console.log('PASS', label);
  }
});
