import { Component, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import {
  ColumnDef,
  GenericTableCellDirective,
  GenericTableExportRequest,
  GenericTableTanstackComponent,
} from '../../components/generic-table-tanstack';
import { DemoCodeBlockComponent } from '../../shared/demo-code-block/demo-code-block.component';
import { code } from '../../shared/demo-code-block/demo-code.util';

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

@Component({
  selector: 'app-generic-table-tanstack-demo',
  imports: [
    GenericTableTanstackComponent,
    GenericTableCellDirective,
    DemoCodeBlockComponent,
  ],
  templateUrl: './generic-table-tanstack-demo.component.html',
  styleUrl: './generic-table-tanstack-demo.component.scss',
})
export class GenericTableTanstackDemoComponent {
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
    },
    {
      key: 'lastSeen',
      header: 'Last seen',
      sortable: true,
      cellType: 'date',
      copyable: true,
      minWidth: '180px',
    },
  ];

  readonly scrollColumns: ColumnDef<DemoUser>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'status', header: 'Status', align: 'center', width: '100px' },
  ];

  readonly rows = signal<DemoUser[]>(this.buildVirtualRows(42));
  readonly virtualRows = signal<DemoUser[]>(this.buildVirtualRows(10_000));
  readonly emptyRows = signal<DemoUser[]>([]);
  readonly selectedRow = signal<DemoUser | null>(null);

  private readonly serverSideDataset = this.buildVirtualRows(87);
  readonly serverSideTotal = this.serverSideDataset.length;
  readonly serverSideRows = signal<DemoUser[]>([]);
  readonly serverSidePageIndex = signal(0);
  readonly serverSidePageSize = signal(5);

  constructor() {
    this.loadServerSidePage(0, this.serverSidePageSize());
  }

  trackById(_index: number, row: DemoUser): number {
    return row.id;
  }

  onRowClick(row: DemoUser): void {
    this.selectedRow.set(row);
  }

  onServerSidePageChange(event: PageEvent): void {
    this.loadServerSidePage(event.pageIndex, event.pageSize);
  }

  onServerSideExport(request: GenericTableExportRequest<DemoUser>): void {
    setTimeout(() => request.complete(this.serverSideDataset), 350);
  }

  statusBadgeClass(status: string): string {
    return `demo__status-badge demo__status-badge--${status.toLowerCase()}`;
  }

  readonly snippets = {
    paginated: {
      html: code`
        <app-generic-table-tanstack
          [columns]="columns"
          [data]="rows()"
          [paginated]="true"
          [pageSize]="5"
          [rowClickable]="true"
          [showExport]="true"
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
        </app-generic-table-tanstack>
      `,
      ts: code`
        import { signal } from '@angular/core';
        import {
          ColumnDef,
          GenericTableCellDirective,
          GenericTableExportRequest,
          GenericTableTanstackComponent,
        } from './components/generic-table-tanstack';

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
          { key: 'createdAt', header: 'Created', sortable: true, cellType: 'date' },
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
        <app-generic-table-tanstack
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
        } from './components/generic-table-tanstack';

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
          // Load every page, then finish the download.
          this.fetchAllRows().then((rows) => request.complete(rows));
        }
      `,
    },
    virtual: {
      html: code`
        <app-generic-table-tanstack
          [columns]="columns"
          [data]="rows()"
          [virtualized]="true"
          [rowHeight]="40"
          height="400px"
          [trackBy]="trackById"
        />
      `,
      ts: code`
        import { signal } from '@angular/core';
        import { ColumnDef } from './components/generic-table-tanstack';

        readonly columns: ColumnDef<DemoUser>[] = [/* ... */];
        readonly rows = signal<DemoUser[]>(this.buildRows(10_000));

        trackById(_index: number, row: DemoUser): number {
          return row.id;
        }
      `,
    },
  };

  private loadServerSidePage(pageIndex: number, pageSize: number): void {
    const start = pageIndex * pageSize;
    this.serverSidePageIndex.set(pageIndex);
    this.serverSidePageSize.set(pageSize);
    this.serverSideRows.set(this.serverSideDataset.slice(start, start + pageSize));
  }

  private buildVirtualRows(count: number): DemoUser[] {
    const departments = ['Engineering', 'Design', 'Product', 'Support', 'Finance'];
    const statuses: DemoUser['status'][] = ['Active', 'Inactive', 'Pending'];

    return Array.from({ length: count }, (_, index) => {
      const id = index + 1;

      return {
        id,
        uuid: `550e8400-e29b-41d4-a716-${id.toString(16).padStart(12, '0')}`,
        name: `User ${id}`,
        email: `user${id}@example.com`,
        department: departments[index % departments.length],
        status: statuses[index % statuses.length],
        createdAt: new Date(2020, index % 12, (index % 28) + 1),
        lastSeen: new Date(2024, index % 12, (index % 28) + 1, 10, 30, index % 60).toISOString(),
      };
    });
  }
}
