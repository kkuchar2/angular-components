import { Component, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { LucideCopy, LucidePencil, LucideTrash2 } from '@lucide/angular';

import {
  BooleanCellComponent,
  ColumnDef,
  ContextMenuDetailField,
  GenericTableExportRequest,
  GenericTableRowAction,
  GenericTableRowActionEvent,
  GenericTableTanstackComponent,
  MailtoCellComponent,
  PersonCellComponent,
  PresencePulseCellComponent,
  ProgressBarCellComponent,
  StatusBadgeCellComponent,
  TrendCellComponent,
} from '../../components/generic-table-tanstack';
import { DemoCodeBlockComponent } from '../../shared/demo-code-block/demo-code-block.component';
import { code } from '../../shared/demo-code-block/demo-code.util';
import { tanstackCellTabs } from './tanstack-cell-sources';

interface DemoUser {
  id: number;
  uuid: string;
  name: string;
  email: string;
  department: string;
  status: 'Active' | 'Inactive' | 'Pending';
  verified: boolean;
  presence: 'online' | 'away' | 'offline';
  progress: number;
  trend: number;
  createdAt: Date;
  lastSeen: string;
}

@Component({
  selector: 'app-generic-table-tanstack-demo',
  imports: [GenericTableTanstackComponent, DemoCodeBlockComponent],
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
      minWidth: '120px',
      width: '280px',
      description: 'Built-in uuid cell: monospace + copy button.',
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      minWidth: '80px',
      width: '140px',
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      copyable: true,
      minWidth: '120px',
      width: '220px',
      description: 'Primary contact address used for account notifications.',
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      minWidth: '80px',
      width: '140px',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      minWidth: '72px',
      width: '110px',
      cellComponent: StatusBadgeCellComponent,
      description: 'Active = can sign in. Pending = invited but not confirmed.',
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      cellType: 'date',
      dateDisplay: 'date',
      minWidth: '80px',
      width: '120px',
    },
    {
      key: 'lastSeen',
      header: 'Last seen',
      sortable: true,
      cellType: 'date',
      copyable: true,
      minWidth: '100px',
      width: '180px',
    },
  ];

  /** Catalog cells: person, mailto, status badge, boolean. */
  readonly catalogColumns: ColumnDef<DemoUser>[] = [
    {
      key: 'name',
      header: 'Member',
      sortable: true,
      minWidth: '100px',
      width: '180px',
      cellComponent: PersonCellComponent,
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      minWidth: '120px',
      width: '220px',
      cellComponent: MailtoCellComponent,
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      minWidth: '80px',
      width: '140px',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      minWidth: '72px',
      width: '110px',
      cellComponent: StatusBadgeCellComponent,
    },
    {
      key: 'verified',
      header: 'Verified',
      sortable: true,
      minWidth: '72px',
      width: '100px',
      cellComponent: BooleanCellComponent,
    },
  ];

  /** Animated / richer cells: presence pulse, progress bar, trend delta. */
  readonly animatedColumns: ColumnDef<DemoUser>[] = [
    {
      key: 'name',
      header: 'Member',
      sortable: true,
      minWidth: '100px',
      width: '160px',
      cellComponent: PersonCellComponent,
    },
    {
      key: 'presence',
      header: 'Presence',
      sortable: true,
      minWidth: '80px',
      width: '110px',
      cellComponent: PresencePulseCellComponent,
    },
    {
      key: 'progress',
      header: 'Progress',
      sortable: true,
      minWidth: '120px',
      width: '180px',
      cellComponent: ProgressBarCellComponent,
    },
    {
      key: 'trend',
      header: 'Trend',
      sortable: true,
      minWidth: '72px',
      width: '100px',
      cellComponent: TrendCellComponent,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      minWidth: '72px',
      width: '110px',
      cellComponent: StatusBadgeCellComponent,
    },
  ];

  readonly scrollColumns: ColumnDef<DemoUser>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      minWidth: '80px',
      width: '140px',
      cellComponent: PersonCellComponent,
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      minWidth: '80px',
      width: '140px',
    },
    {
      key: 'status',
      header: 'Status',
      minWidth: '72px',
      width: '110px',
      cellComponent: StatusBadgeCellComponent,
    },
  ];

  readonly rows = signal<DemoUser[]>(this.buildVirtualRows(42));
  readonly catalogRows = signal<DemoUser[]>(this.buildVirtualRows(8));
  readonly animatedRows = signal<DemoUser[]>(this.buildVirtualRows(8));
  readonly virtualRows = signal<DemoUser[]>(this.buildVirtualRows(10_000));
  readonly emptyRows = signal<DemoUser[]>([]);
  readonly selectedRow = signal<DemoUser | null>(null);
  readonly lastRowAction = signal<string | null>(null);

  readonly rowActions: GenericTableRowAction<DemoUser>[] = [
    { id: 'edit', label: 'Edit', icon: LucidePencil },
    { id: 'copy', label: 'Copy email', icon: LucideCopy },
    {
      id: 'delete',
      label: 'Delete',
      icon: LucideTrash2,
      danger: true,
      dividerBefore: true,
      disabled: (row) => row.status === 'Active',
    },
  ];

  readonly resolveRowDetails = (row: DemoUser): ContextMenuDetailField[] => [
    { label: 'Email', value: row.email },
    { label: 'Department', value: row.department },
    { label: 'Status', value: row.status },
    { label: 'UUID', value: row.uuid },
    {
      label: 'Last seen',
      value: new Date(row.lastSeen).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    },
  ];

  readonly resolveRowDetailsTitle = (row: DemoUser): string => row.name;

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

  onRowAction(event: GenericTableRowActionEvent<DemoUser>): void {
    if (event.actionId === 'copy') {
      void navigator.clipboard.writeText(event.row.email).then(() => {
        this.lastRowAction.set(`Copied ${event.row.email}`);
      });
      return;
    }

    this.lastRowAction.set(`${event.actionId} → ${event.row.name}`);
  }

  onServerSidePageChange(event: PageEvent): void {
    this.loadServerSidePage(event.pageIndex, event.pageSize);
  }

  onServerSideExport(request: GenericTableExportRequest<DemoUser>): void {
    setTimeout(() => request.complete(this.serverSideDataset), 350);
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
          [rowActions]="rowActions"
          [showExport]="true"
          [trackBy]="trackById"
          (rowClick)="onRowClick($event)"
          (rowAction)="onRowAction($event)"
        />
      `,
      ts: code`
        import { signal } from '@angular/core';
        import { LucideCopy, LucidePencil, LucideTrash2 } from '@lucide/angular';
        import {
          GenericTableRowAction,
          GenericTableRowActionEvent,
          GenericTableTanstackComponent,
        } from './components/generic-table-tanstack';

        readonly rows = signal<DemoUser[]>([/* ... */]);

        readonly rowActions: GenericTableRowAction<DemoUser>[] = [
          { id: 'edit', label: 'Edit', icon: LucidePencil },
          { id: 'copy', label: 'Copy email', icon: LucideCopy },
          {
            id: 'delete',
            label: 'Delete',
            icon: LucideTrash2,
            danger: true,
            dividerBefore: true,
            disabled: (row) => row.status === 'Active',
          },
        ];

        trackById(_index: number, row: DemoUser): number {
          return row.id;
        }

        onRowClick(row: DemoUser): void {
          this.selectedRow.set(row);
        }

        onRowAction(event: GenericTableRowActionEvent<DemoUser>): void {
          if (event.actionId === 'copy') {
            void navigator.clipboard.writeText(event.row.email);
            return;
          }

          console.log(event.actionId, event.row);
        }
      `,
      columnsTs: code`
        import {
          ColumnDef,
          StatusBadgeCellComponent,
        } from './components/generic-table-tanstack';

        readonly columns: ColumnDef<DemoUser>[] = [
          {
            key: 'uuid',
            header: 'UUID',
            cellType: 'uuid',
            copyable: true,
            minWidth: '120px',
            width: '280px',
          },
          {
            key: 'name',
            header: 'Name',
            sortable: true,
            minWidth: '80px',
            width: '140px',
          },
          {
            key: 'email',
            header: 'Email',
            sortable: true,
            copyable: true,
            minWidth: '120px',
            width: '220px',
          },
          {
            key: 'department',
            header: 'Department',
            sortable: true,
            minWidth: '80px',
            width: '140px',
          },
          {
            key: 'status',
            header: 'Status',
            sortable: true,
            minWidth: '72px',
            width: '110px',
            cellComponent: StatusBadgeCellComponent,
          },
          {
            key: 'createdAt',
            header: 'Created',
            sortable: true,
            cellType: 'date',
            minWidth: '80px',
            width: '120px',
          },
          {
            key: 'lastSeen',
            header: 'Last seen',
            sortable: true,
            cellType: 'date',
            minWidth: '100px',
            width: '180px',
          },
        ];
      `,
      cells: tanstackCellTabs('StatusBadge'),
    },
    rowDetails: {
      html: code`
        <app-generic-table-tanstack
          [columns]="columns"
          [data]="rows()"
          rowMenuVariant="details"
          [rowDetails]="resolveRowDetails"
          [rowDetailsTitle]="resolveRowDetailsTitle"
          [trackBy]="trackById"
        />
      `,
      ts: code`
        import { ContextMenuDetailField } from './components/generic-table-tanstack';

        readonly resolveRowDetails = (row: DemoUser): ContextMenuDetailField[] => [
          { label: 'Email', value: row.email },
          { label: 'Department', value: row.department },
          { label: 'Status', value: row.status },
          { label: 'UUID', value: row.uuid },
        ];

        readonly resolveRowDetailsTitle = (row: DemoUser): string => row.name;
      `,
      columnsTs: code`
        import {
          BooleanCellComponent,
          ColumnDef,
          MailtoCellComponent,
          PersonCellComponent,
          StatusBadgeCellComponent,
        } from './components/generic-table-tanstack';

        readonly columns: ColumnDef<DemoUser>[] = [
          {
            key: 'name',
            header: 'Member',
            sortable: true,
            minWidth: '100px',
            width: '180px',
            cellComponent: PersonCellComponent,
          },
          {
            key: 'email',
            header: 'Email',
            sortable: true,
            minWidth: '120px',
            width: '220px',
            cellComponent: MailtoCellComponent,
          },
          {
            key: 'status',
            header: 'Status',
            sortable: true,
            minWidth: '72px',
            width: '110px',
            cellComponent: StatusBadgeCellComponent,
          },
          {
            key: 'verified',
            header: 'Verified',
            sortable: true,
            minWidth: '72px',
            width: '100px',
            cellComponent: BooleanCellComponent,
          },
        ];
      `,
      cells: tanstackCellTabs('Person', 'Mailto', 'StatusBadge', 'Boolean'),
    },
    catalogCells: {
      html: code`
        <app-generic-table-tanstack
          [columns]="columns"
          [data]="rows()"
          [showColumnToggle]="false"
          [trackBy]="trackById"
        />
      `,
      ts: code`
        import {
          BooleanCellComponent,
          MailtoCellComponent,
          PersonCellComponent,
          StatusBadgeCellComponent,
        } from './components/generic-table-tanstack';

        // Library cell catalog — set cellComponent on ColumnDef.
        // Each cell receives value / row / column inputs.
      `,
      columnsTs: code`
        import {
          BooleanCellComponent,
          ColumnDef,
          MailtoCellComponent,
          PersonCellComponent,
          StatusBadgeCellComponent,
        } from './components/generic-table-tanstack';

        readonly columns: ColumnDef<DemoUser>[] = [
          {
            key: 'name',
            header: 'Member',
            sortable: true,
            minWidth: '100px',
            width: '180px',
            cellComponent: PersonCellComponent,
          },
          {
            key: 'email',
            header: 'Email',
            sortable: true,
            minWidth: '120px',
            width: '220px',
            cellComponent: MailtoCellComponent,
          },
          {
            key: 'status',
            header: 'Status',
            sortable: true,
            minWidth: '72px',
            width: '110px',
            cellComponent: StatusBadgeCellComponent,
          },
          {
            key: 'verified',
            header: 'Verified',
            sortable: true,
            minWidth: '72px',
            width: '100px',
            cellComponent: BooleanCellComponent,
          },
        ];
      `,
      cells: tanstackCellTabs('Person', 'Mailto', 'StatusBadge', 'Boolean'),
    },
    animatedCells: {
      html: code`
        <app-generic-table-tanstack
          [columns]="columns"
          [data]="rows()"
          [showColumnToggle]="false"
          [trackBy]="trackById"
        />
      `,
      ts: code`
        import {
          PresencePulseCellComponent,
          ProgressBarCellComponent,
          TrendCellComponent,
        } from './components/generic-table-tanstack';

        // Animated cells respect prefers-reduced-motion.
      `,
      columnsTs: code`
        import {
          ColumnDef,
          PersonCellComponent,
          PresencePulseCellComponent,
          ProgressBarCellComponent,
          StatusBadgeCellComponent,
          TrendCellComponent,
        } from './components/generic-table-tanstack';

        readonly columns: ColumnDef<DemoUser>[] = [
          {
            key: 'name',
            header: 'Member',
            minWidth: '100px',
            width: '160px',
            cellComponent: PersonCellComponent,
          },
          {
            key: 'presence',
            header: 'Presence',
            minWidth: '80px',
            width: '110px',
            cellComponent: PresencePulseCellComponent,
          },
          {
            key: 'progress',
            header: 'Progress',
            minWidth: '120px',
            width: '180px',
            cellComponent: ProgressBarCellComponent,
          },
          {
            key: 'trend',
            header: 'Trend',
            minWidth: '72px',
            width: '100px',
            cellComponent: TrendCellComponent,
          },
          {
            key: 'status',
            header: 'Status',
            minWidth: '72px',
            width: '110px',
            cellComponent: StatusBadgeCellComponent,
          },
        ];
      `,
      cells: tanstackCellTabs(
        'Person',
        'PresencePulse',
        'ProgressBar',
        'Trend',
        'StatusBadge',
      ),
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
        import { GenericTableExportRequest } from './components/generic-table-tanstack';

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
      columnsTs: code`
        import {
          ColumnDef,
          StatusBadgeCellComponent,
        } from './components/generic-table-tanstack';

        readonly columns: ColumnDef<DemoUser>[] = [
          {
            key: 'uuid',
            header: 'UUID',
            cellType: 'uuid',
            copyable: true,
            minWidth: '120px',
            width: '280px',
          },
          {
            key: 'name',
            header: 'Name',
            sortable: true,
            minWidth: '80px',
            width: '140px',
          },
          {
            key: 'status',
            header: 'Status',
            sortable: true,
            minWidth: '72px',
            width: '110px',
            cellComponent: StatusBadgeCellComponent,
          },
        ];
      `,
      cells: tanstackCellTabs('StatusBadge'),
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

        readonly rows = signal<DemoUser[]>(this.buildRows(10_000));

        trackById(_index: number, row: DemoUser): number {
          return row.id;
        }
      `,
      columnsTs: code`
        import {
          ColumnDef,
          PersonCellComponent,
          StatusBadgeCellComponent,
        } from './components/generic-table-tanstack';

        readonly columns: ColumnDef<DemoUser>[] = [
          {
            key: 'name',
            header: 'Name',
            sortable: true,
            minWidth: '80px',
            width: '140px',
            cellComponent: PersonCellComponent,
          },
          {
            key: 'department',
            header: 'Department',
            sortable: true,
            minWidth: '80px',
            width: '140px',
          },
          {
            key: 'status',
            header: 'Status',
            minWidth: '72px',
            width: '110px',
            cellComponent: StatusBadgeCellComponent,
          },
        ];
      `,
      cells: tanstackCellTabs('Person', 'StatusBadge'),
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
    const presences: DemoUser['presence'][] = ['online', 'away', 'offline'];
    const trends = [12, -4, 0, 8, -15, 3, -1, 22];
    const names = [
      'Alice Johnson',
      'Bob Smith',
      'Carol Lee',
      'Diego Ruiz',
      'Elena Novak',
      'Farah Ali',
      'Gabe Chen',
      'Hana Kim',
    ];

    return Array.from({ length: count }, (_, index) => {
      const id = index + 1;
      const status = statuses[index % statuses.length];

      return {
        id,
        uuid: `550e8400-e29b-41d4-a716-${id.toString(16).padStart(12, '0')}`,
        name: names[index % names.length] + (index >= names.length ? ` ${id}` : ''),
        email: `user${id}@example.com`,
        department: departments[index % departments.length],
        status,
        verified: status === 'Active',
        presence: presences[index % presences.length],
        progress: (index * 17 + 23) % 101,
        trend: trends[index % trends.length],
        createdAt: new Date(2020, index % 12, (index % 28) + 1),
        lastSeen: new Date(2024, index % 12, (index % 28) + 1, 10, 30, index % 60).toISOString(),
      };
    });
  }
}
