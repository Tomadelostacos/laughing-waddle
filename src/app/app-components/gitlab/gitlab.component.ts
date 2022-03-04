import { Component, OnInit } from '@angular/core';
import { GitlabService } from 'src/app/services/gitlab.service';
import config from '../../../assets/config.json';

@Component({
  selector: 'app-gitlab',
  templateUrl: './gitlab.component.html',
  styleUrls: ['./gitlab.component.scss']
})
export class GitlabComponent implements OnInit {

  title = 'webview-gitlab';
  projectIds: Array<string>
  projectInfos: Array<any>;

  tempTokenGitlab: string;

  tokenGitlab: string;

  constructor(private gitlabService: GitlabService) {
    this.projectIds = config.projectIds;
    this.projectInfos = [];
    this.tokenGitlab = '';
    this.tempTokenGitlab = '';
  }

  ngOnInit(): void {
    if (localStorage.getItem("tokenGitlab")) {
      this.gitlabService.authorizationBearerToken = localStorage.getItem('tokenGitlab') ?? '';
    }

    if (this.gitlabService.authorizationBearerToken) {
      this.gitlabService.setHeaders();
      this.refreshContent();
    }
  }

  refreshContent(): void {
    this.projectIds.forEach(element => {
      this.gitlabService.getProject(element).subscribe(response => {
        this.gitlabService.getMergeRequests(element).subscribe(mrResponse => {

          var mergeRequests: { conflicts: any; auteur: any; avatar: any, url: any; source: any; target: any; date: any; titre: any; statut: any }[] = [];
          mrResponse.forEach((mrResponseElement:
            { author: { name: any; avatar_url: any }; has_conflicts: any, web_url: any; source_branch: any; target_branch: any; created_at: any; title: any; merge_status: any; }) => {
            mergeRequests.push({
              auteur: mrResponseElement.author.name,
              avatar: mrResponseElement.author.avatar_url,
              conflicts: mrResponseElement.has_conflicts,
              url: mrResponseElement.web_url,
              source: mrResponseElement.source_branch,
              target: mrResponseElement.target_branch,
              date: mrResponseElement.created_at,
              titre: mrResponseElement.title,
              statut: mrResponseElement.merge_status
            });
          });

          this.gitlabService.getPipelines(element).subscribe(pipelineResponse => {

            var pipelines: { url: any; branche: any; date: any; status: any; }[] = [];
            pipelineResponse.slice(0, 5).forEach((pipelineResponseElement: { web_url: any; ref: any; created_at: any; status: any; }) => {
              pipelines.push({
                url: pipelineResponseElement.web_url,
                branche: pipelineResponseElement.ref,
                date: pipelineResponseElement.created_at,
                status: pipelineResponseElement.status
              });

            });

            this.gitlabService.getBranches(element).subscribe(branchesResponse => {

              var branches: { nom: any; url: any; auteur: any; dernier_commit: any; nom_commit: any; }[] = [];
              branchesResponse.forEach((branche: { name: any; author_name: any; commit: { committed_date: any; author_name: any; title: any; web_url: any; }; }) => {
                branches.push({
                  nom: branche.name,
                  url: branche.commit.web_url,
                  auteur: branche.commit.author_name,
                  dernier_commit: branche.commit.committed_date,
                  nom_commit: branche.commit.title
                });
              });

              this.projectInfos.push({
                id: element,
                nom: response.name,
                url: response.web_url,
                description: response.description,
                mergeRequests: mergeRequests,
                pipelines: pipelines,
                branches: branches
              });
            });
          });
        });
      });
    });
  }

  ifExistsTokenGitlab(): boolean {
    return this.gitlabService.authorizationBearerToken != '' && this.gitlabService.authorizationBearerToken != null;
  }

  putTokenGitlab(): void {
    this.gitlabService.authorizationBearerToken = this.tempTokenGitlab;
    localStorage.setItem('tokenGitlab', this.tempTokenGitlab);
    this.gitlabService.setHeaders();
    this.refreshContent();
  }
}
