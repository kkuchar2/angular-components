import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import {
  DemoCodeLanguage,
  StarryNightService,
} from './starry-night.service';

@Component({
  selector: 'app-demo-code-block',
  templateUrl: './demo-code-block.component.html',
  styleUrl: './demo-code-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoCodeBlockComponent {
  private readonly starryNight = inject(StarryNightService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly code = input.required<string>();
  readonly label = input('Usage');
  readonly language = input<DemoCodeLanguage>('auto');
  /** When false, the block starts collapsed (click header to expand). */
  readonly initiallyExpanded = input(true);

  private readonly expandedOverride = signal<boolean | null>(null);
  readonly copied = signal(false);

  readonly expanded = computed(
    () => this.expandedOverride() ?? this.initiallyExpanded(),
  );

  private readonly highlightedResource = resource({
    params: () => ({
      code: this.code(),
      language: this.language(),
    }),
    loader: async ({ params }): Promise<SafeHtml> => {
      const html = await this.starryNight.highlight(params.code, params.language);
      return this.sanitizer.bypassSecurityTrustHtml(html);
    },
  });

  readonly highlightedHtml = computed(() => this.highlightedResource.value() ?? null);
  readonly highlightPending = computed(() => this.highlightedResource.isLoading());

  toggle(): void {
    this.expandedOverride.set(!this.expanded());
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code().trim() + '\n');
      this.copied.set(true);
      window.setTimeout(() => this.copied.set(false), 1600);
    } catch {
      // Clipboard may be unavailable in insecure contexts.
    }
  }
}
