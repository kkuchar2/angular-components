import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { Component, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import {
  ColumnDef,
  GenericTableCellDirective,
  GenericTableComponent,
  GenericTableExportRequest,
  GenericTableHeightMode,
} from '../../components/generic-table';
import { DemoCodeBlockComponent } from '../../shared/demo-code-block/demo-code-block.component';
import { code } from '../../shared/demo-code-block/demo-code.util';
import { ResizeObserverDirective } from './resize-observer.directive';

interface DemoUser {
  id: number;
  uuid: string;
  name: string;
  email: string;
  department: string;
  status: 'Active' | 'Inactive' | 'Pending';
  createdAt: Date;
  lastSeen: string;
}

interface HeightDemoCard {
  id: string;
  code: string;
  description: string;
  heightMode?: GenericTableHeightMode;
  height?: string;
  maxHeight?: string;
  /** Resizable shell is a flex column (required for fill / parent). */
  flexShell?: boolean;
  toolbar?: boolean;
}

@Component({
  selector: 'app-generic-table-demo',
  imports: [
    CdkDrag,
    CdkDragHandle,
    GenericTableComponent,
    GenericTableCellDirective,
    ResizeObserverDirective,
    DemoCodeBlockComponent,
  ],
  templateUrl: './generic-table-demo.component.html',
  styleUrl: './generic-table-demo.component.scss',
})
export class GenericTableDemoComponent {
  readonly columns: ColumnDef<DemoUser>[] = [
    {
      key: 'uuid',
      header: 'UUID',
      cellType: 'uuid',
      copyable: true,
      minWidth: '280px',
      description: 'Built-in uuid cell: monospace + copy button.',
    },
    { key: 'name', header: 'Name', sortable: true },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      copyable: true,
      minWidth: '220px',
      description: 'Primary contact address used for account notifications.',
    },
    { key: 'department', header: 'Department', sortable: true },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      width: '120px',
      description: 'Active = can sign in. Pending = invited but not confirmed.',
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      cellType: 'date',
      dateDisplay: 'date',
      description: 'Date cell from a Date value (no custom template).',
    },
    {
      key: 'lastSeen',
      header: 'Last seen',
      sortable: true,
      cellType: 'date',
      copyable: true,
      minWidth: '180px',
      description: 'Date cell from an ISO datetime string.',
    },
  ];

  readonly showcaseColumns: ColumnDef<DemoUser>[] = [
    { key: 'name', header: 'Member', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'status', header: 'Status', align: 'center', width: '120px' },
  ];

  /** Slimmer columns for the height-constraint demos. */
  readonly scrollColumns: ColumnDef<DemoUser>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'status', header: 'Status', align: 'center', width: '100px' },
  ];

  readonly heightDemos: HeightDemoCard[] = [
    {
      id: 'auto',
      code: 'heightMode="auto"',
      description: 'Default — grows with rows up to 480px, then scrolls.',
    },
    {
      id: 'fixed',
      code: 'height="200px"',
      description: 'Fixed — the scroll body is always 200px tall.',
      height: '200px',
      flexShell: true,
    },
    {
      id: 'max',
      code: 'maxHeight="160px"',
      description: 'Capped — grows with content up to 160px.',
      maxHeight: '160px',
      flexShell: true,
    },
    {
      id: 'parent',
      code: 'heightMode="parent"',
      description: 'Shrinks to rows; caps at container height and scrolls when needed.',
      heightMode: 'parent',
      flexShell: true,
    },
    {
      id: 'fill',
      code: 'heightMode="fill"',
      description: 'Shrinks to rows; caps at remaining space below the toolbar.',
      heightMode: 'fill',
      flexShell: true,
      toolbar: true,
    },
  ];

  readonly rows = signal<DemoUser[]>([
    {
      id: 1,
      uuid: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      department: 'Engineering',
      status: 'Active',
      createdAt: new Date('2024-03-15'),
      lastSeen: '2026-07-21T18:30:00.123456Z',
    },
    {
      id: 2,
      uuid: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Bob Smith',
      email: 'bob@example.com',
      department: 'Operations',
      status: 'Active',
      createdAt: new Date('2024-06-22'),
      lastSeen: '2026-07-18T09:15:00Z',
    },
    {
      id: 3,
      uuid: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Carol Williams',
      email: 'carol@example.com',
      department: 'Support',
      status: 'Inactive',
      createdAt: new Date('2023-11-08'),
      lastSeen: '2025-12-01T00:00:00.000Z',
    },
    {
      id: 4,
      uuid: '550e8400-e29b-41d4-a716-446655440004',
      name: 'David Brown',
      email: 'david@example.com',
      department: 'Engineering',
      status: 'Active',
      createdAt: new Date('2025-01-30'),
      lastSeen: '2026-06-01T14:22:11.5Z',
    },
    {
      id: 5,
      uuid: '550e8400-e29b-41d4-a716-446655440005',
      name: 'Eva Martinez',
      email: 'eva@example.com',
      department: 'Finance',
      status: 'Active',
      createdAt: new Date('2024-09-12'),
      lastSeen: '2026-07-20T08:00:00Z',
    },
    {
      id: 6,
      uuid: '550e8400-e29b-41d4-a716-446655440006',
      name: 'Frank Lee',
      email: 'frank@example.com',
      department: 'Operations',
      status: 'Pending',
      createdAt: new Date('2025-02-18'),
      lastSeen: '2026-03-10T16:45:30.123Z',
    },
    {
      id: 7,
      uuid: '550e8400-e29b-41d4-a716-446655440007',
      name: 'Grace Kim',
      email: 'grace@example.com',
      department: 'Support',
      status: 'Active',
      createdAt: new Date('2024-07-04'),
      lastSeen: '2026-07-21T12:00:00Z',
    },
    {
      id: 8,
      uuid: '550e8400-e29b-41d4-a716-446655440008',
      name: 'Henry Davis',
      email: 'henry@example.com',
      department: 'Finance',
      status: 'Inactive',
      createdAt: new Date('2023-05-27'),
      lastSeen: '2024-01-02T23:59:59Z',
    },
    {
      id: 9,
      uuid: '550e8400-e29b-41d4-a716-446655440009',
      name: 'Ivy Chen',
      email: 'ivy@example.com',
      department: 'Engineering',
      status: 'Active',
      createdAt: new Date('2025-03-01'),
      lastSeen: '2026-07-19T07:30:00.001Z',
    },
    {
      id: 10,
      uuid: '550e8400-e29b-41d4-a716-44665544000a',
      name: 'Jack Wilson',
      email: 'jack@example.com',
      department: 'Operations',
      status: 'Pending',
      createdAt: new Date('2024-12-19'),
      lastSeen: '2026-05-05T11:11:11Z',
    },
    {
      id: 11,
      uuid: '550e8400-e29b-41d4-a716-44665544000b',
      name: 'Karen Taylor',
      email: 'karen@example.com',
      department: 'Support',
      status: 'Active',
      createdAt: new Date('2024-04-03'),
      lastSeen: '2026-07-15T19:20:00Z',
    },
    {
      id: 12,
      uuid: '550e8400-e29b-41d4-a716-44665544000c',
      name: 'Leo Anderson',
      email: 'leo@example.com',
      department: 'Finance',
      status: 'Active',
      createdAt: new Date('2023-08-14'),
      lastSeen: '2026-02-28T04:05:06.789Z',
    },
  ]);

  readonly showcaseRows = signal<DemoUser[]>(this.rows().slice(0, 5));
  readonly emptyRows = signal<DemoUser[]>([]);

  /** Always empty — used to remount a fresh virtual table instance (cold start). */
  readonly virtualColdEmptyRows: DemoUser[] = [];

  /** Populated reference for column-width comparison. */
  readonly virtualReferenceRows = this.buildVirtualRows(250);

  /** Increment to destroy and recreate the cold-start table. */
  readonly virtualColdMount = signal(0);

  /** Large dataset for the virtual-scroll demo (10 000 rows). */
  readonly virtualRows = signal<DemoUser[]>(this.buildVirtualRows(10_000));

  readonly selectedRow = signal<DemoUser | null>(null);

  /** Simulated server-side dataset (87 rows); only one page is exposed at a time. */
  private readonly serverSideDataset = this.buildVirtualRows(87);

  readonly serverSideTotal = this.serverSideDataset.length;
  readonly serverSideRows = signal<DemoUser[]>([]);
  readonly serverSidePageIndex = signal(0);
  readonly serverSidePageSize = signal(5);
  readonly serverSideLoading = signal(false);

  constructor() {
    this.loadServerSidePage(0, this.serverSidePageSize());
  }

  onServerSidePageChange(event: PageEvent): void {
    this.loadServerSidePage(event.pageIndex, event.pageSize);
  }

  onServerSideExport(request: GenericTableExportRequest<DemoUser>): void {
    // Simulate fetching every page, then finish the download.
    setTimeout(() => request.complete(this.serverSideDataset), 350);
  }

  onRowClick(row: DemoUser): void {
    this.selectedRow.set(row);
  }

  resetVirtualColdDemo(): void {
    this.virtualColdMount.update((mount) => mount + 1);
  }

  trackById(_index: number, row: DemoUser): number {
    return row.id;
  }

  initials(row: DemoUser): string {
    return row.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  statusBadgeClass(status: string): string {
    return `home__status-badge home__status-badge--${status.toLowerCase()}`;
  }

  readonly snippets = {
    fullFeatured: {
      html: code`
        <app-generic-table
          [columns]="columns"
          [data]="rows()"
          [paginated]="true"
          [pageSize]="5"
          [rowClickable]="true"
          [showExport]="true"
          exportFileName="team-members.csv"
          [trackBy]="trackById"
          (rowClick)="onRowClick($event)"
        >
          <ng-template
            appGenericTableCell="status"
            [appGenericTableCellFor]="rows()"
            let-row
          >
            <span [class]="statusBadgeClass(row.status)">{{ row.status }}</span>
          </ng-template>
        </app-generic-table>
      `,
      ts: code`
        import { signal } from '@angular/core';
        import {
          ColumnDef,
          GenericTableCellDirective,
          GenericTableComponent,
        } from './components/generic-table';

        interface DemoUser {
          id: number;
          uuid: string;
          name: string;
          email: string;
          status: 'Active' | 'Inactive' | 'Pending';
          createdAt: Date;
          lastSeen: string;
        }

        readonly columns: ColumnDef<DemoUser>[] = [
          { key: 'uuid', header: 'UUID', cellType: 'uuid', copyable: true },
          { key: 'name', header: 'Name', sortable: true },
          { key: 'email', header: 'Email', sortable: true, copyable: true },
          { key: 'status', header: 'Status', sortable: true, align: 'center' },
          {
            key: 'createdAt',
            header: 'Created',
            sortable: true,
            cellType: 'date',
            dateDisplay: 'date',
          },
          { key: 'lastSeen', header: 'Last seen', sortable: true, cellType: 'date' },
        ];

        readonly rows = signal<DemoUser[]>([/* ... */]);

        trackById(_index: number, row: DemoUser): number {
          return row.id;
        }

        onRowClick(row: DemoUser): void {
          this.selectedRow.set(row);
        }

        statusBadgeClass(status: string): string {
          return \`status-badge status-badge--\${status.toLowerCase()}\`;
        }
      `,
    },
    serverSide: {
      html: code`
        <app-generic-table
          [columns]="columns"
          [data]="pageRows()"
          [paginated]="true"
          [serverSide]="true"
          [totalCount]="totalCount"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          [showExport]="true"
          (pageChange)="onPageChange($event)"
          (exportRequest)="onExport($event)"
        />
      `,
      ts: code`
        import { signal } from '@angular/core';
        import { PageEvent } from '@angular/material/paginator';
        import {
          ColumnDef,
          GenericTableExportRequest,
        } from './components/generic-table';

        readonly columns: ColumnDef<DemoUser>[] = [/* ... */];
        readonly totalCount = 87;
        readonly pageIndex = signal(0);
        readonly pageSize = signal(5);
        readonly pageRows = signal<DemoUser[]>([]);

        onPageChange(event: PageEvent): void {
          this.pageIndex.set(event.pageIndex);
          this.pageSize.set(event.pageSize);
          this.loadPage(event.pageIndex, event.pageSize);
        }

        onExport(request: GenericTableExportRequest<DemoUser>): void {
          this.fetchAllRows().then((rows) => request.complete(rows));
        }
      `,
    },
    heightModes: {
      html: code`
        <!-- auto (default): grow with rows, then scroll -->
        <app-generic-table heightMode="auto" [columns]="columns" [data]="rows()" />

        <!-- fixed height -->
        <app-generic-table height="200px" [columns]="columns" [data]="rows()" />

        <!-- cap growth -->
        <app-generic-table maxHeight="160px" [columns]="columns" [data]="rows()" />

        <!-- fill parent / remaining space -->
        <app-generic-table heightMode="parent" [columns]="columns" [data]="rows()" />
        <app-generic-table heightMode="fill" [columns]="columns" [data]="rows()" />
      `,
      ts: code`
        import { ColumnDef, GenericTableHeightMode } from './components/generic-table';

        readonly columns: ColumnDef<DemoUser>[] = [/* ... */];
        readonly rows = signal<DemoUser[]>([/* ... */]);

        // Optional: drive heightMode from a variable
        readonly heightMode = signal<GenericTableHeightMode>('parent');
      `,
    },
    customCells: {
      html: code`
        <app-generic-table
          [columns]="columns"
          [data]="rows()"
          [trackBy]="trackById"
        >
          <ng-template
            appGenericTableCell="name"
            [appGenericTableCellFor]="rows()"
            let-row
          >
            <span class="user">
              <span class="avatar">{{ initials(row) }}</span>
              {{ row.name }}
            </span>
          </ng-template>

          <ng-template
            appGenericTableCell="email"
            [appGenericTableCellFor]="rows()"
            let-row
          >
            <a [href]="'mailto:' + row.email">{{ row.email }}</a>
          </ng-template>
        </app-generic-table>
      `,
      ts: code`
        import { ColumnDef, GenericTableCellDirective } from './components/generic-table';

        readonly columns: ColumnDef<DemoUser>[] = [
          { key: 'name', header: 'Member', sortable: true },
          { key: 'email', header: 'Email' },
          { key: 'department', header: 'Department', sortable: true },
          { key: 'status', header: 'Status', align: 'center' },
        ];

        initials(row: DemoUser): string {
          return row.name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
        }
      `,
    },
    virtualScroll: {
      html: code`
        <app-generic-table
          [columns]="columns"
          [data]="rows()"
          [virtualized]="true"
          [rowHeight]="48"
          height="400px"
          [trackBy]="trackById"
        />
      `,
      ts: code`
        import { signal } from '@angular/core';
        import { ColumnDef } from './components/generic-table';

        readonly columns: ColumnDef<DemoUser>[] = [/* ... */];
        readonly rows = signal<DemoUser[]>(this.buildRows(10_000));

        trackById(_index: number, row: DemoUser): number {
          return row.id;
        }
      `,
    },
    empty: {
      html: code`
        <app-generic-table
          [columns]="columns"
          [data]="[]"
          emptyMessage="No team members found."
        />
      `,
      ts: code`
        import { ColumnDef } from './components/generic-table';

        readonly columns: ColumnDef<DemoUser>[] = [/* ... */];
      `,
    },
    virtualEmpty: {
      html: code`
        <app-generic-table
          [columns]="columns"
          [data]="rows()"
          [virtualized]="true"
          [rowHeight]="48"
          height="240px"
          emptyMessage="Cold start — no rows yet."
          [trackBy]="trackById"
        />
      `,
      ts: code`
        import { signal } from '@angular/core';
        import { ColumnDef } from './components/generic-table';

        readonly columns: ColumnDef<DemoUser>[] = [/* ... */];
        readonly rows = signal<DemoUser[]>([]);

        trackById(_index: number, row: DemoUser): number {
          return row.id;
        }
      `,
    },
  };

  private loadServerSidePage(pageIndex: number, pageSize: number): void {
    this.serverSideLoading.set(true);

    // Simulate network latency.
    setTimeout(() => {
      const start = pageIndex * pageSize;
      this.serverSideRows.set(this.serverSideDataset.slice(start, start + pageSize));
      this.serverSidePageIndex.set(pageIndex);
      this.serverSidePageSize.set(pageSize);
      this.serverSideLoading.set(false);
    }, 350);
  }

  private buildVirtualRows(count: number): DemoUser[] {
    const departments = ['Engineering', 'Operations', 'Support', 'Finance'] as const;
    const statuses = ['Active', 'Inactive', 'Pending'] as const;
    const base = this.rows();

    return Array.from({ length: count }, (_, index) => {
      const template = base[index % base.length];
      const id = index + 1;

      return {
        ...template,
        id,
        uuid: `550e8400-e29b-41d4-a716-${id.toString(16).padStart(12, '0')}`,
        name: `${template.name} #${id}`,
        email: `user${id}@example.com`,
        department: departments[index % departments.length],
        status: statuses[index % statuses.length],
        createdAt: new Date(2020 + (index % 6), index % 12, (index % 28) + 1),
        lastSeen: new Date(2024, index % 12, (index % 28) + 1, 10, 30, index % 60).toISOString(),
      };
    });
  }
}
