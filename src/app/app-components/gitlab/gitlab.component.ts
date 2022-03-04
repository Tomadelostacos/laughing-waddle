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
  projectIds: Array<string>;
  projectInfos: Array<any>;

  tempTokenGitlab: string;
  tokenGitlab: string;
  availableReleaseBranches: any;
  runningPipeline: any;

  constructor(private gitlabService: GitlabService) {
    this.projectIds = config.projectIds;
    this.projectInfos = [];
    this.tokenGitlab = '';
    this.tempTokenGitlab = '';
    this.availableReleaseBranches = {};
    this.runningPipeline = {};
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

  private computeVersionAndRunPipeline(project: string, branch: string, version: string[], typeOfVersionIncrement: number){
    if(typeOfVersionIncrement == 0){
      version[0] = (parseInt(version[0])+1).toString();
      version[1] = version[2] = "0";
    }
    else if(typeOfVersionIncrement == 1){
      version[1] = (parseInt(version[1])+1).toString();
      version[2] = "0";
    }
    let releaseVersion = version.join(".");

    version[2] = (parseInt(version[2])+1).toString();
    let snapVersion = version.join(".") + "-SNAPSHOT";

    this.gitlabService.postPipeline(project, branch, releaseVersion, snapVersion).subscribe();
    this.runningPipeline[project] = "<span>La pipeline a été lancé sur la branche <span class='fw-bold'>" + branch + "</span> pour la release <span class='fw-bold'>" + releaseVersion +"</span> (next snapshot : " + snapVersion + ").</span>";
  }

  onReleaseSelected(project: string, branch: string, typeOfVersionIncrement: number = 1){
    let readable: any;
    let version = [];

    // First try to get package.json, if it fails then try to retrieve pom.xml
    // For FENG projects
    this.gitlabService.getFile(project, branch, 'package.json').subscribe(file => {
      readable = JSON.parse(atob(file.content));
      version = readable.version.replace('-SNAPSHOT', '').split(".");

      this.computeVersionAndRunPipeline(project, branch, version, typeOfVersionIncrement);
    },
    error => {
      // For JAMS projects
      this.gitlabService.getFile(project, branch, 'pom.xml').subscribe(file => {
        readable = atob(file.content);
        readable = readable.substring(0, readable.indexOf('-SNAPSHOT</version>'));
        version = readable.substring(readable.lastIndexOf('<version>')+9).trim().split(".");
  
        this.computeVersionAndRunPipeline(project, branch, version, typeOfVersionIncrement);
      });
    })
  }

  refreshContent(): void {
    this.projectIds.forEach(element => {
      this.gitlabService.getProject(element).subscribe(response => {
        this.availableReleaseBranches[element] = [];


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

            this.gitlabService.getBranchesFilter(element, "^version").subscribe(branchesResponse => {
              branchesResponse.forEach((branche: any) => this.availableReleaseBranches[element].push(branche.name))
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
