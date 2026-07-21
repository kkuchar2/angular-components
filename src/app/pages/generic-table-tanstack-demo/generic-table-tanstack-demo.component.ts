import { Component, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import {
  ColumnDef,
  GenericTableCellDirective,
  GenericTableExportRequest,
} from '../../components/generic-table';
import { GenericTableTanstackComponent } from '../../components/generic-table-tanstack';
import { DemoCodeBlockComponent } from '../../shared/demo-code-block/demo-code-block.component';

interface DemoUser {
  id: number;
  name: string;
  email: string;
  department: string;
  status: 'Active' | 'Inactive' | 'Pending';
  createdAt: Date;
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
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true, minWidth: '220px' },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'status', header: 'Status', sortable: true, align: 'center', width: '120px' },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      cell: (user) => user.createdAt.toLocaleDateString(),
      sortAccessor: (user) => user.createdAt.getTime(),
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
    paginated: `<app-generic-table-tanstack
  [columns]="columns"
  [data]="rows()"
  [paginated]="true"
  [pageSize]="5"
  [rowClickable]="true"
  [showExport]="true"
  [trackBy]="trackById"
  (rowClick)="onRowClick($event)"
>
  <ng-template appGenericTableCell="status" [appGenericTableCellFor]="rows()" let-row>
    <span [class]="statusBadgeClass(row.status)">{{ row.status }}</span>
  </ng-template>
</app-generic-table-tanstack>`,
    serverSide: `<app-generic-table-tanstack
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
/>`,
    virtual: `<app-generic-table-tanstack
  [columns]="columns"
  [data]="rows()"
  [virtualized]="true"
  [rowHeight]="48"
  height="400px"
  [trackBy]="trackById"
/>`,
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
        name: `User ${id}`,
        email: `user${id}@example.com`,
        department: departments[index % departments.length],
        status: statuses[index % statuses.length],
        createdAt: new Date(2020, index % 12, (index % 28) + 1),
      };
    });
  }
}
