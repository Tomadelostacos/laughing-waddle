import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import config from '../assets/config.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'webview-gitlab';
  projectIds: Array<String>
  projectInfos: Array<any>;

  tempTokenGitlab: string;

  tokenGitlab: string;



  constructor(private http: HttpService) {

    this.projectIds = config.projectIds;
    this.projectInfos = [];
    this.tokenGitlab = '';
    this.tempTokenGitlab = '';


  }

  ngOnInit(): void {
    if (localStorage.getItem("tokenGitlab")) {
      this.http.tokenGitlab = localStorage.getItem('tokenGitlab') ?? '';
    }


    if (this.http.tokenGitlab) {
      this.http.setHeaders();
      this.refreshContent();
    }

  }

  refreshContent(): void {
    this.projectIds.forEach(element => {
      this.getProject(element).subscribe(response => {
        this.getMergeRequests(element).subscribe(mrResponse => {
          console.log(mrResponse);

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


          this.getPipelines(element).subscribe(pipelineResponse => {

            var pipelines: { url: any; branche: any; date: any; status: any; }[] = [];
            pipelineResponse.slice(0, 5).forEach((pipelineResponseElement: { web_url: any; ref: any; created_at: any; status: any; }) => {
              pipelines.push({
                url: pipelineResponseElement.web_url,
                branche: pipelineResponseElement.ref,
                date: pipelineResponseElement.created_at,
                status: pipelineResponseElement.status
              });

            });


            this.getBranches(element).subscribe(branchesResponse => {

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
    return this.http.tokenGitlab != '' && this.http.tokenGitlab != null;
  }

  putTokenGitlab(): void {
    this.http.tokenGitlab = this.tempTokenGitlab;
    localStorage.setItem('tokenGitlab', this.tempTokenGitlab);
    this.http.setHeaders();
    this.refreshContent();
  }


  getProject(projectId: String): Observable<any> {
    return this.http.getRequestWithHeader('https://gitlab.krj.gie/api/v4/projects/' + projectId);
  }

  getMergeRequests(projectId: String): Observable<any> {
    return this.http.getRequestWithHeader('https://gitlab.krj.gie/api/v4/projects/' + projectId + '/merge_requests?state=opened');
  }

  getPipelines(projectId: String): Observable<any> {
    return this.http.getRequestWithHeader('https://gitlab.krj.gie/api/v4/projects/' + projectId + '/pipelines');
  }

  getBranches(projectId: String): Observable<any> {
    return this.http.getRequestWithHeader('https://gitlab.krj.gie/api/v4/projects/' + projectId + '/repository/branches');
  }

}
