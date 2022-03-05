import { Component, OnInit } from '@angular/core';
import { Branch, BrancheFactory, GitlabBranch } from 'src/app/models/branche';
import { GitlabMergeRequest, MergeRequest, MergeRequestFactory } from 'src/app/models/merge-request';
import { GitlabPipeline, Pipeline, PipelineFactory } from 'src/app/models/pipeline';
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

          let mergeRequests: MergeRequest[] = [];
          mrResponse.forEach((mrResponseElement: GitlabMergeRequest) => {
            mergeRequests.push(MergeRequestFactory.fromGitlabMergeRequestToMergeRequest(mrResponseElement));
          });

          this.gitlabService.getPipelines(element).subscribe(pipelineResponse => {

            let pipelines: Pipeline[] = [];
            pipelineResponse.slice(0, 5).forEach((pipelineResponseElement: GitlabPipeline) => {
              pipelines.push(PipelineFactory.fromGitlabPipelineToPipeline(pipelineResponseElement));
            });

            this.gitlabService.getBranchesFilter(element, "^version").subscribe(branchesResponse => {
              branchesResponse.forEach((branche: any) => this.availableReleaseBranches[element].push(branche.name))
            });

            this.gitlabService.getBranches(element).subscribe(branchesResponse => {

              let branches: Branch[] = [];
              branchesResponse.forEach((branch: GitlabBranch) => {
                branches.push(BrancheFactory.fromGitlabBranchToBranch(branch));
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
