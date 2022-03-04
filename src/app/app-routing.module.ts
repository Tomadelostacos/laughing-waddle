import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GitlabComponent } from './app-components/gitlab/gitlab.component';

const routes: Routes = [
  { path: '', redirectTo: 'gitlab', pathMatch: 'full' },
  {
    path: 'gitlab',
    children: [{ path: '', component: GitlabComponent }],
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      onSameUrlNavigation: 'reload',
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
