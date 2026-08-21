import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import type { OrganizationDirectory as Directory } from '../../api/models';
import { problemDetail } from '../../core/problem-detail';

@Component({
  selector: 'app-organization-directory-page',
  imports: [FormsModule],
  templateUrl: './organization-directory.page.html',
  styleUrl: './organization-directory.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationDirectoryPage implements OnInit {
  private readonly http = inject(HttpClient);
  protected readonly directory = signal<Directory | null>(null);
  protected readonly error = signal('');
  protected readonly savingOrganization = signal(false);
  protected readonly savingTeam = signal(false);
  protected organizationCode = '';
  protected organizationName = '';
  protected unitGroupCode = 'UNIVERSITY';
  protected teamCode = '';
  protected teamName = '';

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected async createOrganization(): Promise<void> {
    this.savingOrganization.set(true);
    this.error.set('');
    try {
      await firstValueFrom(
        this.http.post('/api/organization-directory/organizations', {
          code: this.organizationCode,
          name: this.organizationName,
          unitGroupCode: this.unitGroupCode,
        }),
      );
      this.organizationCode = '';
      this.organizationName = '';
      await this.load();
    } catch (error) {
      this.error.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Không thể tạo đơn vị.')
          : 'Không thể tạo đơn vị.',
      );
    } finally {
      this.savingOrganization.set(false);
    }
  }

  protected async createTeam(): Promise<void> {
    this.savingTeam.set(true);
    this.error.set('');
    try {
      await firstValueFrom(
        this.http.post('/api/organization-directory/teams', {
          code: this.teamCode,
          name: this.teamName,
        }),
      );
      this.teamCode = '';
      this.teamName = '';
      await this.load();
    } catch (error) {
      this.error.set(
        error instanceof HttpErrorResponse
          ? problemDetail(error, 'Không thể tạo tổ theo dõi.')
          : 'Không thể tạo tổ theo dõi.',
      );
    } finally {
      this.savingTeam.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      this.directory.set(
        await firstValueFrom(this.http.get<Directory>('/api/organization-directory')),
      );
    } catch {
      this.error.set('Không đọc được cơ cấu tổ chức từ backend.');
    }
  }
}
