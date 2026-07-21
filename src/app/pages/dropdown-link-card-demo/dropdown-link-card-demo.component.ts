import { Component } from '@angular/core';
import {
  LucideBookOpen,
  LucideCode,
  LucideFileText,
  LucideGlobe,
  LucideLayers,
  LucideZap,
} from '@lucide/angular';

import {
  DropdownLink,
  DropdownLinkCardComponent,
  DropdownLinkCardIcon,
} from '../../components/dropdown-link-card/dropdown-link-card';
import { DemoCodeBlockComponent } from '../../shared/demo-code-block/demo-code-block.component';
import { code } from '../../shared/demo-code-block/demo-code.util';

@Component({
  selector: 'app-dropdown-link-card-demo',
  imports: [DropdownLinkCardComponent, DemoCodeBlockComponent],
  templateUrl: './dropdown-link-card-demo.component.html',
  styleUrl: './dropdown-link-card-demo.component.scss',
})
export class DropdownLinkCardDemoComponent {
  readonly lucideCardIcon: DropdownLinkCardIcon = {
    type: 'lucide',
    icon: LucideBookOpen,
  };

  readonly imageCardIcon: DropdownLinkCardIcon = {
    type: 'image',
    src: '/demo-icons/angular.svg',
    alt: 'Angular',
  };

  readonly lucideLinks: DropdownLink[] = [
    {
      label: 'Angular Docs',
      url: 'https://angular.dev',
      icon: { type: 'lucide', icon: LucideFileText },
      description: 'Official Angular documentation',
    },
    {
      label: 'Web Resources',
      icon: { type: 'lucide', icon: LucideLayers },
      description: 'Curated web development links',
      children: [
        {
          label: 'MDN Web Docs',
          url: 'https://developer.mozilla.org',
          icon: { type: 'lucide', icon: LucideGlobe },
          description: 'Web APIs & HTML/CSS/JS reference',
        },
        {
          label: 'Can I Use',
          url: 'https://caniuse.com',
          icon: { type: 'lucide', icon: LucideCode },
          description: 'Browser support tables',
        },
      ],
    },
    {
      label: 'RxJS Guide',
      url: 'https://rxjs.dev/guide/overview',
      icon: { type: 'lucide', icon: LucideZap },
      description: 'Reactive programming with RxJS',
    },
  ];

  readonly flatLucideLinks: DropdownLink[] = [
    {
      label: 'Angular Docs',
      url: 'https://angular.dev',
      icon: { type: 'lucide', icon: LucideFileText },
      description: 'Official Angular documentation',
    },
    {
      label: 'MDN Web Docs',
      url: 'https://developer.mozilla.org',
      icon: { type: 'lucide', icon: LucideGlobe },
      description: 'Web APIs & HTML/CSS/JS reference',
    },
    {
      label: 'RxJS Guide',
      url: 'https://rxjs.dev/guide/overview',
      icon: { type: 'lucide', icon: LucideZap },
      description: 'Reactive programming with RxJS',
    },
  ];

  readonly imageLinks: DropdownLink[] = [
    {
      label: 'Angular',
      url: 'https://angular.dev',
      icon: { type: 'image', src: '/demo-icons/angular.svg', alt: 'Angular' },
      description: 'Application framework',
    },
    {
      label: 'TypeScript',
      url: 'https://www.typescriptlang.org/docs/',
      icon: {
        type: 'image',
        src: '/demo-icons/typescript.svg',
        alt: 'TypeScript',
      },
      description: 'Typed JavaScript superset',
    },
    {
      label: 'GitHub',
      url: 'https://github.com',
      icon: { type: 'image', src: '/demo-icons/github.svg', alt: 'GitHub' },
      description: 'Source code hosting',
    },
  ];

  readonly snippets = {
    nested: {
      html: code`
        <app-dropdown-link-card
          title="Documentation"
          [icon]="cardIcon"
          [links]="links"
        />
      `,
      ts: code`
        import {
          LucideBookOpen,
          LucideFileText,
          LucideLayers,
        } from '@lucide/angular';
        import {
          DropdownLink,
          DropdownLinkCardIcon,
        } from './components/dropdown-link-card/dropdown-link-card';

        readonly cardIcon: DropdownLinkCardIcon = {
          type: 'lucide',
          icon: LucideBookOpen,
        };

        readonly links: DropdownLink[] = [
          {
            label: 'Angular Docs',
            url: 'https://angular.dev',
            icon: { type: 'lucide', icon: LucideFileText },
          },
          {
            label: 'Web Resources',
            icon: { type: 'lucide', icon: LucideLayers },
            children: [
              { label: 'MDN', url: 'https://developer.mozilla.org' },
              { label: 'Can I Use', url: 'https://caniuse.com' },
            ],
          },
        ];
      `,
    },
    imageIcons: {
      html: code`
        <app-dropdown-link-card
          title="Frameworks"
          [icon]="cardIcon"
          [links]="links"
        />
      `,
      ts: code`
        import {
          DropdownLink,
          DropdownLinkCardIcon,
        } from './components/dropdown-link-card/dropdown-link-card';

        readonly cardIcon: DropdownLinkCardIcon = {
          type: 'image',
          src: '/icons/angular.svg',
          alt: 'Angular',
        };

        readonly links: DropdownLink[] = [
          {
            label: 'Angular',
            url: 'https://angular.dev',
            icon: { type: 'image', src: '/icons/angular.svg', alt: 'Angular' },
          },
        ];
      `,
    },
    flat: {
      html: code`
        <app-dropdown-link-card
          title="Quick Links"
          [icon]="cardIcon"
          [links]="flatLinks"
        />
      `,
      ts: code`
        import {
          DropdownLink,
          DropdownLinkCardIcon,
        } from './components/dropdown-link-card/dropdown-link-card';

        readonly cardIcon: DropdownLinkCardIcon = { /* ... */ };
        readonly flatLinks: DropdownLink[] = [
          { label: 'Angular', url: 'https://angular.dev' },
          { label: 'GitHub', url: 'https://github.com' },
        ];
      `,
    },
    disabled: {
      html: code`
        <app-dropdown-link-card
          title="Unavailable"
          [icon]="cardIcon"
          [links]="links"
          [disabled]="true"
        />
      `,
      ts: code`
        import {
          DropdownLink,
          DropdownLinkCardIcon,
        } from './components/dropdown-link-card/dropdown-link-card';

        readonly cardIcon: DropdownLinkCardIcon = { /* ... */ };
        readonly links: DropdownLink[] = [/* ... */];
      `,
    },
  };
}
