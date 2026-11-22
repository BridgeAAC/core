import { onRequestPost as joinAndroidBetaPost } from '../functions/api/join-android-beta';
import { onRequestPost as ttsPost } from '../functions/api/tts';

interface WorkerEnv {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
  GOOGLE_WORKSPACE_ADMIN_EMAIL?: string;
  GOOGLE_BETA_GROUP_EMAIL?: string;
  GOOGLE_PLAY_OPT_IN_URL?: string;
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/join-android-beta') {
      if (request.method !== 'POST') {
        return new Response(null, { status: 405, headers: { Allow: 'POST' } });
      }
      return joinAndroidBetaPost({ request, env });
    }

    if (url.pathname === '/api/tts') {
      if (request.method !== 'POST') {
        return new Response(null, { status: 405, headers: { Allow: 'POST' } });
      }
      return ttsPost({ request });
    }

    return env.ASSETS.fetch(request);
  },
};
