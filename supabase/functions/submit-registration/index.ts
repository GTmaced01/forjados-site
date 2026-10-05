import { createClient } from 'npm:@supabase/supabase-js@2.110.2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const FILE_PROXY_BASE = `${SUPABASE_URL}/functions/v1/registration-file?token=`;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_ATTEMPTS_PER_HOUR = 8;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type UploadRecord = { bucket: string; path: string };
type DetectedFile = { ext: 'jpg' | 'png' | 'webp' | 'pdf'; mime: string };

function allowedOrigin(origin: string) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'forjados-site.vercel.app' ||
        url.hostname === 'forjados-site-theta.vercel.app' ||
        url.hostname.endsWith('-medeiros-dev1.vercel.app'))
    );
  } catch {
    return false;
  }
}

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  return origin && allowedOrigin(origin)
    ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'content-type,authorization,apikey,x-client-info',
        Vary: 'Origin',
      }
    : {};
}

function jsonResponse(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders(request),
    },
  });
}

function cleanText(value: FormDataEntryValue | null, maxLength: number, required = false) {
  const text = String(value ?? '').replace(/\u0000/g, '').trim();
  if (required && !text) throw new Error('Campo obrigatório não preenchido.');
  if (text.length > maxLength) throw new Error('Um dos campos excede o tamanho permitido.');
  return text;
}

function boolField(form: FormData, name: string) {
  const value = String(form.get(name) ?? '').toLowerCase();
  return ['true', '1', 'sim', 'on', 'yes'].includes(value);
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function validCpf(value: string) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digit = (baseLength: number) => {
    let sum = 0;
    for (let i = 0; i < baseLength; i += 1) {
      sum += Number(cpf[i]) * (baseLength + 1 - i);
    }
    const result = 11 - (sum % 11);
    return result >= 10 ? 0 : result;
  };

  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function formatCpf(value: string) {
  const cpf = onlyDigits(value);
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
}

function calculateAge(dateValue: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return -1;
  const [year, month, day] = dateValue.split('-').map(Number);
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (
    birth.getUTCFullYear() !== year ||
    birth.getUTCMonth() !== month - 1 ||
    birth.getUTCDate() !== day
  ) return -1;

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (birth > today) return -1;

  let age = today.getUTCFullYear() - year;
  if (
    today.getUTCMonth() < month - 1 ||
    (today.getUTCMonth() === month - 1 && today.getUTCDate() < day)
  ) age -= 1;
  return age;
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function detectFile(file: File, allowPdf: boolean): Promise<DetectedFile | null> {
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) return null;
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }

  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return { ext: 'png', mime: 'image/png' };
  }

  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }

  if (
    allowPdf && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 &&
    bytes[3] === 0x46 && bytes[4] === 0x2d
  ) {
    return { ext: 'pdf', mime: 'application/pdf' };
  }

  return null;
}

async function hmacHex(secret: string, message: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function getClientIp(request: Request) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

async function enforceRateLimit(request: Request) {
  const { data: secretRow, error: secretError } = await supabase
    .from('site_runtime_secrets')
    .select('secret_value')
    .eq('secret_name', 'registration_webhook')
    .maybeSingle();

  if (secretError || !secretRow?.secret_value) {
    throw new Error('Rate limiter indisponível.');
  }

  const ipHash = await hmacHex(secretRow.secret_value, getClientIp(request));
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count, error: countError } = await supabase
    .from('registration_submission_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', oneHourAgo);

  if (countError) throw new Error('Rate limiter indisponível.');
  if ((count || 0) >= MAX_ATTEMPTS_PER_HOUR) return false;

  const { error: insertError } = await supabase
    .from('registration_submission_attempts')
    .insert({ ip_hash: ipHash });

  if (insertError) throw new Error('Rate limiter indisponível.');

  return true;
}

async function uploadFile(
  bucket: 'fotos' | 'comprovantes' | 'autorizacoes',
  file: File,
  detected: DetectedFile,
  uploaded: UploadRecord[]
) {
  const path = `${crypto.randomUUID()}.${detected.ext}`;
  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: detected.mime,
    cacheControl: '0',
    upsert: false,
  });
  if (error) throw new Error(`Falha ao armazenar ${bucket}.`);
  uploaded.push({ bucket, path });
  return path;
}

