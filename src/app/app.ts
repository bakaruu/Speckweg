import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UpdateService } from './core/updates/update.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly updates = inject(UpdateService);
  protected readonly isBeta = computed(() => this.updates.appName().toLowerCase().includes('beta'));

  ngOnInit(): void {
    void this.updates.init();
  }
}
