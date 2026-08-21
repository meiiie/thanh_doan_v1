import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { AssignmentWorkbench, ScorecardCatalog } from '../../api/models';
import { AppIconComponent } from '../../shared/app-icon.component';
import { targetValue } from '../../shared/form-events';
import { buildTeamDirectory, type RosterMember, type TeamDirectory } from './team-directory';

type DirectoryView = 'teams' | 'members';

@Component({
  selector: 'app-team-directory-page',
  imports: [AppIconComponent],
  templateUrl: './team-directory.page.html',
  styleUrl: './team-directory.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamDirectoryPage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly directory = signal<TeamDirectory | null>(null);
  protected readonly view = signal<DirectoryView>('teams');
  protected readonly query = signal('');
  protected readonly selectedTeamId = signal('');
  protected readonly selectedMemberId = signal('');
  protected readonly error = signal('');

  protected readonly filteredTeams = computed(() => {
    const directory = this.directory();
    if (!directory) return [];
    const query = normalize(this.query());
    if (!query) return directory.teams;
    return directory.teams.filter(
      (team) =>
        normalize(team.name).includes(query) ||
        team.members.some((member) => normalize(member.displayName).includes(query)),
    );
  });

  protected readonly activeTeam = computed(() => {
    const teams = this.filteredTeams();
    return teams.find((team) => team.id === this.selectedTeamId()) ?? teams[0] ?? null;
  });

  protected readonly filteredMembers = computed(() => {
    const directory = this.directory();
    if (!directory) return [];
    const query = normalize(this.query());
    if (!query) return directory.members;
    return directory.members.filter((member) =>
      normalize(
        `${member.displayName} ${member.teamName} ${member.teamMonitor ? 'SubAdmin1 theo dõi Tổ' : 'SubAdmin2 cán bộ chấm'}`,
      ).includes(query),
    );
  });

  protected readonly selectedMember = computed<RosterMember | null>(() => {
    const directory = this.directory();
    return directory?.members.find((member) => member.id === this.selectedMemberId()) ?? null;
  });

  async ngOnInit(): Promise<void> {
    try {
      const [workbench, catalog] = await Promise.all([
        firstValueFrom(this.http.get<AssignmentWorkbench>('/api/assignments/current')),
        firstValueFrom(this.http.get<ScorecardCatalog>('/api/scorecards/current')),
      ]);
      const directory = buildTeamDirectory(workbench, catalog);
      this.directory.set(directory);
      const requestedTeam = this.route.snapshot.queryParamMap.get('team') ?? '';
      this.selectedTeamId.set(
        directory.teams.some((team) => team.id === requestedTeam)
          ? requestedTeam
          : (directory.teams[0]?.id ?? ''),
      );
    } catch {
      this.error.set('Không đọc được danh sách Tổ và cán bộ từ backend.');
    }
  }

  protected setView(view: DirectoryView): void {
    this.view.set(view);
    this.selectedMemberId.set('');
  }

  protected setQuery(event: Event): void {
    this.query.set(targetValue(event));
    this.selectedMemberId.set('');
  }

  protected async selectTeam(teamId: string): Promise<void> {
    this.selectedTeamId.set(teamId);
    this.selectedMemberId.set('');
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { team: teamId },
      replaceUrl: true,
    });
  }

  protected selectMember(memberId: string): void {
    this.selectedMemberId.update((current) => (current === memberId ? '' : memberId));
  }
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('vi');
}