async function cleanup(uploaded: UploadRecord[], registrationId?: string) {
  for (const item of uploaded) {
    await supabase.storage.from(item.bucket).remove([item.path]).catch(() => undefined);
  }
  if (registrationId) {
    await supabase.from('registration_file_tokens').delete().eq('registration_id', registrationId);
    await supabase.from('inscritos').delete().eq('id', registrationId);
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, { ok: false, error: 'Método não permitido.' }, 405);
  }

  const origin = request.headers.get('origin') || '';
  if (origin && !allowedOrigin(origin)) {
    return jsonResponse(request, { ok: false, error: 'Origem não permitida.' }, 403);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(request, { ok: false, error: 'Serviço indisponível.' }, 500);
  }

  if (!(request.headers.get('content-type') || '').toLowerCase().includes('multipart/form-data')) {
    return jsonResponse(request, { ok: false, error: 'Formato de envio inválido.' }, 415);
  }

  try {
    if (!(await enforceRateLimit(request))) {
      return jsonResponse(
        request,
        { ok: false, error: 'Muitas tentativas de inscrição. Aguarde antes de tentar novamente.' },
        429
      );
    }
  } catch (error) {
    console.error(error);
    return jsonResponse(request, { ok: false, error: 'Serviço temporariamente indisponível.' }, 503);
  }

  const uploaded: UploadRecord[] = [];
  let registrationId = '';

  try {
    const form = await request.formData();

    // Honeypot for simple automated submissions.
    if (cleanText(form.get('website'), 200, false)) {
      return jsonResponse(request, { ok: true });
    }

    const categoria = cleanText(form.get('categoria'), 20) || 'participante';
    if (!['participante', 'equipe'].includes(categoria)) throw new Error('Informe uma categoria válida.');

    const nome = cleanText(form.get('nome'), 160, true);
    const cpfInput = cleanText(form.get('cpf'), 20, true);
    const telefone = cleanText(form.get('telefone'), 40, true);
    const email = cleanText(form.get('email'), 254, true).toLowerCase();
    const endereco = cleanText(form.get('endereco'), 240, true);
    const cidade = cleanText(form.get('cidade'), 120, true);
    const dataNascimento = cleanText(form.get('data_nascimento'), 10, true);
    const congrega = cleanText(form.get('congrega'), 10, true);
    const igrejaInput = cleanText(form.get('igreja'), 160, false);
    const gestante = cleanText(form.get('gestante'), 10, true);
    const camisa = cleanText(form.get('camisa'), 8, true);
    const alergias = cleanText(form.get('alergias'), 1000, true);
    const medicamentos = cleanText(form.get('medicamentos'), 1000, true);
    const condicaoSaude = cleanText(form.get('condicao_saude'), 1500, true);
    const restricaoAlimentar = cleanText(form.get('restricao_alimentar'), 1000, true);
    const contatoNome = cleanText(form.get('contato_emergencia_nome'), 160, true);
    const contatoTelefone = cleanText(form.get('contato_emergencia_telefone'), 40, true);

    if (!validCpf(cpfInput)) throw new Error('Informe um CPF válido.');
    if (!validEmail(email)) throw new Error('Informe um e-mail válido.');
    if (!['sim', 'nao'].includes(congrega)) throw new Error('Informe se congrega em alguma igreja.');
    if (congrega === 'sim' && !igrejaInput) throw new Error('Informe qual igreja você congrega.');
    if (gestante !== 'nao') throw new Error('A inscrição não pode ser concluída para participante gestante.');
    if (!['PP', 'P', 'M', 'G', 'GG', 'XG', 'EXG'].includes(camisa)) {
      throw new Error('Tamanho de camisa inválido.');
    }

    const age = calculateAge(dataNascimento);
    if (age < 0 || age > 120) throw new Error('Informe uma data de nascimento válida.');

    const aceitouTermo = boolField(form, 'aceitou_termo');
    const aceitouPolitica = boolField(form, 'aceitou_politica');
    const autorizaUsoImagem = boolField(form, 'autoriza_uso_imagem');
    if (!aceitouTermo || !aceitouPolitica) {
      throw new Error('É necessário aceitar o Termo de Participação e a Política de Privacidade.');
    }

    const cpf = formatCpf(cpfInput);

    const { data: cpfExisting, error: cpfError } = await supabase
      .from('inscritos')
      .select('id')
      .eq('cpf', cpf)
      .limit(1);
    if (cpfError) throw new Error('Não foi possível validar a inscrição.');
    if (cpfExisting && cpfExisting.length > 0) throw new Error('Já existe uma inscrição para este CPF.');

    const { data: emailExisting, error: emailError } = await supabase
      .from('inscritos')
      .select('id')
      .ilike('email', email)
      .limit(1);
    if (emailError) throw new Error('Não foi possível validar a inscrição.');
    if (emailExisting && emailExisting.length > 0) throw new Error('Já existe uma inscrição para este e-mail.');

    const foto = form.get('foto');
    const comprovante = form.get('comprovante');
    const autorizacao = form.get('autorizacao_menor');
    if (!(foto instanceof File)) throw new Error('A foto de rosto é obrigatória.');
    // Accept receipts from older clients, but registration no longer requires payment.
    const comprovanteFile = comprovante instanceof File && comprovante.size > 0 ? comprovante : null;

    const fotoType = await detectFile(foto, false);
    const comprovanteType = comprovanteFile ? await detectFile(comprovanteFile, true) : null;
    if (!fotoType) throw new Error('Foto inválida. Use JPG, PNG ou WebP com até 5 MB.');
    if (comprovanteFile && !comprovanteType) throw new Error('Comprovante inválido. Use imagem ou PDF com até 5 MB.');

    let autorizacaoFile: File | null = null;
    let autorizacaoType: DetectedFile | null = null;
    if (age < 18) {
      if (!(autorizacao instanceof File)) {
        throw new Error('A autorização assinada é obrigatória para menor de idade.');
      }
      autorizacaoFile = autorizacao;
      autorizacaoType = await detectFile(autorizacaoFile, true);
      if (!autorizacaoType) {
        throw new Error('Autorização inválida. Use imagem ou PDF com até 5 MB.');
      }
    }

    const fotoPath = await uploadFile('fotos', foto, fotoType, uploaded);
    const comprovantePath = comprovanteFile && comprovanteType
      ? await uploadFile('comprovantes', comprovanteFile, comprovanteType, uploaded)
      : '';
    const autorizacaoPath = autorizacaoFile && autorizacaoType
      ? await uploadFile('autorizacoes', autorizacaoFile, autorizacaoType, uploaded)
      : '';

    registrationId = crypto.randomUUID();
    const fotoToken = randomToken();
    const comprovanteToken = comprovantePath ? randomToken() : '';
    const autorizacaoToken = autorizacaoPath ? randomToken() : '';

    const row = {
      id: registrationId,
      nome,
      categoria,
      cpf,
      telefone,
      email,
      endereco,
      cidade,
      data_nascimento: dataNascimento,
      idade: String(age),
      igreja: congrega === 'sim' ? igrejaInput : 'Não congrega',
      gestante,
      camisa,
      alergias,
      medicamentos,
      condicao_saude: condicaoSaude,
      restricao_alimentar: restricaoAlimentar,
      contato_emergencia_nome: contatoNome,
      contato_emergencia_telefone: contatoTelefone,
      foto_url: `${FILE_PROXY_BASE}${fotoToken}`,
      comprovante_url: comprovanteToken ? `${FILE_PROXY_BASE}${comprovanteToken}` : null,
      autorizacao_menor_url: autorizacaoToken ? `${FILE_PROXY_BASE}${autorizacaoToken}` : '',
      pagamento_status: 'pendente',
      observacao_admin: '',
      aceitou_termo: aceitouTermo,
      aceitou_politica: aceitouPolitica,
      autoriza_uso_imagem: autorizaUsoImagem,
    };

    const { error: insertError } = await supabase.from('inscritos').insert(row);
    if (insertError) {
      if (insertError.code === '23505') throw new Error('Já existe uma inscrição para este CPF ou e-mail.');
      console.error('Falha ao inserir inscrição:', insertError.message);
      throw new Error('Não foi possível salvar a inscrição.');
    }

    const tokenRows = [
      {
        token: fotoToken,
        registration_id: registrationId,
        bucket_id: 'fotos',
        object_name: fotoPath,
        file_kind: 'foto',
      },
      ...(comprovanteToken
        ? [{
            token: comprovanteToken,
            registration_id: registrationId,
            bucket_id: 'comprovantes',
            object_name: comprovantePath,
            file_kind: 'comprovante',
          }]
        : []),
      ...(autorizacaoToken
        ? [{
            token: autorizacaoToken,
            registration_id: registrationId,
            bucket_id: 'autorizacoes',
            object_name: autorizacaoPath,
            file_kind: 'autorizacao',
          }]
        : []),
    ];

    const { error: tokenError } = await supabase.from('registration_file_tokens').insert(tokenRows);
    if (tokenError) {
      console.error('Falha ao registrar tokens de arquivo:', tokenError.message);
      throw new Error('Não foi possível concluir a proteção dos arquivos.');
    }

    return jsonResponse(request, { ok: true, registration_id: registrationId }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado ao enviar inscrição.';
    console.error('Falha na inscrição:', message);
    await cleanup(uploaded, registrationId || undefined);

    const clientError = [
      'Informe ',
      'É necessário ',
      'Já existe ',
      'A inscrição ',
      'A foto ',
      'O comprovante ',
      'Foto inválida',
      'Comprovante inválido',
      'Autorização inválida',
      'A autorização ',
      'Tamanho de camisa inválido',
      'Um dos campos ',
      'Campo obrigatório',
      'Esta inscrição ',
    ].some((prefix) => message.startsWith(prefix));

    return jsonResponse(
      request,
      { ok: false, error: clientError ? message : 'Não foi possível concluir a inscrição. Tente novamente.' },
      clientError ? 400 : 500
    );
  }
});
