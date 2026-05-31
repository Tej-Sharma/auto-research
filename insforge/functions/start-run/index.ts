// Edge function: start-run
// Bridge between the web client and the Daytona orchestrator. Authenticates the
// user, creates a research_runs row, then launches the iterative orchestrator
// inside a fresh Daytona sandbox (async — returns immediately with { runId }).
//
// Secrets (set via `npx @insforge/cli secrets add KEY VALUE`, read with Deno.env):
//   DAYTONA_API_KEY, APIFY_TOKEN, OPENROUTER_API_KEY, INSFORGE_SERVICE_KEY,
//   ORCH_REPO_URL (https git url of this repo), GITHUB_TOKEN (optional, if private),
//   LLM_MODEL (optional, default anthropic/claude-sonnet-4.5)
import { createClient } from 'npm:@insforge/sdk';
import { Daytona } from 'npm:@daytonaio/sdk';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const baseUrl = Deno.env.get('INSFORGE_BASE_URL')!;
  const userToken = req.headers.get('Authorization')?.replace('Bearer ', '') ?? null;

  // 1. authenticate
  const asUser = createClient({ baseUrl, edgeFunctionToken: userToken });
  const { data: userData } = await asUser.auth.getCurrentUser();
  const userId = userData?.user?.id;
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  // 2. validate input
  const body = await req.json().catch(() => ({}));
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  const mode = body.mode === 'academic' ? 'academic' : 'market';
  const params = (body.params && typeof body.params === 'object') ? body.params : {};
  if (!query || query.length > 2000) return json({ error: 'Invalid query' }, 400);

  // 3. create the run (admin client so we own the row regardless of RLS)
  const admin = createClient({ baseUrl, anonKey: Deno.env.get('INSFORGE_SERVICE_KEY') });
  const { data: runRows, error: runErr } = await admin.database
    .from('research_runs')
    .insert([{ user_id: userId, query, mode, status: 'queued', params }])
    .select();
  if (runErr || !runRows?.[0]) return json({ error: 'Failed to create run', detail: runErr }, 500);
  const runId = runRows[0].id as string;

  // 4. launch the orchestrator in a Daytona sandbox (async)
  try {
    const daytona = new Daytona({ apiKey: Deno.env.get('DAYTONA_API_KEY') });
    const repo = Deno.env.get('ORCH_REPO_URL') ?? 'https://github.com/Tej-Sharma/auto-research.git';
    const ghToken = Deno.env.get('GITHUB_TOKEN');
    const cloneUrl = ghToken ? repo.replace('https://', `https://${ghToken}@`) : repo;

    const sandbox = await daytona.create({
      language: 'typescript',
      autoStopInterval: 20,
      ephemeral: true,
      envVars: {
        RUN_ID: runId, QUERY: query, MODE: mode, PARAMS: JSON.stringify(params),
        INSFORGE_URL: baseUrl,
        INSFORGE_SERVICE_KEY: Deno.env.get('INSFORGE_SERVICE_KEY')!,
        OPENROUTER_API_KEY: Deno.env.get('OPENROUTER_API_KEY')!,
        APIFY_TOKEN: Deno.env.get('APIFY_TOKEN') ?? '',
        LLM_MODEL: Deno.env.get('LLM_MODEL') ?? 'anthropic/claude-sonnet-4.5',
      },
    });

    await admin.database.from('research_runs')
      .update({ sandbox_id: sandbox.id }).eq('id', runId);

    // Clone → install → build → run, in a background session so we return now.
    // (Production optimization: bake deps into a snapshot or upload a prebuilt
    //  dist/run.js to skip clone+install — see docs/05-daytona.md.)
    const setup = [
      `git clone --depth 1 ${cloneUrl} /workspace/app`,
      `cd /workspace/app/orchestrator`,
      `npm install --no-audit --no-fund`,
      `npm run build`,
      `node dist/run.js`,
    ].join(' && ');

    await sandbox.process.createSession('orchestrate');
    await sandbox.process.executeSessionCommand('orchestrate', { command: setup, runAsync: true });

    return json({ runId });
  } catch (e) {
    await admin.database.from('research_runs')
      .update({ status: 'error', error_detail: `launch failed: ${String(e)}`.slice(0, 1000) })
      .eq('id', runId);
    return json({ runId, warning: 'Run created but orchestrator launch failed', detail: String(e) }, 202);
  }
}
