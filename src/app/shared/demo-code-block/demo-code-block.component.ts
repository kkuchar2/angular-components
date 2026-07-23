import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  resource,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import type { DemoCodeSnippet } from './demo-code.util';
import {
  DemoCodeLanguage,
  StarryNightService,
} from './starry-night.service';

type DemoCodeTabId = string;

interface DemoCodeTab {
  id: DemoCodeTabId;
  label: string;
  code: string;
  language: DemoCodeLanguage;
}

@Component({
  selector: 'app-demo-code-block',
  templateUrl: './demo-code-block.component.html',
  styleUrl: './demo-code-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoCodeBlockComponent {
  private readonly starryNight = inject(StarryNightService);
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Preferred API: HTML + TypeScript (+ optional Columns / cell) panes for a
   * usage example. When multiple panes are set, the toolbar shows tabs.
   */
  readonly snippet = input<DemoCodeSnippet | null>(null);

  /** Legacy single-pane code (no tabs). Prefer `snippet` when possible. */
  readonly code = input<string>('');
  readonly label = input('Usage');
  readonly language = input<DemoCodeLanguage>('auto');
  /** When false, the block starts collapsed (click header to expand). */
  readonly initiallyExpanded = input(true);

  private readonly expandedOverride = signal<boolean | null>(null);
  readonly copied = signal(false);

  readonly tabs = computed((): DemoCodeTab[] => {
    const snippet = this.snippet();
    const html = snippet?.html?.trim() ?? '';
    const ts = snippet?.ts?.trim() ?? '';
    const columnsTs = snippet?.columnsTs?.trim() ?? '';
    const cells = snippet?.cells ?? [];

    if (html || ts || columnsTs || cells.length > 0) {
      const panes: DemoCodeTab[] = [];

      if (html) {
        panes.push({ id: 'html', label: 'HTML', code: html + '\n', language: 'html' });
      }

      if (ts) {
        panes.push({ id: 'ts', label: 'TypeScript', code: ts + '\n', language: 'ts' });
      }

      if (columnsTs) {
        panes.push({ id: 'columns', label: 'Columns', code: columnsTs + '\n', language: 'ts' });
      }

      for (const [index, cell] of cells.entries()) {
        const source = cell.code.trim();

        if (!source) {
          continue;
        }

        panes.push({
          id: `cell-${index}-${slugify(cell.label)}`,
          label: cell.label,
          code: source.endsWith('\n') ? source : source + '\n',
          language: 'ts',
        });
      }

      return panes;
    }

    const legacy = this.code().trim();

    if (!legacy) {
      return [];
    }

    return [
      {
        id: 'code',
        label: this.label(),
        code: legacy + '\n',
        language: this.language(),
      },
    ];
  });

  readonly showTabs = computed(() => this.tabs().length > 1);

  readonly activeTabId = linkedSignal<DemoCodeTabId>(() => this.tabs()[0]?.id ?? 'html');

  readonly activeTab = computed(() => {
    const tabs = this.tabs();
    const activeId = this.activeTabId();
    return tabs.find((tab) => tab.id === activeId) ?? tabs[0] ?? null;
  });

  readonly expanded = computed(
    () => this.expandedOverride() ?? this.initiallyExpanded(),
  );

  private readonly highlightedResource = resource({
    params: () => {
      const tab = this.activeTab();
      return tab ? { code: tab.code, language: tab.language } : null;
    },
    loader: async ({ params }): Promise<SafeHtml | null> => {
      if (!params) {
        return null;
      }

      const html = await this.starryNight.highlight(params.code, params.language);
      return this.sanitizer.bypassSecurityTrustHtml(html);
    },
  });

  readonly highlightedHtml = computed(() => this.highlightedResource.value() ?? null);
  readonly highlightPending = computed(() => this.highlightedResource.isLoading());

  /** Always SafeHtml so `<pre><code>` can stay whitespace-free. */
  readonly displayHtml = computed((): SafeHtml => {
    const highlighted = this.highlightedHtml();

    if (highlighted) {
      return highlighted;
    }

    const raw = this.activeTab()?.code.trim() ?? '';
    return this.sanitizer.bypassSecurityTrustHtml(escapeHtml(raw));
  });

  selectTab(id: DemoCodeTabId): void {
    this.activeTabId.set(id);
    this.copied.set(false);
  }

  toggle(): void {
    this.expandedOverride.set(!this.expanded());
  }

  async copy(): Promise<void> {
    const value = this.activeTab()?.code.trim();

    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value + '\n');
      this.copied.set(true);
      window.setTimeout(() => this.copied.set(false), 1600);
    } catch {
      // Clipboard may be unavailable in insecure contexts.
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'cell';
}
