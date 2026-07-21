# Generic Table

A configurable, signal-based table built on Angular Material's `mat-table`. Drop the
`generic-table` folder into any Angular 20+ project and use it.

## Features

- Column-driven configuration (`ColumnDef<T>`)
- Optional per-column sorting
- Built-in cell styles: `text`, `uuid` (monospace), `date` (`Date`, `YYYY-MM-DD`, or ISO datetimes)
- Optional Lucide copy button per column (`copyable: true`)
- Optional pagination, or a scrollable body with a sticky header
- Optional virtual scroll for large datasets (CDK viewport + fixed row height)
- CSV export of all rows/columns (raw values; works with pagination and virtualization)
- Chip-based column visibility toggle
- Custom cell templates (badges, links, avatars, anything)
- Optional row click (mouse + keyboard) with hover styling
- Centered empty state
- Fully typed via generics, `OnPush` + signals, zoneless friendly
- Self-contained styling via overridable `--gt-*` CSS variables

## Requirements

- `@angular/core`, `@angular/common`
- `@angular/material` + `@angular/cdk` (provides `mat-table`, `mat-sort`, `mat-paginator`, `mat-chips`)
- `@lucide/angular` (copy icon on `copyable` cells; header info icon)

## Setup

1. Copy the `generic-table` folder into your project (e.g. `src/app/components/generic-table`).
2. Ensure `@angular/material` is installed.
3. Add a Material theme once, globally (e.g. in `src/styles.scss`):

   ```scss
   @use '@angular/material' as mat;

   html {
     color-scheme: light;

     @include mat.theme(
       (
         color: (
           primary: mat.$azure-palette,
         ),
         typography: Roboto,
         density: 0,
       )
     );
   }
   ```

   No animations provider is required (`mat-table`, `mat-sort`, `mat-paginator`, and
   `mat-chips` do not depend on `@angular/animations`).

## Basic usage

```ts
import { Component, signal } from '@angular/core';
import { ColumnDef, GenericTableComponent } from './components/generic-table';

interface User {
  name: string;
  email: string;
  createdAt: Date;
}

@Component({
  selector: 'app-users',
  imports: [GenericTableComponent],
  template: `
    <app-generic-table [columns]="columns" [data]="rows()" [paginated]="true" />
  `,
})
export class UsersComponent {
  readonly columns: ColumnDef<User>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email' },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      cell: (u) => u.createdAt.toLocaleDateString(),
      sortAccessor: (u) => u.createdAt.getTime(),
    },
  ];

  readonly rows = signal<User[]>([
    /* ... */
  ]);
}
```

The row type `T` is inferred from the `data`/`columns` inputs, so `cell`,
`sortAccessor`, and the `rowClick` payload are all fully typed.

## Inputs

