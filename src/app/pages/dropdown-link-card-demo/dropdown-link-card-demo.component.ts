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

@Component({
  selector: 'app-dropdown-link-card-demo',
  imports: [DropdownLinkCardComponent],
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
}
