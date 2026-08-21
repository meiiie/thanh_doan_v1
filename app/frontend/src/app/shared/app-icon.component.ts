import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArchive,
  phosphorArrowLeft,
  phosphorArrowRight,
  phosphorArrowsLeftRight,
  phosphorBell,
  phosphorCaretDown,
  phosphorCaretRight,
  phosphorChartLineUp,
  phosphorCheck,
  phosphorDatabase,
  phosphorFileText,
  phosphorFlag,
  phosphorFunnel,
  phosphorHouse,
  phosphorList,
  phosphorLock,
  phosphorMagnifyingGlass,
  phosphorPlus,
  phosphorQuestion,
  phosphorShieldCheck,
  phosphorSquaresFour,
  phosphorStack,
  phosphorUploadSimple,
  phosphorUsersThree,
  phosphorWarning,
  phosphorX,
} from '@ng-icons/phosphor-icons/regular';

export type AppIconName =
  | 'overview'
  | 'campaign'
  | 'spreadsheet'
  | 'versions'
  | 'results'
  | 'organization'
  | 'accounts'
  | 'integration'
  | 'security'
  | 'backup'
  | 'menu'
  | 'search'
  | 'help'
  | 'bell'
  | 'chevron'
  | 'chevron-down'
  | 'plus'
  | 'close'
  | 'filter'
  | 'check'
  | 'warning'
  | 'database'
  | 'arrow'
  | 'arrow-left'
  | 'lock'
  | 'document'
  | 'upload';

const ICON_NAMES = {
  overview: 'phosphorHouse',
  campaign: 'phosphorFlag',
  spreadsheet: 'phosphorSquaresFour',
  versions: 'phosphorStack',
  results: 'phosphorChartLineUp',
  organization: 'phosphorUsersThree',
  accounts: 'phosphorUsersThree',
  integration: 'phosphorArrowsLeftRight',
  security: 'phosphorShieldCheck',
  backup: 'phosphorArchive',
  menu: 'phosphorList',
  search: 'phosphorMagnifyingGlass',
  help: 'phosphorQuestion',
  bell: 'phosphorBell',
  chevron: 'phosphorCaretRight',
  'chevron-down': 'phosphorCaretDown',
  plus: 'phosphorPlus',
  close: 'phosphorX',
  filter: 'phosphorFunnel',
  check: 'phosphorCheck',
  warning: 'phosphorWarning',
  database: 'phosphorDatabase',
  arrow: 'phosphorArrowRight',
  'arrow-left': 'phosphorArrowLeft',
  lock: 'phosphorLock',
  document: 'phosphorFileText',
  upload: 'phosphorUploadSimple',
} satisfies Record<AppIconName, string>;

@Component({
  selector: 'app-icon',
  imports: [NgIcon],
  providers: [
    provideIcons({
      phosphorArchive,
      phosphorArrowLeft,
      phosphorArrowRight,
      phosphorArrowsLeftRight,
      phosphorBell,
      phosphorCaretDown,
      phosphorCaretRight,
      phosphorChartLineUp,
      phosphorCheck,
      phosphorDatabase,
      phosphorFileText,
      phosphorFlag,
      phosphorFunnel,
      phosphorHouse,
      phosphorList,
      phosphorLock,
      phosphorMagnifyingGlass,
      phosphorPlus,
      phosphorQuestion,
      phosphorShieldCheck,
      phosphorSquaresFour,
      phosphorStack,
      phosphorUploadSimple,
      phosphorUsersThree,
      phosphorWarning,
      phosphorX,
    }),
  ],
  template: `<ng-icon [name]="iconName()" />`,
  styles: `
    :host {
      display: inline-grid;
      width: 1.25rem;
      height: 1.25rem;
      place-items: center;
      flex: 0 0 auto;
    }
    ng-icon {
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppIconComponent {
  readonly name = input.required<AppIconName>();
  protected readonly iconName = computed(() => ICON_NAMES[this.name()]);
}