| Input             | Type                     | Default               | Description                                              |
| ----------------- | ------------------------ | --------------------- | -------------------------------------------------------- |
| `columns`         | `ColumnDef<T>[]`         | required              | Column definitions in display order.                     |
| `data`            | `readonly T[]`           | required              | Row data (client-side sort/paginate unless `serverSide`). |
| `paginated`       | `boolean`                | `false`               | Show a paginator; otherwise the body scrolls. Ignored when `virtualized`. |
| `serverSide`      | `boolean`                | `false`               | Server-side pagination — pass one page in `data`, set `totalCount`, fetch on `(pageChange)`. Requires `paginated`. |
| `totalCount`      | `number`                 | `0`                   | Total rows on the server (when `serverSide` is true).     |
| `pageIndex`       | `number`                 | `0`                   | Current page index, zero-based (when `serverSide` is true). |
| `virtualized`     | `boolean`                | `false`               | Virtual scroll — only visible rows are rendered. Requires a bounded height and `rowHeight`. |
| `rowHeight`       | `number`                 | `48`                  | Fixed row height in pixels (required for `virtualized`). |
| `pageSize`        | `number`                 | `10`                  | Initial page size.                                       |
| `pageSizeOptions` | `number[]`               | `[5, 10, 25, 50]`     | Page size choices.                                       |
| `showColumnToggle`| `boolean`                | `true`                | Show the column visibility chips.                        |
| `showExport`      | `boolean`                | `false`               | Show an Export CSV button (all rows/columns, raw values). |
| `exportFileName`  | `string`                 | `'table-export.csv'`  | Download filename for CSV export.                        |
| `exportData`      | `readonly T[] \| null`   | `null`                | Full dataset for CSV when `data` is only one page.       |
| `emptyMessage`    | `string`                 | `'No data available'` | Message shown when there are no rows.                    |
| `rowClickable`    | `boolean`                | `false`               | Enable row click + hover styling.                        |
| `heightMode`      | `'auto' \| 'fill' \| 'parent'` | `'auto'`        | Vertical sizing strategy — see [Height & scrolling](#height--scrolling). |
| `height`          | `string \| null`         | `null`                | Exact, fixed height for the scroll body (e.g. `'320px'`). Wins over `heightMode`. |
| `maxHeight`       | `string \| null`         | `null`                | Caps the scroll body height (e.g. `'320px'`). Composes with any `heightMode`. |
| `trackBy`         | `TrackByFunction<T>`     | identity tracking     | Row `trackBy`; defaults to tracking by row identity.     |

## Outputs

| Output       | Payload     | Description                                        |
| ------------ | ----------- | -------------------------------------------------- |
| `rowClick`   | `T`         | Emitted on row click when `rowClickable` is true.  |
| `sortChange` | `Sort`      | Emitted when the sort state changes.               |
| `pageChange`    | `PageEvent` | Emitted when the page changes. Fetch the next page when `serverSide` is true. |
| `exportRequest` | `GenericTableExportRequest<T>` | Emitted on CSV export. Call `complete(rows)` after loading the full dataset (server-side). |

### CSV export

Export every column definition and every row as a UTF-8 CSV download (Excel-friendly BOM).
Values are raw `row[key]` properties — custom `cell` formatters and projected templates are
ignored. Pagination and virtualization do not limit the export.

**Client-side / virtualized:** downloads from `data` (or `exportData`) immediately.

**Server-side pagination:** the table does not fetch pages itself. Handle `(exportRequest)`,
load the full set, then call `complete(rows)`:

```ts
onExport(request: GenericTableExportRequest<User>): void {
  this.users.fetchAll().subscribe((rows) => request.complete(rows));
}
```

```html
<app-generic-table
  [columns]="columns"
  [data]="pageRows()"
  [paginated]="true"
  [serverSide]="true"
  [totalCount]="total()"
  [showExport]="true"
  (exportRequest)="onExport($event)"
/>
```

Alternatively pass `[exportData]` with a full list you already have, and the table will
download without waiting on `(exportRequest)`.

### Server-side pagination

Use when the full dataset lives on the server and you only want one page in memory at a time.
Enable `paginated` and `serverSide`, pass the current page rows in `data`, set `totalCount` to the
server total, and update `pageIndex` after each fetch:

```ts
import { Component, inject, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ColumnDef, GenericTableComponent } from './components/generic-table';
import { UserService } from './user.service';

@Component({
  selector: 'app-users',
  imports: [GenericTableComponent],
  template: `
    <app-generic-table
      [columns]="columns"
      [data]="rows()"
      [paginated]="true"
      [serverSide]="true"
      [totalCount]="totalCount()"
      [pageIndex]="pageIndex()"
      [pageSize]="pageSize()"
      (pageChange)="onPageChange($event)"
    />
  `,
})
export class UsersComponent {
  private readonly users = inject(UserService);

  readonly columns: ColumnDef<User>[] = [/* ... */];
  readonly rows = signal<User[]>([]);
  readonly totalCount = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  constructor() {
    this.loadPage(0, this.pageSize());
  }

  onPageChange(event: PageEvent): void {
    this.loadPage(event.pageIndex, event.pageSize);
  }

  private loadPage(pageIndex: number, pageSize: number): void {
    this.users.fetchPage({ pageIndex, pageSize }).subscribe(({ items, total }) => {
      this.rows.set(items);
      this.totalCount.set(total);
      this.pageIndex.set(pageIndex);
      this.pageSize.set(pageSize);
    });
  }
}
```

With `serverSide`, the paginator is **not** wired to `MatTableDataSource` — it uses `totalCount`
for the page count and displays whatever you pass in `data` as-is. Sorting still runs client-side
over the current page unless you handle `(sortChange)` and refetch from the server.

### Height & scrolling

The table body scrolls (with a sticky header) whenever its content is taller than
the height it's given. There are three ways to decide that height:

| Goal | Use |
| --- | --- |
| **Grow with content** (optionally capped) | default `heightMode="auto"`, add `maxHeight="480px"` to cap |
| **Fixed height** (always this tall) | `height="320px"` |
| **Fill the remaining space** of a sized column | `heightMode="fill"` |
| **Fill the parent's full height** | `heightMode="parent"` |
| **Large dataset, scroll through all rows** | `[virtualized]="true"` + `height` + `rowHeight` |

`height` and `maxHeight` accept any CSS length (`px`, `rem`, `vh`, `cqh`, …).

#### Virtual scroll

Use when you need to scroll through thousands of rows without pagination. Wraps the table in a
CDK virtual scroll viewport so only visible rows are in the DOM. Requires:

- A bounded scroll height (`height`, `maxHeight`, or `heightMode="fill"` / `"parent"`)
- A fixed `rowHeight` (default `48` px) — custom cell templates should fit within that height
- `paginated` is ignored while `virtualized` is on

```html
<app-generic-table
  [columns]="columns"
  [data]="rows()"
  [virtualized]="true"
  [rowHeight]="48"
  height="400px"
/>
```

#### `heightMode="fill"` (fill remaining space)

Best when the table sits alongside other content inside a container that already
has a height. The component takes the leftover space and scrolls its body.

```css
.table-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;   /* let the table shrink and scroll */
  height: 100%;    /* or flex: 1 inside another flex column */
}
```

```html
<div class="table-panel">
  <h2>Team</h2>
  <app-generic-table heightMode="fill" [columns]="columns" [data]="rows()" />
</div>
```

#### `heightMode="parent"` (fill parent height)

Best when the table is the only child of an element that has a resolvable height.

```html
<div style="height: 400px">
  <app-generic-table heightMode="parent" [columns]="columns" [data]="rows()" />
</div>
```

#### Two common gotchas

1. **The table's direct parent must be a flex column.** `flex: 1; min-height: 0` on an
   ancestor is not enough — the element that wraps `app-generic-table` also needs
   `display: flex; flex-direction: column; min-height: 0`, otherwise `heightMode="fill"`
   has no flex context to fill and the table grows with its rows.
2. **Every `flex: 1` ancestor in the chain needs `min-height: 0`.** Flex items default
   to `min-height: auto`, so one missing `min-height: 0` lets content push the page.
3. **`cqh`/`cqb` need a block-axis container.** `container-type: inline-size` only
   establishes a width axis; use `container-type: size` (or `block-size`) for
   container-query height units.

Typical app-shell layout:

```css
.page { display: flex; flex-direction: column; height: 100vh; }
.page__main {
  flex: 1;
  min-height: 0;
  display: flex;           /* required on the table's parent */
  flex-direction: column;  /* required on the table's parent */
}
```

```html
<main class="page__main">
  <app-generic-table heightMode="fill" [paginated]="false" ... />
</main>
```

## `ColumnDef<T>`

| Property       | Type                            | Description                                                        |
| -------------- | ------------------------------- | ----------------------------------------------------------------- |
| `key`          | `string`                        | Unique id; also the default `row[key]` accessor.                  |
| `header`       | `string`                        | Header label.                                                     |
| `description`  | `string`                        | Optional help text; shows a small info icon + tooltip by the header. |
| `sortable`     | `boolean`                       | Enable sorting for this column (default `false`).                 |
| `cellType`     | `'text' \| 'uuid' \| 'date'`    | Built-in cell presentation when no custom template is projected (default `'text'`). |
| `dateDisplay`  | `'auto' \| 'date' \| 'datetime'`| How `date` cells format values (default `'auto'`).                |
| `copyable`     | `boolean`                       | Show a small Lucide copy button for the cell value (default `false`). |
| `cell`         | `(row: T) => string \| number`  | Custom text formatter (default `row[key]`).                       |
| `sortAccessor` | `(row: T) => string \| number`  | Value used for sorting (default `cell`, then `row[key]` / date timestamp). |
| `hideable`     | `boolean`                       | If `false`, always visible and not shown in the toggle (default `true`). |
| `visible`      | `boolean`                       | Initial visibility (default `true`).                             |
| `width`        | `string`                        | Fixed width, e.g. `'120px'` or `'20%'`.                          |
| `minWidth`     | `string`                        | Minimum width, e.g. `'120px'`; the column never shrinks below it. |
| `align`        | `'left' \| 'center' \| 'right'` | Text alignment (default `'left'`).                               |

### Built-in cell types

Use `cellType` instead of a custom template for common formats:

```ts
const columns: ColumnDef<User>[] = [
  { key: 'id', header: 'ID', cellType: 'uuid', copyable: true },
  { key: 'email', header: 'Email', copyable: true },
  {
    key: 'createdAt',
    header: 'Created',
    sortable: true,
    cellType: 'date',
    dateDisplay: 'date', // Date | 'YYYY-MM-DD' | ISO datetime string
  },
];
```

- **`uuid`**: monospace text.
- **`date`**: accepts `Date`, date-only strings (`2026-07-21`), or ISO datetimes
  (`2026-07-21T18:30:00.123456Z`). With `dateDisplay: 'auto'` (default), date-only /
  midnight values render as a locale date; otherwise date + time.
- **`copyable`**: copies the **raw** cell value (ISO for `Date`s), not only the pretty label.
  Custom `appGenericTableCell` templates still win over built-in styles.

## Custom cell templates

Project an `<ng-template appGenericTableCell="<columnKey>">` to render rich content
for a column. Import `GenericTableCellDirective` alongside the table.

```ts
import { GenericTableCellDirective, GenericTableComponent } from './components/generic-table';

@Component({
  imports: [GenericTableComponent, GenericTableCellDirective],
  /* ... */
})
```

```html
<app-generic-table [columns]="columns" [data]="rows()">
  <ng-template appGenericTableCell="status" [appGenericTableCellFor]="rows()" let-row>
    <span class="badge badge--{{ row.status }}">{{ row.status }}</span>
  </ng-template>
</app-generic-table>
```

The template context exposes the row as both `$implicit` (`let-row`) and `row`
(`let-row="row"`). A column can still define a `cell` formatter for sorting/plain
rendering; when a matching template exists it takes precedence for display.

### Typing `let-row`

Bind `[appGenericTableCellFor]` to the same value you pass to `[data]`. The
directive infers its row type from that binding (the same way `*ngFor` infers its
item type from `ngForOf`), so `let-row` is fully typed under `strictTemplates` —
no `$any` casts. The binding is inference-only and is never read at runtime.

> If you omit `[appGenericTableCellFor]`, `let-row` falls back to `unknown`.

## Styling

Colors, spacing, and radii are exposed as CSS variables on `.generic-table`. Override
any of them from a parent scope:

```css
app-generic-table .generic-table {
  --gt-header-accent: #3f51b5; /* header underline color */
  --gt-row-even-bg: #f0f4ff;   /* zebra striping */
}
```

| Variable            | Purpose                     |
| ------------------- | --------------------------- |
| `--gt-gap`          | Gap between toolbar/table/paginator |
| `--gt-toggle-gap`   | Gap between toggle chips     |
| `--gt-border`       | Scroll container border      |
| `--gt-radius`       | Scroll container radius      |
| `--gt-header-bg`    | Header background            |
| `--gt-header-text`  | Header text color            |
| `--gt-header-accent`| Header bottom border color   |
| `--gt-row-odd-bg`   | Odd row background           |
| `--gt-row-even-bg`  | Even row background          |
| `--gt-row-hover-bg` | Clickable row hover color    |
| `--gt-row-divider`  | Divider between rows         |
| `--gt-empty-color`  | Empty-state text color       |
| `--gt-empty-padding`| Empty-state padding          |

Each variable falls back to a default, so the component looks correct with no
external setup. It also reuses `--spacing-*` / `--color-*` design tokens when they
exist in the host project.

## Change detection

The component is `OnPush` and 100% signal-driven (`input()`, `computed()`,
`linkedSignal()`, `viewChild()`, `contentChildren()`). That is exactly the
signal-first setup: Angular only re-renders when a signal changes, which also works
in a zoneless app (`provideZonelessChangeDetection()`). No manual
`ChangeDetectorRef` calls are needed.

## Files

| File                             | Responsibility                          |
| -------------------------------- | --------------------------------------- |
| `generic-table.component.ts`     | Component logic (signals, data source)  |
| `generic-table.component.html`   | Template                                |
| `generic-table.component.scss`   | Self-contained styling                  |
| `generic-table-cell.directive.ts`| Custom cell template directive          |
| `generic-table-cell-value.component.ts` | Built-in text/uuid/date + copy UI |
| `generic-table-cell-format.ts`   | Shared format / parse / copy helpers    |
| `generic-table-cell.types.ts`    | `GenericTableCellType`, `GenericTableDateDisplay` |
| `generic-table-header-info.component.ts` | Header description tooltip icon |
| `generic-table.types.ts`         | `ColumnDef<T>`, `GenericTableCellContext<T>` |
| `index.ts`                       | Public barrel export                    |
