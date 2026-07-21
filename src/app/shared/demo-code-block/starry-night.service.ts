import { Injectable } from '@angular/core';
import { createStarryNight, type Grammar } from '@wooorm/starry-night';
import { toHtml } from 'hast-util-to-html';

export type DemoCodeLanguage = 'auto' | 'html' | 'ts' | 'tsx' | 'js';

type StarryNightInstance = Awaited<ReturnType<typeof createStarryNight>>;

const LANGUAGE_FLAGS: Record<Exclude<DemoCodeLanguage, 'auto'>, string> = {
  html: 'html',
  ts: 'ts',
  tsx: 'tsx',
  js: 'js',
};

@Injectable({ providedIn: 'root' })
export class StarryNightService {
  private highlighterPromise: Promise<StarryNightInstance> | null = null;

  async highlight(code: string, language: DemoCodeLanguage = 'auto'): Promise<string> {
    const value = code.trim();
    if (!value) {
      return '';
    }

    try {
      const night = await this.getHighlighter();
      const flag = this.resolveFlag(value, language);
      const scope = night.flagToScope(flag) ?? night.flagToScope('html') ?? 'text.html.basic';
      return toHtml(night.highlight(value, scope));
    } catch (error) {
      console.error('[starry-night] highlight failed', error);
      // Escape so the fallback can safely go through innerHTML if needed.
      return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
    }
  }

  private resolveFlag(code: string, language: DemoCodeLanguage): string {
    if (language !== 'auto') {
      return LANGUAGE_FLAGS[language];
    }

    const hasImport = /\bimport\s+/.test(code);
    const hasHtml = /<[A-Za-z!/]/.test(code);

    if (hasImport && hasHtml) {
      return 'tsx';
    }
    if (hasImport || /\b(const|readonly|function|interface|type)\s/.test(code)) {
      return 'ts';
    }
    return 'html';
  }

  private getHighlighter(): Promise<StarryNightInstance> {
    this.highlighterPromise ??= this.createHighlighter().catch((error) => {
      // Allow a later retry if WASM/assets were not ready yet.
      this.highlighterPromise = null;
      throw error;
    });
    return this.highlighterPromise;
  }

  private async createHighlighter(): Promise<StarryNightInstance> {
    // Load only the grammars we need — avoid importing `@wooorm/starry-night`'s
    // `all` / `common` barrels, which are multi‑MB.
    const [sourceJs, sourceTs, sourceTsx, textHtml] = await Promise.all([
      import('@wooorm/starry-night/source.js'),
      import('@wooorm/starry-night/source.ts'),
      import('@wooorm/starry-night/source.tsx'),
      import('@wooorm/starry-night/text.html.basic'),
    ]);

    const grammars = [
      sourceJs.default,
      sourceTs.default,
      sourceTsx.default,
      textHtml.default,
    ] as Grammar[];

    return createStarryNight(grammars, {
      // Served from /public/onig.wasm (also listed in angular.json assets).
      getOnigurumaUrlFetch: async () =>
        new URL('/onig.wasm', globalThis.location.origin),
    });
  }
}
