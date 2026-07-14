import { DataSource, ListRange } from '@angular/cdk/collections';
import { CdkVirtualScrollRepeater } from '@angular/cdk/scrolling';
import { BehaviorSubject, Observable, combineLatest, map } from 'rxjs';

/**
 * Bridges a sorted row array to `cdk-virtual-scroll-viewport` and a consuming
 * `DataSource` (e.g. `mat-table`) by exposing only the rendered slice.
 *
 * Prefer the built-in CDK table virtual-scroll integration when the table sits
 * directly inside a viewport (Angular CDK 21+). This class remains available
 * for explicit viewport wiring or environments where auto-detection is unavailable.
 */
export class VirtualScrollTableDataSource<T>
  implements DataSource<T>, CdkVirtualScrollRepeater<T>
{
  private readonly sortedData$ = new BehaviorSubject<readonly T[]>([]);
  private readonly renderedRange$ = new BehaviorSubject<ListRange>({ start: 0, end: 0 });

  readonly dataStream: Observable<readonly T[]> = this.sortedData$.asObservable();

  constructor(private readonly rowHeightPx: number) {}

  /** Replace the full, sorted dataset backing the viewport. */
  setSortedData(data: readonly T[]): void {
    this.sortedData$.next(data);
  }

  /** Update the slice currently rendered by the viewport. */
  setRenderedRange(range: ListRange): void {
    this.renderedRange$.next(range);
  }

  /** Absolute index of the first rendered row (for zebra striping, etc.). */
  get renderedOffset(): number {
    return this.renderedRange$.value.start;
  }

  connect(): Observable<readonly T[]> {
    return combineLatest([this.sortedData$, this.renderedRange$]).pipe(
      map(([data, range]) => data.slice(range.start, Math.min(range.end, data.length))),
    );
  }

  disconnect(): void {
    // Stateless bridge; subscriptions are owned by the consumer.
  }

  measureRangeSize(range: ListRange, orientation: 'horizontal' | 'vertical'): number {
    if (orientation !== 'vertical' || range.start >= range.end) {
      return 0;
    }

    return (range.end - range.start) * this.rowHeightPx;
  }
}
